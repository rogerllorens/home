import { getCurrentUserContext } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { runFreeSeoAudit } from "@/lib/audit/audit-engine";
import { validateAuditUrl } from "@/lib/audit/url-validation";
import { markAuditEmailSent, recordAuditReportEvent, saveFreeSeoAudit } from "@/lib/audit/repository";
import { buildAuditConversionSummary } from "@/lib/audit/conversion-summary";
import { createAuditReportToken } from "@/lib/audit/report-token";
import { sendAuditReportEmail } from "@/lib/email/audit-report-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = { url?: string; email?: string; name?: string; company?: string; sendReport?: boolean; consentEmailReport?: boolean; consentMarketing?: boolean; utm?: Record<string, string | null | undefined> };

function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
function rateLimited(retryAfterSeconds: number) { return Response.json({ error: "rate_limited", message: "Demasiadas auditorías. Inténtalo de nuevo más tarde.", retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }); }
function appUrl() { return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""); }

export async function POST(request: Request) {
  let body: Body;
  try { body = await request.json() as Body; } catch { return Response.json({ error: "invalid_json", message: "Body JSON inválido." }, { status: 400 }); }
  const url = body.url?.trim();
  const email = body.email?.trim().toLowerCase() || null;
  const sendReport = Boolean(body.sendReport);
  const consentEmailReport = Boolean(body.consentEmailReport);
  const consentMarketing = Boolean(body.consentMarketing);
  if (!url) return Response.json({ error: "invalid_url", message: "Introduce la URL pública de tu ecommerce." }, { status: 400 });
  if (email && !validEmail(email)) return Response.json({ error: "invalid_email", message: "Email no válido." }, { status: 400 });
  if (sendReport && !email) return Response.json({ error: "email_required", message: "Para enviar el informe necesitamos un email válido." }, { status: 400 });
  if (sendReport && !consentEmailReport) return Response.json({ error: "consent_required", message: "Confirma que quieres recibir este informe por email." }, { status: 400 });

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
    const conversionSummary = buildAuditConversionSummary(result);
    const token = createAuditReportToken();
    const reportUrl = `${appUrl()}/auditoria/${token.rawToken}`;
    const saved = await saveFreeSeoAudit(result, { userId: context.user?.id ?? null, leadEmail: email, leadName: body.name?.slice(0, 120) ?? null, companyName: body.company?.slice(0, 160) ?? null, sourceIp: ip, userAgent: request.headers.get("user-agent"), tokenHash: token.tokenHash, tokenExpiresAt: token.expiresAt, conversionSummary, consentEmailReport, consentMarketing, utm: body.utm, referrer: request.headers.get("referer") }).catch(() => ({ auditId: null }));
    await recordAuditReportEvent(saved.auditId, "audit_created", { domain: result.domain }, context.user?.id ?? null);
    let emailSent = false;
    let emailSkipped = false;
    if (sendReport && email) {
      await recordAuditReportEvent(saved.auditId, "email_requested", {}, context.user?.id ?? null);
      const sent = await sendAuditReportEmail({ to: email, domain: result.domain, score: result.scores.overall, reportUrl, summary: conversionSummary });
      emailSent = sent.sent;
      emailSkipped = Boolean(sent.skipped);
      await recordAuditReportEvent(saved.auditId, sent.sent ? "email_sent" : "email_failed", sent.error ? { error: sent.error } : { skipped: sent.skipped }, context.user?.id ?? null);
      if (sent.sent) await markAuditEmailSent(saved.auditId);
    }
    return Response.json({ ...result, audit_id: saved.auditId ?? undefined, conversion_summary: conversionSummary, public_report_url: reportUrl, emailSent, emailSkipped, next_cta: { label: "Empezar a optimizar mi tienda", href: `/login?mode=register&next=/app/upload&source=audit_report&auditToken=${encodeURIComponent(token.rawToken)}` } });
  } catch {
    return Response.json({ error: "internal_error", message: "No se pudo completar la auditoría. Inténtalo de nuevo en unos minutos." }, { status: 500 });
  }
}
