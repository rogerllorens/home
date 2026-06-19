import type { AuditFinding, ParsedHtmlSummary, RobotsSitemapAudit, SafeFetchResult } from "./types";

export function evaluateIndexability(fetchResult: SafeFetchResult, parsed: ParsedHtmlSummary, robots: RobotsSitemapAudit) {
  const issues: AuditFinding[] = [];
  const robotsMeta = (parsed.robotsMeta ?? "").toLowerCase();
  if (fetchResult.httpStatus !== 200) issues.push({ severity: "critical", category: "indexability", title: `HTTP ${fetchResult.httpStatus ?? "desconocido"}`, description: "La home auditada no devuelve un 200 OK claro.", recommendation: "Revisa redirects, bloqueos o errores del servidor antes de optimizar contenido.", impact: "high", effort: "high" });
  if (robotsMeta.includes("noindex")) issues.push({ severity: "critical", category: "indexability", title: "Meta robots noindex detectado", description: "La página indica a buscadores que no debe indexarse.", recommendation: "Retira noindex si esta home debe aparecer en buscadores.", impact: "high", effort: "low" });
  if (robots.robotsDisallowAll) issues.push({ severity: "warning", category: "indexability", title: "robots.txt parece bloquear todo", description: "Se detectó una regla Disallow: / para User-agent: *.", recommendation: "Revisa robots.txt para confirmar que no bloquea páginas importantes.", impact: "high", effort: "medium" });
  if (!parsed.canonicalUrl) issues.push({ severity: "warning", category: "indexability", title: "Canonical no detectado", description: "No se encontró link rel=canonical en la home.", recommendation: "Añade canonical para consolidar señales de URL.", impact: "medium", effort: "low" });
  return { isIndexable: fetchResult.httpStatus === 200 && !robotsMeta.includes("noindex") && !robots.robotsDisallowAll, issues };
}
