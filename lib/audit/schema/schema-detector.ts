import type { AuditFinding } from "../types";
import type { JsonLdParseResult, SchemaTypeAudit } from "./types";

export const CORE_SCHEMA_TYPES = ["Product", "Organization", "WebSite", "BreadcrumbList", "FAQPage", "Article", "BlogPosting", "CollectionPage", "ItemList", "LocalBusiness", "SearchAction", "Offer", "AggregateRating", "Review", "ProductGroup", "OfferCatalog", "AggregateOffer"];

function typesOf(item: Record<string, unknown>) { const raw = item["@type"]; return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : []; }
export function detectSchemaTypes(parser: JsonLdParseResult): Record<string, SchemaTypeAudit> {
  const detected: Record<string, SchemaTypeAudit> = {};
  for (const type of CORE_SCHEMA_TYPES) {
    const matches = parser.items.filter((item) => typesOf(item).some((name) => name.toLowerCase() === type.toLowerCase()));
    const issues: AuditFinding[] = [];
    if (type === "AggregateRating" && matches.length) issues.push({ severity: "warning", category: "schema", title: "AggregateRating detectado", description: "Revisa que las valoraciones existan y sean visibles; no deben inventarse ratings.", recommendation: "Mantén ratings/reviews solo si proceden de reseñas reales visibles.", impact: "high", effort: "medium" });
    detected[type] = { found: matches.length > 0, count: matches.length, evidence: matches.slice(0, 3).map((item) => String(item.name ?? item.url ?? item["@id"] ?? type)), confidence: Math.min(100, matches.length * 35), issues, recommendations: [] };
  }
  return detected;
}
