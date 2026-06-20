import assert from "node:assert/strict";
import test from "node:test";
import { autoMapColumnsWithConfidence } from "../lib/import/mapping-confidence";
import { detectPlatformFromHeaders } from "../lib/import/platform-detection";

test("detecta Shopify y mapea columnas clave", () => {
  const headers = ["Handle", "Title", "Body (HTML)", "Variant SKU", "Image Src", "Image Alt Text", "SEO Title", "SEO Description"];
  assert.equal(detectPlatformFromHeaders(headers).platform, "shopify");
  const mapped = autoMapColumnsWithConfidence(headers);
  assert.equal(mapped.mapping.product_name, "Title");
  assert.equal(mapped.mapping.image_url, "Image Src");
  assert.ok(mapped.overallConfidence > 0.6);
});

test("detecta WooCommerce y PrestaShop", () => {
  assert.equal(detectPlatformFromHeaders(["SKU", "Name", "Short description", "Images", "Meta: _yoast_wpseo_title"]).platform, "woocommerce");
  assert.equal(detectPlatformFromHeaders(["Reference", "Name", "URL rewritten", "Image URLs", "Meta description"]).platform, "prestashop");
});

test("mapea cabeceras españolas y typo frecuente", () => {
  const mapped = autoMapColumnsWithConfidence(["nombre", "descripccion", "categoría", "referencia", "imagen"]);
  assert.equal(mapped.mapping.product_name, "nombre");
  assert.equal(mapped.mapping.category, "categoría");
  assert.equal(mapped.mapping.sku, "referencia");
  assert.equal(mapped.mapping.description, "descripccion");
});
