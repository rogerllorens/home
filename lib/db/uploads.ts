import { createClient } from "@/lib/supabase/client";

export type FileUploadRecord = {
  id: string;
  user_id: string;
  project_id: string | null;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  row_count: number;
  detected_columns: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

export async function createFileUploadRecord(data: Omit<FileUploadRecord, "id" | "created_at" | "updated_at">) {
  const supabase = createClient();
  return supabase.from("file_uploads").insert(data).select("*").single<FileUploadRecord>();
}

export async function getFileUploads() {
  const supabase = createClient();
  return supabase.from("file_uploads").select("*").order("created_at", { ascending: false });
}
