import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buildCostDashboard } from "@/lib/ai-template-studio/cost-dashboard";
import { createServiceClient } from "@/lib/supabase/admin";

export default async function AdminAiCostsPage() {
  const runs = process.env.SUPABASE_SERVICE_ROLE_KEY ? (await createServiceClient().from("ai_generation_runs").select("estimated_cost,task_type,model,prompt_version_id,fallback_used,quality_score,created_at").order("created_at", { ascending: false }).limit(500)).data ?? [] : [];
  const dashboard = buildCostDashboard(runs);
  return <div className="space-y-6"><Card variant="elevated"><Badge variant="ai">Cost monitoring</Badge><h1 className="mt-3 text-3xl font-black">Costes IA reales</h1><p className="mt-2 text-slate-600">Lee ai_generation_runs cuando Supabase service role está configurado; si no hay runs muestra estado vacío honesto.</p></Card><section className="grid gap-4 md:grid-cols-4"><Card><p className="text-sm text-slate-500">Coste estimado</p><p className="mt-2 text-3xl font-black">${dashboard.total.toFixed(4)}</p></Card><Card><p className="text-sm text-slate-500">Runs</p><p className="mt-2 text-3xl font-black">{dashboard.runs}</p></Card><Card><p className="text-sm text-slate-500">Fallback rate</p><p className="mt-2 text-3xl font-black">{Math.round(dashboard.fallbackRate * 100)}%</p></Card><Card><p className="text-sm text-slate-500">Quality avg</p><p className="mt-2 text-3xl font-black">{Math.round(dashboard.avgQuality)}</p></Card></section></div>;
}
