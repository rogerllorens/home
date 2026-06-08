import { AdminSettingsPage } from "@/components/admin/AdminPages";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
export default function AdminSettingsRoute() { return <div className="space-y-6"><Card><Badge variant="warning">Ajustes demo</Badge><h1 className="mt-3 text-2xl font-black">Settings internos</h1><p className="mt-2 text-sm text-slate-600">Estos controles no mutan producción todavía. Los límites reales viven en env, SQL/RPC, worker y helpers centralizados.</p></Card><AdminSettingsPage /></div>; }
