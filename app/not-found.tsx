import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><section className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl"><p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-600">404</p><h1 className="mt-4 text-4xl font-black text-slate-950">Página no encontrada</h1><p className="mt-4 text-slate-600">Esta ruta no existe o el recurso ya no está disponible. Vuelve a Rankelia para continuar con tus catálogos CSV/Excel.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button href="/">Ir a la landing</Button><Button href="/app" variant="secondary">Abrir app</Button></div></section></main>;
}
