import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function SavingsCalculator() {
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><Card variant="gradient"><div className="grid gap-8 lg:grid-cols-2"><div><p className="text-sm font-bold text-blue-700">ROI placeholder</p><h2 className="mt-3 text-3xl font-black">Ahorra horas de redacción producto por producto</h2><p className="mt-3 text-slate-600">Simulación demo para mostrar ahorro de tiempo y coste antes de configurar pricing real.</p></div><div className="space-y-5"><div><div className="mb-2 flex justify-between text-sm font-bold"><span>1.000 filas</span><span>~133 h ahorradas</span></div><ProgressBar value={72} status="success" /></div><div><div className="mb-2 flex justify-between text-sm font-bold"><span>Coste operativo evitado</span><span>3.990 € mock</span></div><ProgressBar value={86} status="info" /></div></div></div></Card></section>;
}
