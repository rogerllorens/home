"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/components/app/AppStateProvider";
import { LogoutButton } from "@/components/auth/LogoutButton";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/app": { title: "Dashboard", subtitle: "Gestiona tus catálogos, trabajos, créditos y descargas SEO desde un solo lugar." },
  "/app/upload": { title: "Subir archivo", subtitle: "Analiza, mapea y procesa CSV de productos o categorías." },
  "/app/jobs": { title: "Trabajos", subtitle: "Consulta el estado de tus lotes de productos, categorías y metadatos." },
  "/app/downloads": { title: "Descargas", subtitle: "Resultados generados y listos para importar o revisar." },
  "/app/credits": { title: "Créditos", subtitle: "Usa créditos para productos, categorías, metadatos y previews avanzadas." },
  "/app/templates": { title: "Plantillas", subtitle: "Controla estilo, estructura y enfoque por plataforma y sector." },
  "/app/billing": { title: "Facturación", subtitle: "Gestiona tu plan, créditos y compras simuladas." },
  "/app/settings": { title: "Ajustes", subtitle: "Preferencias de proyecto, generación, exportación y notificaciones." },
};

export function AppTopbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const { state } = useAppState();
  const page = titles[pathname] ?? titles["/app"];
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <button aria-label="Abrir menú" className="rounded-2xl border border-slate-200 px-3 py-2 font-bold lg:hidden" onClick={onMenu}>☰</button>
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rankelia / {page.title}</p><h1 className="text-2xl font-black text-slate-950">{page.title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{page.subtitle}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="global-search">Buscar</label>
          <input className="hidden w-72 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-blue-500 xl:block" id="global-search" placeholder="Buscar jobs, archivos o plantillas…" />
          <Badge variant="info">{state.plan.name}</Badge>
          <Badge variant="success">{state.credits.toLocaleString("es-ES")} créditos</Badge>
          <span className="text-sm font-semibold text-slate-600">{state.user.name}</span>
          <Button href="/app/credits">Comprar productos extra</Button>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
