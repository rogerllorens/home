import { verifyAuditReportToken } from "@/lib/audit/report-token";

export async function getAuditOnboardingContext(rawToken?: string | null) {
  if (!rawToken) return null;
  const audit = await verifyAuditReportToken(rawToken).catch(() => null);
  if (!audit) return null;
  return {
    domain: audit.domain,
    headline: "Tu auditoría ya detectó oportunidades. Sube tu catálogo para convertirlas en propuestas revisables.",
    steps: ["Importa tu catálogo", "Rankelia genera propuestas por producto", "Revisa antes/después", "Aprueba y exporta", "Conecta Search Console para priorizar por demanda real"],
    cta: { label: "Importar catálogo ahora", href: "/app/upload" }
  };
}
