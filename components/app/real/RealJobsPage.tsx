"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td } from "@/components/ui/Table";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppState } from "@/components/app/AppStateProvider";
import { getJobLogs, getJobRows, getUserJobs, updateJob, type JobLogRecord, type JobRecord, type JobRowRecord } from "@/lib/db/jobs";
import { getSignedDownloadUrl } from "@/lib/storage/files";

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "completed") return "success";
  if (status === "failed" || status === "failed_validation" || status === "cancelled") return "danger";
  if (status === "queued" || status === "ready_for_processing" || status === "processing") return "warning";
  if (status === "analyzed") return "info";
  return "default";
}

export function RealJobsPage() {
  const { showToast } = useAppState();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [rows, setRows] = useState<JobRowRecord[]>([]);
  const [logs, setLogs] = useState<JobLogRecord[]>([]);
  const [selected, setSelected] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    setLoading(true);
    const result = await getUserJobs();
    if (result.error) showToast(result.error.message, "error");
    setJobs(result.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getUserJobs().then((result) => {
      if (!active) return;
      if (result.error) showToast(result.error.message, "error");
      setJobs(result.data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [showToast]);

  async function openDetails(job: JobRecord) {
    setSelected(job);
    const result = await getJobRows(job.id);
    const logResult = await getJobLogs(job.id);
    if (result.error) showToast(result.error.message, "error");
    if (logResult.error) showToast(logResult.error.message, "error");
    setRows(result.data ?? []);
    setLogs(logResult.data ?? []);
  }

  async function openOriginal(job: JobRecord) {
    if (!job.input_bucket || !job.input_file_path) return showToast("Este job aún no tiene archivo original asociado.", "warning");
    const result = await getSignedDownloadUrl(job.input_bucket, job.input_file_path);
    if (result.error || !result.data?.signedUrl) return showToast(result.error?.message ?? "No se pudo crear signed URL.", "error");
    window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    showToast("Signed URL creada para el archivo original.", "success");
  }

  async function cancelJob(job: JobRecord) {
    const result = await updateJob(job.id, { status: "cancelled" });
    if (result.error) return showToast(result.error.message, "error");
    showToast("Job cancelado.", "warning");
    await loadJobs();
  }

  const counts = useMemo(() => ({ total: jobs.length, ready: jobs.filter((j) => j.status === "ready_for_processing").length, processing: jobs.filter((j) => j.status === "processing").length, failed: jobs.filter((j) => j.status.includes("failed")).length, rows: jobs.reduce((sum, job) => sum + job.rows_total, 0) }), [jobs]);

  if (loading) return <Card><p className="font-bold text-slate-600">Cargando jobs reales…</p></Card>;

  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Jobs reales</p><p className="mt-2 text-3xl font-black">{counts.total}</p></Card><Card><p className="text-sm text-slate-500">Listos worker</p><p className="mt-2 text-3xl font-black">{counts.ready}</p></Card><Card><p className="text-sm text-slate-500">Procesando</p><p className="mt-2 text-3xl font-black">{counts.processing}</p></Card><Card><p className="text-sm text-slate-500">Filas registradas</p><p className="mt-2 text-3xl font-black">{counts.rows.toLocaleString("es-ES")}</p></Card></div>{jobs.length ? <Card><div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-xl font-black">Trabajos guardados en Supabase</h2><p className="text-sm text-slate-500">Estados reales del worker con IA, fallback, JSON validado y descargas privadas.</p></div><Button href="/app/upload">Subir otro CSV</Button></div><Table headers={["ID", "Archivo", "Motor", "Plataforma", "Progreso", "Estado", "Score", "Uso", "IA", "Acciones"]}>{jobs.map((job) => <tr className="hover:bg-slate-50" key={job.id}><Td><code>{job.id.slice(0, 8)}</code></Td><Td><b>{job.original_filename ?? "—"}</b></Td><Td>{job.generation_engine ?? "template"}<br/><span className="text-xs text-slate-500">{job.ai_model ?? job.generation_type}</span></Td><Td>{job.platform}</Td><Td>{job.rows_processed}/{job.rows_total}<ProgressBar className="mt-2" value={job.rows_total ? Math.round((job.rows_processed / job.rows_total) * 100) : 0} status={job.status === "completed" ? "success" : "info"} /></Td><Td><Badge variant={statusVariant(job.status)}>{job.status}</Badge></Td><Td>{job.average_score ?? "—"}</Td><Td>{job.product_equivalent_used ?? "—"} productos<br/><span className="text-xs text-slate-500">{job.credits_used ?? job.estimated_credits} créditos internos</span></Td><Td>{job.ai_cost_estimated ? `${Number(job.ai_cost_estimated).toFixed(4)} €` : "—"}<br/><span className="text-xs text-slate-500">FB {job.fallback_count ?? 0} · claims {job.unsupported_claim_count ?? 0}</span></Td><Td><div className="flex gap-2"><Button onClick={() => openDetails(job)} variant="secondary">Detalle</Button><Button onClick={() => openOriginal(job)} variant="ghost">Original</Button><Button onClick={() => cancelJob(job)} variant="ghost">Cancelar</Button></div></Td></tr>)}</Table></Card> : <EmptyState title="No tienes jobs reales todavía" description="Crea tu primer job desde /app/upload para ver aquí el lote guardado en Supabase." icon="▦" action={<Button href="/app/upload">Subir CSV</Button>} />}{selected && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true"><Card className="max-h-[90vh] w-full max-w-4xl overflow-auto" variant="elevated"><div className="flex justify-between gap-4"><div><Badge variant={statusVariant(selected.status)}>Job {selected.status}</Badge><h2 className="mt-3 text-2xl font-black">{selected.original_filename}</h2><p className="text-sm text-slate-500">{selected.id}</p></div><button className="rounded-2xl border px-3 py-2 font-bold" onClick={() => setSelected(null)}>×</button></div><div className="mt-5 grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Filas</p><p className="text-2xl font-black">{selected.rows_total}</p></Card><Card><p className="text-sm text-slate-500">Válidas</p><p className="text-2xl font-black">{selected.rows_valid}</p></Card><Card><p className="text-sm text-slate-500">Créditos</p><p className="text-2xl font-black">{selected.estimated_credits}</p></Card><Card><p className="text-sm text-slate-500">IA coste</p><p className="text-2xl font-black">{selected.ai_cost_estimated ? `${Number(selected.ai_cost_estimated).toFixed(4)} €` : "—"}</p></Card></div><div className="mt-5 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100"><p>› Archivo subido: {selected.input_file_path ?? "pendiente"}</p><p>› Análisis guardado en JSONB.</p><p>› Filas insertadas: {rows.length}</p><p>› Puedes cerrar esta página; el worker seguirá procesando.</p><p>› IA: {selected.ai_provider ?? "template"} · {selected.ai_model ?? "fallback"} · {selected.prompt_version ?? "sin prompt"}</p><p>› Fallbacks: {selected.fallback_count ?? 0} · Errores JSON: {selected.validation_error_count ?? 0} · Claims: {selected.unsupported_claim_count ?? 0}</p></div><h3 className="mt-6 text-lg font-black">Logs recientes</h3><div className="mt-3 space-y-2">{logs.slice(0, 5).map((log) => <div className="rounded-2xl border border-slate-200 p-3 text-sm" key={log.id}><Badge variant={log.level === "error" || log.level === "critical" ? "danger" : log.level === "warning" ? "warning" : "info"}>{log.level}</Badge><span className="ml-2 font-semibold">{log.message}</span><span className="ml-2 text-slate-500">{new Date(log.created_at).toLocaleString("es-ES")}</span></div>)}</div><h3 className="mt-6 text-lg font-black">Preview filas</h3><Table headers={["#", "Estado", "IA", "Score", "Problemas"]}>{rows.slice(0, 8).map((row) => <tr key={row.id}><Td>{row.row_index + 1}</Td><Td>{row.validation_status}</Td><Td>{row.fallback_used ? "Fallback" : row.ai_model ?? "—"}{row.json_repaired ? " · JSON reparado" : ""}</Td><Td>{row.seo_score ?? "—"}/{row.conversion_score ?? "—"}</Td><Td>{[...(row.detected_issues ?? []), ...(row.unsupported_claims ?? [])].join(" · ") || "OK"}</Td></tr>)}</Table></Card></div>}</div>;
}
