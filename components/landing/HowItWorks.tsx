import { Card } from "@/components/ui/Card";

const steps = ["Archivo", "Diagnóstico", "Preview", "Job", "Descarga", "Informe"];
export function HowItWorks() {
  return <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><h2 className="text-3xl font-black text-slate-950 md:text-4xl">Flujo completo CSV-first</h2><div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">{steps.map((step, index) => <Card className="text-center" key={step}><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 font-bold text-white">{index + 1}</div><p className="mt-4 font-bold">{step}</p></Card>)}</div></section>;
}
