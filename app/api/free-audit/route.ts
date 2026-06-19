import { getCurrentUserContext } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { runFreeSeoAudit } from "@/lib/audit/audit-engine";
import { validateAuditUrl } from "@/lib/audit/url-validation";
import { saveFreeSeoAudit } from "@/lib/audit/repository";

export const dynamic = "force-dynamic";

type Body = { url?: string; email?: string };

function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
function rateLimited(retryAfterSeconds: number) { return Response.json({ error: "rate_limited", message: "Demasiadas auditorías. Inténtalo de nuevo más tarde.", retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }); }

export async function POST(request: Request) {
  let body: Body;
  try { body = await request.json() as Body; } catch { return Response.json({ error: "invalid_json", message: "Body JSON inválido." }, { status: 400 }); }
  const url = body.url?.trim();
  const email = body.email?.trim().toLowerCase() || null;
  if (!url) return Response.json({ error: "invalid_url", message: "Introduce la URL pública de tu ecommerce." }, { status: 400 });
  if (email && !validEmail(email)) return Response.json({ error: "invalid_email", message: "Email no válido." }, { status: 400 });

  const ip = getClientIp(request);
  const ipLimit = await rateLimit(`free-audit:ip:${ip}`, 5, 3600);
  if (!ipLimit.allowed) return rateLimited(ipLimit.retryAfterSeconds);

  let validated;
  try { validated = await validateAuditUrl(url); } catch (error) { return Response.json({ error: "blocked_url", message: error instanceof Error ? error.message : "URL bloqueada." }, { status: 400 }); }
  const domainLimit = await rateLimit(`free-audit:domain:${validated.domain}`, 10, 86400);
  if (!domainLimit.allowed) return rateLimited(domainLimit.retryAfterSeconds);
  if (email) {
    const emailLimit = await rateLimit(`free-audit:email:${email}`, 5, 86400);
    if (!emailLimit.allowed) return rateLimited(emailLimit.retryAfterSeconds);
  }
  const context = await getCurrentUserContext();
  if (context.user) {
    const userLimit = await rateLimit(`free-audit:user:${context.user.id}`, 20, 86400);
    if (!userLimit.allowed) return rateLimited(userLimit.retryAfterSeconds);
  }

  try {
    const result = await runFreeSeoAudit(validated.normalizedUrl, { sourceIp: ip });
    const saved = await saveFreeSeoAudit(result, { userId: context.user?.id ?? null, leadEmail: email, sourceIp: ip, userAgent: request.headers.get("user-agent") }).catch(() => ({ auditId: null }));
    return Response.json({ ...result, audit_id: saved.auditId ?? undefined });
  } catch {
    return Response.json({ error: "internal_error", message: "No se pudo completar la auditoría. Inténtalo de nuevo en unos minutos." }, { status: 500 });
  }
}
