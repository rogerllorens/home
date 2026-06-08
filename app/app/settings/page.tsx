import { SettingsPage } from "@/components/app/AppPages";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
export default function PrivateSettingsPage() { return <div className="space-y-6"><Card><Badge variant="warning">Perfil beta</Badge><h1 className="mt-3 text-2xl font-black">Ajustes de workspace</h1><p className="mt-2 text-sm text-slate-600">Los cambios visuales de preferencias quedan en estado cliente; la persistencia avanzada de settings por proyecto queda documentada para v1.1.</p></Card><SettingsPage /></div>; }
