import assert from "node:assert/strict";
import test from "node:test";
import { validateAuditUrl } from "../lib/audit/url-validation";
import { parseHtmlSummary } from "../lib/audit/html-parser";
import { detectPlatform } from "../lib/audit/platform-detector";
import { auditSchema } from "../lib/audit/schema-audit";
import { calculateFreeAuditScores } from "../lib/audit/scoring";

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tienda de botas de seguridad industrial online</title><meta name="description" content="Compra botas de seguridad para industria con fichas claras, categorías y envío revisable para profesionales."><link rel="canonical" href="https://example.com/"><meta property="og:title" content="Tienda"><meta property="og:description" content="Desc"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"ACME"},{"@type":"Product","name":"Bota","offers":{"price":"19.99"}}]}</script></head><body><h1>Botas de seguridad</h1><h2>Ventajas principales</h2><h2>Preguntas frecuentes</h2><p>Comprar producto tienda categoría marca envío material protección.</p><a href="/producto">Interno</a><a href="https://other.test">Externo</a><img src="/hero.webp" alt="Bota de seguridad" width="800" height="600"><img src="/large-banner.jpg"></body></html>`;

test("validateAuditUrl normalizes public domains and rejects unsafe targets", async () => {
  const valid = await validateAuditUrl("example.com/tienda#frag", { resolveDns: false });
  assert.equal(valid.normalizedUrl, "https://example.com/tienda");
  await assert.rejects(() => validateAuditUrl("http://localhost", { resolveDns: false }));
  await assert.rejects(() => validateAuditUrl("http://127.0.0.1", { resolveDns: false }));
  await assert.rejects(() => validateAuditUrl("http://192.168.1.1", { resolveDns: false }));
  await assert.rejects(() => validateAuditUrl("file:///etc/passwd", { resolveDns: false }));
  await assert.rejects(() => validateAuditUrl("ftp://example.com", { resolveDns: false }));
});

test("parseHtmlSummary extracts SEO, links, images and JSON-LD blocks without raw HTML", () => {
  const parsed = parseHtmlSummary(html, "https://example.com/");
  assert.equal(parsed.title, "Tienda de botas de seguridad industrial online");
  assert.equal(parsed.h1Texts[0], "Botas de seguridad");
  assert.equal(parsed.internalLinksCount, 1);
  assert.equal(parsed.externalLinksCount, 1);
  assert.equal(parsed.imageCount, 2);
  assert.equal(parsed.imagesWithoutAlt, 1);
  assert.equal(parsed.jsonLdBlocks.length, 1);
});

test("detectPlatform identifies common ecommerce platforms conservatively", () => {
  assert.equal(detectPlatform("<script src='https://cdn.shopify.com/theme.js'></script>").platform, "Shopify");
  assert.equal(detectPlatform("<link href='/wp-content/plugins/woocommerce/style.css'>").platform, "WooCommerce / WordPress");
  assert.equal(detectPlatform("<meta name='generator' content='PrestaShop'><script src='/modules/foo.js'></script>").platform, "PrestaShop");
  assert.equal(detectPlatform("<html><body>custom</body></html>").platform, "Desconocida");
});

test("schema audit and scoring reward complete pages and penalize missing basics", () => {
  const parsed = parseHtmlSummary(html, "https://example.com/");
  const schema = auditSchema(parsed.jsonLdBlocks);
  const robots = { robotsTxtFound: true, robotsTxtUrl: "https://example.com/robots.txt", robotsDisallowAll: false, sitemapFound: true, sitemapUrl: "https://example.com/sitemap.xml", sitemapDeclaredInRobots: true, sitemapUrlCountEstimate: 10, sitemapContainsProducts: true, sitemapContainsCategories: true, warnings: [] };
  const scores = calculateFreeAuditScores({ ok: true, httpStatus: 200, finalUrl: "https://example.com/", redirectCount: 0, fetchTimeMs: 10, html, htmlSizeBytes: html.length, headers: {} }, parsed, robots, schema);
  assert.ok(scores.overall > 70);
  const poor = parseHtmlSummary("<html><body><img src='x.jpg'></body></html>", "https://example.com/");
  const poorScores = calculateFreeAuditScores({ ok: true, httpStatus: 200, finalUrl: "https://example.com/", redirectCount: 0, fetchTimeMs: 10, html: "", htmlSizeBytes: 30, headers: {} }, poor, { ...robots, robotsTxtFound: false, sitemapFound: false }, auditSchema([]));
  assert.ok(poorScores.overall < scores.overall);
});
