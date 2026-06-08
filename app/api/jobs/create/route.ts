import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { analyzeCSVRows, autoMapColumns, parseCSV, type ColumnMapping, type CsvRow } from "@/lib/csv";
import { calculateJobCredits, calculateProductEquivalentUsed, normalizeGenerationType, normalizeQualityLevel } from "@/lib/pricing";
import { INPUT_BUCKET, sanitizeFilename, validateStoragePathOwnership } from "@/lib/storage/files";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getPlanLimits, isExportFormatAllowed, isGenerationTypeAllowed, isQualityAllowed } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

type CreateJobPayload = {
  inputFilePath?: string;
  originalFilename?: string;
  platform?: string;
  language?: string;
  country?: string;
  tone?: string;
  generationType?: string;
  qualityLevel?: string;
  columnMapping?: ColumnMapping;
};

const allowedPlatforms = new Set(["generic", "CSV genérico", "Shopify", "WooCommerce", "Prestashop", "PrestaShop"]);
const allowedGenerationTypes = new Set(["product_complete", "products_categories", "metadata_only", "categories_seo"]);
const batchSize = 500;

function toDbGenerationType(value = "product_complete") { return normalizeGenerationType(value); }

function normalizePlatform(value = "generic") {
  if (/shopify/i.test(value)) return "Shopify";
  if (/woo/i.test(value)) return "WooCommerce";
  if (/presta/i.test(value)) return "PrestaShop";
  return value === "CSV genérico" ? "generic" : value;
}

function toRowInserts(jobId: string, userId: string, rows: CsvRow[], analysis: ReturnType<typeof analyzeCSVRows>) {
  return rows.map((row, index) => {
    const preview = analysis.preview[index];
    return {
      job_id: jobId,
      user_id: userId,
      row_index: index,
      input_data: row,
      validation_status: preview?.__validationStatus ?? "valid",
      detected_issues: preview?.__issues ?? [],
      priority: preview?.__priority === "Alta" ? "high" : preview?.__priority === "Media" ? "medium" : "low",
      status: "pending",
      error_message: null,
    };
  });
}

async function insertRowsInBatches(supabase: ReturnType<typeof createServiceClient>, rows: ReturnType<typeof toRowInserts>) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const { error } = await supabase.from("job_rows").insert(rows.slice(index, index + batchSize));
    if (error) throw error;
  }
}

export async function POST(request: Request) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await enforceRateLimit(request, "jobs:create", context.user.id, 12, 60);
  if (limited) return limited;

  const body = (await request.json().catch(() => null)) as CreateJobPayload | null;
  if (!body?.inputFilePath || !validateStoragePathOwnership(context.user.id, body.inputFilePath)) {
    return NextResponse.json({ error: "Ruta de archivo inválida o ajena al usuario." }, { status: 400 });
  }

  const originalFilename = sanitizeFilename(body.originalFilename ?? "catalogo.csv");
  if (!originalFilename.toLowerCase().endsWith(".csv")) return NextResponse.json({ error: "Solo se procesan CSV reales en beta. XLSX está documentado para v1.1." }, { status: 400 });

  const platform = normalizePlatform(body.platform);
  if (!allowedPlatforms.has(platform) && platform !== "generic") return NextResponse.json({ error: "Plataforma no permitida." }, { status: 400 });

  const generationType = toDbGenerationType(body.generationType);
  if (!allowedGenerationTypes.has(generationType)) return NextResponse.json({ error: "Tipo de generación no permitido." }, { status: 400 });

  const qualityLevel = normalizeQualityLevel(body.qualityLevel ?? "standard");
  const service = createServiceClient();
  const subscription = await service.from("subscriptions").select("plan_id,status").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle<{ plan_id: string; status: string }>();
  const planId = subscription.data?.plan_id ?? "free";
  const planLimits = getPlanLimits(planId);
  const activeStatuses = ["pending_reservation", "queued", "ready_for_processing", "processing", "retrying"];
  const activeJobs = await service.from("jobs").select("id", { count: "exact", head: true }).eq("user_id", context.user.id).in("status", activeStatuses);
  if ((activeJobs.count ?? 0) >= planLimits.maxConcurrentJobs) return NextResponse.json({ error: `Tu plan permite ${planLimits.maxConcurrentJobs} job(s) activo(s). Espera a que termine uno antes de crear otro.`, activeJobs: activeJobs.count ?? 0, maxConcurrentJobs: planLimits.maxConcurrentJobs }, { status: 429 });
  if (!isQualityAllowed(planId, qualityLevel)) return NextResponse.json({ error: `Tu plan actual no permite calidad ${qualityLevel}. Los productos extra aumentan volumen, pero no desbloquean calidad premium.` }, { status: 403 });
  if (!isGenerationTypeAllowed(planId, generationType)) return NextResponse.json({ error: "Tu plan actual no permite este tipo de generación." }, { status: 403 });
  if (!isExportFormatAllowed(planId, platform)) return NextResponse.json({ error: "Tu plan actual no permite este formato de exportación." }, { status: 403 });
  const language = (body.language ?? "es").slice(0, 10);
  const country = (body.country ?? "ES").slice(0, 10);
  const tone = (body.tone ?? "profesional").slice(0, 80);
  const maxRows = Math.min(Number(process.env.WORKER_MAX_ROWS_PER_JOB ?? 5000), planLimits.maxProductsPerJob);

  let jobId: string | null = null;
  let reservationId: string | null = null;
  let supabase: ReturnType<typeof createServiceClient> | null = null;
  try {
    supabase = service;
    const downloaded = await supabase.storage.from(INPUT_BUCKET).download(body.inputFilePath);
    if (downloaded.error || !downloaded.data) throw downloaded.error ?? new Error("No se pudo leer el CSV privado.");
    const text = await downloaded.data.text();
    const parsed = parseCSV(text);
    if (!parsed.headers.length) return NextResponse.json({ error: "El CSV no tiene cabeceras." }, { status: 400 });
    if (!parsed.rows.length) return NextResponse.json({ error: "El CSV no contiene filas." }, { status: 400 });
    if (parsed.rows.length > maxRows) return NextResponse.json({ error: `Este entorno beta procesa hasta ${maxRows.toLocaleString("es-ES")} filas por job. Divide el CSV en varios lotes.`, maxRows }, { status: 413 });

    const mapping = Object.keys(body.columnMapping ?? {}).length ? body.columnMapping! : autoMapColumns(parsed.headers);
    const analysis = analyzeCSVRows(parsed.rows, mapping, { generationType });
    const estimatedCredits = calculateJobCredits(parsed.rows.length, { generationType, qualityLevel, categories: analysis.categories });
    const productEquivalent = calculateProductEquivalentUsed(parsed.rows.length, qualityLevel);

    const existingProject = await supabase.from("projects").select("*").eq("user_id", context.user.id).order("created_at", { ascending: true }).limit(1).maybeSingle<{ id: string; name: string; platform: string }>();
    const project = existingProject.data ?? (await supabase.from("projects").insert({ user_id: context.user.id, name: context.profile?.company_name || "Mi ecommerce", platform, language, country, default_tone: tone }).select("*").single<{ id: string; name: string; platform: string }>()).data;
    if (!project?.id) throw existingProject.error ?? new Error("No se pudo preparar el proyecto.");

    const upload = await supabase.from("file_uploads").insert({ user_id: context.user.id, project_id: project.id, original_filename: originalFilename, storage_bucket: INPUT_BUCKET, storage_path: body.inputFilePath, file_type: "text/csv", row_count: parsed.rows.length, detected_columns: parsed.headers, status: "analyzed" }).select("*").single<{ id: string }>();
    if (upload.error || !upload.data?.id) throw upload.error ?? new Error("No se pudo registrar el archivo.");

    const job = await supabase.from("jobs").insert({
      user_id: context.user.id,
      project_id: project.id,
      file_upload_id: upload.data.id,
      job_type: "products_csv",
      platform,
      generation_type: generationType,
      language,
      country,
      tone,
      status: "pending_reservation",
      original_filename: originalFilename,
      input_bucket: INPUT_BUCKET,
      input_file_path: body.inputFilePath,
      rows_total: parsed.rows.length,
      rows_valid: analysis.validRows,
      rows_invalid: analysis.invalidRows,
      categories_count: analysis.categories,
      detected_columns: parsed.headers,
      column_mapping: mapping,
      analysis_summary: analysis as unknown as Record<string, unknown>,
      settings: { generation_engine: "ai", generation_type: generationType, quality_level: qualityLevel, platform, language, country, tone, column_mapping: mapping },
      generation_engine: "ai",
      estimated_credits: estimatedCredits,
      quality_level: qualityLevel,
      product_equivalent_used: productEquivalent,
      average_score: analysis.currentScore,
    }).select("*").single<{ id: string }>();
    if (job.error || !job.data?.id) throw job.error ?? new Error("No se pudo crear el job.");
    jobId = job.data.id;

    await insertRowsInBatches(supabase, toRowInserts(jobId, context.user.id, parsed.rows, analysis));

    const reserved = await supabase.rpc("reserve_credits", { p_user_id: context.user.id, p_job_id: jobId, p_amount: estimatedCredits }).maybeSingle<{ id: string }>();
    if (reserved.error || !reserved.data?.id) {
      await supabase.from("jobs").update({ status: "insufficient_credits", error_message: reserved.error?.message ?? "Saldo insuficiente", finished_at: new Date().toISOString() }).eq("id", jobId);
      return NextResponse.json({ error: "No tienes productos suficientes para reservar este job.", estimatedCredits, estimatedProducts: Math.ceil(estimatedCredits / 500) }, { status: 402 });
    }
    reservationId = reserved.data.id;

    await Promise.all([
      supabase.from("jobs").update({ status: "queued", reserved_credits: estimatedCredits }).eq("id", jobId),
      supabase.from("profiles").update({ company_name: context.profile?.company_name || project.name, default_platform: platform, onboarding_completed: true }).eq("id", context.user.id),
    ]);

    return NextResponse.json({ jobId, reservationId, status: "queued", estimatedCredits, estimatedProducts: Math.ceil(estimatedCredits / 500), rowsTotal: parsed.rows.length, rowsValid: analysis.validRows, warnings: analysis.issues.slice(0, 10) });
  } catch (error) {
    if (reservationId && supabase) await supabase.rpc("release_reserved_credits", { p_reservation_id: reservationId, p_reason: "Job creation failed after reservation" });
    if (jobId && supabase) await supabase.from("jobs").update({ status: "failed", error_message: error instanceof Error ? error.message : "Job creation failed", finished_at: new Date().toISOString() }).eq("id", jobId);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el job." }, { status: 500 });
  }
}
