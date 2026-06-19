import { createClient } from "@/lib/supabase/client";

export type ProjectRecord = {
  id: string;
  user_id: string;
  name: string;
  website_url: string | null;
  platform: string;
  language: string;
  country: string;
  default_tone: string;
  created_at: string;
  updated_at: string;
};

export async function getProjects() {
  const supabase = createClient();
  return supabase.from("projects").select("*").order("created_at", { ascending: false });
}

export async function createProject(data: Partial<ProjectRecord> & { user_id: string; name: string }) {
  const supabase = createClient();
  return supabase.from("projects").insert(data).select("*").single<ProjectRecord>();
}

export async function updateProject(id: string, data: Partial<ProjectRecord>) {
  const supabase = createClient();
  return supabase.from("projects").update(data).eq("id", id).select("*").single<ProjectRecord>();
}

export async function getOrCreateDefaultProject(userId: string, defaults?: Partial<ProjectRecord>) {
  const supabase = createClient();
  const existing = await supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle<ProjectRecord>();
  if (existing.data) return existing;
  return createProject({ user_id: userId, name: defaults?.name || "Mi ecommerce", platform: defaults?.platform || "generic", language: defaults?.language || "es", country: defaults?.country || "ES", default_tone: defaults?.default_tone || "profesional" });
}
