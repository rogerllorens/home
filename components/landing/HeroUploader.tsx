import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const badges = ["CSV", "Shopify", "Prestashop", "WooCommerce", "SEO Score", "Preview gratis"];

export function HeroUploader() {
  return (
    <section className="radial-premium premium-grid overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div>
          <Badge variant="ai">Ecommerce SEO Copilot CSV-first</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">Optimiza productos y categorías SEO desde un CSV</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Sube tu catálogo y Rankelia genera descripciones, metatítulos, metadescripciones, keywords, FAQs, slugs y textos SEO listos para Shopify, Prestashop y WooCommerce.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button href="/app/upload">Analizar mi catálogo gratis</Button><Button href="#diagnostico" variant="secondary">Usar CSV de ejemplo</Button></div>
          <div className="mt-8 flex flex-wrap gap-2">{badges.map((badge) => <Badge key={badge}>{badge}</Badge>)}</div>
        </div>
        <Card className="relative overflow-hidden" variant="elevated">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="rounded-[1.15rem] border-2 border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl text-white shadow-xl shadow-blue-600/25">↑</div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">Arrastra tu CSV</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Diagnóstico demo sin conectar APIs reales: columnas, vacíos, duplicados y oportunidades SEO.</p>
            <Button className="mt-5" variant="secondary">Seleccionar archivo mock</Button>
          </div>
          <div className="mt-6 space-y-4">
            {["Detectando columnas", "Calculando score SEO", "Preparando preview gratis"].map((item, index) => <div key={item}><div className="mb-2 flex justify-between text-sm font-semibold text-slate-700"><span>{item}</span><span>{[100, 76, 48][index]}%</span></div><ProgressBar value={[100, 76, 48][index]} status={index === 2 ? "warning" : "info"} /></div>)}
          </div>
        </Card>
      </div>
    </section>
  );
}
