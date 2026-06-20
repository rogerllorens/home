import type { CsvRow } from "../../csv";
import { normalizeHeader } from "../../csv";
import { generateFallbackImageAlt } from "./alt-generator-rules";
import { calculateImageSeoScore } from "./image-score";
import { normalizeImageWarning } from "./image-warnings";
import type { ExtractedImageData, ImageAltContext, ImageSeoEnrichment, ImageAltSource } from "./types";

export type { ExtractedImageData, ImageAltContext, ImageSeoEnrichment, ImageAltSource, ImageAltStatus, ImageDataQuality } from "./types";
export { validateImageAlt } from "./alt-validator";
export { generateFallbackImageAlt } from "./alt-generator-rules";
export { calculateImageSeoScore } from "./image-score";

const imageAliases = new Set(["image", "images", "image_url", "image_src", "image_link", "img", "img_url", "photo", "photo_url", "picture", "picture_url", "product_image", "main_image", "imagen", "imagen_url", "url_imagen", "foto", "foto_url", "imagenes", "galeria", "gallery", "gallery_images", "additional_images", "extra_images", "image_urls"]);
const altAliases = new Set(["alt", "alt_text", "image_alt", "image_alt_text", "alt_imagen", "texto_alternativo", "texto_alt", "image_alt_texts", "rankelia_image_alt_texts"]);
const urlRegex = /^https?:\/\//i;
const splitCandidates = (value: string) => value.split(/\s*[;,|\n]\s*/).flatMap((item) => item.split(/\s+(?=https?:\/\/)/i)).map((item) => item.trim()).filter(Boolean);
const validImageUrl = (value: string) => urlRegex.test(value) && value.length <= 2048;

function valuesFromAliases(row: CsvRow, aliases: Set<string>) {
  const values: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(row)) {
    if (aliases.has(normalizeHeader(key)) && value?.trim()) values.push({ key, value: value.trim() });
  }
  return values;
}

export function extractImageDataFromRow(row: CsvRow): ExtractedImageData {
  const imageCells = valuesFromAliases(row, imageAliases);
  const altCells = valuesFromAliases(row, altAliases);
  const warnings: string[] = [];
  const urls = imageCells.flatMap((cell) => splitCandidates(cell.value)).map((url) => url.slice(0, 2048));
  const validUrls = urls.filter(validImageUrl);
  if (urls.length !== validUrls.length) warnings.push("image_url_invalid");
  if (validUrls.length > 10) warnings.push("too_many_images");
  const alts = altCells.flatMap((cell) => splitCandidates(cell.value).length > 1 && !cell.value.includes(" ") ? splitCandidates(cell.value) : cell.value.split(/[|\n]/)).map((alt) => alt.trim()).filter(Boolean).slice(0, 10);
  if (!validUrls.length) warnings.push("no_image_url");
  return { primaryImageUrl: validUrls[0] ?? "", galleryImageUrls: validUrls.slice(1, 10), existingAltTexts: alts, detectedImageColumns: imageCells.map((cell) => cell.key), detectedAltColumns: altCells.map((cell) => cell.key), warnings: Array.from(new Set(warnings)) };
}

export function enrichImageSeo(row: CsvRow, context: ImageAltContext, aiAltTexts: string[] = []): ImageSeoEnrichment {
  const extracted = extractImageDataFromRow(row);
  const allUrls = [extracted.primaryImageUrl, ...extracted.galleryImageUrls].filter(Boolean);
  let source: ImageAltSource = "none";
  let altTexts = extracted.existingAltTexts.slice(0, allUrls.length || 1);
  if (altTexts.length) source = "existing";
  if (!altTexts.length && aiAltTexts.filter(Boolean).length) { altTexts = aiAltTexts.filter(Boolean).slice(0, allUrls.length || 1); source = "ai"; }
  const fallbackWarnings: string[] = [];
  while (allUrls.length && altTexts.length < Math.min(allUrls.length, 10)) {
    const generated = generateFallbackImageAlt(context, altTexts.length ? "gallery" : "primary", altTexts.length);
    if (generated.alt) altTexts.push(generated.alt);
    if (generated.warning) fallbackWarnings.push(generated.warning);
    source = source === "existing" ? "existing" : "fallback";
    if (!generated.alt) break;
  }
  const seo = calculateImageSeoScore({ imageUrls: allUrls, altTexts, context });
  const warningCodes = Array.from(new Set([...extracted.warnings, ...seo.warnings, ...fallbackWarnings.map(() => "human_review_required")]));
  const warnings = warningCodes.map(normalizeImageWarning);
  const recommendations = Array.from(new Set([
    ...seo.evaluations.flatMap((evaluation) => evaluation.recommendations),
    ...(warningCodes.includes("no_image_url") ? ["Añade URLs de imagen al CSV para generar ALT text SEO por producto."] : []),
    ...(warningCodes.includes("too_many_images") ? ["Revisa manualmente galerías con más de 10 imágenes."] : []),
    ...(source === "fallback" ? ["Revisa los ALT fallback antes de importar en la tienda."] : []),
  ]));
  const status = !allUrls.length ? "missing" : source === "existing" && seo.status === "good" ? "good" : source === "fallback" ? "generated" : seo.status;
  return {
    primary_image_url: extracted.primaryImageUrl,
    gallery_image_urls: extracted.galleryImageUrls,
    existing_image_alt_texts: extracted.existingAltTexts,
    image_alt_texts: altTexts.join(" | "),
    primary_image_alt: altTexts[0] ?? "",
    gallery_image_alts: altTexts.slice(1, 10),
    image_seo_score: seo.score,
    image_alt_status: status as ImageSeoEnrichment["image_alt_status"],
    image_alt_warnings: warnings,
    image_alt_recommendations: recommendations,
    image_data_quality: allUrls.length && altTexts.length >= allUrls.length ? "complete" : allUrls.length ? "partial" : "missing",
    image_alt_source: source,
    image_alt_keyword_used: context.keyword ?? null,
    image_alt_human_review_required: source === "fallback" || seo.evaluations.some((evaluation) => evaluation.humanReviewRequired) || warningCodes.includes("no_image_url"),
  };
}
