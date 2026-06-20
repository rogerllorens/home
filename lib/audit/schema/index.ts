import type { ParsedHtmlSummary } from "../types";
import { parseJsonLdBlocks } from "./jsonld-parser";
import { detectSchemaTypes } from "./schema-detector";
import { auditProductSchema } from "./product-schema-audit";
import { calculateSchemaScore, calculateSchemaStatus } from "./schema-scoring";
import { schemaRecommendations } from "./schema-recommendations";
import type { AdvancedSchemaAudit } from "./types";

function typeOf(item: Record<string, unknown>, type: string) { const raw = item["@type"]; return (Array.isArray(raw) ? raw : [raw]).map(String).some((name) => name.toLowerCase() === type.toLowerCase()); }
export function runAdvancedSchemaAudit(parsed: ParsedHtmlSummary): AdvancedSchemaAudit {
  const parser = parseJsonLdBlocks(parsed.jsonLdBlocks);
  const detected = detectSchemaTypes(parser);
  const products = parser.items.filter((item) => typeOf(item, "Product"));
  const visibleProduct = /product|producto|comprar|precio|sku|marca/i.test(parsed.bodyTextPreview) || parsed.h1Texts.some((h1) => /producto|comprar/i.test(h1));
  const productIssues = auditProductSchema(products, visibleProduct);
  const risky = Boolean(detected.AggregateRating?.found || detected.Review?.found || products.some((product) => product.aggregateRating || product.review));
  const recommendations = schemaRecommendations({ detected });
  const parseIssues = parser.parse_errors.map((error) => ({ severity: "critical" as const, category: "schema", title: "JSON-LD inválido", description: error, recommendation: "Corrige el JSON-LD para que sea parseable y coincida con contenido visible.", impact: "high" as const, effort: "medium" as const }));
  const schema_issues = [...parseIssues, ...Object.values(detected).flatMap((entry) => entry.issues), ...productIssues];
  const schema_score = calculateSchemaScore({ parseable: parser.valid_count > 0, hasOrganizationOrWebsite: Boolean(detected.Organization?.found || detected.WebSite?.found), hasProduct: Boolean(detected.Product?.found), hasBreadcrumb: Boolean(detected.BreadcrumbList?.found), hasFaq: Boolean(detected.FAQPage?.found), hasRisky: risky, issueCount: schema_issues.length });
  return { schema_score, schema_status: calculateSchemaStatus(schema_score, parser.invalid_count > 0 && parser.valid_count === 0, parser.raw_count === 0), schema_strengths: parser.types.map((type) => `${type} detectado`), schema_issues, schema_recommendations: recommendations, schema_safe_suggestions: ["No inventar reviews, ratings, precios ni disponibilidad.", "Usar FAQ schema solo si la FAQ es visible.", "Usar Product schema en fichas reales y ItemList/CollectionPage en listados."], risky_schema_detected: risky, parser, detected };
}
export * from "./types";
