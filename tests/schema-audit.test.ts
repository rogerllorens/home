import assert from "node:assert/strict";
import test from "node:test";
import { parseHtmlSummary } from "../lib/audit/html-parser";
import { parseJsonLdBlocks } from "../lib/audit/schema/jsonld-parser";
import { runAdvancedSchemaAudit } from "../lib/audit/schema";

test("JSON-LD parser supports multiple scripts, @graph, type arrays and invalid JSON", () => {
  const result = parseJsonLdBlocks([`{"@graph":[{"@type":["Product","Thing"],"name":"Shoe"},{"@type":"Organization","name":"ACME"}]}`, `{bad}`]);
  assert.equal(result.raw_count, 2);
  assert.equal(result.valid_count, 1);
  assert.equal(result.invalid_count, 1);
  assert.ok(result.types.includes("Product"));
  assert.ok(result.types.includes("Organization"));
});

test("advanced schema audit scores complete ecommerce schema and flags risky ratings", () => {
  const html = `<html><head><title>Comprar botas ACME</title><meta name="description" content="Tienda ecommerce de botas"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Bota","image":"/bota.jpg","brand":"ACME","sku":"B1","offers":{"price":"20","priceCurrency":"EUR"},"aggregateRating":{"ratingValue":"5"}}</script></head><body><h1>Comprar botas ACME</h1><p>Producto con precio y marca.</p></body></html>`;
  const audit = runAdvancedSchemaAudit(parseHtmlSummary(html, "https://example.com/"));
  assert.ok(audit.parser.types.includes("Product"));
  assert.equal(audit.risky_schema_detected, true);
  assert.ok(audit.schema_issues.some((issue) => issue.title.includes("Ratings")));
});
