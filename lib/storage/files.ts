import { createClient } from "@/lib/supabase/client";

export const INPUT_BUCKET = "rankelia-inputs";
export const OUTPUT_BUCKET = "rankelia-outputs";
export const REPORT_BUCKET = "rankelia-reports";

export function sanitizeFilename(name: string) {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  return cleaned || "catalogo.csv";
}

export function buildInputFilePath(userId: string, jobId: string, filename: string) {
  return `${userId}/${jobId}/${sanitizeFilename(filename)}`;
}

export function getFilePathForJob(userId: string, jobId: string, filename: string) {
  return buildInputFilePath(userId, jobId, filename);
}

export async function uploadInputFile(fileOrBlob: Blob, path: string) {
  const supabase = createClient();
  return supabase.storage.from(INPUT_BUCKET).upload(path, fileOrBlob, { contentType: "text/csv;charset=utf-8", upsert: true });
}

export async function getSignedDownloadUrl(bucket: string, path: string, expiresIn = 60 * 10) {
  const supabase = createClient();
  return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
}

export function validateStoragePathOwnership(userId: string, path: string) {
  const normalized = path.replace(/^\/+/, "");
  return normalized.startsWith(`${userId}/`) && !normalized.includes("..");
}

export function buildUserStoragePath(userId: string, jobId: string, filename: string) {
  return `${userId}/${jobId}/${sanitizeFilename(filename)}`;
}
