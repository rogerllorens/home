"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AuthUserContext, Profile } from "@/lib/profiles";
import {
  analyzeCSV,
  appDemoCsv,
  appTemplateCsv,
  buildDownloads,
  createInitialAppState,
  creditPacks,
  defaultGenerationSettings,
  downloadAppFile,
  downloadCsv,
  estimateCredits,
  generatePreview,
  generateProductResult,
  parseCSV,
  type AppDownload,
  type AppJob,
  type AppState,
  type AppTemplate,
  type CreditTransaction,
  type GenerationSettings,
  type ProductResult,
  type ProjectSettings,
} from "@/lib/app-mock";

type Toast = { id: string; type: "success" | "error" | "warning" | "info"; message: string };
type Modal =
  | { type: "job"; job: AppJob }
  | { type: "template"; template: AppTemplate }
  | { type: "checkout"; title: string; message: string }
  | { type: "insufficient"; required: number; available: number }
  | { type: "errors"; job: AppJob }
  | { type: "preview"; result: ProductResult }
  | null;

type AppContextValue = {
  state: AppState;
  settings: GenerationSettings;
  setSettings: (settings: GenerationSettings) => void;
  toasts: Toast[];
  modal: Modal;
  setModal: (modal: Modal) => void;
  showToast: (message: string, type?: Toast["type"]) => void;
  loadExampleCsv: () => void;
  analyzeCsvText: (text: string, fileName?: string) => void;
  handleUploadedFile: (file: File) => void;
  clearCsv: () => void;
  downloadTemplate: () => void;
  generateFreePreview: () => void;
  processFullBatch: () => void;
  buyCredits: (pack: (typeof creditPacks)[number]) => void;
  applyCreditCode: (code: string) => boolean;
  changePlan: (planName: string, monthlyCredits: number) => void;
  saveSettings: (settings: ProjectSettings) => void;
  auth: AuthUserContext;
  updateAuthProfile: (profile: Partial<Profile>) => void;
  activateTemplate: (templateId: string) => void;
  downloadFile: (download: AppDownload) => void;
  copyDownloadLink: (download: AppDownload) => void;
  reprocessJob: (job: AppJob) => void;
  cancelJob: (job: AppJob) => void;
  columnMapping: Record<string, string>;
  setColumnMapping: (mapping: Record<string, string>) => void;
};

const LEGACY_STORAGE_KEY = "rankelia_app_state_v3";
const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
function getUserScopedStorageKey(auth?: AuthUserContext) {
  return `rankelia_app_state_${auth?.user?.id ?? "anonymous"}`;
}
const AppContext = createContext<AppContextValue | null>(null);

function applyAuthToState(state: AppState, auth?: AuthUserContext): AppState {
  if (!auth?.user) return state;
  const displayName = auth.profile?.full_name || auth.user.email || state.user.name;
  return {
    ...state,
    user: {
      name: displayName,
      email: auth.user.email || auth.profile?.email || state.user.email,
      company: auth.profile?.company_name || state.user.company,
    },
    credits: auth.wallet?.balance ?? state.credits,
    plan: { ...state.plan, name: auth.profile?.role === "admin" ? "Admin beta" : state.plan.name },
    settings: {
      ...state.settings,
      projectName: auth.profile?.company_name || state.settings.projectName,
      defaultPlatform: auth.profile?.default_platform === "Shopify" || auth.profile?.default_platform === "Prestashop" || auth.profile?.default_platform === "WooCommerce" ? auth.profile.default_platform : state.settings.defaultPlatform,
    },
  };
}

function safeLoadState(initialAuth?: AuthUserContext): AppState {
  if (!DEMO_ENABLED || typeof window === "undefined") return applyAuthToState(createInitialAppState(), initialAuth);
  try {
    const scopedKey = getUserScopedStorageKey(initialAuth);
    const stored = window.localStorage.getItem(scopedKey);
    const legacy = initialAuth?.user ? window.localStorage.getItem(LEGACY_STORAGE_KEY) : null;
    if (!stored && legacy) {
      window.localStorage.setItem(scopedKey, legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    const base = (stored ?? legacy) ? { ...createInitialAppState(), ...JSON.parse(stored ?? legacy ?? "{}") } : createInitialAppState();
    return applyAuthToState(base, initialAuth);
  } catch {
    return applyAuthToState(createInitialAppState(), initialAuth);
  }
}

function createTransaction(transaction: Omit<CreditTransaction, "id" | "date" | "balance">, balance: number): CreditTransaction {
  return { id: `TR-${Date.now()}`, date: new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date()), balance, ...transaction };
}

export function AppStateProvider({ children, initialAuth }: { children: ReactNode; initialAuth?: AuthUserContext }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthUserContext>(initialAuth ?? { user: null, profile: null, wallet: null });
  const [state, setState] = useState<AppState>(() => safeLoadState(initialAuth));
  const [settings, setSettings] = useState<GenerationSettings>(defaultGenerationSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!DEMO_ENABLED) return;
    window.localStorage.setItem(getUserScopedStorageKey(auth), JSON.stringify(state));
  }, [auth, state]);


  const updateAuthProfile = useCallback((profilePatch: Partial<Profile>) => {
    setAuth((current) => ({ ...current, profile: current.profile ? { ...current.profile, ...profilePatch } : current.profile }));
    setState((current) => ({
      ...current,
      user: {
        ...current.user,
        name: profilePatch.full_name ?? current.user.name,
        company: profilePatch.company_name ?? current.user.company,
      },
      settings: {
        ...current.settings,
        projectName: profilePatch.company_name ?? current.settings.projectName,
        defaultPlatform: profilePatch.default_platform === "Shopify" || profilePatch.default_platform === "Prestashop" || profilePatch.default_platform === "WooCommerce" ? profilePatch.default_platform : current.settings.defaultPlatform,
      },
    }));
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = `TOAST-${Date.now()}`;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3600);
  }, []);

  const setCsvState = useCallback((rows: ReturnType<typeof parseCSV>, fileName: string) => {
    if (!rows.length) {
      showToast("No hemos detectado filas válidas en el CSV.", "error");
      return;
    }
    const analysis = analyzeCSV(rows);
    const columns = Object.keys(rows[0] ?? {});
    setColumnMapping({ sku: "sku", productName: "nombre_producto", brand: "marca", category: "categoria", features: "caracteristicas", description: "descripcion_actual", keyword: "keyword_principal", secondaryKeywords: "keywords_secundarias", platform: "plataforma" });
    setState((current) => ({ ...current, currentCSV: { fileName, rows, columns, analysis }, previewResults: [] }));
    showToast(`CSV analizado: ${rows.length} filas detectadas.`, "success");
  }, [showToast]);

  const analyzeCsvText = useCallback((text: string, fileName = "catalogo-pegado.csv") => setCsvState(parseCSV(text), fileName), [setCsvState]);
  const loadExampleCsv = useCallback(() => setCsvState(parseCSV(appDemoCsv), "csv-ejemplo-rankelia.csv"), [setCsvState]);

  const handleUploadedFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      showToast(DEMO_ENABLED ? "Excel detectado. En demo cargaremos el CSV de ejemplo." : "XLS/XLSX no está activo en producción beta. Exporta el archivo a CSV y vuelve a subirlo.", "warning");
      if (DEMO_ENABLED) loadExampleCsv();
      return;
    }
    if (!name.endsWith(".csv")) {
      showToast("Formato no compatible. Usa CSV, XLSX o XLS.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCsvState(parseCSV(String(reader.result ?? "")), file.name);
    reader.onerror = () => showToast("No hemos podido leer el archivo.", "error");
    reader.readAsText(file);
  }, [loadExampleCsv, setCsvState, showToast]);

  const clearCsv = useCallback(() => {
    setState((current) => ({ ...current, currentCSV: null, previewResults: [] }));
    showToast("CSV limpiado.", "info");
  }, [showToast]);

  const downloadTemplate = useCallback(() => {
    downloadCsv("rankelia-plantilla-app.csv", appTemplateCsv);
    showToast("Plantilla CSV descargada.", "success");
  }, [showToast]);

  const generateFreePreview = useCallback(() => {
    if (!DEMO_ENABLED) {
      showToast("Preview demo desactivada en producción. Usa /app/upload para generar previews reales desde el backend.", "warning");
      return;
    }
    if (!state.currentCSV) {
      showToast("Analiza un CSV antes de generar preview.", "warning");
      return;
    }
    const preview = generatePreview(state.currentCSV.rows, settings);
    setState((current) => ({ ...current, previewResults: preview }));
    showToast("Preview gratuita generada sin consumir créditos.", "success");
  }, [settings, showToast, state.currentCSV]);

  const processFullBatch = useCallback(() => {
    if (!DEMO_ENABLED) {
      showToast("Procesamiento demo desactivado en producción. Crea jobs reales desde /app/upload.", "warning");
      return;
    }
    if (!state.currentCSV) {
      showToast("Analiza un CSV antes de procesar el lote.", "warning");
      return;
    }
    const creditsRequired = estimateCredits(state.currentCSV.rows, settings);
    if (state.credits < creditsRequired) {
      setModal({ type: "insufficient", required: creditsRequired, available: state.credits });
      showToast("Créditos insuficientes para procesar el lote.", "error");
      return;
    }
    const rows = state.currentCSV.rows;
    const results = rows.map((row, index) => generateProductResult(row, index, settings));
    const score = Math.round(results.reduce((sum, result) => sum + result.seoScore, 0) / Math.max(results.length, 1));
    const job: AppJob = {
      id: `JOB-${Date.now()}`,
      fileName: state.currentCSV.fileName,
      type: settings.generationType,
      platform: settings.platform,
      rows: rows.length,
      status: "Procesando",
      progress: 12,
      score,
      creditsUsed: creditsRequired,
      createdAt: new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date()),
      warnings: results.reduce((sum, result) => sum + result.qualityWarnings.length, 0),
      errors: 0,
      logs: ["Archivo recibido", "Columnas detectadas", "Preview validada", "Procesando lote completo"],
    };
    const nextCredits = state.credits - creditsRequired;
    const transaction = createTransaction({ concept: `Consumo ${job.fileName}`, type: "Consumo", credits: -creditsRequired, status: "Procesando" }, nextCredits);
    setState((current) => ({ ...current, credits: nextCredits, jobs: [job, ...current.jobs], transactions: [transaction, ...current.transactions] }));
    showToast("Job creado. Procesamiento en segundo plano simulado.", "success");
    router.push("/app/jobs");

    const steps = [34, 62, 88, 100];
    steps.forEach((progress, index) => {
      window.setTimeout(() => {
        setState((current) => {
          const updatedJob = { ...job, progress, status: progress === 100 ? "Completado" as const : "Procesando" as const, completedAt: progress === 100 ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date()) : undefined, logs: [...job.logs, progress === 100 ? "Trabajo completado" : `Generando productos ${Math.round((progress / 100) * rows.length)}/${rows.length}`] };
          const newDownloads = progress === 100 ? buildDownloads(updatedJob, results) : [];
          return { ...current, jobs: current.jobs.map((item) => item.id === job.id ? updatedJob : item), downloads: [...newDownloads, ...current.downloads] };
        });
        if (progress === 100) showToast("Tu lote está listo. Ya puedes descargarlo.", "success");
      }, (index + 1) * 1200);
    });
  }, [router, settings, showToast, state.currentCSV, state.credits]);

  const buyCredits = useCallback((pack: (typeof creditPacks)[number]) => {
    setState((current) => {
      const balance = current.credits + pack.credits;
      const transaction = createTransaction({ concept: `Compra ${pack.credits.toLocaleString("es-ES")} créditos`, type: "Compra", credits: pack.credits, amount: `${pack.price} €`, status: "Simulado" }, balance);
      return { ...current, credits: balance, transactions: [transaction, ...current.transactions] };
    });
    showToast("Créditos añadidos. Checkout simulado completado.", "success");
  }, [showToast]);

  const applyCreditCode = useCallback((code: string) => {
    if (code.trim().toUpperCase() !== "RANKELIA100") {
      showToast("Código promocional no válido.", "error");
      return false;
    }
    if (state.promoUsed) {
      showToast("El código RANKELIA100 ya fue aplicado.", "warning");
      return false;
    }
    setState((current) => {
      const balance = current.credits + 100000;
      const transaction = createTransaction({ concept: "Código promocional RANKELIA100", type: "Promo", credits: 100000, status: "Aplicado" }, balance);
      return { ...current, credits: balance, promoUsed: true, transactions: [transaction, ...current.transactions] };
    });
    showToast("Código aplicado: +100.000 créditos.", "success");
    return true;
  }, [showToast, state.promoUsed]);

  const changePlan = useCallback((planName: string, monthlyCredits: number) => {
    setModal({ type: "checkout", title: `Cambiar a ${planName}`, message: "En producción irías a Stripe Checkout. Aquí simulamos el cambio de plan." });
    setState((current) => ({ ...current, plan: { name: planName, monthlyCredits, status: "Simulado" } }));
  }, []);

  const saveSettings = useCallback((settingsData: ProjectSettings) => {
    setState((current) => ({ ...current, settings: settingsData }));
    showToast("Ajustes guardados.", "success");
  }, [showToast]);

  const activateTemplate = useCallback((templateId: string) => {
    setState((current) => ({ ...current, templates: current.templates.map((template) => template.id === templateId ? { ...template, active: !template.active } : template) }));
    showToast("Estado de plantilla actualizado.", "success");
  }, [showToast]);

  const downloadFile = useCallback((download: AppDownload) => {
    downloadAppFile(download);
    showToast(`${download.fileName} descargado.`, "success");
  }, [showToast]);

  const copyDownloadLink = useCallback((download: AppDownload) => {
    navigator.clipboard?.writeText(`https://rankelia.ai/app/downloads/${download.id}`).catch(() => undefined);
    showToast("Enlace simulado copiado.", "success");
  }, [showToast]);

  const reprocessJob = useCallback((job: AppJob) => {
    setState((current) => ({ ...current, jobs: [{ ...job, id: `JOB-${Date.now()}`, status: "En cola", progress: 0, createdAt: "Ahora", logs: ["Reprocesamiento solicitado"] }, ...current.jobs] }));
    showToast("Reprocesamiento simulado creado.", "success");
  }, [showToast]);

  const cancelJob = useCallback((job: AppJob) => {
    setState((current) => ({ ...current, jobs: current.jobs.map((item) => item.id === job.id ? { ...item, status: "Cancelado", progress: item.progress, logs: [...item.logs, "Trabajo cancelado por el usuario"] } : item) }));
    showToast("Job cancelado en la beta visual.", "warning");
  }, [showToast]);

  const value = useMemo<AppContextValue>(() => ({ state, settings, setSettings, toasts, modal, setModal, showToast, loadExampleCsv, analyzeCsvText, handleUploadedFile, clearCsv, downloadTemplate, generateFreePreview, processFullBatch, buyCredits, applyCreditCode, changePlan, saveSettings, activateTemplate, downloadFile, copyDownloadLink, reprocessJob, cancelJob, columnMapping, setColumnMapping, auth, updateAuthProfile }), [state, settings, toasts, modal, showToast, loadExampleCsv, analyzeCsvText, handleUploadedFile, clearCsv, downloadTemplate, generateFreePreview, processFullBatch, buyCredits, applyCreditCode, changePlan, saveSettings, activateTemplate, downloadFile, copyDownloadLink, reprocessJob, cancelJob, columnMapping, auth, updateAuthProfile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}

export function AppToasts() {
  const { toasts } = useAppState();
  return <div className="fixed right-4 top-20 z-[80] space-y-3">{toasts.map((toast) => <div className={`max-w-sm rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-2xl ${toast.type === "success" ? "border-emerald-200 text-emerald-700" : toast.type === "error" ? "border-red-200 text-red-700" : toast.type === "warning" ? "border-amber-200 text-amber-700" : "border-blue-200 text-blue-700"}`} key={toast.id}>{toast.message}</div>)}</div>;
}

export function AppModal() {
  const { modal, setModal, downloadFile, state } = useAppState();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setModal]);
  if (!modal) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Rankelia modal</p><h2 className="mt-1 text-2xl font-black text-slate-950">{modal.type === "job" ? modal.job.fileName : modal.type === "template" ? modal.template.name : modal.type === "insufficient" ? "Créditos insuficientes" : modal.type === "errors" ? "Errores y logs" : modal.type === "preview" ? modal.result.seoProductName : modal.title}</h2></div><button aria-label="Cerrar modal" className="rounded-2xl border border-slate-200 px-3 py-2 font-bold" onClick={() => setModal(null)}>×</button></div>{modal.type === "job" && <div className="mt-5 grid gap-4 md:grid-cols-2"><p><b>Estado:</b> {modal.job.status}</p><p><b>Créditos:</b> {modal.job.creditsUsed.toLocaleString("es-ES")}</p><p><b>Filas:</b> {modal.job.rows}</p><p><b>Warnings:</b> {modal.job.warnings}</p><div className="md:col-span-2 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">{modal.job.logs.map((log) => <p key={log}>› {log}</p>)}</div></div>}{modal.type === "template" && <div className="mt-5 space-y-4"><p className="rounded-2xl bg-slate-50 p-4 text-slate-700">{modal.template.prompt}</p><div className="flex flex-wrap gap-2">{modal.template.fields.map((field) => <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700" key={field}>{field}</span>)}</div><p><b>Ejemplo:</b> {modal.template.example}</p><ul className="list-disc space-y-1 pl-5 text-sm text-slate-600"><li>No inventar características.</li><li>Evitar keyword stuffing.</li><li>Usar atributos del CSV.</li><li>Revisar claims y adaptar tono.</li></ul></div>}{modal.type === "insufficient" && <div className="mt-5"><p className="text-slate-600">Necesitas {modal.required.toLocaleString("es-ES")} créditos y tienes {modal.available.toLocaleString("es-ES")}.</p><button className="mt-5 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-5 py-3 font-bold text-white" onClick={() => { setModal(null); window.location.href = "/app/credits"; }}>Ir a créditos</button></div>}{modal.type === "checkout" && <p className="mt-5 text-slate-600">{modal.message}</p>}{modal.type === "errors" && <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">{modal.job.logs.map((log) => <p key={log}>› {log}</p>)}</div>}{modal.type === "preview" && <div className="mt-5 space-y-4"><p className="text-slate-600">{modal.result.shortDescription}</p><div className="rounded-2xl bg-slate-50 p-4"><p><b>Meta title:</b> {modal.result.metaTitle}</p><p><b>Meta description:</b> {modal.result.metaDescription}</p><p><b>Score:</b> SEO {modal.result.seoScore}/100 · Conversión {modal.result.conversionScore}/100</p></div></div>}{modal.type === "job" && state.downloads.filter((download) => download.jobId === modal.job.id).length > 0 && <div className="mt-5 flex flex-wrap gap-2">{state.downloads.filter((download) => download.jobId === modal.job.id).map((download) => <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold" key={download.id} onClick={() => downloadFile(download)}>Descargar {download.format}</button>)}</div>}</div></div>;
}
