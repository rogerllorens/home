export type AdminUserStatus = "active" | "warning" | "suspended" | "internal";
export type AdminJobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled" | "reprocessing";
export type Severity = "info" | "warning" | "error" | "critical";
export type Platform = "Shopify" | "Prestashop" | "WooCommerce" | "CSV genérico";
export type AiModel = "economy" | "standard" | "premium";

export type AdminUser = {
  id: string; name: string; email: string; plan: "Free" | "Starter" | "Pro" | "Agency" | "Pro beta"; credits: number; jobs: number; status: AdminUserStatus; lastJob: string; estimatedSpend: number; joinedAt: string; lastSeen: string; avgScore: number; churnRisk: "low" | "medium" | "high"; ltv: number; aiCost: number; margin: number; notes: string[];
};
export type AdminJob = {
  id: string; file: string; userId: string; userName: string; platform: Platform; type: "Producto completo" | "Solo metadatos" | "Categorías SEO" | "Productos + categorías"; rows: number; processed: number; failedRows: number; status: AdminJobStatus; progress: number; score: number; credits: number; model: AiModel; duration: string; date: string; template: string; error?: string; logs: string[];
};
export type AdminDownload = { id: string; jobId: string; file: string; format: "CSV" | "HTML" | "TXT" | "Errores CSV"; rows: number; size: string; createdAt: string };
export type CreditWallet = { userId: string; user: string; plan: string; balance: number; lifetimeUsed: number; lastPurchase: string; lastUsage: string; status: "ok" | "low" | "blocked" };
export type CreditTransaction = { id: string; date: string; userId: string; user: string; type: "purchase" | "subscription_grant" | "usage" | "refund" | "admin_adjustment" | "promo_code"; amount: number; description: string; jobId?: string; status: string; origin: string };
export type AdminTemplate = { id: string; name: string; type: string; platform: Platform; sector: string; language: string; version: string; active: boolean; usage: number; score: number; avgCost: number; errorRate: number; updatedAt: string; systemPrompt: string; userPrompt: string; variables: string[]; versions: string[] };
export type AdminLog = { id: string; date: string; level: Severity; source: "worker" | "ai_provider" | "csv_parser" | "storage" | "billing" | "credits" | "auth" | "admin"; message: string; userId?: string; user: string; jobId?: string; code: string; status: "abierto" | "investigando" | "resuelto" | "ignorado"; stack: string; context: string; recommendation: string };
export type Incident = { id: string; title: string; severity: Severity; source: string; description: string; owner: string; status: "abierta" | "investigando" | "resuelta" | "crítica"; createdAt: string };
export type InternalSettings = {
  productName: string; betaMode: boolean; freeRowLimit: number; starterRowLimit: number; proRowLimit: number; agencyRowLimit: number; standardProductCost: number; proProductCost: number; premiumProductCost: number; metadataCost: number; categoryCost: number; previewCost: number; extraPackMaxProducts: number; reserveCredits: boolean; autoRefundErrors: boolean; economyModel: string; standardModel: string; premiumModel: string; localModel: string; timeout: number; retries: number; maxRowsPerBatch: number; validateJson: boolean; fallbackMode: boolean; concurrency: number; jobsPerMinute: number; agencyPriority: boolean; queuePaused: boolean; emailCompleted: boolean; emailFailed: boolean; emailLowCredits: boolean; weeklySummary: boolean; rlsMock: boolean; signedUrls: boolean; downloadExpiryHours: number; auditLogs: boolean;
};
export type AdminState = { users: AdminUser[]; jobs: AdminJob[]; downloads: AdminDownload[]; wallets: CreditWallet[]; transactions: CreditTransaction[]; templates: AdminTemplate[]; logs: AdminLog[]; incidents: Incident[]; settings: InternalSettings; billingEvents: string[]; modelUsage: Array<{ model: AiModel; calls: number; cost: number; avgScore: number }>; qualityMetrics: Array<{ day: string; cost: number; credits: number }> };

export function formatNumber(value: number) { return new Intl.NumberFormat("es-ES").format(value); }
export function formatCurrency(value: number) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value); }
export function formatDate(date = new Date()) { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date); }

export function calculateAICost(job: Pick<AdminJob, "rows" | "model">) {
  const tokens = job.rows * (900 + 1200);
  const rate = job.model === "economy" ? 0.5 : job.model === "standard" ? 3 : 12;
  return Number(((tokens / 1_000_000) * rate).toFixed(2));
}
export function estimateCreditRevenue(credits: number) {
  if (credits >= 1_000_000) return (credits / 1_000_000) * 299;
  if (credits >= 250_000) return (credits / 250_000) * 99;
  return (credits / 100_000) * 49;
}
export function calculateMargin(job: AdminJob) { return Number((estimateCreditRevenue(job.credits) - calculateAICost(job)).toFixed(2)); }
export function calculateGlobalMargin(state: AdminState) { return Number((state.transactions.filter(t=>t.amount>0).reduce((s,t)=>s+estimateCreditRevenue(t.amount),0) - state.jobs.reduce((s,j)=>s+calculateAICost(j),0)).toFixed(2)); }
export function getSystemHealth() { return [{ name: "API IA", status: "Online" }, { name: "Worker", status: "Online" }, { name: "Storage", status: "OK" }, { name: "Stripe", status: "Test mode" }, { name: "Supabase", status: "Mock" }, { name: "Email", status: "Mock pending" }]; }
export function getAdminStats(state: AdminState) {
  const completed = state.jobs.filter(j => j.status === "completed");
  const failed = state.jobs.filter(j => j.status === "failed").length;
  const aiCost = state.jobs.reduce((sum, job) => sum + calculateAICost(job), 0);
  const revenue = state.transactions.filter(t => t.amount > 0).reduce((s,t)=>s+estimateCreditRevenue(t.amount),0);
  return { totalUsers: state.users.length, activeUsers: state.users.filter(u => u.status === "active" || u.status === "internal").length, jobsToday: state.jobs.length, processingJobs: state.jobs.filter(j=>j.status === "processing").length, failedJobs: failed, consumedCredits: Math.abs(state.transactions.filter(t=>t.type === "usage").reduce((s,t)=>s+t.amount,0)), revenue, aiCost, margin: revenue - aiCost, globalScore: Math.round(completed.reduce((s,j)=>s+j.score,0) / Math.max(completed.length,1)), avgJobTime: "18 min", criticalErrors: state.logs.filter(l=>l.level === "critical" && l.status !== "resuelto").length, errorRate: Number(((failed / Math.max(state.jobs.length,1)) * 100).toFixed(1)) };
}

export function createInitialAdminState(): AdminState {
  const users: AdminUser[] = [
    { id: "USR-001", name: "Laura Martínez", email: "laura@agenciaseo.com", plan: "Agency", credits: 820000, jobs: 18, status: "active", lastJob: "productos-prestashop.csv", estimatedSpend: 949, joinedAt: "12 may", lastSeen: "Hoy 09:40", avgScore: 88, churnRisk: "low", ltv: 1840, aiCost: 42.2, margin: 91, notes: ["Cuenta agencia prioritaria", "Interesada en multi-proyecto"] },
    { id: "USR-002", name: "Daniel Roca", email: "daniel@tiendashopify.com", plan: "Pro", credits: 120000, jobs: 7, status: "active", lastJob: "shopify-catalog.csv", estimatedSpend: 198, joinedAt: "28 may", lastSeen: "Hoy 08:18", avgScore: 84, churnRisk: "low", ltv: 420, aiCost: 11.8, margin: 86, notes: ["Shopify DTC", "Pide alt text masivo"] },
    { id: "USR-003", name: "Marta Gómez", email: "marta@prestashopseo.com", plan: "Starter", credits: 28000, jobs: 3, status: "warning", lastJob: "proveedor-industrial.csv", estimatedSpend: 39, joinedAt: "02 jun", lastSeen: "Ayer 17:04", avgScore: 71, churnRisk: "medium", ltv: 89, aiCost: 8.1, margin: 62, notes: ["Productos restantes bajos", "Job fallido pendiente soporte"] },
    { id: "USR-004", name: "Roger demo", email: "roger@rankelia.ai", plan: "Pro beta", credits: 250000, jobs: 5, status: "internal", lastJob: "categorias-woocommerce.csv", estimatedSpend: 0, joinedAt: "01 jun", lastSeen: "Ahora", avgScore: 86, churnRisk: "low", ltv: 0, aiCost: 2.4, margin: 100, notes: ["Usuario interno demo"] },
  ];
  const jobs: AdminJob[] = [
    { id: "JOB-001", file: "productos-prestashop.csv", userId: "USR-001", userName: "Laura Martínez", platform: "Prestashop", type: "Producto completo", rows: 500, processed: 500, failedRows: 0, status: "completed", progress: 100, score: 86, credits: 125000, model: "standard", duration: "16 min", date: "Hoy 09:12", template: "Prestashop técnico v3", logs: ["Archivo recibido", "Columnas detectadas", "Créditos reservados", "IA iniciada", "Fila 1/500", "CSV generado", "Descargas creadas"] },
    { id: "JOB-002", file: "shopify-catalog.csv", userId: "USR-002", userName: "Daniel Roca", platform: "Shopify", type: "Productos + categorías", rows: 1200, processed: 640, failedRows: 0, status: "processing", progress: 53, score: 0, credits: 300000, model: "premium", duration: "running", date: "Hoy 10:04", template: "Shopify comercial v2", logs: ["Archivo recibido", "Worker asignado", "Generando fila 640/1200"] },
    { id: "JOB-003", file: "categorias-woocommerce.csv", userId: "USR-004", userName: "Roger demo", platform: "WooCommerce", type: "Categorías SEO", rows: 42, processed: 0, failedRows: 0, status: "queued", progress: 8, score: 0, credits: 105000, model: "standard", duration: "queued", date: "Hoy 10:25", template: "Categoría SEO v4", logs: ["Trabajo creado", "Esperando cola worker"] },
    { id: "JOB-004", file: "proveedor-industrial.csv", userId: "USR-003", userName: "Marta Gómez", platform: "CSV genérico", type: "Producto completo", rows: 800, processed: 783, failedRows: 17, status: "failed", progress: 78, score: 64, credits: 200000, model: "economy", duration: "22 min", date: "Ayer 18:02", template: "B2B industrial v1", error: "JSON inválido en 17 filas", logs: ["Archivo recibido", "IA iniciada", "JSON inválido fila 118", "Job marcado failed"] },
  ];
  const downloads: AdminDownload[] = jobs.filter(j=>j.status === "completed").flatMap(j => [
    { id: `DL-${j.id}-CSV`, jobId: j.id, file: j.file.replace(".csv", "-optimizado.csv"), format: "CSV", rows: j.rows, size: "4.2 MB", createdAt: "Hoy 09:30" },
    { id: `DL-${j.id}-HTML`, jobId: j.id, file: j.file.replace(".csv", ".html"), format: "HTML", rows: j.rows, size: "2.8 MB", createdAt: "Hoy 09:30" },
    { id: `DL-${j.id}-TXT`, jobId: j.id, file: `informe-${j.file}.txt`, format: "TXT", rows: j.rows, size: "28 KB", createdAt: "Hoy 09:30" },
  ]);
  const wallets: CreditWallet[] = users.map(u => ({ userId: u.id, user: u.name, plan: u.plan, balance: u.credits, lifetimeUsed: u.jobs * 68500, lastPurchase: u.id === "USR-003" ? "Nunca" : "03 jun", lastUsage: u.lastJob, status: u.credits < 50000 ? "low" : "ok" }));
  const transactions: CreditTransaction[] = [
    { id: "TX-001", date: "Hoy 09:12", userId: "USR-001", user: "Laura Martínez", type: "usage", amount: -125000, description: "Consumo productos-prestashop.csv", jobId: "JOB-001", status: "completed", origin: "worker" },
    { id: "TX-002", date: "Ayer 12:21", userId: "USR-001", user: "Laura Martínez", type: "purchase", amount: 1000000, description: "Compra pack Agency", status: "paid", origin: "stripe_test" },
    { id: "TX-003", date: "Hoy 10:04", userId: "USR-002", user: "Daniel Roca", type: "usage", amount: -300000, description: "Reserva shopify-catalog.csv", jobId: "JOB-002", status: "reserved", origin: "worker" },
    { id: "TX-004", date: "02 jun", userId: "USR-004", user: "Roger demo", type: "subscription_grant", amount: 250000, description: "Pro beta grant", status: "applied", origin: "admin" },
  ];
  const templates: AdminTemplate[] = ["Producto ecommerce", "Prestashop técnico", "Shopify comercial", "Categoría SEO", "B2B industrial", "WooCommerce natural"].map((name, i) => ({ id: `TPL-${i+1}`, name, type: i===3?"Categoría":"Producto", platform: i===2?"Shopify":i===3?"WooCommerce":i===1?"Prestashop":"CSV genérico", sector: i===4?"Industrial":"General", language: "Español", version: `v${i+1}.0`, active: i<4, usage: 1200 - i*130, score: 88 - i*4, avgCost: Number((0.008 + i*0.002).toFixed(3)), errorRate: Number((1.2 + i*0.9).toFixed(1)), updatedAt: `${i+1} jun`, systemPrompt: "Eres un especialista SEO ecommerce. No inventes características y devuelve JSON válido.", userPrompt: "Genera contenido para {{nombre_producto}} usando {{caracteristicas}} y {{keyword_principal}}.", variables: ["{{nombre_producto}}", "{{marca}}", "{{categoria}}", "{{caracteristicas}}", "{{descripcion_actual}}", "{{keyword_principal}}", "{{keywords_secundarias}}", "{{plataforma}}", "{{tono}}", "{{pais}}", "{{idioma}}"], versions: [`v${i}.0`, `v${i+1}.0`] }));
  const logs: AdminLog[] = [
    { id: "LOG-001", date: "Hoy 10:31", level: "critical", source: "ai_provider", message: "JSON inválido recibido de IA", userId: "USR-003", user: "Marta Gómez", jobId: "JOB-004", code: "AI_JSON_INVALID", status: "abierto", stack: "SyntaxError: Unexpected token at row 118", context: "promptVersion=B2B industrial v1; model=economy", recommendation: "Reprocesar fallidos con modelo standard y validar JSON estricto." },
    { id: "LOG-002", date: "Hoy 10:20", level: "warning", source: "csv_parser", message: "CSV con columnas faltantes", userId: "USR-002", user: "Daniel Roca", jobId: "JOB-002", code: "CSV_MISSING_COLUMNS", status: "investigando", stack: "missing: keyword_principal", context: "shopify-catalog.csv", recommendation: "Mostrar mapeo de columnas antes de procesar." },
    { id: "LOG-003", date: "Hoy 09:55", level: "info", source: "credits", message: "Créditos insuficientes", userId: "USR-003", user: "Marta Gómez", code: "LOW_CREDITS", status: "resuelto", stack: "No stack", context: "saldo=28000", recommendation: "Sugerir pack 100.000 créditos." },
    { id: "LOG-004", date: "Ayer 18:40", level: "error", source: "storage", message: "Storage upload failed", user: "Sistema", jobId: "JOB-004", code: "STORAGE_UPLOAD_FAILED", status: "abierto", stack: "MockStorageError: timeout", context: "region=eu-west", recommendation: "Reintentar subida de outputs." },
  ];
  return {
    users, jobs, downloads, wallets, transactions, templates, logs,
    incidents: [{ id: "INC-001", title: "JSON inválido recurrente en B2B industrial", severity: "critical", source: "ai_provider", description: "17 filas fallidas con salida no parseable", owner: "Ops", status: "abierta", createdAt: "Hoy 10:35" }],
    settings: { productName: "Rankelia.ai", betaMode: true, freeRowLimit: 3, starterRowLimit: 50, proRowLimit: 150, agencyRowLimit: 1000, standardProductCost: 500, proProductCost: 1000, premiumProductCost: 2000, metadataCost: 50, categoryCost: 5000, previewCost: 0, extraPackMaxProducts: 10000, reserveCredits: true, autoRefundErrors: true, economyModel: "gpt-economy-mock", standardModel: "gpt-standard-mock", premiumModel: "gpt-premium-mock", localModel: "local-rules", timeout: 90, retries: 2, maxRowsPerBatch: 2500, validateJson: true, fallbackMode: true, concurrency: 4, jobsPerMinute: 12, agencyPriority: true, queuePaused: false, emailCompleted: true, emailFailed: true, emailLowCredits: true, weeklySummary: false, rlsMock: false, signedUrls: true, downloadExpiryHours: 168, auditLogs: true },
    billingEvents: ["stripe.checkout.completed mock", "invoice.paid mock", "credits.granted mock"],
    modelUsage: [{ model: "economy", calls: 8200, cost: 18.4, avgScore: 75 }, { model: "standard", calls: 5100, cost: 44.1, avgScore: 86 }, { model: "premium", calls: 1600, cost: 58.8, avgScore: 91 }],
    qualityMetrics: ["L", "M", "X", "J", "V", "S", "D"].map((day, i) => ({ day, cost: [8,12,9,16,22,11,14][i], credits: [120,180,160,240,310,140,190][i] * 1000 })),
  };
}
