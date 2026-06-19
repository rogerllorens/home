"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, Td } from "@/components/ui/Table";
import { getAdminJobs } from "@/lib/db/jobs";
import { getAdminUsers } from "@/lib/db/admin";
import { getAdminLogs, type AdminJobLogRecord } from "@/lib/db/logs";
import { getAdminBillingData } from "@/lib/db/billing";
import { getVisibleProductCountFromCredits } from "@/lib/pricing";
import { useAdminState } from "@/components/admin/AdminStateProvider";

type AdminJob = { id: string; status: string; rows_total?: number; rows_processed?: number; average_score?: number | null; ai_cost_estimated?: number | null; credits_used?: number | null; product_equivalent_used?: number | null; original_filename?: string | null; created_at: string; profiles?: { email?: string | null } | null };
type BillingData = Awaited<ReturnType<typeof getAdminBillingData>>;

export function RealAdminOverviewPage() {
  const { showToast } = useAdminState();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email?: string | null; role?: string | null }>>([]);
  const [logs, setLogs] = useState<AdminJobLogRecord[]>([]);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminJobs(), getAdminUsers(), getAdminLogs(), getAdminBillingData()]).then(([jobsResult, usersResult, logsResult, billingResult]) => {
      if (jobsResult.error) showToast(jobsResult.error.message, "error");
      if (usersResult.error) showToast(usersResult.error.message, "error");
      if (logsResult.error) showToast(logsResult.error.message, "error");
      setJobs((jobsResult.data ?? []) as AdminJob[]);
      setUsers((usersResult.data ?? []) as Array<{ id: string; email?: string | null; role?: string | null }>);
      setLogs(logsResult.data ?? []);
      setBilling(billingResult);
      setLoading(false);
    }).catch((error) => { showToast(error instanceof Error ? error.message : "Error cargando overview admin", "error"); setLoading(false); });
  }, [showToast]);

  const stats = useMemo(() => {
    const wallets = billing?.wallets ?? [];
    const checkouts = billing?.checkouts ?? [];
    return { users: users.length, jobs: jobs.length, processing: jobs.filter((j) => j.status === "processing").length, failed: jobs.filter((j) => j.status.includes("failed") || j.status === "insufficient_credits").length, creditsBalance: wallets.reduce((sum, wallet) => sum + (wallet.balance ?? 0), 0), reserved: wallets.reduce((sum, wallet) => sum + (wallet.reserved_balance ?? 0), 0), revenue: checkouts.filter((c: { status?: string }) => c.status === "completed").reduce((sum: number, c: { amount_total?: number | null }) => sum + (c.amount_total ?? 0), 0) / 100, aiCost: jobs.reduce((sum, job) => sum + Number(job.ai_cost_estimated ?? 0), 0), errors: logs.filter((log) => ["error", "critical"].includes(log.level)).length };
  }, [billing, jobs, logs, users.length]);

  if (loading) return <Card><p className="font-bold text-slate-600">Cargando overview admin real…</p></Card>;

  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"><Card><p className="text-sm text-slate-500">Usuarios</p><p className="mt-2 text-3xl font-black">{stats.users}</p></Card><Card><p className="text-sm text-slate-500">Jobs</p><p className="mt-2 text-3xl font-black">{stats.jobs}</p></Card><Card><p className="text-sm text-slate-500">Errores</p><p className="mt-2 text-3xl font-black">{stats.errors + stats.failed}</p></Card><Card><p className="text-sm text-slate-500">Productos wallet</p><p className="mt-2 text-3xl font-black">{getVisibleProductCountFromCredits(stats.creditsBalance).toLocaleString("es-ES")}</p></Card><Card><p className="text-sm text-slate-500">Ingresos checkout</p><p className="mt-2 text-3xl font-black">{stats.revenue.toLocaleString("es-ES")} €</p></Card><Card><p className="text-sm text-slate-500">Coste IA</p><p className="mt-2 text-3xl font-black">{stats.aiCost.toFixed(2)} €</p></Card></div><Card variant="gradient"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><Badge variant="ai">Admin real</Badge><h1 className="mt-3 text-3xl font-black">Control operativo beta</h1><p className="mt-2 text-slate-600">Lectura protegida por rol admin. Datos reales de Supabase, Stripe, wallet, jobs y logs cuando existen.</p></div><div className="flex flex-wrap gap-3"><Button href="/admin/jobs">Ver jobs</Button><Button href="/admin/credits" variant="secondary">Billing</Button></div></div></Card><div className="grid gap-6 xl:grid-cols-2"><Card><h2 className="mb-4 text-xl font-black">Últimos jobs</h2><Table headers={["Fecha", "Usuario", "Archivo", "Estado", "Score"]}>{jobs.slice(0, 8).map((job) => <tr key={job.id}><Td>{new Date(job.created_at).toLocaleDateString("es-ES")}</Td><Td>{job.profiles?.email ?? "—"}</Td><Td>{job.original_filename ?? job.id.slice(0, 8)}</Td><Td><Badge variant={job.status === "completed" ? "success" : job.status.includes("failed") ? "danger" : "warning"}>{job.status}</Badge></Td><Td>{job.average_score ?? "—"}</Td></tr>)}</Table></Card><Card><h2 className="mb-4 text-xl font-black">Logs críticos recientes</h2><div className="space-y-3">{logs.filter((log) => ["warning", "error", "critical"].includes(log.level)).slice(0, 8).map((log) => <div className="rounded-2xl border border-slate-200 p-4 text-sm" key={log.id}><Badge variant={log.level === "warning" ? "warning" : "danger"}>{log.level}</Badge><b className="ml-2">{log.message}</b><p className="mt-1 text-slate-500">{log.source} · {new Date(log.created_at).toLocaleString("es-ES")}</p></div>)}</div></Card></div></div>;
}
