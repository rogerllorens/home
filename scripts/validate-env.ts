type EnvGroup = { name: string; required: string[]; recommended?: string[] };

const mode = process.env.VALIDATE_ENV_MODE ?? process.env.NODE_ENV ?? "development";
const strict = ["production", "worker", "stripe", "supabase", "ai"].includes(mode);
const pagespeedEnabled = process.env.PAGESPEED_ENABLED !== "false";
const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
const emailEnabled = process.env.EMAIL_ENABLED === "true";
const emailReportsEnabled = process.env.EMAIL_REPORTS_ENABLED === "true";
const fallbackOnly = process.env.AI_USE_FALLBACK === "template-only" || process.env.AI_PROVIDER === "template";
const gscEnabled = process.env.GSC_ENABLED === "true";
const aiTemplateStudioEnabled = process.env.AI_TEMPLATE_STUDIO_ENABLED === "true";

const groups: EnvGroup[] = [
  { name: "app", required: ["APP_URL", "NEXT_PUBLIC_APP_URL"], recommended: ["NEXT_PUBLIC_ENABLE_DEMO"] },
  { name: "supabase", required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", ...(strict ? ["SUPABASE_SERVICE_ROLE_KEY"] : [])], recommended: strict ? [] : ["SUPABASE_SERVICE_ROLE_KEY"] },
  { name: "stripe", required: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", ...(strict ? ["STRIPE_PRICE_STARTER_MONTHLY", "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_PRODUCTS_25", "STRIPE_PRICE_PRODUCTS_100", "STRIPE_PRICE_PRODUCTS_1000"] : [])], recommended: ["STRIPE_PRICE_GROWTH_MONTHLY", "STRIPE_PRICE_AGENCY_MONTHLY"] },
  { name: "worker", required: strict ? ["WORKER_MAX_JOBS_PER_RUN", "WORKER_MAX_ROWS_PER_JOB", "WORKER_STALE_JOB_MINUTES", "WORKER_MAX_ATTEMPTS"] : [], recommended: ["WORKER_MAX_JOBS_PER_RUN", "WORKER_MAX_ROWS_PER_JOB", "WORKER_STALE_JOB_MINUTES", "WORKER_MAX_ATTEMPTS"] },
  { name: "rate-limit", required: strict ? ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] : [], recommended: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] },
  { name: "ai", required: strict && !fallbackOnly ? ["AI_PROVIDER"] : [], recommended: ["OPENAI_API_KEY", "QWEN_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "AI_USE_FALLBACK", "AI_ROW_TIMEOUT_MS", "AI_TEMPLATE_STUDIO_ENABLED", "AI_DEFAULT_PROVIDER", "AI_DEFAULT_MODEL", "AI_MAX_COST_PER_JOB", "AI_MAX_COST_PER_ROW", "AI_ENABLE_EXPERIMENTS"] },
  { name: "email", required: strict && (emailEnabled || emailReportsEnabled) ? ["RESEND_API_KEY", "EMAIL_FROM"] : [], recommended: ["EMAIL_REPORTS_ENABLED", "RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO", "SUPPORT_EMAIL"] },
  { name: "observability", required: [], recommended: ["SENTRY_DSN", "SENTRY_ENVIRONMENT"] },
  { name: "pagespeed", required: strict && pagespeedEnabled ? ["PAGESPEED_API_KEY"] : [], recommended: ["PAGESPEED_API_KEY", "PAGESPEED_ENABLED", "PAGESPEED_TIMEOUT_MS", "PAGESPEED_CACHE_TTL_HOURS", "PAGESPEED_MAX_URLS_PER_DAY"] },
  { name: "gsc", required: strict && gscEnabled ? ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY", "GOOGLE_GSC_SCOPES"] : [], recommended: ["GSC_ENABLED", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY", "GOOGLE_GSC_SCOPES", "GSC_SYNC_ROW_LIMIT", "GSC_SYNC_MAX_ROWS_PER_DIMENSION"] },
];

let failures = 0;
for (const group of groups) {
  const requiredMissing = group.required.filter((key) => !process.env[key]);
  const recommendedMissing = (group.recommended ?? []).filter((key) => !process.env[key]);
  if (requiredMissing.length) {
    const level = strict ? "ERROR" : "WARN";
    console.log(`[${level}] ${group.name}: missing ${requiredMissing.join(", ")}`);
    if (strict) failures += requiredMissing.length;
  } else {
    console.log(`[OK] ${group.name}: required variables present for ${mode}`);
  }
  if (recommendedMissing.length) console.log(`[INFO] ${group.name}: recommended/manual setup pending ${recommendedMissing.join(", ")}`);
}

if (strict && demoEnabled) { console.log("[ERROR] app: NEXT_PUBLIC_ENABLE_DEMO must be false in production."); failures += 1; }
if (strict && !process.env.UPSTASH_REDIS_REST_URL) console.log("[ERROR] rate-limit: UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN son obligatorios en producción: el rate limiting en memoria no protege entornos serverless multi-instancia.");
if (!process.env.RESEND_API_KEY) console.log("[INFO] email: Resend is noop until RESEND_API_KEY and EMAIL_FROM are configured.");
if (strict && emailReportsEnabled && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) { console.log("[ERROR] email: EMAIL_REPORTS_ENABLED=true requires RESEND_API_KEY and EMAIL_FROM in production."); failures += 1; }
if (!process.env.UPSTASH_REDIS_REST_URL) console.log(strict ? "[ERROR] rate-limit: memory fallback is forbidden in production." : "[INFO] rate-limit: using in-memory fallback only for development/test; configure Upstash for production.");
if (fallbackOnly) console.log("[WARN] ai: template-only/fallback mode limits production quality; configure a real provider before public launch.");
if (strict && aiTemplateStudioEnabled && !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.log("[ERROR] ai: AI_TEMPLATE_STUDIO_ENABLED=true requires server-side Supabase service role for repository writes."); failures += 1; }
if (gscEnabled) {
  const gscMissing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY", "GOOGLE_GSC_SCOPES"].filter((key) => !process.env[key]);
  if (gscMissing.length) console.log(strict ? `[ERROR] gsc: GSC_ENABLED=true but missing ${gscMissing.join(", ")}` : `[WARN] gsc: GSC_ENABLED=true but missing ${gscMissing.join(", ")}`);
  if (strict) failures += gscMissing.length;
  const scopes = (process.env.GOOGLE_GSC_SCOPES ?? "").split(/\s+/).filter(Boolean);
  if (!scopes.length || scopes.some((scope) => scope !== "https://www.googleapis.com/auth/webmasters.readonly")) { console.log("[ERROR] gsc: GOOGLE_GSC_SCOPES must be readonly only (https://www.googleapis.com/auth/webmasters.readonly)."); if (strict) failures += 1; }
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  const keyBytes = key ? Buffer.from(key, "base64").length === 32 ? 32 : Buffer.from(key, "utf8").length : 0;
  if (strict && keyBytes < 32) { console.log("[ERROR] gsc: GOOGLE_TOKEN_ENCRYPTION_KEY must be base64 32 bytes or at least 32 UTF-8 bytes."); failures += 1; }
}
if (pagespeedEnabled && !process.env.PAGESPEED_API_KEY) {
  const level = strict ? "ERROR" : "WARN";
  console.log(`[${level}] pagespeed: PAGESPEED_ENABLED is not false but PAGESPEED_API_KEY is missing; PageSpeed enrichment will be skipped.`);
  if (strict) failures += 1;
}
if (failures) process.exit(1);
