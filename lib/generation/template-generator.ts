import type { ColumnMapping, CsvRow } from "../csv";
import { calculateJobCredits, calculateProductEquivalentUsed, normalizeQualityLevel, type QualityLevel } from "../pricing";

export type GenerationOutput = {
  sku: string; nombre_producto: string; marca: string; categoria: string; seo_product_name: string; keyword_principal: string;
  keywords_secundarias: string; keywords_long_tail: string; entidades_relacionadas: string; short_description: string; long_description_html: string;
  bullet_points: string; benefits: string; technical_features: string; use_cases: string; meta_title: string; meta_description: string; slug: string;
  faqs: string; schema_product_json: string; image_alt_texts: string; internal_link_suggestions: string; cta: string; seo_score: number; conversion_score: number;
  quality_warnings: string; quality_level: QualityLevel; product_equivalent_used: number; internal_credits_used: number; status: "completed" | "failed"; error_message: string;
};

export type WorkerGenerationSettings = { platform?: string; generation_type?: string; generationType?: string; quality_level?: string; quality?: string; tone?: string; language?: string; country?: string; includeFaqs?: boolean; includeSchema?: boolean; includeAltText?: boolean; column_mapping?: ColumnMapping };

function createSlug(text: string) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
const pick = (row: CsvRow, mapping: ColumnMapping | undefined, key: keyof ColumnMapping, fallback = "") => (mapping?.[key] ? row[mapping[key]!] : row[key]) || fallback;
const split = (value: string) => value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
const esc = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const truncate = (value: string, max: number) => value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;

export function calculateSEOScore(row: CsvRow, output: Partial<GenerationOutput>) {
  let score = 72;
  if (output.meta_title && output.meta_title.length <= 62) score += 5;
  if (output.meta_description && output.meta_description.length >= 120 && output.meta_description.length <= 165) score += 6;
  if (output.short_description && output.short_description.length > 80) score += 4;
  if (row.caracteristicas || output.technical_features) score += 5;
  if (output.faqs) score += 4;
  if (!output.keyword_principal) score -= 8;
  return Math.max(58, Math.min(94, score));
}

export function calculateConversionScore(row: CsvRow, output: Partial<GenerationOutput>) {
  let score = 70;
  if (output.bullet_points) score += 7;
  if (output.benefits) score += 6;
  if (output.cta) score += 5;
  if (!row.precio) score -= 2;
  return Math.max(55, Math.min(93, score));
}

export function detectQualityWarnings(row: CsvRow, output?: Partial<GenerationOutput>) {
  const warnings: string[] = [];
  if (!row.caracteristicas || row.caracteristicas.length < 20) warnings.push("Completar características técnicas antes de publicar.");
  if (!row.descripcion_actual || row.descripcion_actual.length < 60) warnings.push("Descripción original vacía o corta: revisar tono final.");
  if (/s3|certific/i.test(`${row.nombre_producto} ${row.caracteristicas}`)) warnings.push("Confirmar certificaciones exactas antes de publicar.");
  if (!row.imagen_url) warnings.push("Añadir imagen real para validar alt text.");
  if (output?.meta_description && output.meta_description.length > 165) warnings.push("Meta description larga: revisar en CMS.");
  return warnings;
}

export function generateProductTemplateResult(row: CsvRow, settings: WorkerGenerationSettings = {}): GenerationOutput {
  const mapping = settings.column_mapping;
  const name = pick(row, mapping, "nombre_producto", row.nombre_producto || row.sku || "Producto sin nombre");
  if (!name || name === "Producto sin nombre") throw new Error("Fila sin nombre de producto utilizable");
  const sku = pick(row, mapping, "sku", row.sku || "");
  const brand = pick(row, mapping, "marca", row.marca || "");
  const category = pick(row, mapping, "categoria", row.categoria || "General");
  const features = pick(row, mapping, "caracteristicas", row.caracteristicas || "");
  const primaryKeyword = pick(row, mapping, "keyword_principal", row.keyword_principal || name.toLowerCase());
  const secondary = split(pick(row, mapping, "keywords_secundarias", row.keywords_secundarias || ""));
  const quality = normalizeQualityLevel(settings.quality_level || settings.quality);
  const productName = `${name}${brand && !name.toLowerCase().includes(brand.toLowerCase()) ? ` ${brand}` : ""}`.trim();
  const featureList = split(features).slice(0, quality === "standard" ? 4 : 7);
  const longTail = [`comprar ${primaryKeyword}`, `${primaryKeyword} ${category}`.toLowerCase(), `${primaryKeyword} profesional`];
  const entities = [category, brand, ...featureList].filter(Boolean).slice(0, 8);
  const shortDescription = `${productName} pensado para ${category.toLowerCase()}, con ${featureList.slice(0, 3).join(", ") || "atributos del catálogo"}. Texto SEO listo para revisar antes de importar.`;
  const bullets = (featureList.length ? featureList : ["Atributos estructurados desde CSV", "Texto revisable antes de publicar", "Preparado para ecommerce"]).map((feature) => `• ${feature.charAt(0).toUpperCase()}${feature.slice(1)}`);
  const benefits = [`Mejora la claridad de la ficha en ${category}.`, "Facilita revisión SEO antes de importar.", "Reduce trabajo manual producto por producto."];
  const faqs = [
    `¿Para qué tipo de uso sirve ${productName}?\nPara catálogos de ${category.toLowerCase()} que necesitan una ficha clara y revisable.`,
    `¿Debo revisar el contenido antes de publicar?\nSí. Rankelia genera una base SEO avanzada, pero siempre conviene validar claims, medidas y compatibilidades.`,
    `¿Se puede importar en ecommerce?\nSí, el resultado se entrega en CSV/HTML para revisión e importación.`
  ];
  if (quality !== "standard") faqs.push(`¿Qué datos conviene completar?\nCaracterísticas, medidas, imágenes reales, precio y atributos verificables.`);
  if (quality === "premium") faqs.push(`¿Qué aporta Premium?\nMás contexto, recomendaciones y validaciones mock anti-invenciones para equipos SEO.`);
  const slug = createSlug(`${primaryKeyword}-${brand || category}`);
  const metaTitle = truncate(`${primaryKeyword} ${brand ? `| ${brand}` : `| ${category}`}`, 60);
  const metaDescription = truncate(`${productName} con ${featureList.slice(0, 3).join(", ") || "contenido estructurado"}. Revisa ficha SEO, metas, FAQs y schema antes de importar.`, 158);
  const output: Partial<GenerationOutput> = {
    sku, nombre_producto: name, marca: brand, categoria: category, seo_product_name: productName, keyword_principal: primaryKeyword,
    keywords_secundarias: secondary.join("; "), keywords_long_tail: longTail.join("; "), entidades_relacionadas: entities.join("; "), short_description: shortDescription,
    long_description_html: `<h2>${productName}</h2><p>${shortDescription}</p><ul>${bullets.map((b) => `<li>${b.replace(/^• /, "")}</li>`).join("")}</ul>${quality !== "standard" ? `<p>Recomendado para equipos que necesitan consistencia SEO, control de warnings y exportación organizada por lote.</p>` : ""}`,
    bullet_points: bullets.join("\n"), benefits: benefits.join("\n"), technical_features: featureList.join("\n"), use_cases: [`Catálogos ${category}`, "Fichas ecommerce", "Migraciones CSV"].join("\n"),
    meta_title: metaTitle, meta_description: metaDescription, slug, faqs: faqs.join("\n\n"),
    schema_product_json: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", sku, name: productName, brand: brand ? { "@type": "Brand", name: brand } : undefined, category }, null, 2),
    image_alt_texts: `${productName} - ${primaryKeyword}`, internal_link_suggestions: [`/${createSlug(category)}`, `/${createSlug(primaryKeyword)}`].join("; "), cta: settings.tone === "Técnico" ? "Ver especificaciones" : "Ver producto",
  };
  const seo = calculateSEOScore(row, output);
  const conversion = calculateConversionScore(row, output);
  const warnings = detectQualityWarnings(row, output);
  return { ...(output as GenerationOutput), seo_score: seo, conversion_score: conversion, quality_warnings: warnings.join(" | "), quality_level: quality, product_equivalent_used: calculateProductEquivalentUsed(1, quality), internal_credits_used: calculateJobCredits(1, { generationType: settings.generation_type || settings.generationType, qualityLevel: quality }), status: "completed", error_message: "" };
}

export function generateCategoryTemplateResult(row: CsvRow, settings: WorkerGenerationSettings = {}) { return generateProductTemplateResult({ ...row, nombre_producto: row.categoria || row.nombre_producto || "Categoría ecommerce" }, settings); }
export function generateMetadataTemplateResult(row: CsvRow, settings: WorkerGenerationSettings = {}) { const result = generateProductTemplateResult(row, settings); return { ...result, long_description_html: "", faqs: "", schema_product_json: "" }; }
export function generateOutputForRow(row: CsvRow, settings: WorkerGenerationSettings = {}) { if (/categor/i.test(settings.generation_type || settings.generationType || "")) return generateCategoryTemplateResult(row, settings); if (/metadata/i.test(settings.generation_type || "")) return generateMetadataTemplateResult(row, settings); return generateProductTemplateResult(row, settings); }

export function buildOutputCSV(results: GenerationOutput[], platform = "generic") {
  const common = ["sku","nombre_producto","marca","categoria","seo_product_name","keyword_principal","keywords_secundarias","keywords_long_tail","entidades_relacionadas","short_description","long_description_html","bullet_points","meta_title","meta_description","slug","faqs","schema_product_json","image_alt_texts","internal_link_suggestions","cta","seo_score","conversion_score","quality_warnings","quality_level","product_equivalent_used","internal_credits_used","status","error_message"];
  const platformHeaders = /shopify/i.test(platform) ? ["Handle","Title","Body HTML","Vendor","Tags","SEO Title","SEO Description","Image Alt Text"] : /prestashop/i.test(platform) ? ["Reference","Name","Short description","Description","Meta title","Meta description","URL rewritten","Categories"] : /woo/i.test(platform) ? ["Name","SKU","Short description","Description","Categories","Tags","Yoast title","Yoast description"] : [];
  const headers = [...platformHeaders, ...common];
  return [headers.join(","), ...results.map((r) => headers.map((h) => esc(platformValue(h, r) ?? (r as unknown as Record<string, unknown>)[h])).join(","))].join("\n");
}

function platformValue(header: string, r: GenerationOutput) { const map: Record<string, unknown> = { Handle: r.slug, Title: r.seo_product_name, "Body HTML": r.long_description_html, Vendor: r.marca, Tags: r.keywords_secundarias, "SEO Title": r.meta_title, "SEO Description": r.meta_description, "Image Alt Text": r.image_alt_texts, Reference: r.sku, Name: r.seo_product_name, "Short description": r.short_description, Description: r.long_description_html, "Meta title": r.meta_title, "Meta description": r.meta_description, "URL rewritten": r.slug, Categories: r.categoria, SKU: r.sku, "Yoast title": r.meta_title, "Yoast description": r.meta_description }; return map[header]; }

export function buildOutputHTML(results: GenerationOutput[], job: { id: string; original_filename?: string | null; platform?: string }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Rankelia resultados ${job.id}</title><style>body{font-family:system-ui;background:#f8fafc;color:#0f172a;padding:32px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px;margin:18px 0}.score{color:#10b981;font-weight:900}.warn{color:#b45309}</style></head><body><h1>Resultados SEO Rankelia</h1><p>Archivo: ${job.original_filename ?? "CSV"} · Plataforma: ${job.platform ?? "generic"} · Revisar antes de publicar.</p>${results.map((r) => `<article class="card"><h2>${r.seo_product_name}</h2><p>${r.short_description}</p><pre>${r.bullet_points}</pre><p><b>Meta title:</b> ${r.meta_title}</p><p><b>Meta description:</b> ${r.meta_description}</p><p class="score">SEO ${r.seo_score}/100 · Conversión ${r.conversion_score}/100</p><p class="warn">${r.quality_warnings}</p></article>`).join("")}</body></html>`;
}

export function buildReportTXT(job: { id: string; original_filename?: string | null; platform?: string; estimated_credits?: number }, results: GenerationOutput[], summary: { failed: number; warnings: number }) {
  const avg = Math.round(results.reduce((s, r) => s + r.seo_score, 0) / Math.max(results.length, 1));
  const products = results.reduce((s, r) => s + r.product_equivalent_used, 0);
  const credits = results.reduce((s, r) => s + r.internal_credits_used, 0);
  return `Informe de calidad Rankelia.ai\n\nJob: ${job.id}\nArchivo original: ${job.original_filename ?? "CSV"}\nFecha: ${new Date().toISOString()}\nPlataforma: ${job.platform ?? "generic"}\nProductos equivalentes consumidos (mock): ${products}\nCréditos internos usados (mock): ${credits}\nFilas procesadas: ${results.length}\nFilas fallidas: ${summary.failed}\nScore medio: ${avg}/100\nCréditos estimados: ${job.estimated_credits ?? credits}\nWarnings detectados: ${summary.warnings}\n\nRecomendaciones:\n- Revisar certificaciones, compatibilidades y claims antes de publicar.\n- Añadir imágenes reales y alt text validado.\n- Completar medidas, precios y características técnicas.\n- Revisar metadatos en el CMS antes de importar.\n- No publicar sin revisión humana.\n\nPróximos pasos:\n- Prompt 8 conectará IA real y validación JSON avanzada.\n- Prompt 9 activará Stripe y consumo real de productos/uso.`;
}

export function buildErrorsCSV(failedRows: Array<{ row_index: number; sku?: string; nombre_producto?: string; error_message: string; detected_issues?: string[] }>) {
  const headers = ["row_index","sku","nombre_producto","error_message","detected_issues","recommendation"];
  return [headers.join(","), ...failedRows.map((r) => [r.row_index, r.sku ?? "", r.nombre_producto ?? "", r.error_message, (r.detected_issues ?? []).join(" | "), "Completar datos y reprocesar fila"].map(esc).join(","))].join("\n");
}
