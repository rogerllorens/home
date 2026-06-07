import type { CsvRow } from "../csv";
import { calculateConversionScore, calculateSEOScore, detectQualityWarnings, type GenerationOutput, type WorkerGenerationSettings } from "../generation/template-generator";
import { calculateJobCredits, calculateProductEquivalentUsed, normalizeQualityLevel } from "../pricing";
import type { ProductAIOutput } from "./schemas/product-output-schema";
import type { MetadataAIOutput } from "./schemas/metadata-output-schema";

const join = (items?: string[]) => (items ?? []).filter(Boolean).join("; ");
const lines = (items?: string[]) => (items ?? []).filter(Boolean).join("\n");
export function createSlug(text: string) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export function normalizeProductOutput(ai: ProductAIOutput | MetadataAIOutput, row: CsvRow, settings: WorkerGenerationSettings, extraWarnings: string[] = []): GenerationOutput {
  const quality = normalizeQualityLevel(settings.quality_level || settings.quality);
  const product = ai as ProductAIOutput;
  const fallbackName = row.nombre_producto || row.sku || product.keyword_principal;
  const partial: Partial<GenerationOutput> = {
    sku: row.sku || "", nombre_producto: row.nombre_producto || fallbackName, marca: row.marca || "", categoria: row.categoria || "General",
    seo_product_name: "seo_product_name" in ai ? product.seo_product_name : fallbackName,
    keyword_principal: ai.keyword_principal,
    keywords_secundarias: join(ai.keywords_secundarias), keywords_long_tail: "keywords_long_tail" in ai ? join(product.keywords_long_tail) : "", entidades_relacionadas: "entidades_relacionadas" in ai ? join(product.entidades_relacionadas) : "",
    short_description: "short_description" in ai ? product.short_description : ai.meta_description,
    long_description_html: "long_description_html" in ai ? product.long_description_html : "", bullet_points: "bullet_points" in ai ? lines(product.bullet_points) : "", benefits: "benefits" in ai ? lines(product.benefits) : "", technical_features: "technical_features" in ai ? lines(product.technical_features) : "", use_cases: "use_cases" in ai ? lines(product.use_cases) : "",
    meta_title: ai.meta_title, meta_description: ai.meta_description, slug: ai.slug || createSlug(fallbackName),
    faqs: "faqs" in ai ? product.faqs.map((faq) => `${faq.question}\n${faq.answer}`).join("\n\n") : "", schema_product_json: "schema_product_json" in ai ? JSON.stringify(product.schema_product_json, null, 2) : "",
    image_alt_texts: join(ai.image_alt_texts), internal_link_suggestions: "internal_link_suggestions" in ai ? join(product.internal_link_suggestions) : "", cta: "cta" in ai ? product.cta : "Ver producto",
  };
  const warnings = [...detectQualityWarnings(row, partial), ...("quality_warnings" in ai ? ai.quality_warnings : []), ...extraWarnings];
  if (warnings.length) partial.quality_warnings = Array.from(new Set(warnings)).join(" | ");
  return { ...(partial as GenerationOutput), seo_score: calculateSEOScore(row, partial), conversion_score: calculateConversionScore(row, partial), quality_warnings: partial.quality_warnings ?? "", quality_level: quality, product_equivalent_used: calculateProductEquivalentUsed(1, quality), internal_credits_used: calculateJobCredits(1, { generationType: settings.generation_type || settings.generationType, qualityLevel: quality }), status: "completed", error_message: "" };
}
