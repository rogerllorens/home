import { createClient } from "@supabase/supabase-js";
import { createProposalFromJobRow } from "../lib/proposals";
import type { GenerationOutput } from "../lib/generation/template-generator";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for proposal backfill.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const dryRun = process.argv.includes("--dry-run");
const arg = (name: string) => process.argv.find((item) => item.startsWith(`${name}=`))?.split("=")[1];
const jobId = arg("--job-id");
const userId = arg("--user-id");
const limit = Number(arg("--limit") ?? process.env.BACKFILL_PROPOSALS_LIMIT ?? 100);

type Row = { id: string; user_id: string; job_id: string; row_index: number; input_data: Record<string, unknown>; output_data: GenerationOutput & Record<string, unknown>; proposal_id: string | null; ai_provider?: string | null; ai_model?: string | null; prompt_version?: string | null; fallback_used?: boolean | null; ai_cost_estimated?: number | null };

async function main() {
  let query = supabase.from("job_rows").select("id,user_id,job_id,row_index,input_data,output_data,proposal_id,ai_provider,ai_model,prompt_version,fallback_used,ai_cost_estimated").is("proposal_id", null).not("output_data", "is", null).eq("status", "completed").order("created_at", { ascending: true }).limit(limit);
  if (jobId) query = query.eq("job_id", jobId);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.returns<Row[]>();
  if (error) throw error;
  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of data ?? []) {
    if (!row.output_data) { skipped += 1; continue; }
    if (dryRun) { console.log(`[dry-run] would create proposal for row ${row.id}`); skipped += 1; continue; }
    try {
      await createProposalFromJobRow(supabase, { userId: row.user_id, jobId: row.job_id, jobRowId: row.id, rowIndex: row.row_index, originalData: row.input_data, outputData: row.output_data, metadata: { provider: row.ai_provider, model: row.ai_model, promptVersion: row.prompt_version, fallbackUsed: Boolean(row.fallback_used), cost: row.ai_cost_estimated } });
      created += 1;
    } catch (error) {
      failed += 1;
      console.warn(`Failed row ${row.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(JSON.stringify({ scanned: data?.length ?? 0, created, skipped, failed, dryRun }));
}

main().catch((error) => { console.error(error); process.exit(1); });
