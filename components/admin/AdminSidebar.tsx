"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { adminRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAdminState } from "@/components/admin/AdminStateProvider";

export function AdminSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { state } = useAdminState();
  const activeJobs = state.jobs.filter((job) => job.status === "processing" || job.status === "queued" || job.status === "reprocessing").length;
  const criticalLogs = state.logs.filter((log) => (log.level === "critical" || log.level === "error") && log.status !== "resuelto").length;
  const newUsers = state.users.filter((user) => user.joinedAt.includes("jun")).length;
  return <>{mobileOpen && <button aria-label="Cerrar menú admin" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onClose} />}<aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#020617] p-4 text-white shadow-2xl transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}><Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-2 py-2"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 font-black shadow-lg shadow-cyan-500/20">R</span><span><span className="block font-black">Rankelia.ai</span><span className="text-xs text-slate-400">Internal Admin</span></span></Link><nav className="mt-7 flex-1 space-y-1" aria-label="Navegación admin">{adminRoutes.map((route) => { const isActive = pathname === route.href; const badge = route.href.endsWith("jobs") ? activeJobs : route.href.endsWith("logs") ? criticalLogs : route.href.endsWith("users") ? newUsers : null; return <Link className={cn("flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white", isActive && "bg-white/15 text-white")} href={route.href} key={route.href} onClick={onClose}><span className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-xs">{route.icon}</span>{route.label.replace("Plantillas", "Plantillas IA")}</span>{badge ? <Badge variant={route.href.endsWith("logs") ? "danger" : "ai"}>{badge}</Badge> : null}</Link>; })}</nav><div className="rounded-[1.35rem] border border-white/10 bg-white/10 p-4"><p className="text-sm font-black">Sistema</p><div className="mt-3 grid gap-2 text-xs text-slate-300">{[["API IA", "mock online"], ["Worker", "mock online"], ["Stripe", "mock test"], ["Supabase", "mock pending"]].map(([k,v]) => <div className="flex justify-between" key={k}><span>{k}</span><span className="font-bold text-emerald-300">{v}</span></div>)}</div></div></aside></>;
}
