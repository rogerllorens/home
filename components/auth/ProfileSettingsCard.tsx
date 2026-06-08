"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppState } from "@/components/app/AppStateProvider";
import { createClient } from "@/lib/supabase/client";

export function ProfileSettingsCard() {
  const { auth, updateAuthProfile, showToast } = useAppState();
  const [fullName, setFullName] = useState(auth.profile?.full_name ?? "");
  const [companyName, setCompanyName] = useState(auth.profile?.company_name ?? "");
  const [platform, setPlatform] = useState(auth.profile?.default_platform ?? "generic");
  const [loading, setLoading] = useState(false);

  if (!auth.user) return null;

  async function saveProfile() {
    setLoading(true);
    try {
      const patch = { full_name: fullName, company_name: companyName, default_platform: platform };
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update(patch).eq("id", auth.user?.id);
      if (error) throw error;
      updateAuthProfile(patch);
      showToast("Perfil actualizado.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No hemos podido actualizar el perfil.", "error");
    } finally {
      setLoading(false);
    }
  }

  return <Card className="mb-6" variant="elevated"><div className="flex flex-col gap-2"><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Perfil real Supabase</p><h2 className="text-2xl font-black text-slate-950">Cuenta y proyecto</h2><p className="text-sm text-slate-500">Estos campos se guardan en la tabla profiles con RLS. El rol y los créditos no se pueden editar desde el cliente.</p></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm font-bold text-slate-700">Nombre<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setFullName(event.target.value)} value={fullName} /></label><label className="text-sm font-bold text-slate-700">Empresa<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setCompanyName(event.target.value)} value={companyName} /></label><label className="text-sm font-bold text-slate-700">Plataforma<select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setPlatform(event.target.value)} value={platform}>{["generic", "Shopify", "Prestashop", "WooCommerce"].map((item) => <option key={item} value={item}>{item === "generic" ? "CSV genérico" : item}</option>)}</select></label></div><div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><span><b>Email:</b> {auth.user.email} · <b>Rol:</b> {auth.profile?.role ?? "customer"}</span><Button disabled={loading} onClick={saveProfile}>{loading ? "Guardando…" : "Guardar perfil"}</Button></div></Card>;
}
