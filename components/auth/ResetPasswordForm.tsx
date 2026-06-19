"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) return setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
    if (password !== confirm) return setMessage({ type: "error", text: "Las contraseñas no coinciden." });
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setMessage({ type: "error", text: error.message });
    setMessage({ type: "success", text: "Contraseña actualizada. Redirigiendo a tu dashboard…" });
    window.setTimeout(() => { router.push("/app"); router.refresh(); }, 900);
  }
  return <main className="radial-premium flex min-h-screen items-center justify-center px-4 py-12"><Card className="w-full max-w-lg" variant="elevated"><Badge variant="ai">Reset password</Badge><h1 className="mt-4 text-3xl font-black text-slate-950">Crea una nueva contraseña</h1><p className="mt-2 text-slate-600">Si has llegado desde el enlace de Supabase, tu sesión recovery ya está activa y puedes actualizar la contraseña.</p>{message && <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}<form className="mt-6 space-y-4" onSubmit={submit}><label className="text-sm font-bold text-slate-700">Nueva contraseña<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(e)=>setPassword(e.target.value)} type="password" value={password} /></label><label className="text-sm font-bold text-slate-700">Confirmar contraseña<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(e)=>setConfirm(e.target.value)} type="password" value={confirm} /></label><Button className="w-full" disabled={loading} type="submit">{loading ? "Actualizando…" : "Actualizar contraseña"}</Button></form></Card></main>;
}
