import type { AuditFinding, ParsedHtmlSummary, SchemaAudit } from "./types";

export function auditGeoAeo(parsed: ParsedHtmlSummary, schema: SchemaAudit): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (parsed.h2Texts.length < 2) findings.push({ severity: "opportunity", category: "geo_aeo", title: "Estructura H2 limitada", description: "La página tiene pocos encabezados descriptivos para resumir el contenido.", recommendation: "Añade secciones claras de categorías, beneficios y preguntas frecuentes.", impact: "medium", effort: "medium", cta_type: "upload_catalog" });
  if (!schema.faqSchemaFound && !/\?/.test(parsed.bodyTextPreview)) findings.push({ severity: "opportunity", category: "geo_aeo", title: "FAQs no detectadas", description: "No se detectan señales claras de preguntas frecuentes visibles o schema FAQ.", recommendation: "Incluye FAQs reales sobre productos, envíos, garantías y categorías cuando aplique.", impact: "medium", effort: "medium" });
  if (parsed.wordCount < 250) findings.push({ severity: "warning", category: "geo_aeo", title: "Contenido textual escaso", description: "La home ofrece poco texto estático para que buscadores y sistemas IA entiendan la tienda.", recommendation: "Añade contenido útil, descriptivo y verificable, sin keyword stuffing.", impact: "medium", effort: "medium" });
  return findings;
}
