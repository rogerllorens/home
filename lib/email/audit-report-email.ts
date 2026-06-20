import { sendResendEmail } from "./resend";
import type { AuditConversionSummary } from "@/lib/audit/conversion-summary";

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char); }

export function renderAuditReportEmail(input: { domain: string; score: number; reportUrl: string; summary: AuditConversionSummary }) {
  const domain = escapeHtml(input.domain);
  const reportUrl = escapeHtml(input.reportUrl);
  const issues = input.summary.topIssues.slice(0, 3);
  const opportunities = input.summary.topOpportunities.slice(0, 3);
  const subject = `Tu auditoría SEO de ${input.domain}: ${input.score}/100 y próximas mejoras`;
  const text = [`Tu auditoría SEO de ${input.domain}`, `Score global: ${input.score}/100`, input.summary.executiveSummary.shortDiagnosis, "Principales problemas:", ...issues.map((issue) => `- ${issue.title}: ${issue.recommendation}`), "Principales oportunidades:", ...opportunities.map((item) => `- ${item.title}: ${item.recommendation}`), `Ver informe completo: ${input.reportUrl}`, "Rankelia genera propuestas revisables; no publica cambios automáticamente."].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:680px;margin:0 auto;padding:32px"><div style="background:#fff;border-radius:24px;padding:28px;border:1px solid #e2e8f0"><p style="font-weight:800;color:#2563eb;margin:0 0 8px">Rankelia.ai</p><h1 style="margin:0;font-size:28px">Auditoría SEO de ${domain}</h1><p style="font-size:16px;color:#475569">${escapeHtml(input.summary.executiveSummary.shortDiagnosis)}</p><div style="display:inline-block;background:#0f172a;color:#fff;border-radius:20px;padding:18px 24px;margin:12px 0"><div style="font-size:12px;text-transform:uppercase;color:#cbd5e1">Score global</div><div style="font-size:42px;font-weight:900">${input.score}/100</div></div><h2>Problemas prioritarios</h2><ul>${issues.map((issue) => `<li><strong>${escapeHtml(issue.title)}</strong><br><span style="color:#475569">${escapeHtml(issue.recommendation)}</span></li>`).join("")}</ul><h2>Oportunidades</h2><ul>${opportunities.map((item) => `<li><strong>${escapeHtml(item.title)}</strong><br><span style="color:#475569">${escapeHtml(item.recommendation)}</span></li>`).join("")}</ul><p><a href="${reportUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;border-radius:14px;padding:14px 20px;font-weight:800">Ver informe completo</a></p><p><a href="${reportUrl}#empezar" style="display:inline-block;color:#2563eb;font-weight:800">Empezar a optimizar mi tienda</a></p><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"><p style="font-size:12px;color:#64748b">Te enviamos este email porque solicitaste recibir el informe. Rankelia genera propuestas revisables y no publica cambios automáticamente.</p></div></div></body></html>`;
  return { subject, html, text };
}

export async function sendAuditReportEmail(input: { to: string; domain: string; score: number; reportUrl: string; summary: AuditConversionSummary }) {
  const rendered = renderAuditReportEmail(input);
  return sendResendEmail({ to: input.to, ...rendered });
}
