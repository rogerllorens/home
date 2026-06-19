"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/components/app/AppStateProvider";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateDefaultProject, updateProject } from "@/lib/db/projects";

const platforms = ["Shopify", "Prestashop", "WooCommerce", "generic"];

export function OnboardingModal() {
  const { auth, updateAuthProfile, showToast } = useAppState();
  const [dismissed, setDismissed] = useState(false);
  const [companyName, setCompanyName] = useState(auth.profile?.company_name ?? "");
  const [platform, setPlatform] = useState(auth.profile?.default_platform ?? "generic");
  const [country, setCountry] = useState("España");
  const [language, setLanguage] = useState("Español");
  const [loading, setLoading] = useState(false);

  const open = Boolean(!dismissed && auth.user && auth.profile && !auth.profile.onboarding_completed);

  if (!open || !auth.user) return null;

  async function save(skip = false) {
    setLoading(true);
    try {
      const supabase = createClient();
      const patch = {
        company_name: skip ? auth.profile?.company_name : companyName,
        default_platform: skip ? auth.profile?.default_platform ?? "generic" : platform,
        onboarding_completed: true,
      };
      const { error } = await supabase.from("profiles").update(patch).eq("id", auth.user?.id);
      if (error) throw error;
      if (!skip) {
        const project = await getOrCreateDefaultProject(auth.user!.id, { name: companyName || "Mi ecommerce", platform, country, language });
        if (project.error) throw project.error;
        if (project.data) await updateProject(project.data.id, { name: companyName || project.data.name, platform, country, language });
      }
      updateAuthProfile(patch);
      setDismissed(true);
      showToast(skip ? "Onboarding omitido por ahora." : `Proyecto guardado para ${country} · ${language}.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No hemos podido guardar el onboarding.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Onboarding Rankelia</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Configura tu primer proyecto</h2>
        <p className="mt-2 text-slate-600">Usaremos estos datos como preferencias por defecto para tus previews y exportaciones futuras.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700 md:col-span-2">Nombre del ecommerce<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setCompanyName(event.target.value)} placeholder="Mi ecommerce" value={companyName} /></label>
          <label className="text-sm font-bold text-slate-700">Plataforma principal<select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setPlatform(event.target.value)} value={platform}>{platforms.map((item) => <option key={item} value={item}>{item === "generic" ? "CSV genérico" : item}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-700">País<select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setCountry(event.target.value)} value={country}>{["España", "México", "Colombia", "Francia", "Estados Unidos"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-700">Idioma<select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" onChange={(event) => setLanguage(event.target.value)} value={language}>{["Español", "Catalán", "Inglés", "Francés"].map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="mt-7 flex flex-col justify-end gap-3 sm:flex-row"><Button disabled={loading} onClick={() => save(true)} variant="ghost">Omitir por ahora</Button><Button disabled={loading} onClick={() => save(false)}>{loading ? "Guardando…" : "Guardar y continuar"}</Button></div>
      </div>
    </div>
  );
}
