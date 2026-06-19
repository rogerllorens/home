import type { CsvRow } from "../../csv";
import type { AIProcessingSettings, ModelTier } from "../types";

export function buildProductSystemPrompt(tier: ModelTier) {
  const detail = tier === "premium" ? "Premium: salida completa, 7 FAQs cuando proceda, bloque comparativo prudente, data_needed y warnings avanzados." : tier === "standard" ? "Standard: salida completa, 5 FAQs, beneficios, casos de uso, enlaces internos y warnings." : "Economy: salida segura, compacta, 3 FAQs, metadatos, descripción HTML media y schema básico.";
  return `${detail}\nGenera una ficha SEO ecommerce estructurada para producto. No inventes para sonar premium: si falta un dato, adviértelo.`;
}

export function buildProductUserPrompt(row: CsvRow, settings: AIProcessingSettings) {
  return `Genera JSON de producto con el schema exacto solicitado.\nConfiguración: ${JSON.stringify(settings)}\nFila CSV normalizada: ${JSON.stringify(row)}\nCampos requeridos: seo_product_name, keyword_principal, keywords_secundarias, keywords_long_tail, entidades_relacionadas, short_description, long_description_html, bullet_points, benefits, technical_features, use_cases, meta_title, meta_description, slug, faqs, schema_product_json, image_alt_texts, internal_link_suggestions, cta, seo_score, conversion_score, quality_warnings, data_needed, forbidden_claims_avoided.\nMeta title aprox. 35-60 caracteres. Meta description aprox. 120-155. Devuelve solo JSON válido.`;
}
