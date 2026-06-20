import { Badge } from "@/components/ui/Badge";

export function PerformanceMetricBadge({ label, value, status }: { label: string; value: string; status: string }) {
  const variant = status === "good" ? "success" : status === "poor" ? "danger" : status === "unavailable" ? "info" : "warning";
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-slate-500">{label}</p><Badge variant={variant}>{status === "needs_improvement" ? "mejorable" : status}</Badge></div><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>;
}
