import { createClient } from "@/lib/supabase/client";

export type DownloadRecord = {
  id: string;
  user_id: string;
  project_id: string | null;
  job_id: string | null;
  file_type: string;
  filename: string;
  storage_bucket: string;
  storage_path: string;
  rows_count: number;
  average_score: number | null;
  file_size: number | null;
  quality_level?: string | null;
  product_equivalent_used?: number | null;
  expires_at: string | null;
  created_at: string;
};

export async function getUserDownloads() {
  const supabase = createClient();
  return supabase.from("downloads").select("*").order("created_at", { ascending: false }).returns<DownloadRecord[]>();
}

export async function createDownloadRecord(data: Omit<DownloadRecord, "id" | "created_at">) {
  const supabase = createClient();
  return supabase.from("downloads").insert(data).select("*").single<DownloadRecord>();
}

export async function getDownloadById(id: string) {
  const supabase = createClient();
  return supabase.from("downloads").select("*").eq("id", id).maybeSingle<DownloadRecord>();
}
