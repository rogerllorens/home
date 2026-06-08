"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td } from "@/components/ui/Table";
import { getUserJobs, type JobRecord } from "@/lib/db/jobs";
import { getUserDownloads, type DownloadRecord } from "@/lib/db/downloads";
import { getUserBillingData, type SubscriptionRow } from "@/lib/db/billing";
import { getVisibleProductCountFromCredits } from "@/lib/pricing";
import type { WalletRow } from "@/lib/billing/credits";
import { useAppState } from "@/components/app/AppStateProvider";

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "completed") return "success";
  if (status.includes("failed") || status === "insufficient_credits") return "danger";
  if (["queued", "ready_for_processing", "processing"].includes(status)) return "warning";
  return "default";
}

export function RealDashboardPage() {
  const { showToast } = useAppState();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getUserJobs(), getUserDownloads(), getUserBillingData()]).then(([jobResult, downloadResult, billing]) => {
      if (!active) return;
      if (jobResult.error) showToast(jobResult.error.message, "error");
      if (downloadResult.error) showToast(downloadResult.error.message, "error");
      setJobs(jobResult.data ?? []);
      setDownloads(downloadResult.data ?? []);
      setWallet(billing.wallet);
      setSubscription(billing.subscription);
      setLoading(false);
    }).catch((error) => { showToast(error instanceof Error ? error.message : "Error cargando dashboard", "error"); setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => ["queued", "ready_for_processing", "processing"].includes(job.status)).length;
    const completed = jobs.filter((job) => job.status === "completed" || job.status === "completed_with_warnings");
    const avgScore = completed.length ? Math.round(completed.reduce((sum, job) => sum + (job.average_score ?? 0), 0) / completed.length) : 0;
    return { activeJobs, completed: completed.length, rows: jobs.reduce((sum, job) => sum + job.rows_total, 0), avgScore };
  }, [jobs]);

  if (loading) return <Card><p className="font-bold text-slate-600">Cargando métricas reales del workspace…</p></Card>;

  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Card><p className="text-sm text-slate-500">Productos disponibles</p><p className="mt-2 text-3xl font-black">{getVisibleProductCountFromCredits(wallet?.balance ?? 0).toLocaleString("es-ES")}</p><p className="text-xs text-slate-500">{(wallet?.balance ?? 0).toLocaleString("es-ES")} créditos internos</p></Card><Card><p className="text-sm text-slate-500">Reservado en jobs</p><p className="mt-2 text-3xl font-black">{getVisibleProductCountFromCredits(wallet?.reserved_balance ?? 0).toLocaleString("es-ES")}</p></Card><Card><p className="text-sm text-slate-500">Jobs activos</p><p className="mt-2 text-3xl font-black">{stats.activeJobs}</p></Card><Card><p className="text-sm text-slate-500">Descargas</p><p className="mt-2 text-3xl font-black">{downloads.length}</p></Card><Card><p className="text-sm text-slate-500">Score medio</p><p className="mt-2 text-3xl font-black">{stats.avgScore || "—"}</p></Card></div><Card variant="gradient"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><Badge variant="success">Dashboard real</Badge><h1 className="mt-3 text-3xl font-black">Tu producción SEO ecommerce</h1><p className="mt-2 text-slate-600">Plan {subscription?.plan_id ?? "free"} · {stats.rows.toLocaleString("es-ES")} filas registradas · puedes cerrar la página mientras el worker procesa.</p></div><div className="flex flex-wrap gap-3"><Button href="/app/upload">Subir CSV</Button><Button href="/app/credits" variant="secondary">Comprar productos</Button></div></div></Card>{jobs.length ? <Card><h2 className="mb-4 text-xl font-black">Actividad reciente</h2><Table headers={["Fecha", "Archivo", "Estado", "Progreso", "Score", "Uso"]}>{jobs.slice(0, 8).map((job) => <tr key={job.id}><Td>{new Date(job.created_at).toLocaleDateString("es-ES")}</Td><Td><b>{job.original_filename ?? "Job CSV"}</b></Td><Td><Badge variant={statusVariant(job.status)}>{job.status}</Badge></Td><Td>{job.rows_processed}/{job.rows_total}</Td><Td>{job.average_score ?? "—"}</Td><Td>{job.product_equivalent_used ?? "—"} productos</Td></tr>)}</Table></Card> : <EmptyState title="Aún no hay jobs reales" description="Sube un CSV para crear tu primer lote y ver métricas reales aquí." icon="▦" action={<Button href="/app/upload">Crear primer job</Button>} />}</div>;
}
