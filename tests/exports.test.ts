import assert from "node:assert/strict";
import test from "node:test";
import { buildOutputCSV, validatePrestaShopExportRow, validateShopifyExportRow, validateWooCommerceExportRow, type GenerationOutput } from "../lib/generation/template-generator";

const row: GenerationOutput = {
  sku: "SKU-001", nombre_producto: "Bota original", marca: "WorkSafe", categoria: "Calzado", seo_product_name: "Bota seguridad S3 WorkSafe", keyword_principal: "bota seguridad s3",
  keywords_secundarias: "calzado laboral; botas", keywords_long_tail: "comprar bota seguridad s3", entidades_relacionadas: "Calzado; WorkSafe", short_description: "Descripción corta revisable", long_description_html: "<p>Descripción larga HTML</p>",
  bullet_points: "Puntera reforzada", benefits: "Claridad SEO", technical_features: "S3", use_cases: "Taller", meta_title: "Bota seguridad S3", meta_description: "Bota de seguridad S3 para revisar antes de importar.", slug: "bota-seguridad-s3", faqs: "[]", schema_product_json: "{}", image_alt_texts: "Bota seguridad S3", internal_link_suggestions: "/calzado", cta: "Ver producto", seo_score: 80, conversion_score: 75, quality_warnings: "", quality_level: "standard", product_equivalent_used: 1, internal_credits_used: 500, status: "completed", error_message: "", ean: "", subcategoria: "", price: "19.90", currency: "EUR", stock: "5", image_url: "https://cdn.example/img.jpg", product_url: "https://shop.example/p", original_description: "Original", original_status: "", meta_title_length: 18, meta_title_status: "warning", meta_title_issues: "", meta_description_length: 57, meta_description_status: "warning", meta_description_issues: "", slug_status: "ok", slug_issues: "", schema_status: "ok", schema_issues: "", claim_status: "ok", unsupported_claims_detected: "", keyword_stuffing_status: "ok", keyword_stuffing_issues: "", missing_data: "", eeat_score: 80, eeat_warnings: "", geo_ai_readiness_score: 75, geo_ai_warnings: "", internal_linking_warnings: "", platform_export_status: "ok", platform_export_warnings: "", ready_to_publish: "ready_with_warnings", human_review_required: true, main_quality_issue: "", blocking_issues: "", non_blocking_warnings: "", rankelia_quality_score: 82, confidence_score: 78, generated_at: "2026-06-08T00:00:00.000Z",
};

test("platform exports expose expected ecommerce columns and warnings", () => {
  assert.match(buildOutputCSV([row], "rankelia"), /nombre_seo/);
  assert.match(buildOutputCSV([row], "Shopify"), /Handle,Title,Body \(HTML\)/);
  assert.match(buildOutputCSV([row], "WooCommerce"), /Meta: _yoast_wpseo_title/);
  assert.match(buildOutputCSV([row], "PrestaShop"), /URL rewritten/);
  assert.match(buildOutputCSV([row], "Shopify"), /19\.90/);
  assert.match(buildOutputCSV([row], "WooCommerce"), /https:\/\/cdn\.example\/img\.jpg/);
  assert.match(buildOutputCSV([row], "PrestaShop"), /19\.90/);
  assert.ok(validateShopifyExportRow({ ...row, sku: "", price: "", image_url: "" }).some((warning) => warning.includes("SKU")));
  assert.ok(validateWooCommerceExportRow(row).some((warning) => warning.includes("Yoast")));
  assert.ok(validatePrestaShopExportRow(row).some((warning) => warning.includes("PrestaShop")));
});
