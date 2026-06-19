import assert from "node:assert/strict";
import test from "node:test";
import { extractJSONFromText, validateWithSchema } from "../lib/ai/json-validator";
import { productAIOutputSchema } from "../lib/ai/schemas/product-output-schema";
import { detectUnsupportedClaims, detectKeywordStuffing } from "../lib/ai/claim-detector";

const validProduct = {
  seo_product_name: "Bota de seguridad S3 negra para uso laboral",
  keyword_principal: "bota seguridad s3",
  keywords_secundarias: ["calzado laboral"],
  keywords_long_tail: ["bota de seguridad para taller"],
  entidades_relacionadas: ["puntera reforzada"],
  short_description: "Bota de seguridad S3 para entornos laborales con puntera reforzada y suela antideslizante.",
  long_description_html: "<p>Bota de seguridad S3 negra pensada para uso laboral intensivo, con datos técnicos revisables antes de publicar.</p>",
  bullet_points: ["Puntera reforzada", "Suela antideslizante"],
  benefits: ["Mejora la protección en tareas laborales"],
  technical_features: ["S3"],
  use_cases: ["Taller"],
  meta_title: "Bota seguridad S3 negra para trabajo",
  meta_description: "Bota de seguridad S3 negra para trabajo, con puntera reforzada y suela antideslizante. Revisa certificación antes de publicar.",
  slug: "bota-seguridad-s3-negra",
  faqs: [{ question: "¿Incluye puntera?", answer: "Sí, el CSV indica puntera reforzada para uso laboral." }, { question: "¿Debe revisarse?", answer: "Sí, revisa certificaciones y medidas antes de publicar." }],
  schema_product_json: { "@type": "Product" },
  image_alt_texts: ["Bota de seguridad S3 negra"],
  internal_link_suggestions: ["/calzado-laboral"],
  cta: "Revisar ficha antes de importar",
  seo_score: 82,
  conversion_score: 78,
  quality_warnings: ["Revisar certificación exacta"],
  data_needed: ["Medidas exactas"],
  forbidden_claims_avoided: ["No se afirma garantía no indicada"],
};

test("AI JSON extraction tolerates fenced/text-wrapped JSON", () => {
  const parsed = extractJSONFromText(`Respuesta:\n\`\`\`json\n${JSON.stringify(validProduct)}\n\`\`\``);
  assert.equal(parsed.seo_product_name, validProduct.seo_product_name);
});

test("product AI schema accepts complete structured output and rejects incomplete output", () => {
  assert.equal(validateWithSchema(validProduct, productAIOutputSchema).ok, true);
  const invalid = validateWithSchema({ seo_product_name: "Bota" }, productAIOutputSchema);
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.length > 5);
});

test("claim and stuffing detectors catch risky output", () => {
  const claims = detectUnsupportedClaims({ nombre_producto: "Bota negra" }, { short_description: "Bota impermeable certificada con garantía oficial." });
  assert.ok(claims.includes("impermeable"));
  assert.ok(claims.includes("garantía"));
  assert.equal(detectKeywordStuffing({ keyword_principal: "bota", meta_title: "bota bota bota", meta_description: "bota bota bota", short_description: "bota bota bota", long_description_html: "bota bota bota" }), true);
});
