"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td } from "@/components/ui/Table";

type Proposal = {
  id: string;
  job_id: string | null;
  status: string;
  review_status: string;
  active_version_id: string | null;
  approved_version_id: string | null;
  current_snapshot: Record<string, unknown>;
  original_scores: Record<string, number>;
  active_scores: Record<string, number>;
  score_delta: Record<string, number>;
  ready_to_export: boolean;
  human_review_required: boolean;
  version_count: number;
  created_at: string;
};

function variant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "approved" || status === "exported") return "success";
  if (status === "needs_review") return "warning";
  if (status === "rejected") return "danger";
  if (status === "active") return "info";
  return "default";
}

export function RealProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (jobId) params.set("jobId", jobId);
    const query = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/app/proposals${query}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setProposals(payload.proposals ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setProposals([]);
        setLoading(false);
      });
    return () => { active = false; };
  }, [status, jobId]);

  const stats = useMemo(() => ({ total: proposals.length, approved: proposals.filter((item) => item.approved_version_id).length, pending: proposals.filter((item) => item.review_status === "pending_review").length, exportable: proposals.filter((item) => item.ready_to_export).length }), [proposals]);
  if (loading) return <Card><p className="font-bold text-slate-600">Cargando propuestas…</p></Card>;
  return <div className="space-y-8"><div className="grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Propuestas</p><p className="mt-2 text-3xl font-black">{stats.total}</p></Card><Card><p className="text-sm text-slate-500">Pendientes</p><p className="mt-2 text-3xl font-black">{stats.pending}</p></Card><Card><p className="text-sm text-slate-500">Aprobadas</p><p className="mt-2 text-3xl font-black">{stats.approved}</p></Card><Card><p className="text-sm text-slate-500">Ready export</p><p className="mt-2 text-3xl font-black">{stats.exportable}</p></Card></div><Card><div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h1 className="text-2xl font-black">Propuestas SEO versionadas</h1><p className="text-sm text-slate-500">Revisa before/after, activa versiones y aprueba solo lo que quieres exportar.</p></div><div className="flex gap-2"><select className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos</option><option value="active">Activas</option><option value="approved">Aprobadas</option><option value="needs_review">Necesitan revisión</option></select><Button href="/app/upload">Subir catálogo</Button></div></div>{proposals.length ? <Table headers={["Producto", "Estado", "Score", "Delta", "Versiones", "Export", "Acciones"]}>{proposals.map((proposal) => <tr key={proposal.id}><Td><b>{String(proposal.current_snapshot?.seo_product_name ?? proposal.current_snapshot?.product_name ?? "Producto")}</b><br/><span className="text-xs text-slate-500">{proposal.job_id?.slice(0, 8) ?? "sin job"}</span></Td><Td><Badge variant={variant(proposal.status)}>{proposal.status}</Badge><br/><span className="text-xs text-slate-500">{proposal.review_status}</span></Td><Td>{proposal.original_scores?.overall ?? "—"} → {proposal.active_scores?.overall ?? "—"}</Td><Td><b className="text-emerald-700">+{proposal.score_delta?.overall ?? 0}</b></Td><Td>{proposal.version_count}</Td><Td>{proposal.ready_to_export ? <Badge variant="success">approved</Badge> : <Badge variant="warning">review</Badge>}</Td><Td><Button href={`/app/proposals/${proposal.id}`} variant="secondary">Revisar</Button></Td></tr>)}</Table> : <EmptyState title="Aún no hay propuestas" description="Procesa un CSV o ejecuta el backfill para convertir outputs legacy en propuestas revisables." icon="✦" action={<Button href="/app/upload">Subir CSV</Button>} />}</Card></div>;
}
