import { Badge } from "@/components/ui/Badge";

type Finding = { severity: string; title: string; description: string; recommendation: string; category: string };

export function AuditFindingList({ title, findings }: { title: string; findings: Finding[] }) {
  if (!findings.length) return null;
  return <div className="rounded-3xl border border-slate-200 bg-white p-5"><h4 className="text-lg font-black text-slate-950">{title}</h4><div className="mt-4 grid gap-3">{findings.slice(0, 5).map((finding, index) => <div className="rounded-2xl bg-slate-50 p-4" key={`${finding.title}-${index}`}><div className="flex flex-wrap items-center gap-2"><Badge variant={finding.severity === "critical" ? "danger" : finding.severity === "warning" ? "warning" : "info"}>{finding.category}</Badge><p className="font-black text-slate-900">{finding.title}</p></div><p className="mt-2 text-sm text-slate-600">{finding.description}</p><p className="mt-2 text-sm font-semibold text-blue-700">{finding.recommendation}</p></div>)}</div></div>;
}
