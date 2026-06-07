import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStateProvider } from "@/components/admin/AdminStateProvider";
import { getCurrentUserContext, isAdminRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function InternalAdminLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseEnv()) redirect("/login?setup=missing-supabase-env&next=/admin");
  const auth = await getCurrentUserContext();
  if (!auth.user) redirect("/login?next=/admin");
  if (!isAdminRole(auth.profile?.role)) redirect("/not-authorized");

  return <AdminStateProvider><AdminShell>{children}</AdminShell></AdminStateProvider>;
}
