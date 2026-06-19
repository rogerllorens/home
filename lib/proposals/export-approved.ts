import type { SupabaseClient } from "@supabase/supabase-js";
import { OUTPUT_BUCKET, REPORT_BUCKET } from "@/lib/storage/files";
import { buildOutputCSV, buildOutputHTML, buildReportTXT, type GenerationOutput } from "@/lib/generation/template-generator";
import { createProposalEvent } from "./events";

type Client = SupabaseClient;
function outputPath(userId: string, jobId: string, filename: string) { return `${userId}/${jobId}/approved/${Date.now()}-${filename}`; }
async function upload(client: Client, bucket: string, path: string, content: string, contentType: string) {
  const { error } = await client.storage.from(bucket).upload(path, new Blob([content], { type: contentType }), { upsert: true, contentType });
  if (error) throw error;
}
function platformFileType(platform: string) {
  if (/shopify/i.test(platform)) return "shopify_csv";
  if (/woo/i.test(platform)) return "woocommerce_csv";
  if (/presta/i.test(platform)) return "prestashop_csv";
  return "rankelia_csv";
}

export async function exportApprovedForJob(client: Client, input: { userId: string; jobId: string; platform?: string }) {
  const jobResult = await client.from("jobs").select("id,user_id,project_id,platform,original_filename,status,estimated_credits").eq("id", input.jobId).eq("user_id", input.userId).maybeSingle<{ id: string; user_id: string; project_id: string | null; platform: string; original_filename: string | null; status: string; estimated_credits: number | null }>();
  if (!jobResult.data) throw new Error("job_not_found");
  const versions = await client.from("optimization_proposals").select("id,approved_version_id,optimization_proposal_versions!optimization_proposals_approved_version_fk(*)").eq("job_id", input.jobId).eq("user_id", input.userId).not("approved_version_id", "is", null).returns<Array<{ id: string; approved_version_id: string; optimization_proposal_versions: { output_data: GenerationOutput; scores?: Record<string, unknown> } | null }>>();
  const approved = (versions.data ?? []).map((row) => row.optimization_proposal_versions?.output_data).filter(Boolean) as GenerationOutput[];
  if (!approved.length) throw new Error("no_approved_versions");
  const platform = input.platform ?? jobResult.data.platform ?? "rankelia";
  const genericCsv = buildOutputCSV(approved, "rankelia");
  const platformCsv = buildOutputCSV(approved, platform);
  const html = buildOutputHTML(approved, { id: input.jobId, original_filename: jobResult.data.original_filename, platform });
  const txt = buildReportTXT({ id: input.jobId, original_filename: jobResult.data.original_filename, platform, estimated_credits: jobResult.data.estimated_credits ?? undefined }, approved, { failed: 0, warnings: approved.filter((row) => row.quality_warnings).length });
  const genericPath = outputPath(input.userId, input.jobId, `rankelia-approved-generic-${input.jobId}.csv`);
  const platformPath = outputPath(input.userId, input.jobId, `rankelia-approved-${platform}-${input.jobId}.csv`);
  const htmlPath = outputPath(input.userId, input.jobId, `rankelia-approved-report-${input.jobId}.html`);
  const txtPath = outputPath(input.userId, input.jobId, `rankelia-approved-summary-${input.jobId}.txt`);
  await upload(client, OUTPUT_BUCKET, genericPath, genericCsv, "text/csv;charset=utf-8");
  await upload(client, OUTPUT_BUCKET, platformPath, platformCsv, "text/csv;charset=utf-8");
  await upload(client, OUTPUT_BUCKET, htmlPath, html, "text/html;charset=utf-8");
  await upload(client, REPORT_BUCKET, txtPath, txt, "text/plain;charset=utf-8");
  const averageScore = Math.round(approved.reduce((sum, row) => sum + (row.seo_score ?? 0), 0) / Math.max(approved.length, 1));
  const downloads = [
    { user_id: input.userId, project_id: jobResult.data.project_id, job_id: input.jobId, file_type: "rankelia_csv", filename: `rankelia-approved-generic-${input.jobId}.csv`, storage_bucket: OUTPUT_BUCKET, storage_path: genericPath, rows_count: approved.length, average_score: averageScore, file_size: genericCsv.length },
    { user_id: input.userId, project_id: jobResult.data.project_id, job_id: input.jobId, file_type: platformFileType(platform), filename: `rankelia-approved-${platform}-${input.jobId}.csv`, storage_bucket: OUTPUT_BUCKET, storage_path: platformPath, rows_count: approved.length, average_score: averageScore, file_size: platformCsv.length },
    { user_id: input.userId, project_id: jobResult.data.project_id, job_id: input.jobId, file_type: "html_report", filename: `rankelia-approved-report-${input.jobId}.html`, storage_bucket: OUTPUT_BUCKET, storage_path: htmlPath, rows_count: approved.length, average_score: averageScore, file_size: html.length },
    { user_id: input.userId, project_id: jobResult.data.project_id, job_id: input.jobId, file_type: "txt_report", filename: `rankelia-approved-summary-${input.jobId}.txt`, storage_bucket: REPORT_BUCKET, storage_path: txtPath, rows_count: approved.length, average_score: averageScore, file_size: txt.length },
  ];
  const inserted = await client.from("downloads").insert(downloads).select("*");
  if (inserted.error) throw inserted.error;
  await client.from("optimization_proposals").update({ status: "exported", exported_at: new Date().toISOString() }).eq("job_id", input.jobId).eq("user_id", input.userId).not("approved_version_id", "is", null);
  await client.from("job_rows").update({ approval_status: "exported" }).eq("job_id", input.jobId).eq("user_id", input.userId).eq("approval_status", "approved");
  for (const proposal of versions.data ?? []) await createProposalEvent(client, { proposalId: proposal.id, versionId: proposal.approved_version_id, userId: input.userId, eventType: "exported", metadata: { job_id: input.jobId, platform } });
  return { downloads: inserted.data ?? [], rows: approved.length, averageScore };
}
