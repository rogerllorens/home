import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { diagnosisDemo } from "@/lib/mock-data";

export function DiagnosisPreview() {
  const metrics = [
    ["Filas", diagnosisDemo.rows], ["Productos", diagnosisDemo.products], ["Categorías", diagnosisDemo.categories], ["Metas faltantes", diagnosisDemo.missingMetas],
  ];
  return (
    <section id="diagnostico" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge variant="info">Diagnóstico antes del registro</Badge><h2 className="mt-4 text-3xl font-black text-slate-950 md:text-4xl">Valor inmediato antes de gastar créditos</h2><p className="mt-3 max-w-2xl text-slate-600">Rankelia prioriza oportunidades: descripciones vacías, metadatos ausentes, duplicados y filas con potencial de conversión.</p></div><ScoreBadge score={78} /></div>
      <div className="grid gap-4 md:grid-cols-4">{metrics.map(([label, value]) => <Card key={label.toString()}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></Card>)}</div>
      <Card className="mt-5" variant="gradient"><p className="font-bold text-slate-950">Oportunidades detectadas</p><div className="mt-4 flex flex-wrap gap-2">{diagnosisDemo.opportunities.map((item) => <Badge key={item} variant="ai">{item}</Badge>)}</div></Card>
    </section>
  );
}
