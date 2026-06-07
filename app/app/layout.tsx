import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { AppStateProvider } from "@/components/app/AppStateProvider";
import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function ClientAppLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseEnv()) redirect("/login?setup=missing-supabase-env&next=/app");
  const auth = await getCurrentUserContext();
  if (!auth.user) redirect("/login?next=/app");

  return <AppStateProvider initialAuth={auth}><AppShell>{children}</AppShell></AppStateProvider>;
}
