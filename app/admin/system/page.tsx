import { Card } from "@/components/ui/Card";
const checks = [
  ["Supabase", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  ["Stripe", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  ["Resend", "RESEND_API_KEY", "EMAIL_FROM"],
  ["GSC", "GSC_CLIENT_ID", "GSC_CLIENT_SECRET", "GSC_TOKEN_ENCRYPTION_KEY"],
  ["Shopify", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET", "SHOPIFY_TOKEN_ENCRYPTION_KEY", "SHOPIFY_WEBHOOK_SECRET"],
  ["Sentry", "SENTRY_DSN"],
  ["PostHog", "NEXT_PUBLIC_POSTHOG_KEY"],
];
export default function AdminSystemPage() {
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Sistema</h1><div className="grid gap-4 md:grid-cols-2">{checks.map(([name, ...envs]) => { const missing = envs.filter((env) => !process.env[env]); return <Card key={name}><h2 className="font-semibold">{name}</h2><p className="mt-2 text-sm text-slate-600">{missing.length ? `No configurado: ${missing.join(", ")}` : "Configurado en entorno servidor."}</p></Card>; })}</div></div>;
}
