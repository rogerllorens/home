import type { GenerationOutput } from "@/lib/generation/template-generator";
import type { ProposalScores } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
const text = (value: unknown) => String(value ?? "").trim();
function hasAny(data: Record<string, unknown>, keys: string[]) { return keys.some((key) => text(data[key]).length > 0); }

export function scoreOriginalSnapshot(original: Record<string, unknown>): ProposalScores {
  const hasName = hasAny(original, ["seo_product_name", "product_name", "nombre_producto", "name", "title"]);
  const hasDescription = hasAny(original, ["description", "descripcion", "short_description", "long_description", "body_html"]);
  const hasMetaTitle = hasAny(original, ["meta_title", "title_tag", "seo_title"]);
  const hasMetaDescription = hasAny(original, ["meta_description", "seo_description"]);
  const hasImage = hasAny(original, ["primary_image_url", "image_url", "image", "Image Src", "Images"]);
  const hasAlt = hasAny(original, ["primary_image_alt", "image_alt", "Image Alt Text", "alt_text"]);
  const seo = clamp((hasName ? 20 : 0) + (hasDescription ? 25 : 0) + (hasMetaTitle ? 25 : 0) + (hasMetaDescription ? 25 : 0) + 5);
  const imageSeo = clamp((hasImage ? 45 : 10) + (hasAlt ? 45 : 0));
  const schema = clamp(hasAny(original, ["schema", "jsonld", "structured_data"]) ? 60 : 20);
  const geo = clamp((hasDescription ? 35 : 10) + (hasName ? 25 : 0) + (hasAny(original, ["category", "categoria", "brand", "marca"]) ? 20 : 0));
  const eeat = clamp((hasAny(original, ["brand", "marca"]) ? 25 : 10) + (hasDescription ? 25 : 0) + (hasAny(original, ["sku", "gtin", "ean"]) ? 20 : 0));
  const confidence = clamp((hasName ? 25 : 0) + (hasDescription ? 25 : 0) + (hasAny(original, ["sku", "brand", "marca"]) ? 25 : 0) + (hasImage ? 15 : 0));
  const readiness = clamp((seo + imageSeo + confidence) / 3);
  return { seo, conversion: clamp((hasDescription ? 45 : 10) + (hasName ? 25 : 0)), geo_aeo: geo, eeat, image_seo: imageSeo, schema, confidence, readiness, overall: clamp((seo + imageSeo + schema + geo + eeat + confidence + readiness) / 7) };
}

export function scoreProposedOutput(output: Partial<GenerationOutput> & Record<string, unknown>): ProposalScores {
  const seo = clamp(Number(output.seo_score ?? 0));
  const conversion = clamp(Number(output.conversion_score ?? 0));
  const geo_aeo = clamp(Number(output.geo_ai_readiness_score ?? output.geo_aeo_score ?? Math.max(seo - 8, 0)));
  const eeat = clamp(Number(output.eeat_score ?? Math.max(seo - 10, 0)));
  const image_seo = clamp(Number(output.image_seo_score ?? (output.primary_image_alt ? 80 : 35)));
  const schema = clamp(Number(output.schema_score ?? (output.schema_jsonld ? 75 : 35)));
  const confidence = clamp(Number(output.confidence_score ?? Math.max(seo - 5, 0)));
  const readiness = clamp(output.ready_to_publish === "ready" ? 90 : output.human_review_required ? 55 : 75);
  return { seo, conversion, geo_aeo, eeat, image_seo, schema, confidence, readiness, overall: clamp((seo + conversion + geo_aeo + eeat + image_seo + schema + confidence + readiness) / 8) };
}

export function calculateScoreDelta(original: ProposalScores, proposed: ProposalScores): ProposalScores {
  return {
    seo: clamp(proposed.seo - original.seo),
    conversion: clamp(proposed.conversion - original.conversion),
    geo_aeo: clamp(proposed.geo_aeo - original.geo_aeo),
    eeat: clamp(proposed.eeat - original.eeat),
    image_seo: clamp(proposed.image_seo - original.image_seo),
    schema: clamp(proposed.schema - original.schema),
    confidence: clamp(proposed.confidence - original.confidence),
    readiness: clamp(proposed.readiness - original.readiness),
    overall: clamp(proposed.overall - original.overall),
  };
}

export function calculateBeforeAfterScores(originalData: Record<string, unknown>, proposedOutput: Partial<GenerationOutput> & Record<string, unknown>) {
  const original = scoreOriginalSnapshot(originalData);
  const proposed = scoreProposedOutput(proposedOutput);
  return { original, proposed, delta: calculateScoreDelta(original, proposed) };
}
