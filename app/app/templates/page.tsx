import { TemplatesPage } from "@/components/app/AppPages";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
export default function PrivateTemplatesPage() { return <div className="space-y-6"><Card><Badge variant="warning">Demo operativo</Badge><h1 className="mt-3 text-2xl font-black">Plantillas preparadas para producción</h1><p className="mt-2 text-sm text-slate-600">Esta pantalla conserva datos demo explícitos hasta conectar el editor de prompts/plantillas a Supabase en v1.1. No afecta al worker ni a los jobs reales.</p></Card><TemplatesPage /></div>; }
