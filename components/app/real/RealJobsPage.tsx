"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td } from "@/components/ui/Table";
import { useAppState } from "@/components/app/AppStateProvider";
import { getJobRows, getUserJobs, updateJob, type JobRecord, type JobRowRecord } from "@/lib/db/jobs";
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
    if (result.error) showToast(result.error.message, "error");
    setRows(result.data ?? []);
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

  const counts = useMemo(() => ({ total: jobs.length, ready: jobs.filter((j) => j.status === "ready_for_processing").length, failed: jobs.filter((j) => j.status.includes("failed")).length, rows: jobs.reduce((sum, job) => sum + job.rows_total, 0) }), [jobs]);

  if (loading) return <Card><p className="font-bold text-slate-600">Cargando jobs reales…</p></Card>;

  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Jobs reales</p><p className="mt-2 text-3xl font-black">{counts.total}</p></Card><Card><p className="text-sm text-slate-500">Listos worker</p><p className="mt-2 text-3xl font-black">{counts.ready}</p></Card><Card><p className="text-sm text-slate-500">Fallos validación</p><p className="mt-2 text-3xl font-black">{counts.failed}</p></Card><Card><p className="text-sm text-slate-500">Filas registradas</p><p className="mt-2 text-3xl font-black">{counts.rows.toLocaleString("es-ES")}</p></Card></div>{jobs.length ? <Card><div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-xl font-black">Trabajos guardados en Supabase</h2><p className="text-sm text-slate-500">Estados iniciales hasta que el worker real del Prompt 7 procese la cola.</p></div><Button href="/app/upload">Subir otro CSV</Button></div><Table headers={["ID", "Archivo", "Tipo", "Plataforma", "Filas", "Estado", "Score", "Créditos", "Fecha", "Acciones"]}>{jobs.map((job) => <tr className="hover:bg-slate-50" key={job.id}><Td><code>{job.id.slice(0, 8)}</code></Td><Td><b>{job.original_filename ?? "—"}</b></Td><Td>{job.generation_type}</Td><Td>{job.platform}</Td><Td>{job.rows_total}</Td><Td><Badge variant={statusVariant(job.status)}>{job.status}</Badge></Td><Td>{job.average_score ?? "—"}</Td><Td>{job.estimated_credits.toLocaleString("es-ES")}</Td><Td>{new Date(job.created_at).toLocaleDateString("es-ES")}</Td><Td><div className="flex gap-2"><Button onClick={() => openDetails(job)} variant="secondary">Detalle</Button><Button onClick={() => openOriginal(job)} variant="ghost">Original</Button><Button onClick={() => cancelJob(job)} variant="ghost">Cancelar</Button></div></Td></tr>)}</Table></Card> : <EmptyState title="No tienes jobs reales todavía" description="Crea tu primer job desde /app/upload para ver aquí el lote guardado en Supabase." icon="▦" action={<Button href="/app/upload">Subir CSV</Button>} />}{selected && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true"><Card className="max-h-[90vh] w-full max-w-4xl overflow-auto" variant="elevated"><div className="flex justify-between gap-4"><div><Badge variant={statusVariant(selected.status)}>Job {selected.status}</Badge><h2 className="mt-3 text-2xl font-black">{selected.original_filename}</h2><p className="text-sm text-slate-500">{selected.id}</p></div><button className="rounded-2xl border px-3 py-2 font-bold" onClick={() => setSelected(null)}>×</button></div><div className="mt-5 grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Filas</p><p className="text-2xl font-black">{selected.rows_total}</p></Card><Card><p className="text-sm text-slate-500">Válidas</p><p className="text-2xl font-black">{selected.rows_valid}</p></Card><Card><p className="text-sm text-slate-500">Créditos</p><p className="text-2xl font-black">{selected.estimated_credits}</p></Card><Card><p className="text-sm text-slate-500">Score actual</p><p className="text-2xl font-black">{selected.average_score ?? "—"}</p></Card></div><div className="mt-5 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100"><p>› Archivo subido: {selected.input_file_path ?? "pendiente"}</p><p>› Análisis guardado en JSONB.</p><p>› Filas insertadas: {rows.length}</p><p>› Pendiente de worker real del Prompt 7.</p></div><h3 className="mt-6 text-lg font-black">Preview filas</h3><Table headers={["#", "Estado", "Prioridad", "Problemas"]}>{rows.slice(0, 8).map((row) => <tr key={row.id}><Td>{row.row_index + 1}</Td><Td>{row.validation_status}</Td><Td>{row.priority}</Td><Td>{row.detected_issues?.join(" · ") || "OK"}</Td></tr>)}</Table></Card></div>}</div>;
}
