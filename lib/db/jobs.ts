import { createClient } from "@/lib/supabase/client";
import type { CsvRow } from "@/lib/csv";

export type JobRecord = {
  id: string;
  user_id: string;
  project_id: string | null;
  file_upload_id: string | null;
  job_type: string;
  platform: string;
  generation_type: string;
  language: string;
  country: string;
  tone: string;
  status: string;
  original_filename: string | null;
  input_bucket: string | null;
  input_file_path: string | null;
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  rows_processed: number;
  rows_failed: number;
  categories_count: number;
  detected_columns: string[];
  column_mapping: Record<string, string>;
  analysis_summary: Record<string, unknown>;
  settings: Record<string, unknown>;
  estimated_credits: number;
  average_score: number | null;
  credits_used?: number;
  product_equivalent_used?: number;
  quality_level?: string;
  processing_attempts?: number;
  generation_engine?: string | null;
  ai_provider?: string | null;
  ai_model?: string | null;
  prompt_version?: string | null;
  input_tokens_estimated?: number;
  output_tokens_estimated?: number;
  ai_cost_estimated?: number;
  ai_error_count?: number;
  fallback_count?: number;
  validation_error_count?: number;
  unsupported_claim_count?: number;
  last_worker_error?: string | null;
  last_heartbeat_at?: string | null;
  output_csv_path?: string | null;
  output_html_path?: string | null;
  output_report_path?: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type JobRowRecord = {
  id: string;
  job_id: string;
  user_id: string;
  row_index: number;
  input_data: CsvRow;
  validation_status: string;
  detected_issues: string[];
  priority: string;
  status: string;
  output_data?: Record<string, unknown> | null;
  seo_score?: number | null;
  conversion_score?: number | null;
  error_message: string | null;
  ai_provider?: string | null;
  ai_model?: string | null;
  prompt_version?: string | null;
  input_tokens_estimated?: number;
  output_tokens_estimated?: number;
  ai_cost_estimated?: number;
  raw_ai_output?: Record<string, unknown> | null;
  validation_errors?: string[] | null;
  unsupported_claims?: string[] | null;
  fallback_used?: boolean;
  generation_attempts?: number;
  json_repaired?: boolean;
  created_at: string;
  updated_at: string;
};

export async function createJobRecord(data: Partial<JobRecord> & { user_id: string; job_type: string }) {
  const supabase = createClient();
  return supabase.from("jobs").insert(data).select("*").single<JobRecord>();
}

export async function updateJob(id: string, data: Partial<JobRecord>) {
  const supabase = createClient();
  return supabase.from("jobs").update(data).eq("id", id).select("*").single<JobRecord>();
}

export async function getUserJobs() {
  const supabase = createClient();
  return supabase.from("jobs").select("*").order("created_at", { ascending: false }).returns<JobRecord[]>();
}

export async function getJobById(id: string) {
  const supabase = createClient();
  return supabase.from("jobs").select("*").eq("id", id).maybeSingle<JobRecord>();
}

export async function createJobRows(rows: Array<Omit<JobRowRecord, "id" | "created_at" | "updated_at">>) {
  const supabase = createClient();
  return supabase.from("job_rows").insert(rows).select("*").returns<JobRowRecord[]>();
}

export async function getJobRows(jobId: string) {
  const supabase = createClient();
  return supabase.from("job_rows").select("*").eq("job_id", jobId).order("row_index", { ascending: true }).returns<JobRowRecord[]>();
}

export async function getAdminJobs() {
  const supabase = createClient();
  return supabase.from("jobs").select("*, profiles:user_id(email, full_name)").order("created_at", { ascending: false });
}

export type JobLogRecord = { id: string; job_id: string; user_id: string; level: string; source: string; message: string; context: Record<string, unknown> | null; created_at: string };

export async function getJobLogs(jobId: string) {
  const supabase = createClient();
  return supabase.from("job_logs").select("*").eq("job_id", jobId).order("created_at", { ascending: false }).returns<JobLogRecord[]>();
}
