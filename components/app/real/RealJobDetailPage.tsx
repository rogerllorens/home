"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, Td } from "@/components/ui/Table";
import { AppProgressBar } from "@/components/app/charts/ProgressBar";

type Job = { id: string; original_filename: string | null; status: string; platform: string; rows_total: number; rows_processed: number; rows_failed: number };
type Row = { id: string; row_index: number; validation_status: string | null; approval_status: string | null; seo_score: number | null; proposal_id: string | null; output_data: { seo_product_name?: string; product_name?: string } | null };
type Download = { id: string; filename: string; file_type: string };
type Log = { id: string; level: string; message: string };
type Payload = { job: Job; eta: { label: string; explanation: string }; proposalSummary: { pending: number; approved: number }; rows: Row[]; downloads: Download[]; logs: Log[] };
export function RealJobDetailPage({ jobId }: { jobId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  useEffect(() => { fetch(`/api/app/jobs/${jobId}`).then((r) => r.json()).then(setData); }, [jobId]);
  if (!data) return <Card><p className="font-bold text-slate-600">Cargando job…</p></Card>;
  const { job } = data; const progress = job.rows_total ? Math.round((job.rows_processed / job.rows_total) * 100) : 0;
  return <div className="space-y-6"><Card variant="elevated"><Badge>{job.status}</Badge><h1 className="mt-3 text-3xl font-black">{job.original_filename ?? "Job CSV"}</h1><p className="mt-1 text-sm text-slate-500">{job.platform} · {data.eta.label} · {data.eta.explanation}</p><div className="mt-5"><AppProgressBar value={progress} /></div><div className="mt-5 flex flex-wrap gap-2"><Button href={`/app/proposals?jobId=${job.id}`}>Revisar propuestas</Button><Button href="/app/downloads" variant="secondary">Descargas</Button><Button href="/app/jobs" variant="ghost">Volver</Button></div></Card><div className="grid gap-4 md:grid-cols-5">{[["Filas", job.rows_total], ["Procesadas", job.rows_processed], ["Fallidas", job.rows_failed], ["Pendientes", data.proposalSummary.pending], ["Aprobadas", data.proposalSummary.approved]].map(([label, value]) => <Card key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-black">{value}</p></Card>)}</div><Card><h2 className="text-xl font-black">Filas y propuestas</h2><Table headers={["#", "Producto", "Score", "Aprobación", "Acciones"]}>{data.rows.slice(0, 40).map((row) => <tr key={row.id}><Td>{row.row_index + 1}</Td><Td>{row.output_data?.seo_product_name ?? row.output_data?.product_name ?? "Producto"}</Td><Td>{row.seo_score ?? "—"}</Td><Td><Badge>{row.approval_status ?? row.validation_status ?? "pending"}</Badge></Td><Td>{row.proposal_id ? <Button href={`/app/proposals/${row.proposal_id}`} variant="secondary">Revisar</Button> : "—"}</Td></tr>)}</Table></Card><div className="grid gap-6 xl:grid-cols-2"><Card><h2 className="text-xl font-black">Descargas</h2>{data.downloads.length ? data.downloads.map((d) => <div className="mt-3 rounded-2xl border p-3" key={d.id}><b>{d.filename}</b><p className="text-xs text-slate-500">{d.file_type} {d.filename.includes("approved") ? "· Solo aprobadas" : "· Completo"}</p></div>) : <p className="mt-3 text-sm text-slate-500">Las descargas aparecerán cuando termine el job o exportes aprobadas.</p>}</Card><Card><h2 className="text-xl font-black">Logs recientes</h2>{data.logs.slice(0, 8).map((log) => <div className="mt-3 rounded-2xl border p-3 text-sm" key={log.id}><Badge variant={log.level === "error" ? "danger" : log.level === "warning" ? "warning" : "info"}>{log.level}</Badge><span className="ml-2 font-semibold">{log.message}</span></div>)}</Card></div></div>;
}
