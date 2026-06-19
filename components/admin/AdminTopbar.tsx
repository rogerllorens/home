"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminState } from "@/components/admin/AdminStateProvider";
import { LogoutButton } from "@/components/auth/LogoutButton";

const pages: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Admin Overview", subtitle: "Control interno de usuarios, jobs, créditos, costes IA, errores y salud del sistema." },
  "/admin/users": { title: "Usuarios", subtitle: "Consulta usuarios, planes, créditos, jobs y estado de cuenta." },
  "/admin/jobs": { title: "Jobs", subtitle: "Supervisa la cola de procesamiento, trabajos completados, fallidos y costes por lote." },
  "/admin/credits": { title: "Créditos", subtitle: "Controla saldos, compras, consumos, reembolsos y ajustes manuales." },
  "/admin/templates": { title: "Plantillas IA", subtitle: "Gestiona plantillas de generación por plataforma, sector, idioma y tipo de contenido." },
  "/admin/logs": { title: "Logs e incidencias", subtitle: "Supervisa errores de jobs, IA, CSV, Storage, créditos y sistema." },
  "/admin/settings": { title: "Ajustes internos", subtitle: "Configuración mock de créditos, IA, worker, emails y seguridad." },
};

export function AdminTopbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const { createIncidentDemo } = useAdminState();
  const page = pages[pathname] ?? pages["/admin"];
  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-start gap-3"><button aria-label="Abrir menú admin" className="rounded-2xl border border-slate-200 px-3 py-2 font-bold lg:hidden" onClick={onMenu}>☰</button><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rankelia Admin / {page.title}</p><h1 className="text-2xl font-black text-slate-950">{page.title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{page.subtitle}</p></div></div><div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor="admin-search">Buscar</label><input id="admin-search" className="hidden w-80 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm xl:block" placeholder="Buscar usuario, job, archivo, email…" /><Badge variant="success">Sistema OK</Badge><span className="text-sm font-bold text-slate-600">Admin demo</span><Button href="/app" variant="secondary">Ver app cliente</Button><Button href="/" variant="secondary">Ver landing</Button><Button onClick={createIncidentDemo}>Crear incidencia demo</Button><LogoutButton /></div></div></header>;
}
