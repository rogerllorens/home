"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppState } from "@/components/app/AppStateProvider";
import { appRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function AppSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { state } = useAppState();
  const activeJobs = state.jobs.filter((job) => job.status === "Procesando" || job.status === "En cola").length;
  const readyDownloads = state.downloads.length;

  return (
    <>
      {mobileOpen && <button aria-label="Cerrar menú" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onClose} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#070A1A] p-4 text-white shadow-2xl transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <Link className="flex items-center gap-3 px-2 py-2" href="/" onClick={onClose}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 font-black shadow-lg shadow-blue-600/25">R</span>
          <span><span className="block font-black">Rankelia.ai</span><span className="text-xs text-slate-400">Ecommerce SEO Copilot</span></span>
        </Link>
        <nav className="mt-7 flex-1 space-y-1" aria-label="Navegación app cliente">
          {appRoutes.map((route) => {
            const isActive = pathname === route.href;
            const badge = route.href.endsWith("jobs") ? activeJobs : route.href.endsWith("downloads") ? readyDownloads : null;
            return <Link className={cn("group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white", isActive && "bg-white/15 text-white shadow-inner")} href={route.href} key={route.href} onClick={onClose}><span className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-xs">{route.icon}</span>{route.label}</span>{badge ? <Badge variant="ai">{badge}</Badge> : null}</Link>;
          })}
        </nav>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/10 p-4">
          <div className="flex items-center justify-between"><p className="text-sm font-bold">{state.plan.name}</p><Badge variant="success">Beta privada</Badge></div>
          <p className="mt-3 text-2xl font-black">{state.credits.toLocaleString("es-ES")}</p>
          <p className="text-xs text-slate-400">créditos disponibles</p>
          <Button className="mt-4 w-full" href="/app/credits" variant="secondary">Añadir créditos</Button>
        </div>
      </aside>
    </>
  );
}
