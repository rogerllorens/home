import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");
const limit = Number(process.env.CLEANUP_ORPHAN_UPLOADS_LIMIT ?? 100);
if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for cleanup.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

type PendingUpload = { id: string; user_id: string; storage_bucket: string; storage_path: string; status: string; job_id: string | null };

async function main() {
  const { data, error } = await supabase.from("pending_uploads").select("id,user_id,storage_bucket,storage_path,status,job_id").eq("status", "pending").lt("expires_at", new Date().toISOString()).limit(limit).returns<PendingUpload[]>();
  if (error) throw error;
  let deleted = 0;
  let failed = 0;
  for (const upload of data ?? []) {
    if (upload.job_id) continue;
    if (dryRun) { console.log(`[dry-run] would delete ${upload.storage_bucket}/${upload.storage_path}`); continue; }
    const removed = await supabase.storage.from(upload.storage_bucket).remove([upload.storage_path]);
    if (removed.error) {
      failed += 1;
      await supabase.from("pending_uploads").update({ status: "failed" }).eq("id", upload.id);
      console.warn(`Failed to delete ${upload.storage_path}: ${removed.error.message}`);
    } else {
      deleted += 1;
      await supabase.from("pending_uploads").update({ status: "deleted" }).eq("id", upload.id);
    }
  }
  console.log(JSON.stringify({ scanned: data?.length ?? 0, deleted, failed, dryRun }));
}
main().catch((error) => { console.error(error); process.exit(1); });
