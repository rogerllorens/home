import type { ColumnMapping, CsvRow } from "../csv";
import { calculateJobCredits, calculateProductEquivalentUsed, normalizeQualityLevel, type QualityLevel } from "../pricing";
import { evaluateQuality, type QualityAudit } from "../quality";

export type GenerationOutput = QualityAudit & {
  sku: string; ean: string; nombre_producto: string; marca: string; categoria: string; subcategoria: string; price: string; currency: string; stock: string; image_url: string; product_url: string; original_description: string; original_status: string;
  seo_product_name: string; keyword_principal: string; keywords_secundarias: string; keywords_long_tail: string; entidades_relacionadas: string; short_description: string; long_description_html: string;
  bullet_points: string; benefits: string; technical_features: string; use_cases: string; meta_title: string; meta_description: string; slug: string;
  faqs: string; schema_product_json: string; image_alt_texts: string; internal_link_suggestions: string; cta: string; seo_score: number; conversion_score: number;
  quality_warnings: string; quality_level: QualityLevel; product_equivalent_used: number; internal_credits_used: number; status: "completed" | "failed"; error_message: string; prompt_version?: string; model_used?: string; fallback_used?: boolean;
};

export type WorkerGenerationSettings = { platform?: string; generation_type?: string; generationType?: string; quality_level?: string; quality?: string; tone?: string; language?: string; country?: string; includeFaqs?: boolean; includeSchema?: boolean; includeAltText?: boolean; column_mapping?: ColumnMapping };

function createSlug(text: string) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
const pick = (row: CsvRow, mapping: ColumnMapping | undefined, key: keyof ColumnMapping, fallback = "") => (mapping?.[key] ? row[mapping[key]!] : row[key]) || fallback;
const firstValue = (row: CsvRow, keys: string[]) => keys.map((key) => row[key]).find((value) => value?.trim()) ?? "";
const split = (value: string) => value.split(/[;,|\n]/).map((item) => item.trim()).filter(Boolean);
export function sanitizeCsvCell(value: unknown) {
  const text = String(value ?? "");
  const trimmedStart = text.trimStart();
  if (/^[=+\-@]/.test(trimmedStart)) return `'${text}`;
  return text;
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeHtmlFragment(value: unknown) {
  return String(value ?? "")
    .replace(/<\/?(?:script|style|iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/<\/?([a-z0-9-]+)(?:\s[^>]*)?>/gi, (tag, rawName: string) => {
      const name = rawName.toLowerCase();
      if (["p", "h2", "h3", "ul", "ol", "li", "strong", "b", "em", "br"].includes(name)) {
        return tag.startsWith("</") ? `</${name}>` : `<${name}>`;
      }
      return escapeHtml(tag);
    });
}

const esc = (value: unknown) => `"${sanitizeCsvCell(value).replace(/"/g, '""')}"`;
const truncate = (value: string, max: number) => value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;

export function originalDataFromRow(row: CsvRow, mapping?: ColumnMapping) {
  return {
    sku: pick(row, mapping, "sku", firstValue(row, ["sku", "SKU", "reference", "referencia", "Variant SKU"])) || "",
    ean: firstValue(row, ["ean", "EAN", "gtin", "GTIN", "barcode", "codigo_barras"]),
    nombre_producto: pick(row, mapping, "nombre_producto", firstValue(row, ["nombre_producto", "product_name", "name", "Title", "Name"])) || "",
    marca: pick(row, mapping, "marca", firstValue(row, ["marca", "brand", "Vendor", "fabricante"])) || "",
    categoria: pick(row, mapping, "categoria", firstValue(row, ["categoria", "category", "Categories", "Product Category", "Type"])) || "General",
    subcategoria: firstValue(row, ["subcategoria", "subcategory", "sub_category"]),
    price: pick(row, mapping, "precio", firstValue(row, ["precio", "price", "regular_price", "Regular price", "Variant Price", "Price tax excluded"])) || "",
    currency: firstValue(row, ["currency", "moneda", "Currency"]) || "EUR",
    stock: firstValue(row, ["stock", "availability", "disponibilidad", "inventory_quantity", "qty"]),
    image_url: pick(row, mapping, "imagen_url", firstValue(row, ["imagen_url", "image_url", "image", "Image Src", "Images", "Image URLs"])) || "",
    product_url: pick(row, mapping, "url_actual", firstValue(row, ["url_actual", "product_url", "url", "link", "handle", "URL"])) || "",
    original_description: pick(row, mapping, "descripcion_actual", firstValue(row, ["descripcion_actual", "description", "Description", "Body (HTML)"])) || "",
    original_status: firstValue(row, ["status", "Status", "Published", "Active"]),
    features: pick(row, mapping, "caracteristicas", firstValue(row, ["caracteristicas", "features", "technical_features", "attributes", "Caracteristicas"])) || "",
    material: firstValue(row, ["material", "materials", "composicion"]),
    dimensions: firstValue(row, ["dimensions", "dimensiones", "medidas"]),
    warranty: firstValue(row, ["warranty", "garantia", "garantía"]),
    compatibility: firstValue(row, ["compatibility", "compatibilidad", "compatible"]),
  };
}

export function calculateSEOScore(row: CsvRow, output: Partial<GenerationOutput>) {
  const auditScore = typeof output.rankelia_quality_score === "number" ? Math.round(output.rankelia_quality_score * 0.65) : 58;
  let score = auditScore + 20;
  if (output.meta_title && output.meta_title.length <= 62) score += 5;
  if (output.meta_description && output.meta_description.length >= 120 && output.meta_description.length <= 165) score += 6;
  if (output.short_description && output.short_description.length > 80) score += 4;
  if (row.caracteristicas || output.technical_features) score += 5;
  if (output.faqs) score += 4;
  if (!output.keyword_principal) score -= 8;
  if (output.human_review_required) score -= 8;
  return Math.max(20, Math.min(98, score));
}

export function calculateConversionScore(row: CsvRow, output: Partial<GenerationOutput>) {
  let score = 70;
  if (output.bullet_points) score += 7;
  if (output.benefits) score += 6;
  if (output.cta) score += 5;
  if (!originalDataFromRow(row).price) score -= 4;
  if (output.ready_to_publish === "not_ready") score -= 12;
  return Math.max(20, Math.min(96, score));
}

export function detectQualityWarnings(row: CsvRow, output?: Partial<GenerationOutput>) {
  const data = originalDataFromRow(row);
  const warnings: string[] = [];
  if (!data.features || data.features.length < 20) warnings.push("Completar características técnicas antes de publicar.");
  if (!data.original_description || data.original_description.length < 60) warnings.push("Descripción original vacía o corta: revisar tono final.");
  if (/s3|certific/i.test(`${data.nombre_producto} ${data.features}`)) warnings.push("Confirmar certificaciones exactas antes de publicar.");
  if (!data.image_url) warnings.push("Añadir imagen real para validar alt text.");
  if (output?.meta_description && output.meta_description.length > 165) warnings.push("Meta description larga: revisar en CMS.");
  return warnings;
}

function finalizeOutput(row: CsvRow, settings: WorkerGenerationSettings, partial: Omit<Partial<GenerationOutput>, keyof QualityAudit>) {
  const quality = normalizeQualityLevel(settings.quality_level || settings.quality);
  const original = originalDataFromRow(row, settings.column_mapping);
  const base = { ...original, ...partial, quality_level: quality } as unknown as GenerationOutput;
  const audit = evaluateQuality(row, base as unknown as Record<string, unknown>, { platform: settings.platform, contentType: settings.generation_type || settings.generationType, promptVersion: base.prompt_version, model: base.model_used, fallbackUsed: base.fallback_used });
  const qualityWarnings = [base.quality_warnings, audit.non_blocking_warnings, audit.blocking_issues].filter(Boolean).join(" | ");
  const scored = { ...base, ...audit, quality_warnings: qualityWarnings } as GenerationOutput;
  return { ...scored, seo_score: calculateSEOScore(row, scored), conversion_score: calculateConversionScore(row, scored), product_equivalent_used: calculateProductEquivalentUsed(1, quality), internal_credits_used: calculateJobCredits(1, { generationType: settings.generation_type || settings.generationType, qualityLevel: quality }), status: "completed" as const, error_message: "" };
}

export function generateProductTemplateResult(row: CsvRow, settings: WorkerGenerationSettings = {}): GenerationOutput {
  const mapping = settings.column_mapping;
  const original = originalDataFromRow(row, mapping);
  const name = original.nombre_producto || original.sku || "Producto sin nombre";
  if (!name || name === "Producto sin nombre") throw new Error("Fila sin nombre de producto utilizable");
  const brand = original.marca;
  const category = original.categoria || "General";
  const features = original.features;
  const primaryKeyword = pick(row, mapping, "keyword_principal", row.keyword_principal || name.toLowerCase());
  const secondary = split(pick(row, mapping, "keywords_secundarias", row.keywords_secundarias || ""));
  const quality = normalizeQualityLevel(settings.quality_level || settings.quality);
  const productName = `${name}${brand && !name.toLowerCase().includes(brand.toLowerCase()) ? ` ${brand}` : ""}`.trim();
  const featureList = split(features).slice(0, quality === "standard" ? 4 : 7);
  const longTail = [`comprar ${primaryKeyword}`, `${primaryKeyword} ${category}`.toLowerCase(), `${primaryKeyword} profesional`];
  const entities = [category, brand, original.ean, ...featureList].filter(Boolean).slice(0, 8);
  const shortDescription = `${productName} pensado para ${category.toLowerCase()}, con ${featureList.slice(0, 3).join(", ") || "atributos del catálogo"}. Texto SEO listo para revisar antes de importar.`;
  const beforeBuy = [!original.compatibility ? "compatibilidades" : "", !original.dimensions ? "medidas" : "", !original.warranty ? "garantía" : ""].filter(Boolean).join(", ");
  const bullets = (featureList.length ? featureList : ["Atributos estructurados desde CSV", "Texto revisable antes de publicar", "Preparado para ecommerce"]).map((feature) => `• ${feature.charAt(0).toUpperCase()}${feature.slice(1)}`);
  const benefits = [`Mejora la claridad de la ficha en ${category}.`, "Facilita revisión SEO antes de importar.", "Reduce trabajo manual producto por producto."];
  const faqs = [`¿Para qué tipo de uso sirve ${productName}?\nPara catálogos de ${category.toLowerCase()} que necesitan una ficha clara y revisable.`, `¿Debo revisar el contenido antes de publicar?\nSí. Rankelia genera una base SEO avanzada, pero siempre conviene validar claims, medidas y compatibilidades.`, `¿Se publica automáticamente en mi tienda?\nNo. Rankelia exporta CSV/HTML para revisión e importación manual.`];
  const schema = { "@context": "https://schema.org", "@type": "Product", name: productName, sku: original.sku || undefined, gtin: original.ean || undefined, brand: brand ? { "@type": "Brand", name: brand } : undefined, image: original.image_url || undefined, description: shortDescription, offers: original.price ? { "@type": "Offer", price: original.price, priceCurrency: original.currency || "EUR" } : undefined };
  return finalizeOutput(row, settings, {
    seo_product_name: productName,
    keyword_principal: primaryKeyword,
    keywords_secundarias: [...secondary, category, brand].filter(Boolean).slice(0, 8).join("; "),
    keywords_long_tail: longTail.join("; "),
    entidades_relacionadas: entities.join("; "),
    short_description: shortDescription,
    long_description_html: `<p>${shortDescription}</p><h2>Ventajas principales</h2><ul>${benefits.map((b) => `<li>${b}</li>`).join("")}</ul><h2>Especificaciones destacadas</h2><ul>${bullets.map((b) => `<li>${b.replace(/^•\s*/, "")}</li>`).join("")}</ul><h2>Antes de comprar</h2><p>${beforeBuy ? `Revisa ${beforeBuy} en tus datos internos antes de publicar.` : "Comprueba que precio, stock e imágenes coinciden con tu tienda antes de importar."}</p>`,
    bullet_points: bullets.join("\n"),
    benefits: benefits.join("\n"),
    technical_features: featureList.join("\n"),
    use_cases: [`Ficha ecommerce ${category}`, "Importación CSV revisable", "Optimización SEO de catálogo"].join("\n"),
    meta_title: truncate(`${primaryKeyword} ${brand}`.trim(), 58),
    meta_description: truncate(`${productName}: ${featureList.slice(0, 2).join(", ") || "ficha SEO estructurada"}. Revisa datos, disponibilidad y compatibilidades antes de importar.`, 155),
    slug: createSlug(`${primaryKeyword}-${brand || original.sku}`),
    faqs: faqs.join("\n\n"),
    schema_product_json: JSON.stringify(schema, null, 2),
    image_alt_texts: `${productName} ${category}`.trim(),
    internal_link_suggestions: category ? `/categoria/${createSlug(category)} | ${category}` : "",
    cta: "Ver producto",
    quality_warnings: detectQualityWarnings(row).join(" | "),
    fallback_used: true,
    prompt_version: "template-v1.1-quality",
    model_used: "template",
  });
}

export function generateCategoryTemplateResult(row: CsvRow, settings: WorkerGenerationSettings = {}): GenerationOutput {
  const original = originalDataFromRow(row, settings.column_mapping);
  const category = original.categoria || original.nombre_producto || "Categoría";
  const keyword = pick(row, settings.column_mapping, "keyword_principal", category.toLowerCase());
  return finalizeOutput(row, settings, {
    seo_product_name: category,
    keyword_principal: keyword,
    keywords_secundarias: [category, original.subcategoria, original.marca].filter(Boolean).join("; "),
    keywords_long_tail: [`comprar ${keyword}`, `guía ${keyword}`].join("; "),
    entidades_relacionadas: [category, original.subcategoria, original.marca].filter(Boolean).join("; "),
    short_description: `${category}: guía SEO de categoría preparada para revisar, enlazar e importar manualmente.`,
    long_description_html: `<p>${category} reúne productos que deben compararse por uso, compatibilidad, precio y disponibilidad real.</p><h2>Cómo elegir ${category}</h2><ul><li>Revisa características técnicas verificadas.</li><li>Comprueba medidas, materiales y garantías.</li><li>Valida categorías antes de importar.</li></ul><h2>Antes de comprar</h2><p>Confirma compatibilidades, stock, imágenes e impuestos en tu tienda.</p>`,
    bullet_points: "Guía de elección\nFAQs de categoría\nEnlaces internos prudentes",
    benefits: "Ayuda a comparar opciones\nMejora estructura de categoría\nFacilita revisión humana",
    technical_features: original.features,
    use_cases: "Categoría ecommerce\nSEO de catálogo",
    meta_title: truncate(`${keyword} | Guía y catálogo`, 58),
    meta_description: truncate(`Descubre ${category} con criterios de elección, FAQs y recomendaciones para revisar antes de importar en tu ecommerce.`, 155),
    slug: createSlug(keyword),
    faqs: `¿Cómo elegir ${category}?\nRevisa características, compatibilidad, precio, stock e imágenes reales.\n\n¿Rankelia publica esta categoría?\nNo. Exporta contenido para revisión e importación manual.`,
    schema_product_json: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: category, description: `${category} para revisión ecommerce` }, null, 2),
    image_alt_texts: category,
    internal_link_suggestions: `/categoria/${createSlug(category)} | ${category}`,
    cta: "Ver categoría",
    quality_warnings: detectQualityWarnings(row).join(" | "),
    fallback_used: true,
    prompt_version: "category-template-v1.1-quality",
    model_used: "template",
  });
}

export function generateMetadataTemplateResult(row: CsvRow, settings: WorkerGenerationSettings = {}) {
  const output = generateProductTemplateResult(row, { ...settings, generation_type: "metadata_only" });
  return { ...output, short_description: output.meta_description, long_description_html: "", bullet_points: "", benefits: "", use_cases: "" };
}

export function generateOutputForRow(row: CsvRow, settings: WorkerGenerationSettings = {}) {
  const generationType = String(settings.generation_type || settings.generationType || "").toLowerCase();
  if (/products[_ -]?categories|productos.*categor|producto.*categor/.test(generationType)) return generateProductTemplateResult(row, settings);
  if (/metadata|metadatos/.test(generationType)) return generateMetadataTemplateResult(row, settings);
  if (/categor/.test(generationType)) return generateCategoryTemplateResult(row, settings);
  return generateProductTemplateResult(row, settings);
}

export type ExportPlatform = "rankelia" | "shopify" | "woocommerce" | "prestashop" | "generic";
type ExportRow = GenerationOutput;
function splitList(value: string) { return value.split(/[;\n|]/).map((item) => item.trim()).filter(Boolean); }
function first(value: string) { return splitList(value)[0] ?? ""; }
function tags(r: ExportRow) { return Array.from(new Set([r.categoria, r.subcategoria, ...splitList(r.keywords_secundarias), ...splitList(r.keywords_long_tail)].filter(Boolean))).join(", "); }
function platformWarnings(r: ExportRow, platform: ExportPlatform) {
  const warnings = splitList(r.quality_warnings);
  if (!r.sku) warnings.push("Falta SKU/reference: revisar antes de importar.");
  if (!r.price && platform !== "rankelia" && platform !== "generic") warnings.push("Falta precio: revisar importación y offers/schema.");
  if (!r.image_url && platform !== "rankelia" && platform !== "generic") warnings.push("Falta imagen: imágenes externas deben revisarse.");
  if (!r.slug) warnings.push("Slug/handle vacío: generado automáticamente o requiere revisión.");
  if (!r.long_description_html && platform !== "rankelia") warnings.push("HTML de descripción vacío.");
  if (!r.categoria) warnings.push("Categoría vacía o pendiente de mapear.");
  if (r.status === "failed") warnings.push("Fila fallida: no importar sin revisar.");
  if (r.meta_title.length > 70) warnings.push("Meta title largo para SERP/CMS.");
  if (r.meta_description.length > 170) warnings.push("Meta description larga para SERP/CMS.");
  if (platform !== "rankelia" && platform !== "generic") warnings.push("Export CSV orientado: probar primero con 5-10 productos y ajustar configuración de tienda.");
  if (platform === "shopify") warnings.push("Variantes complejas y taxonomía Shopify requieren revisión manual.");
  if (platform === "woocommerce") warnings.push("Campos Yoast requieren plugin Yoast; variables/atributos avanzados no cubiertos en beta.");
  if (platform === "prestashop") warnings.push("Impuestos, combinaciones y categorías PrestaShop pueden requerir ajuste manual.");
  return Array.from(new Set(warnings)).join(" | ");
}

const auditColumns = (r: ExportRow, platform: ExportPlatform) => ({ meta_title_length: r.meta_title_length, meta_title_status: r.meta_title_status, meta_title_issues: r.meta_title_issues, meta_description_length: r.meta_description_length, meta_description_status: r.meta_description_status, meta_description_issues: r.meta_description_issues, slug_status: r.slug_status, slug_issues: r.slug_issues, schema_status: r.schema_status, schema_issues: r.schema_issues, claim_status: r.claim_status, unsupported_claims_detected: r.unsupported_claims_detected, keyword_stuffing_status: r.keyword_stuffing_status, keyword_stuffing_issues: r.keyword_stuffing_issues, missing_data: r.missing_data, eeat_score: r.eeat_score, eeat_warnings: r.eeat_warnings, geo_ai_readiness_score: r.geo_ai_readiness_score, geo_ai_warnings: r.geo_ai_warnings, internal_linking_warnings: r.internal_linking_warnings, platform_export_status: r.platform_export_status, platform_export_warnings: platformWarnings(r, platform), ready_to_publish: r.ready_to_publish, human_review_required: r.human_review_required, main_quality_issue: r.main_quality_issue, blocking_issues: r.blocking_issues, non_blocking_warnings: r.non_blocking_warnings, rankelia_quality_score: r.rankelia_quality_score, confidence_score: r.confidence_score, prompt_version: r.prompt_version ?? "", model_used: r.model_used ?? "", fallback_used: Boolean(r.fallback_used), generated_at: r.generated_at });
function rankeliaRow(r: ExportRow) { return { sku: r.sku, ean: r.ean, nombre_original: r.nombre_producto, nombre_seo: r.seo_product_name, marca: r.marca, categoria: r.categoria, subcategoria: r.subcategoria, price: r.price, currency: r.currency, stock: r.stock, image_url: r.image_url, product_url: r.product_url, descripcion_original: r.original_description, keyword_principal: r.keyword_principal, keywords_secundarias: r.keywords_secundarias, keywords_long_tail: r.keywords_long_tail, entidades_relacionadas: r.entidades_relacionadas, descripcion_corta: r.short_description, descripcion_larga_html: r.long_description_html, bullet_points: r.bullet_points, beneficios: r.benefits, caracteristicas_tecnicas: r.technical_features, casos_uso: r.use_cases, meta_title: r.meta_title, meta_description: r.meta_description, slug: r.slug, faqs_json: r.faqs, schema_product_json: r.schema_product_json, alt_texts: r.image_alt_texts, tags: tags(r), enlaces_internos_sugeridos: r.internal_link_suggestions, cta: r.cta, seo_score: r.seo_score, conversion_score: r.conversion_score, quality_warnings: platformWarnings(r, "rankelia"), status: r.status, error_message: r.error_message, ...auditColumns(r, "rankelia") }; }
function shopifyRow(r: ExportRow) { return { Handle: r.slug, Title: r.seo_product_name, "Body (HTML)": r.long_description_html, Vendor: r.marca, "Product Category": r.categoria, Type: r.categoria, Tags: tags(r), Published: "FALSE", "Option1 Name": "Title", "Option1 Value": "Default Title", "Variant SKU": r.sku, "Variant Price": r.price, "Image Src": r.image_url, "Image Alt Text": first(r.image_alt_texts), "SEO Title": r.meta_title, "SEO Description": r.meta_description, Status: "draft", "Rankelia Warnings": platformWarnings(r, "shopify"), ready_to_publish: r.ready_to_publish, human_review_required: r.human_review_required, rankelia_quality_score: r.rankelia_quality_score }; }
function wooRow(r: ExportRow) { return { Type: "simple", SKU: r.sku, Name: r.seo_product_name, Published: "0", "Short description": r.short_description, Description: r.long_description_html, "Regular price": r.price, Categories: r.categoria, Tags: tags(r), Images: r.image_url, "Meta: _yoast_wpseo_title": r.meta_title, "Meta: _yoast_wpseo_metadesc": r.meta_description, "Rankelia Warnings": platformWarnings(r, "woocommerce"), ready_to_publish: r.ready_to_publish, human_review_required: r.human_review_required, rankelia_quality_score: r.rankelia_quality_score }; }
function prestaRow(r: ExportRow) { return { ID: "", Name: r.seo_product_name, Categories: r.categoria, "Price tax excluded": r.price, Reference: r.sku, "Short description": r.short_description, Description: r.long_description_html, "Meta title": r.meta_title, "Meta keywords": r.keywords_secundarias, "Meta description": r.meta_description, "URL rewritten": r.slug, "Image URLs": r.image_url, Active: "0", "Rankelia Warnings": platformWarnings(r, "prestashop"), ready_to_publish: r.ready_to_publish, human_review_required: r.human_review_required, rankelia_quality_score: r.rankelia_quality_score }; }
function rowsToCsv(rows: Array<Record<string, unknown>>) { const headers = Object.keys(rows[0] ?? {}); return [headers.join(","), ...rows.map((row) => headers.map((header) => esc(row[header])).join(","))].join("\n"); }

export function buildOutputCSV(results: GenerationOutput[], platform: ExportPlatform | string = "rankelia") {
  if (/shopify/i.test(platform)) return rowsToCsv(results.map((r) => shopifyRow(r)));
  if (/woo/i.test(platform)) return rowsToCsv(results.map((r) => wooRow(r)));
  if (/presta/i.test(platform)) return rowsToCsv(results.map((r) => prestaRow(r)));
  return rowsToCsv(results.map((r) => rankeliaRow(r)));
}
export function buildPlatformWarnings(row: GenerationOutput, platform: ExportPlatform | string) { const normalized: ExportPlatform = /shopify/i.test(platform) ? "shopify" : /woo/i.test(platform) ? "woocommerce" : /presta/i.test(platform) ? "prestashop" : "rankelia"; return platformWarnings(row, normalized); }
export const validateShopifyExportRow = (row: GenerationOutput) => buildPlatformWarnings(row, "shopify").split(" | ").filter(Boolean);
export const validateWooCommerceExportRow = (row: GenerationOutput) => buildPlatformWarnings(row, "woocommerce").split(" | ").filter(Boolean);
export const validatePrestaShopExportRow = (row: GenerationOutput) => buildPlatformWarnings(row, "prestashop").split(" | ").filter(Boolean);

export function buildOutputHTML(results: GenerationOutput[], job: { id: string; original_filename?: string | null; platform?: string }) {
  const avgConfidence = Math.round(results.reduce((s, r) => s + r.confidence_score, 0) / Math.max(results.length, 1));
  const avgEEAT = Math.round(results.reduce((s, r) => s + r.eeat_score, 0) / Math.max(results.length, 1));
  const avgGeo = Math.round(results.reduce((s, r) => s + r.geo_ai_readiness_score, 0) / Math.max(results.length, 1));
  const safeJobId = escapeHtml(job.id);
  const safeFile = escapeHtml(job.original_filename ?? "CSV");
  const safePlatform = escapeHtml(job.platform ?? "generic");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Rankelia resultados ${safeJobId}</title><style>body{font-family:system-ui;background:#f8fafc;color:#0f172a;padding:32px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px;margin:18px 0}.score{color:#10b981;font-weight:900}.warn{color:#b45309}</style></head><body><h1>Resultados SEO Rankelia</h1><p>Archivo: ${safeFile} · Plataforma: ${safePlatform} · Revisar antes de publicar.</p><p class="score">Confidence medio ${avgConfidence}/100 · E-E-A-T ${avgEEAT}/100 · GEO/AI readiness ${avgGeo}/100</p>${results.map((r) => `<article class="card"><h2>${escapeHtml(r.seo_product_name)}</h2><p>${escapeHtml(r.short_description)}</p><pre>${escapeHtml(r.bullet_points)}</pre><p><b>Descripción larga saneada:</b></p><div>${sanitizeHtmlFragment(r.long_description_html)}</div><p><b>Meta title:</b> ${escapeHtml(r.meta_title)} (${escapeHtml(r.meta_title_status)})</p><p><b>Meta description:</b> ${escapeHtml(r.meta_description)} (${escapeHtml(r.meta_description_status)})</p><p class="score">SEO ${r.seo_score}/100 · Conversión ${r.conversion_score}/100 · Rankelia ${r.rankelia_quality_score}/100</p><p><b>Ready:</b> ${escapeHtml(r.ready_to_publish)} · Human review: ${r.human_review_required ? "sí" : "no"}</p><p class="warn">${escapeHtml(r.quality_warnings)}</p></article>`).join("")}</body></html>`;
}

export function buildReportTXT(job: { id: string; original_filename?: string | null; platform?: string; estimated_credits?: number }, results: GenerationOutput[], summary: { failed: number; warnings: number }) {
  const avg = Math.round(results.reduce((s, r) => s + r.seo_score, 0) / Math.max(results.length, 1));
  const avgConfidence = Math.round(results.reduce((s, r) => s + r.confidence_score, 0) / Math.max(results.length, 1));
  const avgEEAT = Math.round(results.reduce((s, r) => s + r.eeat_score, 0) / Math.max(results.length, 1));
  const avgGeo = Math.round(results.reduce((s, r) => s + r.geo_ai_readiness_score, 0) / Math.max(results.length, 1));
  const ready = results.filter((r) => r.ready_to_publish === "ready").length;
  const review = results.filter((r) => r.human_review_required).length;
  const topMissing = Array.from(new Set(results.flatMap((r) => splitList(r.missing_data)))).slice(0, 12).join(" | ");
  const topClaims = Array.from(new Set(results.flatMap((r) => splitList(r.unsupported_claims_detected)))).slice(0, 12).join(" | ");
  const products = results.reduce((s, r) => s + r.product_equivalent_used, 0);
  const credits = results.reduce((s, r) => s + r.internal_credits_used, 0);
  return `Informe de calidad Rankelia.ai\n\nJob: ${job.id}\nArchivo original: ${job.original_filename ?? "CSV"}\nFecha: ${new Date().toISOString()}\nPlataforma: ${job.platform ?? "generic"}\nProductos equivalentes consumidos: ${products}\nCréditos internos usados: ${credits}\nFilas procesadas: ${results.length}\nFilas fallidas: ${summary.failed}\nScore medio SEO: ${avg}/100\nConfidence medio: ${avgConfidence}/100\nE-E-A-T medio: ${avgEEAT}/100\nGEO/AI readiness medio: ${avgGeo}/100\nFilas ready_to_publish: ${ready}\nFilas con revisión humana: ${review}\nTop missing data: ${topMissing || "—"}\nTop unsupported claims: ${topClaims || "—"}\nCréditos estimados: ${job.estimated_credits ?? credits}\nWarnings detectados: ${summary.warnings}\n\nRecomendaciones:\n- Añadir EAN/GTIN, imágenes reales, garantía, compatibilidad y medidas cuando falten.\n- Revisar schema, claims, metadatos y enlaces internos antes de publicar.\n- Importar primero 5-10 productos de prueba.\n- No publicar sin revisión humana cuando human_review_required=true.\n\nNotas de importación:\n- Los CSV de plataforma son orientados a importación manual y deben probarse primero con 5-10 productos.\n- Rankelia no publica automáticamente ni garantiza compatibilidad con variantes, impuestos, atributos o categorías específicas de cada tienda.`;
}

export function buildErrorsCSV(failedRows: Array<{ row_index: number; sku?: string; nombre_producto?: string; error_message: string; detected_issues?: string[] }>) {
  const headers = ["row_index","sku","nombre_producto","error_message","detected_issues","recommendation"];
  return [headers.join(","), ...failedRows.map((r) => [r.row_index, r.sku ?? "", r.nombre_producto ?? "", r.error_message, (r.detected_issues ?? []).join(" | "), "Completar datos y reprocesar fila"].map(esc).join(","))].join("\n");
}
