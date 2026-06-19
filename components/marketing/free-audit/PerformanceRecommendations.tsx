type Rec = { id: string; title: string; description: string; recommendation: string; severity: string };
export function PerformanceRecommendations({ items }: { items: Rec[] }) {
  if (!items?.length) return <p className="text-sm text-slate-500">No hay oportunidades de rendimiento disponibles ahora mismo.</p>;
  return <div className="grid gap-3">{items.slice(0, 3).map((item) => <div className="rounded-2xl bg-slate-50 p-4" key={item.id}><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.description}</p><p className="mt-2 text-sm font-semibold text-blue-700">{item.recommendation}</p></div>)}</div>;
}
