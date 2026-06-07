import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { AuthUserContext, CreditWallet, Profile, UserRole } from "@/lib/profiles";

export async function getCurrentUserContext(): Promise<AuthUserContext> {
  if (!hasSupabaseEnv()) return { user: null, profile: null, wallet: null };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, wallet: null };

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name,role,avatar_url,company_name,default_platform,onboarding_completed,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    supabase
      .from("credit_wallets")
      .select("user_id,balance,reserved_balance,lifetime_used,lifetime_purchased,lifetime_granted,lifetime_refunded,created_at,updated_at")
      .eq("user_id", user.id)
      .maybeSingle<CreditWallet>(),
  ]);

  return {
    user: { id: user.id, email: user.email ?? profile?.email ?? "" },
    profile: profile ?? null,
    wallet: wallet ?? null,
  };
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { profile } = await getCurrentUserContext();
  return profile?.role ?? null;
}

export function isAdminRole(role: UserRole | null | undefined) {
  return role === "admin";
}
