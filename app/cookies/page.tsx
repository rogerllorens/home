import { Button } from "@/components/ui/Button";

export const metadata = { title: "Cookies | Rankelia.ai", description: "Política básica de cookies de Rankelia.ai." };

export default function CookiesPage() {
  return <main className="bg-slate-50 px-4 py-16"><article className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-600">Cookies</p><h1 className="mt-4 text-4xl font-black text-slate-950">Política de cookies</h1><div className="mt-6 space-y-4 text-slate-600"><p>Rankelia utiliza cookies necesarias para sesión, seguridad y funcionamiento de la app. Estas cookies son imprescindibles para login, rutas privadas y preferencias básicas.</p><p>La analítica es opcional y solo se activa si configuras un proveedor mediante variables públicas. No registramos contenido sensible de CSV en eventos de analítica.</p><p>Stripe puede usar cookies propias durante Checkout y Customer Portal para procesar pagos de forma segura.</p></div><Button className="mt-8" href="/">Volver</Button></article></main>;
}
