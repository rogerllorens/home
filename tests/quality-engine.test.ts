import assert from "node:assert/strict";
import test from "node:test";
import { generateProductTemplateResult, buildOutputCSV } from "../lib/generation/template-generator";
import { evaluateQuality } from "../lib/quality";

test("quality engine preserves source commerce data and exports audit columns", () => {
  const input = { sku: "0007", nombre_producto: "SSD 1TB", marca: "FastDisk", categoria: "Hardware", precio: "89.90", stock: "12", imagen_url: "https://cdn.example/ssd.jpg", url_actual: "https://shop.example/ssd", caracteristicas: "NVMe; PCIe 4.0; 1TB; disipador", descripcion_actual: "SSD NVMe de catálogo con datos verificables para una ficha de ecommerce." };
  const output = generateProductTemplateResult(input, { platform: "Shopify", generation_type: "product_complete", quality_level: "standard" });
  assert.equal(output.price, "89.90");
  assert.equal(output.stock, "12");
  assert.equal(output.image_url, "https://cdn.example/ssd.jpg");
  assert.equal(output.product_url, "https://shop.example/ssd");
  const shopify = buildOutputCSV([output], "Shopify");
  assert.match(shopify, /Variant Price/);
  assert.match(shopify, /89\.90/);
  assert.match(shopify, /Image Src/);
  const generic = buildOutputCSV([output], "rankelia");
  assert.match(generic, /product_url/);
  assert.match(generic, /rankelia_quality_score/);
  assert.match(generic, /human_review_required/);
});

test("quality engine flags unsupported claims and publish readiness", () => {
  const audit = evaluateQuality({ nombre_producto: "Crema facial", categoria: "Cosmética" }, { seo_product_name: "Crema facial", keyword_principal: "crema facial", meta_title: "Mejor crema facial número 1", meta_description: "Crema facial con envío 24h y garantía total para todo tipo de piel.", slug: "Crema Facial", long_description_html: "<p>Producto definitivo dermatológicamente testado.</p>", schema_product_json: "{\"@type\":\"Product\",\"aggregateRating\":{}}" });
  assert.equal(audit.human_review_required, true);
  assert.notEqual(audit.claim_status, "ok");
  assert.match(audit.unsupported_claims_detected, /dermatológicamente|garantía|número 1|envío 24h/);
  assert.equal(audit.ready_to_publish, "not_ready");
});
