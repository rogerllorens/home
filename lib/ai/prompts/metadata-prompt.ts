import type { CsvRow } from "../../csv";
import type { AIProcessingSettings } from "../types";

export function buildMetadataPrompt(row: CsvRow, settings: AIProcessingSettings) {
  return `Genera solo metadatos SEO en JSON: keyword_principal, keywords_secundarias, meta_title, meta_description, slug, image_alt_texts, quality_warnings. No inventes datos, no hagas keyword stuffing, integra query principal/GSC solo si encaja, meta_title 45-60 caracteres y meta_description 120-160 caracteres. Configuración: ${JSON.stringify(settings)}. Datos: ${JSON.stringify(row)}.`;
}
