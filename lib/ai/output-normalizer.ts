import type { CsvRow } from "../csv";
import { detectQualityWarnings, originalDataFromRow, type GenerationOutput, type WorkerGenerationSettings } from "../generation/template-generator";
import { calculateJobCredits, calculateProductEquivalentUsed, normalizeQualityLevel } from "../pricing";
import { evaluateQuality } from "../quality";
import type { ProductAIOutput } from "./schemas/product-output-schema";
import type { MetadataAIOutput } from "./schemas/metadata-output-schema";
import type { CategoryAIOutput } from "./schemas/category-output-schema";

const join = (items?: string[]) => (items ?? []).filter(Boolean).join("; ");
const lines = (items?: string[]) => (items ?? []).filter(Boolean).join("\n");
export function createSlug(text: string) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function finalize(aiPartial: Partial<GenerationOutput>, row: CsvRow, settings: WorkerGenerationSettings, extraWarnings: string[] = []) {
  const quality = normalizeQualityLevel(settings.quality_level || settings.quality);
  const original = originalDataFromRow(row, settings.column_mapping);
  const base = { ...original, ...aiPartial, quality_level: quality, product_equivalent_used: calculateProductEquivalentUsed(1, quality), internal_credits_used: calculateJobCredits(1, { generationType: settings.generation_type || settings.generationType, qualityLevel: quality }), status: "completed" as const, error_message: "" } as GenerationOutput;
  const audit = evaluateQuality(row, base as unknown as Record<string, unknown>, { platform: settings.platform, contentType: settings.generation_type || settings.generationType, promptVersion: base.prompt_version, model: base.model_used, fallbackUsed: base.fallback_used });
  const qualityWarnings = [...detectQualityWarnings(row, base), base.quality_warnings, ...extraWarnings, audit.non_blocking_warnings, audit.blocking_issues].filter(Boolean).join(" | ");
  const scored = { ...base, ...audit, quality_warnings: Array.from(new Set(qualityWarnings.split(" | ").filter(Boolean))).join(" | ") } as GenerationOutput;
  const seo = Math.max(20, Math.min(98, Math.round(scored.rankelia_quality_score * 0.65 + (scored.meta_title_status === "ok" ? 8 : 0) + (scored.meta_description_status === "ok" ? 8 : 0) + (scored.schema_status === "ok" ? 7 : 0) + (scored.geo_ai_readiness_score * 0.12))));
  const conversion = Math.max(20, Math.min(96, 70 + (scored.bullet_points ? 7 : 0) + (scored.benefits ? 6 : 0) + (scored.cta ? 5 : 0) - (scored.ready_to_publish === "not_ready" ? 15 : 0)));
  return { ...scored, seo_score: seo, conversion_score: conversion };
}

export function normalizeProductOutput(ai: ProductAIOutput | MetadataAIOutput, row: CsvRow, settings: WorkerGenerationSettings, extraWarnings: string[] = []): GenerationOutput {
  const product = ai as ProductAIOutput;
  const original = originalDataFromRow(row, settings.column_mapping);
  const fallbackName = original.nombre_producto || original.sku || product.keyword_principal;
  const partial: Partial<GenerationOutput> = {
    seo_product_name: "seo_product_name" in ai ? product.seo_product_name : fallbackName,
    keyword_principal: ai.keyword_principal,
    keywords_secundarias: join(ai.keywords_secundarias),
    keywords_long_tail: "keywords_long_tail" in ai ? join(product.keywords_long_tail) : "",
    entidades_relacionadas: "entidades_relacionadas" in ai ? join(product.entidades_relacionadas) : "",
    short_description: "short_description" in ai ? product.short_description : ai.meta_description,
    long_description_html: "long_description_html" in ai ? product.long_description_html : "",
    bullet_points: "bullet_points" in ai ? lines(product.bullet_points) : "",
    benefits: "benefits" in ai ? lines(product.benefits) : "",
    technical_features: "technical_features" in ai ? lines(product.technical_features) : original.features,
    use_cases: "use_cases" in ai ? lines(product.use_cases) : "",
    meta_title: ai.meta_title,
    meta_description: ai.meta_description,
    slug: ai.slug || createSlug(fallbackName),
    faqs: "faqs" in ai ? product.faqs.map((faq) => `${faq.question}\n${faq.answer}`).join("\n\n") : "",
    schema_product_json: "schema_product_json" in ai ? JSON.stringify(product.schema_product_json, null, 2) : "",
    image_alt_texts: join(ai.image_alt_texts),
    internal_link_suggestions: "internal_link_suggestions" in ai ? join(product.internal_link_suggestions) : "",
    cta: "cta" in ai ? product.cta : "Ver producto",
  };
  return finalize(partial, row, settings, [...("quality_warnings" in ai ? ai.quality_warnings : []), ...extraWarnings]);
}

export function normalizeCategoryOutput(ai: CategoryAIOutput, row: CsvRow, settings: WorkerGenerationSettings, extraWarnings: string[] = []): GenerationOutput {
  const partial: Partial<GenerationOutput> = {
    seo_product_name: ai.category_h1,
    keyword_principal: ai.keyword_principal,
    keywords_secundarias: join(ai.keywords_secundarias),
    keywords_long_tail: join(ai.keywords_long_tail),
    entidades_relacionadas: join(ai.entidades_relacionadas),
    short_description: ai.top_text_html.replace(/<[^>]+>/g, " ").slice(0, 450),
    long_description_html: `${ai.top_text_html}\n${ai.bottom_text_html}`,
    bullet_points: lines(ai.buying_guide_points ?? []),
    benefits: lines(ai.subcategory_suggestions ?? []),
    technical_features: "",
    use_cases: "Categoría ecommerce\nGuía de elección\nSEO de catálogo",
    meta_title: ai.meta_title,
    meta_description: ai.meta_description,
    slug: ai.slug,
    faqs: ai.faqs.map((faq) => `${faq.question}\n${faq.answer}`).join("\n\n"),
    schema_product_json: JSON.stringify(ai.schema_collection_page_json, null, 2),
    image_alt_texts: ai.category_h1,
    internal_link_suggestions: join(ai.internal_link_suggestions),
    cta: ai.cta,
  };
  return finalize(partial, row, settings, [...ai.quality_warnings, ...ai.data_needed.map((item) => `Dato recomendado: ${item}`), ...extraWarnings]);
}
