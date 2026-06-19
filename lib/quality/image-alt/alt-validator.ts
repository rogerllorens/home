import type { ImageAltContext, ImageAltEvaluation } from "./types";

const pricePromo = /(€|\$|\bprecio\b|oferta|descuento|env[ií]o gratis|env[ií]o 24h|stock|rebaja|barato|comprar ahora)/i;
const emptyGeneric = /^(producto|imagen|foto|image|photo|img|sin alt|n\/a|na|-|_)$/i;
const filename = /^(?:img|image|foto|photo|dsc|whatsapp|captura)?[_-]?\d+\.(?:jpe?g|png|webp|avif|gif)$/i;
const unsupportedClaims = /(garantizado|n[uú]mero 1|mejor del mercado|oficial|certificado|homologado|impermeable|ign[ií]fugo|ecol[oó]gico|sostenible|org[aá]nico|vegano|universal)/i;

function words(value: string) { return value.trim().split(/\s+/).filter(Boolean); }
function repeatedTokens(value: string) {
  const tokens = words(value.toLowerCase()).filter((token) => token.length > 3);
  const counts = new Map<string, number>();
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  return [...counts.entries()].filter(([, count]) => count >= 3).map(([token]) => token);
}

export function validateImageAlt(alt: string, context: ImageAltContext = {}): ImageAltEvaluation {
  const normalized = alt.trim().replace(/\s+/g, " ");
  const warnings: string[] = [];
  const recommendations: string[] = [];
  if (!normalized) warnings.push("empty_alt");
  if (normalized && normalized.length < 25) warnings.push("too_short");
  if (normalized.length > 125) warnings.push("too_long");
  if (words(normalized).length > 16) warnings.push("too_many_words");
  if (emptyGeneric.test(normalized)) warnings.push("generic_alt");
  if (filename.test(normalized)) warnings.push("filename_alt");
  if (pricePromo.test(normalized)) warnings.push("alt_contains_price_or_promo");
  if (unsupportedClaims.test(normalized)) warnings.push("unsupported_claim");
  const repeated = repeatedTokens(normalized);
  if (repeated.length) warnings.push("keyword_stuffing");
  const product = context.productName?.trim().toLowerCase();
  if (product && normalized.toLowerCase() === product && product.split(/\s+/).length < 4) warnings.push("alt_repeats_product_name_exactly");
  if (warnings.includes("empty_alt")) recommendations.push("Añade un ALT descriptivo basado en datos reales del producto.");
  if (warnings.includes("too_short") || warnings.includes("generic_alt")) recommendations.push("Incluye producto, marca o categoría de forma natural, sin stuffing.");
  if (warnings.includes("too_long") || warnings.includes("too_many_words")) recommendations.push("Reduce el ALT a una frase clara de 40-125 caracteres.");
  if (warnings.includes("alt_contains_price_or_promo") || warnings.includes("unsupported_claim")) recommendations.push("No incluyas precio, stock, envío, promociones ni claims no verificados en ALT.");
  const penalty = warnings.reduce((sum, warning) => sum + (warning === "empty_alt" ? 55 : warning === "unsupported_claim" || warning === "alt_contains_price_or_promo" ? 30 : warning === "keyword_stuffing" ? 25 : 12), 0);
  const score = Math.max(0, Math.min(100, 94 - penalty));
  const status = !normalized ? "missing" : score >= 82 ? "good" : score >= 55 ? "warning" : "needs_review";
  return { score, status, warnings: Array.from(new Set(warnings)), recommendations: Array.from(new Set(recommendations)), humanReviewRequired: status !== "good" || warnings.some((w) => ["unsupported_claim", "alt_contains_price_or_promo", "keyword_stuffing"].includes(w)) };
}
