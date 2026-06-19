import { createClient } from "@/lib/supabase/client";
import { getAdminJobs } from "@/lib/db/jobs";

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  company_name: string | null;
  default_platform: string;
  created_at: string;
  credit_wallets: { balance: number; lifetime_used: number } | null;
  projects: { id: string }[];
  jobs: { id: string }[];
};

export async function getAdminUsers() {
  const supabase = createClient();
  const profiles = await supabase.from("profiles").select("id,email,full_name,role,company_name,default_platform,created_at").order("created_at", { ascending: false });
  if (profiles.error || !profiles.data) return profiles;
  const userIds = profiles.data.map((profile) => profile.id);
  const [wallets, projects, jobs] = await Promise.all([
    supabase.from("credit_wallets").select("user_id,balance,lifetime_used").in("user_id", userIds),
    supabase.from("projects").select("id,user_id").in("user_id", userIds),
    supabase.from("jobs").select("id,user_id").in("user_id", userIds),
  ]);
  const data = profiles.data.map<AdminUserRow>((profile) => ({
    ...profile,
    credit_wallets: wallets.data?.find((wallet) => wallet.user_id === profile.id) ?? null,
    projects: projects.data?.filter((project) => project.user_id === profile.id).map(({ id }) => ({ id })) ?? [],
    jobs: jobs.data?.filter((job) => job.user_id === profile.id).map(({ id }) => ({ id })) ?? [],
  }));
  return { ...profiles, data };
}

export async function getAdminStats() {
  const supabase = createClient();
  const [profiles, jobs, downloads, wallets] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    getAdminJobs(),
    supabase.from("downloads").select("id", { count: "exact", head: true }),
    supabase.from("credit_wallets").select("balance,lifetime_used"),
  ]);
  return { profiles, jobs, downloads, wallets };
}
