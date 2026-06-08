"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createInitialAdminState, formatDate, type AdminJob, type AdminLog, type AdminState, type AdminTemplate, type AdminUser, type Incident, type InternalSettings } from "@/lib/admin-mock";

type Toast = { id: string; type: "success" | "error" | "warning" | "info"; message: string };
type Drawer = { type: "user"; user: AdminUser } | { type: "job"; job: AdminJob } | { type: "template"; template: AdminTemplate } | { type: "log"; log: AdminLog } | null;
type Modal = { type: "addCredits"; user?: AdminUser } | { type: "refund"; job?: AdminJob; user?: AdminUser } | { type: "changePlan"; user: AdminUser } | { type: "testPrompt"; template: AdminTemplate } | { type: "incident"; log?: AdminLog } | { type: "confirm"; title: string; message: string; action: () => void } | null;

type AdminContextValue = {
  state: AdminState;
  toasts: Toast[];
  drawer: Drawer;
  modal: Modal;
  openDrawer: (drawer: Drawer) => void;
  closeDrawer: () => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  showToast: (message: string, type?: Toast["type"]) => void;
  adminAddCredits: (userId: string, amount: number, reason: string) => void;
  adminRefundCredits: (userId: string, amount: number, reason: string, jobId?: string) => void;
  adminChangeUserPlan: (userId: string, plan: AdminUser["plan"]) => void;
  adminReprocessJob: (jobId: string, mode?: string) => void;
  adminCancelJob: (jobId: string) => void;
  adminMarkJobCompleted: (jobId: string) => void;
  adminRefundJobCredits: (jobId: string) => void;
  adminActivateTemplate: (templateId: string) => void;
  adminDuplicateTemplate: (templateId: string) => void;
  adminCreateTemplateVersion: (templateId: string) => void;
  adminTestPrompt: (templateId: string) => void;
  adminResolveLog: (logId: string) => void;
  adminCreateIncident: (data?: Partial<Incident>) => void;
  adminSaveInternalSettings: (settings: InternalSettings) => void;
  createIncidentDemo: () => void;
};

const STORAGE_KEY = "rankelia_admin_state_v4";
const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
const AdminContext = createContext<AdminContextValue | null>(null);

function loadInitial() {
  if (!DEMO_ENABLED || typeof window === "undefined") return createInitialAdminState();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...createInitialAdminState(), ...JSON.parse(stored) } : createInitialAdminState();
  } catch { return createInitialAdminState(); }
}

export function AdminStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AdminState>(() => loadInitial());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => { if (DEMO_ENABLED) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") { setDrawer(null); setModal(null); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = `ADM-TOAST-${Date.now()}`;
    setToasts((items) => [...items, { id, type, message }]);
    window.setTimeout(() => setToasts((items) => items.filter((toast) => toast.id !== id)), 3600);
  }, []);

  const guardDemoAction = useCallback((actionName: string) => {
    if (DEMO_ENABLED) return false;
    showToast(`${actionName} está desactivado en producción; usa el endpoint/API admin real cuando esté disponible.`, "warning");
    return true;
  }, [showToast]);

  const adminAddCredits = useCallback((userId: string, amount: number, reason: string) => {
    if (guardDemoAction("Añadir créditos mock")) return;
    setState((current) => ({ ...current,
      users: current.users.map((user) => user.id === userId ? { ...user, credits: user.credits + amount } : user),
      wallets: current.wallets.map((wallet) => wallet.userId === userId ? { ...wallet, balance: wallet.balance + amount } : wallet),
      transactions: [{ id: `TX-${Date.now()}`, date: formatDate(), userId, user: current.users.find(u=>u.id===userId)?.name ?? "Usuario", type: "admin_adjustment", amount, description: reason, status: "applied", origin: "admin" }, ...current.transactions]
    }));
    showToast("Créditos añadidos por admin.", "success");
  }, [guardDemoAction, showToast]);

  const adminRefundCredits = useCallback((userId: string, amount: number, reason: string, jobId?: string) => {
    if (guardDemoAction("Reembolsar créditos mock")) return;
    setState((current) => ({ ...current,
      users: current.users.map((user) => user.id === userId ? { ...user, credits: user.credits + amount } : user),
      wallets: current.wallets.map((wallet) => wallet.userId === userId ? { ...wallet, balance: wallet.balance + amount } : wallet),
      transactions: [{ id: `TX-${Date.now()}`, date: formatDate(), userId, user: current.users.find(u=>u.id===userId)?.name ?? "Usuario", type: "refund", amount, description: reason, jobId, status: "refunded", origin: "admin" }, ...current.transactions]
    }));
    showToast("Créditos reembolsados.", "success");
  }, [guardDemoAction, showToast]);

  const adminChangeUserPlan = useCallback((userId: string, plan: AdminUser["plan"]) => {
    if (guardDemoAction("Cambiar plan mock")) return;
    setState((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, plan } : user), wallets: current.wallets.map((wallet) => wallet.userId === userId ? { ...wallet, plan } : wallet) }));
    showToast("Plan actualizado en modo mock.", "success");
  }, [guardDemoAction, showToast]);

  const adminReprocessJob = useCallback((jobId: string, mode = "todo") => {
    if (guardDemoAction("Reprocesar job mock")) return;
    setState((current) => ({ ...current, jobs: current.jobs.map((job) => job.id === jobId ? { ...job, status: "reprocessing", progress: 12, logs: [...job.logs, `Reprocesamiento ${mode} solicitado por admin`] } : job) }));
    showToast("Job enviado a reproceso.", "success");
  }, [guardDemoAction, showToast]);
  const adminCancelJob = useCallback((jobId: string) => { if (guardDemoAction("Cancelar job mock")) return; setState((c) => ({ ...c, jobs: c.jobs.map(j => j.id === jobId ? { ...j, status: "cancelled", logs: [...j.logs, "Cancelado por admin"] } : j) })); showToast("Job cancelado.", "warning"); }, [guardDemoAction, showToast]);
  const adminMarkJobCompleted = useCallback((jobId: string) => { if (guardDemoAction("Marcar job completado mock")) return; setState((c) => ({ ...c, jobs: c.jobs.map(j => j.id === jobId ? { ...j, status: "completed", progress: 100, processed: j.rows, failedRows: 0, score: j.score || 84, logs: [...j.logs, "Marcado completado por admin"] } : j) })); showToast("Job marcado como completado.", "success"); }, [guardDemoAction, showToast]);
  const adminRefundJobCredits = useCallback((jobId: string) => { const job = state.jobs.find(j=>j.id===jobId); if (job) adminRefundCredits(job.userId, job.credits, `Reembolso job ${job.id}`, job.id); }, [adminRefundCredits, state.jobs]);

  const adminActivateTemplate = useCallback((templateId: string) => { if (guardDemoAction("Activar template mock")) return; setState((c)=>({ ...c, templates: c.templates.map(t => t.id === templateId ? { ...t, active: !t.active } : t) })); showToast("Plantilla activada/desactivada.", "success"); }, [guardDemoAction, showToast]);
  const adminDuplicateTemplate = useCallback((templateId: string) => { if (guardDemoAction("Duplicar template mock")) return; setState((c)=>{ const t=c.templates.find(item=>item.id===templateId); return t ? { ...c, templates: [{ ...t, id: `TPL-${Date.now()}`, name: `${t.name} copia`, active: false, updatedAt: "Ahora" }, ...c.templates] } : c; }); showToast("Plantilla duplicada.", "success"); }, [guardDemoAction, showToast]);
  const adminCreateTemplateVersion = useCallback((templateId: string) => { if (guardDemoAction("Crear versión de template mock")) return; setState((c)=>({ ...c, templates: c.templates.map(t => t.id === templateId ? { ...t, version: `v${Number(t.version.replace(/[^0-9]/g, "") || 1)+1}.0`, versions: [...t.versions, `v${t.versions.length + 1}.0`], updatedAt: "Ahora" } : t) })); showToast("Nueva versión creada.", "success"); }, [guardDemoAction, showToast]);
  const adminTestPrompt = useCallback((templateId: string) => { if (guardDemoAction("Test prompt mock")) return; const t = state.templates.find(item=>item.id===templateId); if (t) setModal({ type: "testPrompt", template: t }); showToast("Prompt test ejecutado.", "info"); }, [guardDemoAction, showToast, state.templates]);

  const adminResolveLog = useCallback((logId: string) => { if (guardDemoAction("Resolver log mock")) return; setState((c)=>({ ...c, logs: c.logs.map(log => log.id === logId ? { ...log, status: "resuelto" } : log) })); showToast("Log marcado resuelto.", "success"); }, [guardDemoAction, showToast]);
  const adminCreateIncident = useCallback((data?: Partial<Incident>) => { if (guardDemoAction("Crear incidencia mock")) return; setState((c)=>({ ...c, incidents: [{ id: `INC-${Date.now()}`, title: data?.title ?? "Incidencia demo creada", severity: data?.severity ?? "warning", source: data?.source ?? "admin", description: data?.description ?? "Incidencia creada desde backoffice mock.", owner: data?.owner ?? "Ops", status: data?.status ?? "abierta", createdAt: formatDate() }, ...c.incidents] })); showToast("Incidencia creada.", "success"); }, [guardDemoAction, showToast]);
  const adminSaveInternalSettings = useCallback((settings: InternalSettings) => { if (guardDemoAction("Guardar ajustes internos mock")) return; setState((c)=>({ ...c, settings })); showToast("Ajustes internos guardados.", "success"); }, [guardDemoAction, showToast]);
  const createIncidentDemo = useCallback(() => { adminCreateIncident({ title: "Incidencia demo desde topbar", severity: "warning", source: "admin", description: "Seguimiento operativo creado manualmente." }); router.push("/admin/logs"); }, [adminCreateIncident, router]);

  const value = useMemo(() => ({ state, toasts, drawer, modal, openDrawer: setDrawer, closeDrawer: () => setDrawer(null), openModal: setModal, closeModal: () => setModal(null), showToast, adminAddCredits, adminRefundCredits, adminChangeUserPlan, adminReprocessJob, adminCancelJob, adminMarkJobCompleted, adminRefundJobCredits, adminActivateTemplate, adminDuplicateTemplate, adminCreateTemplateVersion, adminTestPrompt, adminResolveLog, adminCreateIncident, adminSaveInternalSettings, createIncidentDemo }), [state, toasts, drawer, modal, showToast, adminAddCredits, adminRefundCredits, adminChangeUserPlan, adminReprocessJob, adminCancelJob, adminMarkJobCompleted, adminRefundJobCredits, adminActivateTemplate, adminDuplicateTemplate, adminCreateTemplateVersion, adminTestPrompt, adminResolveLog, adminCreateIncident, adminSaveInternalSettings, createIncidentDemo]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminState() { const context = useContext(AdminContext); if (!context) throw new Error("useAdminState must be used inside AdminStateProvider"); return context; }

export function AdminToasts() { const { toasts } = useAdminState(); return <div className="fixed right-4 top-20 z-[90] space-y-3">{toasts.map(t => <div className={`max-w-sm rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-2xl ${t.type === "success" ? "border-emerald-200 text-emerald-700" : t.type === "error" ? "border-red-200 text-red-700" : t.type === "warning" ? "border-amber-200 text-amber-700" : "border-blue-200 text-blue-700"}`} key={t.id}>{t.message}</div>)}</div>; }

export function AdminDrawer() {
  const { drawer, closeDrawer, adminAddCredits, adminRefundCredits, adminChangeUserPlan, adminReprocessJob, adminCancelJob, adminMarkJobCompleted, adminRefundJobCredits, adminActivateTemplate, adminDuplicateTemplate, adminCreateTemplateVersion, adminTestPrompt, adminResolveLog, adminCreateIncident } = useAdminState();
  if (!drawer) return null;
  return <div className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm" role="dialog" aria-modal="true"><button aria-label="Cerrar drawer" className="absolute inset-0" onClick={closeDrawer} /><aside className="absolute right-0 top-0 h-full w-full overflow-auto bg-white p-6 shadow-2xl sm:max-w-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Internal drawer</p><h2 className="mt-1 text-2xl font-black">{drawer.type === "user" ? drawer.user.name : drawer.type === "job" ? drawer.job.file : drawer.type === "template" ? drawer.template.name : drawer.log.message}</h2></div><button className="rounded-2xl border border-slate-200 px-3 py-2 font-bold" onClick={closeDrawer}>×</button></div>{drawer.type === "user" && <div className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[["Email", drawer.user.email], ["Plan", drawer.user.plan], ["Créditos", drawer.user.credits.toLocaleString("es-ES")], ["Jobs", drawer.user.jobs], ["Score medio", `${drawer.user.avgScore}/100`], ["Riesgo churn", drawer.user.churnRisk], ["LTV", `${drawer.user.ltv} €`], ["Margen", `${drawer.user.margin}%`]].map(([k,v])=><div className="rounded-2xl bg-slate-50 p-4" key={k}><p className="text-xs font-bold uppercase text-slate-500">{k}</p><p className="mt-1 font-bold">{v}</p></div>)}</div><div className="flex flex-wrap gap-2"><button className="rounded-2xl bg-blue-600 px-4 py-2 font-bold text-white" onClick={()=>adminAddCredits(drawer.user.id, 50000, "Ajuste soporte")}>Añadir 50k</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminRefundCredits(drawer.user.id, 25000, "Refund soporte")}>Reembolsar 25k</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminChangeUserPlan(drawer.user.id, "Agency")}>Plan Agency</button></div><div><h3 className="font-black">Notas internas</h3>{drawer.user.notes.map(n=><p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm" key={n}>{n}</p>)}</div></div>}{drawer.type === "job" && <div className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[["ID", drawer.job.id], ["Usuario", drawer.job.userName], ["Estado", drawer.job.status], ["Filas", drawer.job.rows], ["Procesadas", drawer.job.processed], ["Fallidas", drawer.job.failedRows], ["Score", drawer.job.score || "Pendiente"], ["Créditos", drawer.job.credits.toLocaleString("es-ES")], ["Modelo", drawer.job.model], ["Plantilla", drawer.job.template], ["Duración", drawer.job.duration], ["Coste IA", `${drawer.job.rows} filas`]].map(([k,v])=><div className="rounded-2xl bg-slate-50 p-4" key={k}><p className="text-xs font-bold uppercase text-slate-500">{k}</p><p className="mt-1 font-bold">{v}</p></div>)}</div><div><h3 className="font-black">Progreso y eventos</h3><div className="mt-3 rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100">{drawer.job.logs.map(l=><p key={l}>› {l}</p>)}</div></div>{drawer.job.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"><b>Error:</b> {drawer.job.error}</div>}<div className="flex flex-wrap gap-2"><button className="rounded-2xl bg-blue-600 px-4 py-2 font-bold text-white" onClick={()=>adminReprocessJob(drawer.job.id)}>Reprocesar</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminMarkJobCompleted(drawer.job.id)}>Marcar completado</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminRefundJobCredits(drawer.job.id)}>Reembolsar créditos</button><button className="rounded-2xl bg-red-600 px-4 py-2 font-bold text-white" onClick={()=>adminCancelJob(drawer.job.id)}>Cancelar</button></div></div>}{drawer.type === "template" && <div className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-2">{[["Tipo", drawer.template.type], ["Plataforma", drawer.template.platform], ["Versión", drawer.template.version], ["Uso", drawer.template.usage], ["Score", drawer.template.score], ["Error rate", `${drawer.template.errorRate}%`]].map(([k,v])=><div className="rounded-2xl bg-slate-50 p-4" key={k}><p className="text-xs font-bold uppercase text-slate-500">{k}</p><p className="mt-1 font-bold">{v}</p></div>)}</div><pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{drawer.template.systemPrompt}\n\n{drawer.template.userPrompt}</pre><div className="flex flex-wrap gap-2">{drawer.template.variables.map(v=><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700" key={v}>{v}</span>)}</div><ul className="list-disc pl-5 text-sm text-slate-600"><li>No inventar características.</li><li>Evitar keyword stuffing.</li><li>Meta title máximo 60 caracteres.</li><li>JSON válido y revisión humana recomendada.</li></ul><div className="flex flex-wrap gap-2"><button className="rounded-2xl bg-blue-600 px-4 py-2 font-bold text-white" onClick={()=>adminTestPrompt(drawer.template.id)}>Test prompt</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminActivateTemplate(drawer.template.id)}>Activar/desactivar</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminDuplicateTemplate(drawer.template.id)}>Duplicar</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminCreateTemplateVersion(drawer.template.id)}>Crear versión</button></div></div>}{drawer.type === "log" && <div className="mt-6 space-y-5"><div className="rounded-2xl bg-slate-50 p-4"><p><b>Código:</b> {drawer.log.code}</p><p><b>Fuente:</b> {drawer.log.source}</p><p><b>Usuario:</b> {drawer.log.user}</p><p><b>Job:</b> {drawer.log.jobId ?? "—"}</p></div><pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{drawer.log.stack}\n\nContexto: {drawer.log.context}</pre><p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"><b>Acción recomendada:</b> {drawer.log.recommendation}</p><div className="flex flex-wrap gap-2"><button className="rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white" onClick={()=>adminResolveLog(drawer.log.id)}>Marcar resuelto</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>adminCreateIncident({ title: drawer.log.message, severity: drawer.log.level, source: drawer.log.source, description: drawer.log.context })}>Crear incidencia</button><button className="rounded-2xl border px-4 py-2 font-bold" onClick={()=>navigator.clipboard?.writeText(drawer.log.stack)}>Copiar error</button></div></div>}</aside></div>;
}

export function AdminModal() {
  const { modal, closeModal, adminAddCredits, adminRefundCredits, adminCreateIncident } = useAdminState();
  const [amount, setAmount] = useState("50000");
  const [reason, setReason] = useState("Ajuste manual de soporte");
  if (!modal) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-[1.5rem] bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><h2 className="text-2xl font-black">{modal.type === "addCredits" ? "Añadir créditos" : modal.type === "refund" ? "Reembolsar créditos" : modal.type === "incident" ? "Crear incidencia" : modal.type === "testPrompt" ? "Test prompt" : modal.type === "confirm" ? modal.title : "Acción admin"}</h2><button aria-label="Cerrar modal" className="rounded-2xl border px-3 py-2 font-bold" onClick={closeModal}>×</button></div>{(modal.type === "addCredits" || modal.type === "refund") && <div className="mt-5 space-y-4"><label className="block text-sm font-bold">Cantidad<input className="mt-2 w-full rounded-2xl border p-3" value={amount} onChange={e=>setAmount(e.target.value)} /></label><label className="block text-sm font-bold">Motivo<textarea className="mt-2 w-full rounded-2xl border p-3" value={reason} onChange={e=>setReason(e.target.value)} /></label><label className="flex gap-2 text-sm font-bold"><input type="checkbox" /> Notificar usuario (mock)</label><button className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white" onClick={()=>{ const user = modal.user; if (user && modal.type === "addCredits") adminAddCredits(user.id, Number(amount), reason); if (user && modal.type === "refund") adminRefundCredits(user.id, Number(amount), reason); closeModal(); }}>Confirmar</button></div>}{modal.type === "incident" && <div className="mt-5 space-y-4"><p className="text-slate-600">Se creará una incidencia demo para seguimiento operativo.</p><button className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white" onClick={()=>{adminCreateIncident({ title: modal.log?.message ?? "Incidencia manual", severity: modal.log?.level ?? "warning", source: modal.log?.source ?? "admin", description: modal.log?.context ?? reason }); closeModal();}}>Crear incidencia</button></div>}{modal.type === "testPrompt" && <div className="mt-5 space-y-4"><pre className="rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">Input demo: Bota seguridad S3\n\nResultado mock: JSON válido con descripción, metas, warnings y score 88/100.</pre><button className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white" onClick={closeModal}>Cerrar test</button></div>}{modal.type === "confirm" && <div className="mt-5"><p className="text-slate-600">{modal.message}</p><button className="mt-5 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white" onClick={()=>{ modal.action(); closeModal(); }}>Confirmar acción</button></div>}</div></div>;
}
