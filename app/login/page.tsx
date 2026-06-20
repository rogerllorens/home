import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LoginSearchParams = {
  mode?: string;
  next?: string;
  intent?: string;
  setup?: string;
  source?: string;
  auditToken?: string;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<LoginSearchParams> }) {
  const params = (await searchParams) ?? {};
  const envReady = hasSupabaseEnv();
  const { user } = await getCurrentUserContext();
  const nextWithContext = params.auditToken && params.next?.startsWith("/") ? `${params.next}${params.next.includes("?") ? "&" : "?"}auditToken=${encodeURIComponent(params.auditToken)}` : params.next;
  if (user) redirect(nextWithContext && nextWithContext.startsWith("/") ? nextWithContext : "/app");

  const mode = params.mode === "register" ? "register" : params.mode === "reset" ? "reset" : "login";
  const setupWarning = params.setup === "missing-supabase-env" ? "Supabase aún no está configurado. Añade las variables de entorno para activar login real." : undefined;

  return (
    <main className="radial-premium min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <AuthForm envReady={envReady} initialMode={mode} intent={params.intent} nextPath={nextWithContext} setupWarning={setupWarning} />
        <AuthSidePanel />
      </div>
    </main>
  );
}
