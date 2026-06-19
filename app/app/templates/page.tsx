import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
export default function PrivateTemplatesPage() { return <Card><h1 className="text-2xl font-black">Configuración avanzada no disponible</h1><p className="mt-2 text-sm text-slate-600">La generación actual usa prompts versionados en código y validación server-side. Usa propuestas, regeneración y edición manual para revisar cambios por producto.</p><Button className="mt-5" href="/app/proposals">Ir a propuestas</Button></Card>; }
