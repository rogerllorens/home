import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buildCostDashboard } from "@/lib/ai-template-studio/cost-dashboard";

export default function AdminAiCostsPage() {
  const dashboard = buildCostDashboard([]);
  return <div className="space-y-6"><Card variant="elevated"><Badge variant="ai">Cost monitoring</Badge><h1 className="mt-3 text-3xl font-black">Costes IA</h1><p className="mt-2 text-slate-600">Panel preparado para leer ai_generation_runs: coste por modelo, tarea, job, prompt version y fallback rate. No cambia billing público.</p></Card><section className="grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Coste estimado</p><p className="mt-2 text-3xl font-black">${dashboard.total.toFixed(4)}</p></Card><Card><p className="text-sm text-slate-500">Runs</p><p className="mt-2 text-3xl font-black">{dashboard.runs}</p></Card><Card><p className="text-sm text-slate-500">Fallback rate</p><p className="mt-2 text-3xl font-black">{Math.round(dashboard.fallbackRate * 100)}%</p></Card><Card><p className="text-sm text-slate-500">Quality avg</p><p className="mt-2 text-3xl font-black">{Math.round(dashboard.avgQuality)}</p></Card></section></div>;
}
