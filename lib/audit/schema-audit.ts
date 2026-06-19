import type { SchemaAudit } from "./types";

function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : value ? [value] : []; }
function typeNames(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const raw = (value as { [key: string]: unknown })["@type"];
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
}
function walk(value: unknown, out: unknown[]) {
  if (!value || typeof value !== "object") return;
  out.push(value);
  const record = value as { [key: string]: unknown };
  for (const item of asArray(record["@graph"])) walk(item, out);
  for (const key of ["itemListElement", "mainEntity", "hasPart"]) for (const item of asArray(record[key])) walk(item, out);
}

export function auditSchema(jsonLdBlocks: string[]): SchemaAudit {
  const nodes: unknown[] = [];
  let invalidJsonLdCount = 0;
  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      for (const item of asArray(parsed)) walk(item, nodes);
    } catch { invalidJsonLdCount += 1; }
  }
  const types = [...new Set(nodes.flatMap(typeNames))];
  const has = (name: string) => types.some((type) => type.toLowerCase() === name.toLowerCase());
  const warnings: string[] = [];
  if (invalidJsonLdCount) warnings.push(`${invalidJsonLdCount} bloque(s) JSON-LD no se pudieron parsear.`);
  if (!has("Organization") && !has("WebSite")) warnings.push("No se detectó schema Organization/WebSite básico.");
  return { schemaTypes: types, productSchemaFound: has("Product"), organizationSchemaFound: has("Organization") || has("WebSite"), breadcrumbSchemaFound: has("BreadcrumbList"), faqSchemaFound: has("FAQPage"), invalidJsonLdCount, warnings };
}
