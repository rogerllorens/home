"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FreeAuditForm } from "./FreeAuditForm";
import { FreeAuditResult } from "./FreeAuditResult";
import { AuditSkeleton } from "./AuditSkeleton";
import { AuditErrorState } from "./AuditErrorState";

type AuditResponse = { error?: string; message?: string; status?: string; domain?: string; [key: string]: unknown };

export function FreeAuditSection() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [consentEmailReport, setConsentEmailReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch("/api/free-audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, email: email || undefined, sendReport: Boolean(email && consentEmailReport), consentEmailReport }) });
      const json = await response.json() as AuditResponse;
      if (!response.ok || json.error) throw new Error(json.message ?? "No se pudo completar la auditoría.");
      setResult(json);
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido."); }
    finally { setLoading(false); }
  }
  return <section id="free-audit" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><Card className="overflow-hidden border-blue-100 bg-gradient-to-br from-white via-blue-50 to-violet-50 p-7 lg:p-10" variant="elevated"><div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"><div><Badge variant="ai">Auditoría SEO gratis</Badge><h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">Audita gratis el SEO de tu ecommerce en 30 segundos</h2><p className="mt-4 text-lg leading-8 text-slate-600">Detecta problemas de indexabilidad, metadatos, schema, imágenes y preparación GEO/AEO antes de optimizar tu catálogo.</p><p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-slate-600">No tocamos tu tienda. Solo analizamos HTML público, robots.txt y sitemap. No ejecutamos JavaScript remoto ni hacemos crawler masivo.</p></div><div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl"><FreeAuditForm url={url} email={email} consentEmailReport={consentEmailReport} loading={loading} onUrlChange={setUrl} onEmailChange={setEmail} onConsentEmailReportChange={setConsentEmailReport} onSubmit={submit} /><div className="mt-5 grid gap-3 sm:grid-cols-3">{["SSRF protegido", "Informe por email", "Resultado inmediato"].map((item) => <div className="rounded-2xl bg-slate-50 p-3 text-center text-sm font-bold text-slate-600" key={item}>{item}</div>)}</div></div></div>{loading && <AuditSkeleton />}{error && <AuditErrorState message={error} />}{result?.domain && <FreeAuditResult result={result as never} />}</Card></section>;
}
