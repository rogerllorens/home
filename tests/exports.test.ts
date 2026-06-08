import assert from "node:assert/strict";
import test from "node:test";
import { buildOutputCSV, validatePrestaShopExportRow, validateShopifyExportRow, validateWooCommerceExportRow, type GenerationOutput } from "../lib/generation/template-generator";

const row: GenerationOutput = {
  sku: "SKU-001", nombre_producto: "Bota original", marca: "WorkSafe", categoria: "Calzado", seo_product_name: "Bota seguridad S3 WorkSafe", keyword_principal: "bota seguridad s3",
  keywords_secundarias: "calzado laboral; botas", keywords_long_tail: "comprar bota seguridad s3", entidades_relacionadas: "Calzado; WorkSafe", short_description: "Descripción corta revisable", long_description_html: "<p>Descripción larga HTML</p>",
  bullet_points: "Puntera reforzada", benefits: "Claridad SEO", technical_features: "S3", use_cases: "Taller", meta_title: "Bota seguridad S3", meta_description: "Bota de seguridad S3 para revisar antes de importar.", slug: "bota-seguridad-s3", faqs: "[]", schema_product_json: "{}", image_alt_texts: "Bota seguridad S3", internal_link_suggestions: "/calzado", cta: "Ver producto", seo_score: 80, conversion_score: 75, quality_warnings: "", quality_level: "standard", product_equivalent_used: 1, internal_credits_used: 500, status: "completed", error_message: "",
};

test("platform exports expose expected ecommerce columns and warnings", () => {
  assert.match(buildOutputCSV([row], "rankelia"), /nombre_seo/);
  assert.match(buildOutputCSV([row], "Shopify"), /Handle,Title,Body \(HTML\)/);
  assert.match(buildOutputCSV([row], "WooCommerce"), /Meta: _yoast_wpseo_title/);
  assert.match(buildOutputCSV([row], "PrestaShop"), /URL rewritten/);
  assert.ok(validateShopifyExportRow({ ...row, sku: "" }).some((warning) => warning.includes("SKU")));
  assert.ok(validateWooCommerceExportRow(row).some((warning) => warning.includes("Yoast")));
  assert.ok(validatePrestaShopExportRow(row).some((warning) => warning.includes("PrestaShop")));
});
