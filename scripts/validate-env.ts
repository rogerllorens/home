type EnvGroup = { name: string; required: string[]; recommended?: string[] };

const mode = process.env.VALIDATE_ENV_MODE ?? process.env.NODE_ENV ?? "development";
const strict = ["production", "worker", "stripe", "supabase", "ai"].includes(mode);

const groups: EnvGroup[] = [
  { name: "app", required: ["APP_URL", "NEXT_PUBLIC_APP_URL"], recommended: ["NEXT_PUBLIC_ENABLE_DEMO"] },
  { name: "supabase", required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], recommended: ["SUPABASE_SERVICE_ROLE_KEY"] },
  { name: "stripe", required: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], recommended: ["STRIPE_PRICE_STARTER_MONTHLY", "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_GROWTH_MONTHLY", "STRIPE_PRICE_AGENCY_MONTHLY", "STRIPE_PRICE_PRODUCTS_25", "STRIPE_PRICE_PRODUCTS_100", "STRIPE_PRICE_PRODUCTS_1000"] },
  { name: "worker", required: ["SUPABASE_SERVICE_ROLE_KEY"], recommended: ["WORKER_MAX_JOBS_PER_RUN", "WORKER_MAX_ROWS_PER_JOB"] },
  { name: "ai", required: [], recommended: ["AI_PROVIDER", "OPENAI_API_KEY", "AI_USE_FALLBACK", "AI_ROW_TIMEOUT_MS"] },
  { name: "email", required: [], recommended: ["RESEND_API_KEY", "EMAIL_FROM", "SUPPORT_EMAIL"] },
  { name: "observability", required: [], recommended: ["SENTRY_DSN", "SENTRY_ENVIRONMENT", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] },
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

if (!process.env.RESEND_API_KEY) console.log("[INFO] email: Resend is noop until RESEND_API_KEY and EMAIL_FROM are configured.");
if (!process.env.UPSTASH_REDIS_REST_URL) console.log("[INFO] rate-limit: using in-memory fallback; configure Upstash for multi-instance production.");
if (failures) process.exit(1);
