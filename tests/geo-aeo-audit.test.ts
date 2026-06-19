import assert from "node:assert/strict";
import test from "node:test";
import { parseHtmlSummary } from "../lib/audit/html-parser";
import { runAdvancedSchemaAudit } from "../lib/audit/schema";
import { runAdvancedGeoAeoAudit } from "../lib/audit/geo-aeo";

test("structured ecommerce page earns stronger GEO/AEO score than generic page", () => {
  const strong = parseHtmlSummary(`<html lang="es"><head><title>Tienda de botas de seguridad industrial</title><meta name="description" content="Compra botas de seguridad para industria con guía de tallas y FAQs"><script type="application/ld+json">{"@type":"Organization","name":"ACME"}</script></head><body><h1>Tienda de botas</h1><h2>Categorías</h2><h2>Preguntas frecuentes</h2><p>Esta tienda ofrece productos ecommerce, categorías, marcas y preguntas frecuentes para comprar mejor.</p><a href="/c1">c1</a><a href="/c2">c2</a><a href="/faq">faq</a></body></html>`, "https://example.com/");
  const weak = parseHtmlSummary(`<html><body><h1>Bienvenido</h1><p>Hola.</p></body></html>`, "https://example.com/");
  const strongScore = runAdvancedGeoAeoAudit(strong, runAdvancedSchemaAudit(strong)).geo_aeo_score;
  const weakScore = runAdvancedGeoAeoAudit(weak, runAdvancedSchemaAudit(weak)).geo_aeo_score;
  assert.ok(strongScore > weakScore);
});
