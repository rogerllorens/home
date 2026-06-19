import { createClient } from "@/lib/supabase/client";
import type { JobLogRecord } from "@/lib/db/jobs";

export type AdminJobLogRecord = JobLogRecord & { jobs?: { original_filename?: string | null; status?: string | null } | null; profiles?: { email?: string | null; full_name?: string | null } | null };

export async function getUserJobLogs(jobId: string) {
  const supabase = createClient();
  return supabase.from("job_logs").select("*").eq("job_id", jobId).order("created_at", { ascending: false }).returns<JobLogRecord[]>();
}

export async function getAdminLogs() {
  const supabase = createClient();
  return supabase.from("job_logs").select("*, jobs:job_id(original_filename,status), profiles:user_id(email,full_name)").order("created_at", { ascending: false }).limit(200).returns<AdminJobLogRecord[]>();
}
