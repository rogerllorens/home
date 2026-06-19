import type { AuditFinding } from "../types";
import type { AdvancedSchemaAudit } from "./types";
export function schemaRecommendations(audit: Pick<AdvancedSchemaAudit, "detected">): AuditFinding[] {
  const recs: AuditFinding[] = [];
  if (!audit.detected.Organization?.found && !audit.detected.WebSite?.found) recs.push({ severity: "opportunity", category: "schema", title: "Añadir Organization/WebSite", description: "La home debería ayudar a identificar marca, URL y buscador interno si existe.", recommendation: "Añade Organization/WebSite con datos reales de marca; no inventes sameAs/contactPoint.", impact: "medium", effort: "medium" });
  if (!audit.detected.BreadcrumbList?.found) recs.push({ severity: "opportunity", category: "schema", title: "BreadcrumbList no detectado", description: "Los breadcrumbs ayudan a entender jerarquía de categorías/productos.", recommendation: "Añade BreadcrumbList en categorías y productos si el breadcrumb es visible.", impact: "medium", effort: "medium" });
  if (!audit.detected.FAQPage?.found) recs.push({ severity: "opportunity", category: "schema", title: "FAQPage no detectado", description: "No se detecta FAQ schema.", recommendation: "Usa FAQPage solo si las preguntas y respuestas son visibles en la página.", impact: "low", effort: "low" });
  return recs;
}
