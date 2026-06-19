import { AdminTemplatesPage } from "@/components/admin/AdminPages";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
export default function AdminTemplatesRoute() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true") return <Card><Badge variant="warning">Demo privada desactivada</Badge><h1 className="mt-3 text-2xl font-black">Editor visual de prompts desactivado</h1><p className="mt-2 text-sm text-slate-600">Los prompts productivos viven versionados en código. Activa demos solo en entorno interno.</p></Card>;
  return <div className="space-y-6"><Card><Badge variant="warning">Demo IA templates</Badge><h1 className="mt-3 text-2xl font-black">Plantillas y prompts</h1><p className="mt-2 text-sm text-slate-600">La generación real usa prompts versionados en código y validación JSON. El editor visual admin queda aislado como demo explícita para v1.1.</p></Card><AdminTemplatesPage /></div>;
}
