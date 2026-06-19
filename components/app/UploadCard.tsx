import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { csvFormats } from "@/lib/mock-data";

export function UploadCard() {
  return <Card variant="elevated"><div className="rounded-[1.2rem] border-2 border-dashed border-blue-200 bg-blue-50 p-10 text-center"><Badge variant="ai">Upload mock</Badge><h2 className="mt-4 text-2xl font-black">Sube tu Excel o CSV</h2><p className="mx-auto mt-3 max-w-xl text-slate-600">En fases posteriores conectaremos análisis real, mapeo de columnas y preview antes de consumir créditos.</p><Button className="mt-6">Seleccionar archivo</Button></div><div className="mt-6 grid gap-3 md:grid-cols-2">{csvFormats.map((format) => <div className="rounded-2xl border border-slate-200 p-4" key={format.platform}><p className="font-bold">{format.platform}</p><p className="mt-1 text-sm text-slate-600">{format.description}</p></div>)}</div></Card>;
}
