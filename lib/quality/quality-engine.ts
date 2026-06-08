import type { CsvRow } from "../csv";
import type { QualityAudit, QualityStatus, PublishReadiness } from "./types";

const riskyClaims = ["mejor del mercado", "número 1", "numero 1", "el más potente", "definitivo", "100% garantizado", "garantía oficial", "garantía total", "envío 24h", "envio 24h", "envío gratis", "envio gratis", "en stock", "oferta limitada", "precio más bajo", "certificado", "homologado", "impermeable", "resistente al agua", "ignífugo", "ecológico", "sostenible", "reciclado", "orgánico", "vegano", "compatible con cualquier", "universal", "recomendado por expertos", "clínicamente probado", "dermatológicamente testado", "cumple normativa", "opiniones verificadas", "valoraciones", "estrellas"];
const split = (value?: string) => String(value ?? "").split(/[|;\n]/).map((item) => item.trim()).filter(Boolean);
const has = (row: CsvRow, keys: string[]) => keys.some((key) => Boolean(row[key]?.trim()));
const textOf = (...values: unknown[]) => values.filter(Boolean).join(" ").toLowerCase();
const uniq = (items: string[]) => Array.from(new Set(items.filter(Boolean)));
const status = (issues: string[], blocking = false): QualityStatus => blocking && issues.length ? "error" : issues.length ? "warning" : "ok";
const score = (base: number, penalty: number) => Math.max(0, Math.min(100, base - penalty));

export function detectUnsupportedQualityClaims(input: CsvRow, output: Record<string, unknown>) {
  const inputText = textOf(...Object.values(input));
  const outputText = textOf(output.seo_product_name, output.short_description, output.long_description_html, output.bullet_points, output.meta_description, output.faqs, output.schema_product_json);
  return riskyClaims.filter((claim) => outputText.includes(claim) && !inputText.includes(claim));
}

export function evaluateQuality(input: CsvRow, output: Record<string, unknown>, options: { platform?: string; contentType?: string; promptVersion?: string; model?: string; fallbackUsed?: boolean } = {}): QualityAudit {
  const keyword = String(output.keyword_principal ?? "").toLowerCase().trim();
  const metaTitle = String(output.meta_title ?? "").trim();
  const metaDescription = String(output.meta_description ?? "").trim();
  const slug = String(output.slug ?? "").trim();
  const longHtml = String(output.long_description_html ?? "");
  const platform = String(options.platform ?? "generic").toLowerCase();
  const metaTitleIssues = [
    metaTitle.length < 35 ? "Meta title corto (<35)." : "",
    metaTitle.length > 60 ? "Meta title largo (>60)." : "",
    keyword && !metaTitle.toLowerCase().includes(keyword.split(" ")[0]) ? "Keyword principal o variante poco visible en title." : "",
    /(mejor|barato|garantizado|número 1|numero 1)/i.test(metaTitle) ? "Title contiene claim comercial sensible." : "",
  ];
  const metaDescriptionIssues = [
    metaDescription.length < 120 ? "Meta description corta (<120)." : "",
    metaDescription.length > 160 ? "Meta description larga (>160)." : "",
    /(envío gratis|envio gratis|envío 24h|envio 24h|en stock|garantía)/i.test(metaDescription) && !textOf(...Object.values(input)).includes("env") ? "Meta description puede inventar envío/stock/garantía." : "",
  ];
  const slugIssues = [
    !slug ? "Slug vacío." : "",
    /[A-ZÁÉÍÓÚÜÑ\s]/.test(slug) ? "Slug debe estar en minúsculas y sin espacios." : "",
    /[^a-z0-9-]/.test(slug) ? "Slug contiene símbolos no recomendados." : "",
  ];
  const stuffingCount = keyword ? (textOf(metaTitle, metaDescription, output.short_description, longHtml).match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length : 0;
  const keywordIssues = stuffingCount > 6 ? [`Keyword stuffing: ${stuffingCount} repeticiones exactas.`] : [];
  const unsupportedClaims = detectUnsupportedQualityClaims(input, output);
  const missingData = [
    !has(input, ["sku", "SKU", "reference", "referencia"]) ? "sku" : "",
    !has(input, ["ean", "gtin", "EAN", "GTIN"]) ? "ean_gtin" : "",
    !has(input, ["precio", "price", "regular_price"]) ? "price" : "",
    !has(input, ["stock", "availability", "disponibilidad"]) ? "stock" : "",
    !has(input, ["imagen_url", "image_url", "image", "Image Src"]) ? "image_url" : "",
    !has(input, ["url_actual", "product_url", "url", "link"]) ? "product_url" : "",
    !has(input, ["caracteristicas", "technical_features", "attributes"]) ? "technical_features" : "",
    !has(input, ["compatibility", "compatibilidad"]) ? "compatibility" : "",
    !has(input, ["material", "materials"]) ? "material" : "",
    !has(input, ["dimensions", "dimensiones", "medidas"]) ? "dimensions" : "",
    !has(input, ["warranty", "garantia", "garantía"]) ? "warranty" : "",
  ].filter(Boolean);
  const platformWarnings = [
    platform !== "generic" && platform !== "rankelia" && !has(input, ["precio", "price", "regular_price"]) ? "Precio vacío para export de plataforma." : "",
    platform !== "generic" && platform !== "rankelia" && !has(input, ["imagen_url", "image_url", "image", "Image Src"]) ? "Imagen vacía para export de plataforma." : "",
    /shopify/.test(platform) ? "Shopify: revisar variantes, taxonomía y estado draft antes de importar." : "",
    /woo/.test(platform) ? "WooCommerce: revisar atributos/variables y campos Yoast si aplica." : "",
    /presta/.test(platform) ? "PrestaShop: revisar combinaciones, impuestos y categorías existentes." : "",
  ];
  const schemaIssues: string[] = [];
  const schema = String(output.schema_product_json ?? output.schema_collection_page_json ?? "").trim();
  if (schema) {
    try {
      const parsed = JSON.parse(schema);
      if (parsed.aggregateRating || parsed.review) schemaIssues.push("Schema contiene reviews/ratings: solo usar si existen datos reales.");
      if (parsed.offers && !has(input, ["precio", "price", "regular_price"])) schemaIssues.push("Schema offers sin precio real en CSV.");
      if ((parsed.gtin || parsed.gtin13 || parsed.ean) && !has(input, ["ean", "gtin", "EAN", "GTIN"])) schemaIssues.push("Schema contiene GTIN/EAN no confirmado.");
    } catch { schemaIssues.push("Schema JSON inválido o no parseable."); }
  } else schemaIssues.push("Schema ausente.");
  const eeatWarnings = [missingData.length > 5 ? "Pocos datos verificables de entrada." : "", unsupportedClaims.length ? "Claims no soportados reducen trust." : "", !/antes de comprar|revis/i.test(longHtml) ? "Falta bloque prudente de revisión/antes de comprar." : ""];
  const geoWarnings = [!/^<p>|^[\wÁÉÍÓÚÜÑ]/i.test(longHtml.trim()) ? "Falta respuesta directa inicial." : "", !/<h2|<ul|<li/i.test(longHtml) ? "Estructura HTML poco extraíble para AI Search." : "", !String(output.faqs ?? "").trim() ? "FAQs ausentes o no visibles." : ""];
  const blocking = uniq([...unsupportedClaims.map((claim) => `Claim no soportado: ${claim}`), ...schemaIssues.filter((issue) => /reviews|offers|GTIN/.test(issue))]);
  const nonBlocking = uniq([...metaTitleIssues, ...metaDescriptionIssues, ...slugIssues, ...keywordIssues, ...missingData.map((item) => `Dato faltante: ${item}`), ...platformWarnings, ...eeatWarnings, ...geoWarnings].filter(Boolean));
  const confidence = score(100, missingData.length * 6 + unsupportedClaims.length * 10);
  const eeat = score(88, split(eeatWarnings.join(" | ")).length * 8 + unsupportedClaims.length * 10 + Math.max(0, missingData.length - 4) * 4);
  const geo = score(86, split(geoWarnings.join(" | ")).length * 8 + keywordIssues.length * 10);
  const rankelia = score(92, blocking.length * 18 + nonBlocking.length * 3);
  const readiness: PublishReadiness = blocking.length ? "not_ready" : confidence < 55 || nonBlocking.length > 8 ? "needs_review" : nonBlocking.length ? "ready_with_warnings" : "ready";
  return {
    meta_title_length: metaTitle.length,
    meta_title_status: status(uniq(metaTitleIssues)),
    meta_title_issues: uniq(metaTitleIssues).join(" | "),
    meta_description_length: metaDescription.length,
    meta_description_status: status(uniq(metaDescriptionIssues)),
    meta_description_issues: uniq(metaDescriptionIssues).join(" | "),
    slug_status: status(uniq(slugIssues), !slug),
    slug_issues: uniq(slugIssues).join(" | "),
    schema_status: status(schemaIssues, schemaIssues.some((issue) => /reviews|offers|GTIN/.test(issue))),
    schema_issues: uniq(schemaIssues).join(" | "),
    claim_status: unsupportedClaims.length ? "error" : "ok",
    unsupported_claims_detected: unsupportedClaims.join(" | "),
    keyword_stuffing_status: keywordIssues.length ? "warning" : "ok",
    keyword_stuffing_issues: keywordIssues.join(" | "),
    missing_data: missingData.join(" | "),
    eeat_score: eeat,
    eeat_warnings: uniq(eeatWarnings).join(" | "),
    geo_ai_readiness_score: geo,
    geo_ai_warnings: uniq(geoWarnings).join(" | "),
    internal_linking_warnings: String(output.internal_link_suggestions ?? "").trim() ? "" : "Sin enlaces internos verificables configurados.",
    platform_export_status: status(uniq(platformWarnings)),
    platform_export_warnings: uniq(platformWarnings).join(" | "),
    ready_to_publish: readiness,
    human_review_required: readiness !== "ready" || unsupportedClaims.length > 0 || options.fallbackUsed === true,
    main_quality_issue: blocking[0] ?? nonBlocking[0] ?? "",
    blocking_issues: blocking.join(" | "),
    non_blocking_warnings: nonBlocking.join(" | "),
    rankelia_quality_score: rankelia,
    confidence_score: confidence,
    generated_at: new Date().toISOString(),
  };
}
