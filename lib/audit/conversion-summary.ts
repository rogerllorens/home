import type { AuditFinding, FreeSeoAuditResult } from "./types";

export type AuditConversionSummary = {
  executiveSummary: { headline: string; shortDiagnosis: string; businessImpact: string; priorityLevel: "critical" | "high" | "medium" | "low" };
  topIssues: Array<AuditFinding & { whyItMatters: string; rankeliaAction: string }>;
  topOpportunities: Array<AuditFinding & { whyItMatters: string; rankeliaAction: string }>;
  recommendedActions: Array<{ title: string; description: string; href: string; cta: string }>;
  rankeliaValueSummary: { estimatedManualWork: string; whatRankeliaCanDo: string[]; bestNextStep: string; ctaLabel: string };
};

function priority(score: number): AuditConversionSummary["executiveSummary"]["priorityLevel"] {
  if (score < 45) return "critical";
  if (score < 65) return "high";
  if (score < 80) return "medium";
  return "low";
}

function enrichFinding(finding: AuditFinding) {
  return {
    ...finding,
    whyItMatters: finding.impact === "high" ? "Puede afectar a indexación, confianza o conversión orgánica." : "Reduce claridad para buscadores y compradores si no se revisa.",
    rankeliaAction: finding.cta_type === "image_alt" ? "Rankelia puede generar ALT text revisable desde tu catálogo." : "Rankelia puede convertir este punto en propuestas revisables antes de exportar."
  };
}

export function buildAuditConversionSummary(result: FreeSeoAuditResult): AuditConversionSummary {
  const score = Number(result.scores.overall ?? 0);
  const level = priority(score);
  const headline = level === "critical" ? "Tu tienda necesita una revisión SEO prioritaria" : level === "high" ? "Hay oportunidades claras para mejorar tu SEO ecommerce" : level === "medium" ? "Tu tienda tiene base SEO, pero puede mejorar" : "Tu tienda parte de una base SEO sólida";
  const topIssues = [...result.critical_issues, ...result.warnings].slice(0, 5).map(enrichFinding);
  const baseOpportunities = result.opportunities.length ? result.opportunities : [{ severity: "opportunity" as const, category: "Catálogo", title: "Importar catálogo para generar propuestas", description: "La auditoría detecta señales del sitio; el siguiente paso es revisar productos y categorías uno a uno.", recommendation: "Sube CSV, Excel, XML básico o pega una tabla para generar propuestas SEO revisables.", impact: "high" as const, effort: "medium" as const, cta_type: "upload_catalog" as const }];
  const topOpportunities = baseOpportunities.slice(0, 5).map(enrichFinding);
  return {
    executiveSummary: {
      headline,
      shortDiagnosis: `Auditamos ${result.domain} y encontramos un score global de ${score}/100. El foco recomendado es revisar metadatos, imágenes, schema, rendimiento y preparación GEO/AEO según las señales disponibles.`,
      businessImpact: "Rankelia no promete rankings ni tráfico; convierte hallazgos técnicos en un flujo operativo: importar catálogo, generar propuestas, revisar antes/después, aprobar y exportar.",
      priorityLevel: level
    },
    topIssues,
    topOpportunities,
    recommendedActions: [
      { title: "Importa tu catálogo", description: "Sube CSV, Excel, XML básico o pega una tabla para analizar productos y categorías.", href: "/app/upload", cta: "Subir catálogo" },
      { title: "Genera propuestas revisables", description: "Rankelia crea versiones antes/después para que tu equipo apruebe cambios antes de exportar.", href: "/app/proposals", cta: "Ver propuestas" },
      { title: "Prioriza con Search Console", description: "Cuando conectes GSC, podrás cruzar demanda real con calidad de catálogo.", href: "/app/search-console", cta: "Conectar GSC" }
    ],
    rankeliaValueSummary: {
      estimatedManualWork: "Puede reducir trabajo manual repetitivo de revisión SEO, manteniendo revisión humana antes de exportar.",
      whatRankeliaCanDo: ["Importar catálogos CSV/Excel/XML", "Generar propuestas SEO por producto", "Mostrar antes/después y scores", "Aprobar versiones", "Exportar CSV para revisión/importación manual", "Cruzar oportunidades con GSC cuando esté conectado"],
      bestNextStep: "Sube tu catálogo para convertir esta auditoría en propuestas producto a producto.",
      ctaLabel: "Empezar a optimizar mi tienda"
    }
  };
}
