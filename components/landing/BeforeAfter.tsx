import { Card } from "@/components/ui/Card";

export function BeforeAfter() {
  return <section id="producto" className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8"><Card><p className="text-sm font-bold uppercase text-red-500">Antes</p><h3 className="mt-3 text-xl font-bold">Descripción pobre o vacía</h3><p className="mt-4 rounded-2xl bg-slate-50 p-4 text-slate-600">“Bota cómoda para trabajar”</p></Card><Card variant="dark"><p className="text-sm font-bold uppercase text-cyan-300">Después</p><h3 className="mt-3 text-xl font-bold">Base SEO revisable</h3><p className="mt-4 rounded-2xl bg-white/10 p-4 text-slate-200">Bota de seguridad S3 negra con puntera reforzada, suela antideslizante y piel resistente para uso profesional intensivo.</p></Card></section>;
}
