"use client";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><section className="max-w-2xl rounded-[2rem] border border-white/10 bg-white/10 p-10 shadow-2xl"><p className="text-sm font-bold uppercase tracking-[0.35em] text-red-200">Error controlado</p><h1 className="mt-4 text-4xl font-black">Algo no ha ido bien</h1><p className="mt-4 text-slate-200">Hemos evitado que el error rompa toda la aplicación. Si estabas procesando un job, revisa logs o vuelve a intentarlo.</p><p className="mt-4 rounded-2xl bg-black/20 p-3 text-xs text-slate-300">Referencia: {error.digest ?? error.message}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button onClick={reset}>Reintentar</Button><Button href="/support" variant="secondary">Contactar soporte</Button></div></section></main>;
}
