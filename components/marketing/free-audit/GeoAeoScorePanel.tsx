import { Card } from "@/components/ui/Card";
import { AuditScoreCard } from "./AuditScoreCard";

type Geo = { geo_aeo_score?: number; entity_clarity_score?: number; answer_readiness_score?: number; content_structure_score?: number; ai_citation_friendly?: boolean; geo_aeo_recommendations?: Array<{ title: string; recommendation: string }> };
export function GeoAeoScorePanel({ geo }: { geo?: Geo }) {
  return <Card><h4 className="text-xl font-black">GEO/AEO readiness</h4><p className="mt-1 text-sm text-slate-500">Estimación de comprensión para buscadores conversacionales. No garantiza AI Overviews ni respuestas en modelos.</p><div className="mt-4 grid gap-3 md:grid-cols-4"><AuditScoreCard label="GEO/AEO" score={geo?.geo_aeo_score ?? 0} /><AuditScoreCard label="Entidades" score={geo?.entity_clarity_score ?? 0} /><AuditScoreCard label="Respuestas" score={geo?.answer_readiness_score ?? 0} /><AuditScoreCard label="Estructura" score={geo?.content_structure_score ?? 0} /></div><p className="mt-4 text-sm font-semibold text-slate-600">AI citation friendly: {geo?.ai_citation_friendly ? "Sí, con revisión" : "Mejorable"}</p>{Boolean(geo?.geo_aeo_recommendations?.length) && <p className="mt-2 text-sm text-blue-700">{geo?.geo_aeo_recommendations?.[0]?.recommendation}</p>}</Card>;
}
