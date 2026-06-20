import type { CsvRow } from "../../csv";
import type { AIProcessingSettings, ModelTier } from "../types";

export function buildCategorySystemPrompt(tier: ModelTier) {
  return `Genera SEO de categoría ecommerce en calidad ${tier}. Evita texto genérico, keyword stuffing y promesas de stock/precio. Devuelve solo JSON válido.`;
}

export function buildCategoryUserPrompt(row: CsvRow, settings: AIProcessingSettings) {
  return `Genera JSON de categoría con H1, top_text_html, bottom_text_html, metadatos, slug, FAQs, enlaces internos, schema_collection_page_json, scores y warnings. Configuración: ${JSON.stringify(settings)}. Datos: ${JSON.stringify(row)}.`;
}
