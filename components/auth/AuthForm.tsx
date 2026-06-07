"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register" | "reset";

type AuthFormProps = {
  initialMode?: AuthMode;
  nextPath?: string;
  envReady: boolean;
  setupWarning?: string;
  intent?: string;
};

function safeNext(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) return "/app";
  return nextPath;
}

export function AuthForm({ initialMode = "login", nextPath, envReady, setupWarning, intent }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(setupWarning ? { type: "error", text: setupWarning } : null);

  const copy = useMemo(() => {
    if (mode === "register") return { title: "Crea tu cuenta gratis", cta: "Crear cuenta gratis", subtitle: "Guarda tu diagnóstico, recibe 10.000 créditos demo y genera tus primeras filas de muestra." };
    if (mode === "reset") return { title: "Recupera tu contraseña", cta: "Enviar enlace de recuperación", subtitle: "Te enviaremos un enlace seguro para restablecer el acceso a tu dashboard." };
    return { title: "Entra en tu cuenta", cta: "Iniciar sesión", subtitle: "Accede a tu dashboard para procesar catálogos, revisar trabajos y descargar resultados SEO." };
  }, [mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!envReady) {
      setMessage({ type: "error", text: "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local antes de usar Auth." });
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: "error", text: "Las contraseñas no coinciden." });
        return;
      }
      if (!accepted) {
        setMessage({ type: "error", text: "Debes aceptar los términos para crear la cuenta." });
        return;
      }
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(safeNext(nextPath));
        router.refresh();
        return;
      }

      if (mode === "register") {
        const origin = window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(nextPath))}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(safeNext(nextPath));
          router.refresh();
          return;
        }
        setMessage({ type: "success", text: "Cuenta creada. Revisa tu email para confirmar la cuenta si Supabase lo requiere." });
        return;
      }

      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}` });
      if (error) throw error;
      setMessage({ type: "success", text: "Te hemos enviado un enlace de recuperación si el email existe en Rankelia." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No hemos podido completar la operación." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
      <Link className="inline-flex items-center gap-3" href="/">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black text-white">R</span>
        <span className="text-xl font-black text-slate-950">Rankelia.ai</span>
      </Link>
      <div className="mt-8 flex rounded-2xl bg-slate-100 p-1">
        <button className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-white text-slate-950 shadow" : "text-slate-500"}`} onClick={() => setMode("login")} type="button">Iniciar sesión</button>
        <button className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${mode === "register" ? "bg-white text-slate-950 shadow" : "text-slate-500"}`} onClick={() => setMode("register")} type="button">Crear cuenta</button>
      </div>
      <div className="mt-8">
        <Badge variant="ai">{mode === "register" ? "10.000 créditos demo" : "Dashboard privado"}</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">{copy.title}</h1>
        <p className="mt-3 text-slate-600">{copy.subtitle}</p>
        {intent && <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">Continuaremos tu intención de {intent === "credits" ? "comprar créditos" : intent === "plan" ? "elegir plan" : intent} tras iniciar sesión.</p>}
      </div>
      {message && <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{message.text}</div>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && <div><label className="text-sm font-bold text-slate-700" htmlFor="fullName">Nombre completo</label><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-blue-500" id="fullName" onChange={(event) => setFullName(event.target.value)} placeholder="Roger Demo" value={fullName} /></div>}
        <div><label className="text-sm font-bold text-slate-700" htmlFor="email">Email</label><input autoComplete="email" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-blue-500" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" required type="email" value={email} /></div>
        {mode !== "reset" && <div><label className="text-sm font-bold text-slate-700" htmlFor="password">Contraseña</label><input autoComplete={mode === "register" ? "new-password" : "current-password"} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-blue-500" id="password" onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} /></div>}
        {mode === "register" && <div><label className="text-sm font-bold text-slate-700" htmlFor="confirmPassword">Confirmar contraseña</label><input autoComplete="new-password" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-blue-500" id="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" required type="password" value={confirmPassword} /></div>}
        {mode === "register" && <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><input className="mt-1" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />Acepto los términos y la política de privacidad. Sin tarjeta · diagnóstico gratuito · 10.000 créditos demo.</label>}
        <Button className="w-full justify-center" disabled={loading || !envReady} type="submit">{loading ? "Procesando…" : copy.cta}</Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-500">
        {mode !== "reset" ? <button className="hover:text-blue-600" onClick={() => setMode("reset")} type="button">¿Has olvidado tu contraseña?</button> : <button className="hover:text-blue-600" onClick={() => setMode("login")} type="button">Volver a iniciar sesión</button>}
        {mode === "login" ? <button className="hover:text-blue-600" onClick={() => setMode("register")} type="button">¿No tienes cuenta? Crear cuenta</button> : <button className="hover:text-blue-600" onClick={() => setMode("login")} type="button">¿Ya tienes cuenta? Iniciar sesión</button>}
      </div>
      <Link className="mt-8 inline-flex text-sm font-bold text-slate-500 hover:text-blue-600" href="/">← Volver a la landing</Link>
    </section>
  );
}
