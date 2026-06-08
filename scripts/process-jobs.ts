import { createClient } from "@supabase/supabase-js";
import { parseCSV, autoMapColumns, type ColumnMapping, type CsvRow } from "../lib/csv";
import { OUTPUT_BUCKET, REPORT_BUCKET } from "../lib/storage/files";
import { buildErrorsCSV, buildOutputCSV, buildOutputHTML, buildReportTXT, type GenerationOutput } from "../lib/generation/template-generator";
import { calculateJobCredits } from "../lib/pricing";
import { sendJobCompletedEmail, sendJobFailedEmail } from "../lib/email/email-service";
import { generateOutputWithAI, type AIRowResult } from "../lib/ai";

type Job = {
  id: string; user_id: string; project_id: string | null; original_filename: string | null; input_bucket: string | null; input_file_path: string | null; platform: string; generation_type: string; language: string; country: string; tone: string; status: string; column_mapping: ColumnMapping | null; settings: Record<string, unknown> | null; estimated_credits: number | null; processing_attempts?: number | null; generation_engine?: string | null;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const maxJobs = Number(process.env.WORKER_MAX_JOBS_PER_RUN ?? 1);
const maxRows = Number(process.env.WORKER_MAX_ROWS_PER_JOB ?? 5000);
if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for worker.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

type LogSource = "worker" | "ai";
async function createJobLog(jobId: string, userId: string, level: "info" | "warning" | "error" | "critical", message: string, context?: Record<string, unknown>, source: LogSource = "worker") {
  await supabase.from("job_logs").insert({ job_id: jobId, user_id: userId, level, source, message, context: context ?? null });
}


async function recoverStaleProcessingJobs() {
  const staleMinutes = Number(process.env.WORKER_STALE_JOB_MINUTES ?? 30);
  const maxAttempts = Number(process.env.WORKER_MAX_ATTEMPTS ?? 3);
  const cutoff = new Date(Date.now() - staleMinutes * 60_000).toISOString();
  const { data, error } = await supabase.from("jobs").select("id,user_id,processing_attempts").eq("status", "processing").lt("last_heartbeat_at", cutoff).returns<Array<{ id: string; user_id: string; processing_attempts: number | null }>>();
  if (error) throw error;
  for (const job of data ?? []) {
    const attempts = job.processing_attempts ?? 0;
    if (attempts >= maxAttempts) {
      const reservation = await supabase.from("credit_reservations").select("id").eq("job_id", job.id).eq("status", "reserved").maybeSingle<{ id: string }>();
      if (reservation.data?.id) await supabase.rpc("release_reserved_credits", { p_reservation_id: reservation.data.id, p_reason: "Worker stale job exceeded max attempts" });
      await supabase.from("jobs").update({ status: "failed", last_worker_error: "Worker heartbeat stale and max attempts reached", finished_at: new Date().toISOString() }).eq("id", job.id);
      await createJobLog(job.id, job.user_id, "error", "Stale processing job failed and reservation released", { attempts, maxAttempts, cutoff });
    } else {
      await supabase.from("jobs").update({ status: "retrying", last_worker_error: "Worker heartbeat stale; job returned to queue" }).eq("id", job.id);
      await createJobLog(job.id, job.user_id, "warning", "Stale processing job moved to retrying", { attempts, maxAttempts, cutoff });
    }
  }
}

async function getPendingJobs() {
  const jobId = process.argv[2];
  if (jobId) {
    const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).in("status", ["queued", "ready_for_processing"]).returns<Job[]>();
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await supabase.from("jobs").select("*").in("status", ["queued", "ready_for_processing", "retrying"]).order("created_at", { ascending: true }).limit(maxJobs).returns<Job[]>();
  if (error) throw error;
  return data ?? [];
}

async function claimJob(job: Job) {
  const { data, error } = await supabase.from("jobs").update({ status: "processing", processing_attempts: (job.processing_attempts ?? 0) + 1, started_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString(), last_worker_error: null }).eq("id", job.id).in("status", ["queued", "ready_for_processing", "retrying"]).select("*").maybeSingle<Job>();
  if (error) throw error;
  return data;
}


async function getUserEmailForJob(userId: string) {
  const profile = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle<{ email: string | null }>();
  if (profile.data?.email) return profile.data.email;
  const customer = await supabase.from("billing_customers").select("email").eq("user_id", userId).maybeSingle<{ email: string | null }>();
  return customer.data?.email ?? null;
}

async function downloadInputFile(job: Job) {
  if (!job.input_bucket || !job.input_file_path) throw new Error("Job without input storage path.");
  const { data, error } = await supabase.storage.from(job.input_bucket).download(job.input_file_path);
  if (error || !data) throw error ?? new Error("Unable to download input file.");
  return data.text();
}

function outputPath(job: Job, filename: string) { return `${job.user_id}/${job.id}/${filename}`; }
async function uploadOutputFile(bucket: string, path: string, content: string, contentType: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, new Blob([content], { type: contentType }), { upsert: true, contentType });
  if (error) throw error;
}

async function updateJobProgress(job: Job, processed: number, failed: number, aiStats?: Partial<AIAccumulator>) {
  await supabase.from("jobs").update({ rows_processed: processed, rows_failed: failed, last_heartbeat_at: new Date().toISOString(), ...(aiStats ? serializeAIStats(aiStats) : {}) }).eq("id", job.id);
}

type AIAccumulator = { inputTokens: number; outputTokens: number; aiCost: number; fallbackCount: number; aiErrorCount: number; validationErrorCount: number; unsupportedClaimCount: number; provider: string | null; model: string | null; promptVersion: string | null };
const emptyAIStats = (): AIAccumulator => ({ inputTokens: 0, outputTokens: 0, aiCost: 0, fallbackCount: 0, aiErrorCount: 0, validationErrorCount: 0, unsupportedClaimCount: 0, provider: null, model: null, promptVersion: null });
function addAIStats(total: AIAccumulator, row: AIRowResult) {
  total.inputTokens += row.inputTokens;
  total.outputTokens += row.outputTokens;
  total.aiCost += row.cost;
  total.fallbackCount += row.fallbackUsed ? 1 : 0;
  total.aiErrorCount += row.fallbackUsed && row.provider !== "template" ? 1 : 0;
  total.validationErrorCount += row.validationErrors.length;
  total.unsupportedClaimCount += row.unsupportedClaims.length;
  total.provider = row.provider;
  total.model = row.model;
  total.promptVersion = row.promptVersion;
}
function serializeAIStats(stats: Partial<AIAccumulator>) {
  return { input_tokens_estimated: stats.inputTokens, output_tokens_estimated: stats.outputTokens, ai_cost_estimated: stats.aiCost, fallback_count: stats.fallbackCount, ai_error_count: stats.aiErrorCount, validation_error_count: stats.validationErrorCount, unsupported_claim_count: stats.unsupportedClaimCount, ai_provider: stats.provider, ai_model: stats.model, prompt_version: stats.promptVersion };
}

async function processJob(job: Job) {
  const claimed = await claimJob(job);
  if (!claimed) return console.info(`Skipped ${job.id}; already claimed.`);
  job = claimed;
  await createJobLog(job.id, job.user_id, "info", "Job processing started", { file: job.original_filename });
  let reservationId: string | null = null;
  try {
    const text = await downloadInputFile(job);
    const parsed = parseCSV(text);
    const mapping = Object.keys(job.column_mapping ?? {}).length ? job.column_mapping! : autoMapColumns(parsed.headers);
    if (parsed.rows.length > maxRows) {
      const message = `CSV exceeds worker limit of ${maxRows} rows. Split the file into smaller jobs.`;
      const existing = await supabase.from("credit_reservations").select("id").eq("job_id", job.id).eq("status", "reserved").maybeSingle<{ id: string }>();
      if (existing.data?.id) await supabase.rpc("release_reserved_credits", { p_reservation_id: existing.data.id, p_reason: message });
      await supabase.from("jobs").update({ status: "failed_validation", error_message: message, last_worker_error: message, finished_at: new Date().toISOString() }).eq("id", job.id);
      await createJobLog(job.id, job.user_id, "warning", "Job rejected by worker row limit", { parsedRows: parsed.rows.length, maxRows, reservationReleased: Boolean(existing.data?.id) });
      return;
    }
    const rows = parsed.rows;
    await createJobLog(job.id, job.user_id, "info", "CSV downloaded and parsed", { rows: rows.length, columns: parsed.headers });

    const settings: Record<string, unknown> & { generation_type: string; platform: string; language: string; country: string; tone: string; column_mapping: ColumnMapping; generation_engine: "ai" | "template" } = { ...(job.settings ?? {}), generation_type: job.generation_type, platform: job.platform, language: job.language, country: job.country, tone: job.tone, column_mapping: mapping, generation_engine: (job.generation_engine === "template" || job.settings?.generation_engine === "template") ? "template" : "ai" };
    const estimatedReservationCredits = calculateJobCredits(rows.length, { generationType: job.generation_type, qualityLevel: String(settings.quality_level ?? settings.quality ?? "standard") });
    if (job.estimated_credits && job.estimated_credits !== estimatedReservationCredits) await createJobLog(job.id, job.user_id, "warning", "Worker recalculated credits different from stored estimate", { stored: job.estimated_credits, recalculated: estimatedReservationCredits });
    const existingReservation = await supabase.from("credit_reservations").select("id,amount,status").eq("job_id", job.id).eq("status", "reserved").maybeSingle<{ id: string; amount: number; status: string }>();
    if (existingReservation.data?.id) reservationId = existingReservation.data.id;
    else {
      const reserved = await supabase.rpc("reserve_credits", { p_user_id: job.user_id, p_job_id: job.id, p_amount: estimatedReservationCredits }).maybeSingle<{ id: string }>();
      if (reserved.error || !reserved.data?.id) {
        const message = reserved.error?.message ?? "No se pudo reservar saldo.";
        await supabase.from("jobs").update({ status: "insufficient_credits", error_message: message, last_worker_error: message, finished_at: new Date().toISOString() }).eq("id", job.id);
        await createJobLog(job.id, job.user_id, "warning", "Insufficient credits: job not processed", { estimatedReservationCredits, error: message });
        const email = await getUserEmailForJob(job.user_id);
        await sendJobFailedEmail({ email }, job, `Productos insuficientes para reservar el lote: ${message}`);
        return;
      }
      reservationId = reserved.data.id;
    }
    await createJobLog(job.id, job.user_id, "info", "Credits reserved before processing", { reservationId, estimatedReservationCredits });
    await createJobLog(job.id, job.user_id, "info", settings.generation_engine === "ai" ? "AI generation enabled with template fallback" : "Template generation selected", { engine: settings.generation_engine }, settings.generation_engine === "ai" ? "ai" : "worker");
    const results: GenerationOutput[] = [];
    const failedRows: Array<{ row_index: number; sku?: string; nombre_producto?: string; error_message: string; detected_issues?: string[] }> = [];
    const aiStats = emptyAIStats();
    let processed = 0;
    let failed = 0;

    for (const [index, row] of rows.entries()) {
      try {
        const normalized = normalizeRow(row, mapping);
        const aiResult = await generateOutputWithAI(normalized, settings);
        const output = aiResult.output;
        addAIStats(aiStats, aiResult);
        results.push(output);
        processed += 1;
        if (aiResult.fallbackUsed) await createJobLog(job.id, job.user_id, "warning", "Fallback template aplicado en fila", { row_index: index, reason: aiResult.validationErrors[0] }, "ai");
        if (aiResult.jsonRepaired) await createJobLog(job.id, job.user_id, "warning", "JSON IA reparado y validado", { row_index: index }, "ai");
        if (aiResult.unsupportedClaims.length) await createJobLog(job.id, job.user_id, "warning", "Claims no soportados detectados", { row_index: index, claims: aiResult.unsupportedClaims }, "ai");
        await supabase.from("job_rows").upsert({ job_id: job.id, user_id: job.user_id, row_index: index, input_data: normalized, output_data: output, seo_score: output.seo_score, conversion_score: output.conversion_score, detected_issues: output.quality_warnings ? output.quality_warnings.split(" | ") : [], validation_status: output.quality_warnings ? "warning" : "valid", priority: output.quality_warnings ? "medium" : "low", status: "completed", error_message: null, ai_provider: aiResult.provider, ai_model: aiResult.model, prompt_version: aiResult.promptVersion, input_tokens_estimated: aiResult.inputTokens, output_tokens_estimated: aiResult.outputTokens, ai_cost_estimated: aiResult.cost, raw_ai_output: aiResult.rawAIOutput, validation_errors: aiResult.validationErrors, unsupported_claims: aiResult.unsupportedClaims, fallback_used: aiResult.fallbackUsed, generation_attempts: aiResult.generationAttempts, json_repaired: aiResult.jsonRepaired }, { onConflict: "job_id,row_index" });
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Row processing failed";
        failedRows.push({ row_index: index, sku: row.sku, nombre_producto: row.nombre_producto, error_message: message, detected_issues: [message] });
        await supabase.from("job_rows").upsert({ job_id: job.id, user_id: job.user_id, row_index: index, input_data: row, validation_status: "invalid", detected_issues: [message], priority: "high", status: "failed", error_message: message }, { onConflict: "job_id,row_index" });
        await createJobLog(job.id, job.user_id, "warning", "Row failed", { row_index: index, error: message });
      }
      if ((index + 1) % 10 === 0 || index === rows.length - 1) await updateJobProgress(job, processed, failed, aiStats);
    }

    const averageScore = Math.round(results.reduce((sum, row) => sum + row.seo_score, 0) / Math.max(results.length, 1));
    const warnings = results.filter((row) => row.quality_warnings).length;
    const creditsUsed = results.reduce((sum, row) => sum + row.internal_credits_used, 0) || calculateJobCredits(results.length, { generationType: job.generation_type, qualityLevel: String(settings.quality_level ?? settings.quality ?? "standard") });
    const productEquivalent = results.reduce((sum, row) => sum + row.product_equivalent_used, 0);
    const rankeliaCsv = buildOutputCSV(results, "rankelia");
    const selectedPlatform = platformDownloadType(job.platform);
    const platformCsv = selectedPlatform === "rankelia_csv" ? null : buildOutputCSV(results, job.platform);
    const html = buildOutputHTML(results, job);
    const report = `${buildReportTXT({ ...job, estimated_credits: job.estimated_credits ?? undefined }, results, { failed, warnings })}

IA y costes:
Provider: ${aiStats.provider ?? "template"}
Modelo: ${aiStats.model ?? "template"}
Prompt version: ${aiStats.promptVersion ?? "template-v1.0.0"}
Input tokens estimados: ${aiStats.inputTokens}
Output tokens estimados: ${aiStats.outputTokens}
Coste IA estimado: ${aiStats.aiCost.toFixed(6)}
Fallback rows: ${aiStats.fallbackCount}
Validation errors: ${aiStats.validationErrorCount}
Unsupported claims: ${aiStats.unsupportedClaimCount}
`;
    const rankeliaPath = outputPath(job, "output_rankelia.csv");
    const platformPath = platformCsv ? outputPath(job, `output_${selectedPlatform.replace("_csv", "")}.csv`) : null;
    const htmlPath = outputPath(job, "output.html");
    const reportPath = outputPath(job, "report.txt");
    await uploadOutputFile(OUTPUT_BUCKET, rankeliaPath, rankeliaCsv, "text/csv;charset=utf-8");
    if (platformCsv && platformPath) await uploadOutputFile(OUTPUT_BUCKET, platformPath, platformCsv, "text/csv;charset=utf-8");
    await uploadOutputFile(OUTPUT_BUCKET, htmlPath, html, "text/html;charset=utf-8");
    await uploadOutputFile(REPORT_BUCKET, reportPath, report, "text/plain;charset=utf-8");
    const downloads = [
      { user_id: job.user_id, project_id: job.project_id, job_id: job.id, file_type: "rankelia_csv", filename: `${job.original_filename ?? "rankelia"}-rankelia.csv`, storage_bucket: OUTPUT_BUCKET, storage_path: rankeliaPath, rows_count: results.length, average_score: averageScore, file_size: rankeliaCsv.length, quality_level: settings.quality_level ?? settings.quality ?? "standard", product_equivalent_used: productEquivalent },
      ...(platformCsv && platformPath ? [{ user_id: job.user_id, project_id: job.project_id, job_id: job.id, file_type: selectedPlatform, filename: `${job.original_filename ?? "rankelia"}-${selectedPlatform.replace("_csv", "")}.csv`, storage_bucket: OUTPUT_BUCKET, storage_path: platformPath, rows_count: results.length, average_score: averageScore, file_size: platformCsv.length, quality_level: settings.quality_level ?? settings.quality ?? "standard", product_equivalent_used: productEquivalent }] : []),
      { user_id: job.user_id, project_id: job.project_id, job_id: job.id, file_type: "html_report", filename: `${job.original_filename ?? "rankelia"}.html`, storage_bucket: OUTPUT_BUCKET, storage_path: htmlPath, rows_count: results.length, average_score: averageScore, file_size: html.length, quality_level: settings.quality_level ?? settings.quality ?? "standard", product_equivalent_used: productEquivalent },
      { user_id: job.user_id, project_id: job.project_id, job_id: job.id, file_type: "txt_report", filename: `informe-${job.original_filename ?? job.id}.txt`, storage_bucket: REPORT_BUCKET, storage_path: reportPath, rows_count: results.length, average_score: averageScore, file_size: report.length, quality_level: settings.quality_level ?? settings.quality ?? "standard", product_equivalent_used: productEquivalent },
    ];
    if (failedRows.length) {
      const errorsCsv = buildErrorsCSV(failedRows);
      const errorsPath = outputPath(job, "errors.csv");
      await uploadOutputFile(OUTPUT_BUCKET, errorsPath, errorsCsv, "text/csv;charset=utf-8");
      downloads.push({ user_id: job.user_id, project_id: job.project_id, job_id: job.id, file_type: "errors_csv", filename: `errores-${job.original_filename ?? job.id}.csv`, storage_bucket: OUTPUT_BUCKET, storage_path: errorsPath, rows_count: failedRows.length, average_score: 0, file_size: errorsCsv.length, quality_level: settings.quality_level ?? settings.quality ?? "standard", product_equivalent_used: 0 });
    }
    await supabase.from("downloads").insert(downloads);
    if (reservationId) {
      const consumed = await supabase.rpc("consume_reserved_credits", { p_reservation_id: reservationId, p_actual_amount: creditsUsed });
      if (consumed.error) await createJobLog(job.id, job.user_id, "error", "Could not consume reserved credits", { reservationId, error: consumed.error.message });
      else await createJobLog(job.id, job.user_id, "info", "Credits consumed for completed job", { reservationId, creditsUsed });
    }
    await supabase.from("jobs").update({ status: failedRows.length || aiStats.fallbackCount || warnings ? "completed_with_warnings" : "completed", rows_processed: processed, rows_failed: failed, credits_used: creditsUsed, product_equivalent_used: productEquivalent, average_score: averageScore, output_csv_path: rankeliaPath, output_html_path: htmlPath, output_report_path: reportPath, finished_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString(), quality_level: settings.quality_level ?? settings.quality ?? "standard", generation_engine: settings.generation_engine, ...serializeAIStats(aiStats) }).eq("id", job.id);
    const email = await getUserEmailForJob(job.user_id);
    await createJobLog(job.id, job.user_id, "info", "Job completed", { processed, failed, averageScore, downloads: downloads.length, email: email ? "queued" : "missing", ai: aiStats });
    await sendJobCompletedEmail({ email }, job, downloads);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker failed";
    if (reservationId) {
      const released = await supabase.rpc("release_reserved_credits", { p_reservation_id: reservationId, p_reason: `Job failed: ${message}` });
      if (released.error) await createJobLog(job.id, job.user_id, "error", "Could not release reserved credits", { reservationId, error: released.error.message });
      else await createJobLog(job.id, job.user_id, "warning", "Credits released after job failure", { reservationId });
    }
    await supabase.from("jobs").update({ status: "failed", error_message: message, last_worker_error: message, finished_at: new Date().toISOString() }).eq("id", job.id);
    const email = await getUserEmailForJob(job.user_id);
    await createJobLog(job.id, job.user_id, "error", "Job failed", { error: message, email: email ? "queued" : "missing" });
    await sendJobFailedEmail({ email }, job, message);
  }
}

function normalizeRow(row: CsvRow, mapping: ColumnMapping): CsvRow {
  const out: CsvRow = { ...row };
  for (const [key, header] of Object.entries(mapping)) if (header) out[key] = row[header] ?? out[key] ?? "";
  return out;
}
function platformDownloadType(platform: string) { if (/shopify/i.test(platform)) return "shopify_csv"; if (/prestashop|presta/i.test(platform)) return "prestashop_csv"; if (/woo/i.test(platform)) return "woocommerce_csv"; return "rankelia_csv"; }

async function main() {
  await recoverStaleProcessingJobs();
  const jobs = await getPendingJobs();
  if (!jobs.length) console.info("No pending jobs.");
  for (const job of jobs) await processJob(job);
}
main().catch((error) => { console.error(error); process.exit(1); });
