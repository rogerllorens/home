import { SettingsPage } from "@/components/app/AppPages";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
export default function PrivateSettingsPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true") return <Card><Badge variant="warning">Demo privada desactivada</Badge><h1 className="mt-3 text-2xl font-black">Settings visuales demo desactivados</h1><p className="mt-2 text-sm text-slate-600">Las preferencias básicas se aplican desde onboarding/perfil y job creation. La pantalla avanzada queda para v1.1.</p></Card>;
  return <div className="space-y-6"><Card><Badge variant="warning">Perfil beta</Badge><h1 className="mt-3 text-2xl font-black">Ajustes de workspace</h1><p className="mt-2 text-sm text-slate-600">Los cambios visuales de preferencias quedan en estado cliente; la persistencia avanzada de settings por proyecto queda documentada para v1.1.</p></Card><SettingsPage /></div>;
}
