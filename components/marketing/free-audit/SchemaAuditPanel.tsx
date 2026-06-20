import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type SchemaAdvanced = { schema_score?: number; schema_status?: string; detected?: Record<string, { found: boolean; count: number }>; schema_issues?: Array<{ title: string; recommendation: string }> };
const TYPES = ["Product", "Organization", "WebSite", "BreadcrumbList", "FAQPage", "Article", "LocalBusiness"];
export function SchemaAuditPanel({ schema }: { schema?: SchemaAdvanced }) {
  return <Card><div className="flex items-center justify-between gap-3"><div><h4 className="text-xl font-black">Schema y datos estructurados</h4><p className="mt-1 text-sm text-slate-500">Diagnóstico prudente: no prometemos rich results ni inventamos ratings.</p></div><Badge variant={(schema?.schema_score ?? 0) >= 75 ? "success" : "warning"}>{schema?.schema_score ?? "—"}/100</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{TYPES.map((type) => <div className="rounded-2xl bg-slate-50 p-4" key={type}><p className="font-black text-slate-900">{type}</p><p className="mt-1 text-sm text-slate-600">{schema?.detected?.[type]?.found ? `Detectado (${schema.detected[type].count})` : "No detectado"}</p></div>)}</div>{Boolean(schema?.schema_issues?.length) && <div className="mt-4 rounded-2xl bg-amber-50 p-4"><p className="font-bold text-amber-800">Prioridad schema</p><p className="mt-1 text-sm text-amber-900">{schema?.schema_issues?.[0]?.title}: {schema?.schema_issues?.[0]?.recommendation}</p></div>}</Card>;
}
