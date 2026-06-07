import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function AuthSidePanel() {
  return (
    <aside className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl lg:min-h-[720px]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-10">
        <div>
          <Badge variant="ai">CSV-first Ecommerce SEO</Badge>
          <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight">De CSV desordenado a catálogo SEO listo para importar</h2>
          <p className="mt-4 text-lg text-slate-300">Crea tu cuenta para guardar diagnósticos, generar previews y preparar exportaciones para Shopify, Prestashop y WooCommerce.</p>
        </div>
        <div className="grid gap-4">
          {["1.240 productos detectados", "322 metas vacías", "Preview de 5 filas", "CSV listo para importar"].map((item) => <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur" key={item}><p className="text-sm font-bold text-slate-100">{item}</p></div>)}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm font-bold"><span>Score actual</span><span className="text-amber-300">42/100</span></div>
            <ProgressBar value={42} status="warning" className="mt-3" />
            <div className="mt-5 flex items-center justify-between text-sm font-bold"><span>Score estimado</span><span className="text-emerald-300">87/100</span></div>
            <ProgressBar value={87} status="success" className="mt-3" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Shopify', 'Prestashop', 'WooCommerce', 'Sin tarjeta', '10.000 créditos demo'].map((badge) => <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100" key={badge}>{badge}</span>)}
        </div>
      </div>
    </aside>
  );
}
