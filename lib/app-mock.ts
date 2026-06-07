import { analyzePublicCSV, createSlug, downloadCsv, parseCSV, publicDemoCsv, publicTemplateCsv, type CsvRow } from "@/lib/public-csv";

export { downloadCsv, parseCSV };

export type AppJobStatus = "En cola" | "Procesando" | "Completado" | "Error" | "Cancelado";
export type GenerationType = "Producto completo" | "Solo metadatos" | "Categorías SEO" | "Productos + categorías";
export type DestinationPlatform = "Shopify" | "Prestashop" | "WooCommerce" | "CSV genérico";
export type AppDownloadFormat = "CSV" | "HTML" | "TXT" | "Errores CSV";

export type GenerationSettings = {
  platform: DestinationPlatform;
  language: "Español" | "Catalán" | "Inglés" | "Francés";
  country: "España" | "México" | "Colombia" | "Francia" | "Estados Unidos";
  generationType: GenerationType;
  quality: "Rápido" | "Equilibrado" | "Premium";
  length: "Corta" | "Media" | "Larga";
  tone: "Profesional" | "Técnico" | "Comercial" | "Natural" | "Premium" | "B2B industrial";
  cta: "Comprar ahora" | "Ver producto" | "Solicitar información" | "Añadir al carrito" | "Consultar disponibilidad";
  forbiddenWords: string;
  brandNotes: string;
  sector: string;
  includeFaqs: boolean;
  includeSchema: boolean;
  includeAltText: boolean;
  includeInternalLinks: boolean;
  avoidHype: boolean;
  doNotInvent: boolean;
};

export type ProductResult = {
  sku: string;
  productName: string;
  seoProductName: string;
  keywordPrincipal: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  entities: string[];
  shortDescription: string;
  longDescriptionHtml: string;
  bulletPoints: string[];
  benefits: string[];
  technicalFeatures: string[];
  useCases: string[];
  metaTitle: string;
  metaDescription: string;
  slug: string;
  faqs: string[];
  schemaProductJson: string;
  imageAltTexts: string[];
  internalLinkSuggestions: string[];
  cta: string;
  seoScore: number;
  conversionScore: number;
  qualityWarnings: string[];
};

export type AppJob = {
  id: string;
  fileName: string;
  type: GenerationType;
  platform: DestinationPlatform;
  rows: number;
  status: AppJobStatus;
  progress: number;
  score: number;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
  warnings: number;
  errors: number;
  logs: string[];
};

export type AppDownload = {
  id: string;
  jobId: string;
  fileName: string;
  format: AppDownloadFormat;
  platform: DestinationPlatform;
  rows: number;
  score: number;
  size: string;
  createdAt: string;
  content: string;
};

export type CreditTransaction = {
  id: string;
  date: string;
  concept: string;
  type: "Compra" | "Consumo" | "Promo" | "Plan";
  credits: number;
  balance: number;
  amount?: string;
  status?: string;
};

export type AppTemplate = {
  id: string;
  name: string;
  type: string;
  platform: DestinationPlatform | "Todas";
  sector: string;
  language: string;
  active: boolean;
  quality: number;
  updatedAt: string;
  prompt: string;
  fields: string[];
  example: string;
};

export type ProjectSettings = {
  projectName: string;
  website: string;
  defaultPlatform: DestinationPlatform;
  country: string;
  language: string;
  currency: string;
  brandTone: string;
  defaultCta: string;
  forbiddenWords: string;
  brandNotes: string;
  mainSector: string;
  defaultLength: string;
  includeFaqs: boolean;
  includeSchema: boolean;
  includeAltText: boolean;
  defaultExportFormat: string;
  csvSeparator: "," | ";";
  encoding: "UTF-8" | "UTF-8 BOM";
  includeTxtReport: boolean;
  includeErrorsCsv: boolean;
  notifyCompleted: boolean;
  notifyErrors: boolean;
  notifyLowCredits: boolean;
  weeklySummary: boolean;
};

export type AppState = {
  user: { name: string; email: string; company: string };
  plan: { name: string; monthlyCredits: number; status: string };
  credits: number;
  promoUsed: boolean;
  jobs: AppJob[];
  downloads: AppDownload[];
  transactions: CreditTransaction[];
  templates: AppTemplate[];
  settings: ProjectSettings;
  currentCSV: { fileName: string; rows: CsvRow[]; columns: string[]; analysis: CsvAnalysis } | null;
  previewResults: ProductResult[];
};

export type CsvAnalysis = ReturnType<typeof analyzeCSV>;

export const appDemoCsv = publicDemoCsv;
export const appTemplateCsv = publicTemplateCsv;

export const defaultGenerationSettings: GenerationSettings = {
  platform: "Prestashop",
  language: "Español",
  country: "España",
  generationType: "Producto completo",
  quality: "Equilibrado",
  length: "Media",
  tone: "Técnico",
  cta: "Comprar ahora",
  forbiddenWords: "barato, el mejor, garantizado",
  brandNotes: "No inventar certificaciones. Priorizar claridad técnica y beneficios verificables.",
  sector: "Industrial",
  includeFaqs: true,
  includeSchema: true,
  includeAltText: true,
  includeInternalLinks: true,
  avoidHype: true,
  doNotInvent: true,
};

export const creditPacks = [
  { credits: 10000, price: 9, ideal: "validar previews y metadatos" },
  { credits: 25000, price: 19, ideal: "tienda pequeña" },
  { credits: 50000, price: 29, ideal: "catálogo en crecimiento" },
  { credits: 100000, price: 49, ideal: "lote medio" },
  { credits: 250000, price: 99, ideal: "1.000 productos completos" },
  { credits: 500000, price: 179, ideal: "catálogo grande" },
  { credits: 1000000, price: 299, ideal: "agencia y B2B" },
];

export const monthlyPlans = [
  { id: "free", name: "Free", price: "0 €", credits: "10.000 créditos demo", features: ["Diagnóstico CSV", "5 filas preview", "Exportación limitada"] },
  { id: "starter", name: "Starter", price: "19 €/mes", credits: "50.000 créditos/mes", features: ["Productos SEO", "Metadatos", "Export CSV básico"] },
  { id: "pro", name: "Pro", price: "49 €/mes", credits: "250.000 créditos/mes", features: ["Categorías SEO", "Export Shopify/Prestashop/WooCommerce", "Score SEO", "Descargas"], featured: true },
  { id: "agency", name: "Agency", price: "149 €/mes", credits: "1.000.000 créditos/mes", features: ["Multi-proyecto", "Procesamiento prioritario", "Plantillas por sector", "Reportes"] },
];

export function nowLabel() {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date());
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function detectMissingFields(row: CsvRow) {
  return ["sku", "nombre_producto", "categoria", "caracteristicas", "keyword_principal"].filter((field) => !row[field]?.trim());
}

export function detectDuplicateRisk(rows: CsvRow[]) {
  const descriptions = rows.map((row) => row.descripcion_actual?.trim().toLowerCase()).filter(Boolean);
  return descriptions.filter((description, index) => descriptions.indexOf(description) !== index).length;
}

export function detectQualityWarnings(row: CsvRow) {
  const warnings: string[] = [];
  const description = row.descripcion_actual?.trim() ?? "";
  const features = row.caracteristicas?.trim() ?? "";
  if (!description) warnings.push("Descripción original vacía.");
  if (description && description.length < 60) warnings.push("Descripción original demasiado corta.");
  if (!row.keyword_principal?.trim()) warnings.push("Falta keyword principal.");
  if (!features || features.length < 18) warnings.push("Faltan características técnicas suficientes.");
  if (/buena calidad|cómoda|universal/i.test(description)) warnings.push("Posible contenido genérico o poco diferencial.");
  if (/seguridad|s3|certific/i.test(`${row.nombre_producto} ${features}`)) warnings.push("Confirmar certificación exacta antes de publicar.");
  if (!/medida|talla|litro|v|cm|mm/i.test(`${row.caracteristicas} ${row.nombre_producto}`)) warnings.push("Añadir medidas, tallas o datos exactos si están disponibles.");
  return warnings.length ? warnings : ["Revisar tono y claims antes de publicar."];
}

export function extractKeywords(row: CsvRow) {
  const principal = row.keyword_principal?.trim() || createSlug(row.nombre_producto || row.sku || "producto").replace(/-/g, " ");
  const secondary = generateSecondaryKeywords(row);
  return { principal, secondary };
}

export function generateSecondaryKeywords(row: CsvRow) {
  const provided = row.keywords_secundarias?.split(";").map((item) => item.trim()).filter(Boolean) ?? [];
  const category = row.categoria?.toLowerCase();
  const brand = row.marca;
  return Array.from(new Set([...provided, category ? `${category} profesional` : "producto ecommerce", brand ? `${brand} ${row.nombre_producto}` : "compra online"])).slice(0, 5);
}

export function calculateSEOScore(row: CsvRow, result?: Partial<ProductResult>) {
  let score = 74;
  if (row.descripcion_actual?.trim()) score += 4;
  if ((row.descripcion_actual ?? "").length < 60) score -= 8;
  if (row.keyword_principal?.trim()) score += 5;
  if (row.caracteristicas?.trim()) score += 5;
  if (result?.metaTitle && result?.metaDescription) score += 5;
  return Math.max(45, Math.min(94, score));
}

export function calculateConversionScore(row: CsvRow, result?: Partial<ProductResult>) {
  let score = 72;
  if (row.marca?.trim()) score += 4;
  if (row.caracteristicas?.includes(";")) score += 7;
  if (result?.bulletPoints?.length) score += 6;
  return Math.max(50, Math.min(92, score));
}

export function analyzeCSV(rows: CsvRow[]) {
  const base = analyzePublicCSV(rows);
  const platforms = Array.from(new Set(rows.map((row) => row.plataforma).filter(Boolean)));
  return {
    ...base,
    platforms,
    columns: rows[0] ? Object.keys(rows[0]) : [],
    duplicateRisk: detectDuplicateRisk(rows),
    issues: rows.map((row) => ({ sku: row.sku, issue: detectQualityWarnings(row)[0], missing: detectMissingFields(row) })),
  };
}

export function estimateCredits(rows: CsvRow[], settings: GenerationSettings) {
  const categories = new Set(rows.map((row) => row.categoria).filter(Boolean)).size;
  if (settings.generationType === "Solo metadatos") return rows.length * 25;
  if (settings.generationType === "Categorías SEO") return categories * 2500;
  if (settings.generationType === "Productos + categorías") return rows.length * 250 + categories * 2500;
  return rows.length * 250;
}

function splitFeatures(row: CsvRow) {
  return (row.caracteristicas || "").split(";").map((item) => item.trim()).filter(Boolean);
}

export function generateProductResult(row: CsvRow, index = 0, settings: GenerationSettings = defaultGenerationSettings): ProductResult {
  const productName = row.nombre_producto || `Producto ${index + 1}`;
  const brand = row.marca ? `${row.marca} ` : "";
  const category = row.categoria || "ecommerce";
  const features = splitFeatures(row);
  const { principal, secondary } = extractKeywords(row);
  const seoProductName = `${productName} ${brand ? brand.trim() : ""}`.includes(row.marca || "__") ? productName : `${productName} ${brand.trim()}`.trim();
  const entities = Array.from(new Set([...features, category.toLowerCase(), principal, "uso profesional"])).filter(Boolean).slice(0, 6);
  const longTailKeywords = [
    `${principal} para ${category.toLowerCase()}`,
    `${productName.toLowerCase()} uso profesional`,
    `${principal} ${brand.trim() || "online"}`.trim(),
  ];
  const warnings = detectQualityWarnings(row);
  const shortDescription = `${productName} ${brand ? `de ${brand.trim()} ` : ""}pensado para ${category.toLowerCase()}, con ${features.slice(0, 3).join(", ") || "atributos clave del catálogo"} y enfoque ${settings.tone.toLowerCase()} para compra ecommerce.`;
  const bulletPoints = features.length
    ? features.slice(0, 4).map((feature) => `${feature.charAt(0).toUpperCase()}${feature.slice(1)} para mejorar la ficha y la decisión de compra.`)
    : ["Estructura clara para revisión SEO.", "Contenido preparado para importar por CSV.", "Avisos de calidad para evitar claims no verificados."];
  const result: ProductResult = {
    sku: row.sku || `SKU-${index + 1}`,
    productName,
    seoProductName: `${seoProductName} ${brand && !seoProductName.includes(brand.trim()) ? brand.trim() : ""}`.trim(),
    keywordPrincipal: principal,
    secondaryKeywords: secondary,
    longTailKeywords,
    entities,
    shortDescription,
    longDescriptionHtml: `<h2>${productName}: ficha SEO preparada para ${category}</h2><p>${shortDescription}</p><ul>${bulletPoints.map((point) => `<li>${point}</li>`).join("")}</ul><p>Revisa los datos técnicos antes de publicar y adapta el contenido al tono de tu tienda.</p>`,
    bulletPoints,
    benefits: ["Mejora la claridad de la ficha.", "Reduce trabajo manual de redacción.", "Facilita importación y revisión por lotes."],
    technicalFeatures: features.length ? features : ["Características pendientes de completar"],
    useCases: [`Compra en ${category}`, "Catálogo ecommerce", "Optimización SEO por lotes"],
    metaTitle: `${principal.slice(0, 38)} ${brand ? `| ${brand.trim()}` : "| Ecommerce"}`.slice(0, 60),
    metaDescription: `${productName} ${brand ? `${brand.trim()} ` : ""}con ${features.slice(0, 2).join(", ") || "datos preparados"}. Optimiza tu catálogo con contenido SEO revisable.`.slice(0, 155),
    slug: createSlug(`${principal}-${brand || productName}`),
    faqs: [`¿Para qué sirve ${productName}?`, `¿Qué revisar antes de publicar ${productName}?`],
    schemaProductJson: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", sku: row.sku, name: productName, brand: row.marca || undefined }, null, 2),
    imageAltTexts: [`${productName} ${brand}`.trim(), `${principal} para ${category}`],
    internalLinkSuggestions: [`/${createSlug(category)}`, `/${createSlug(principal)}`],
    cta: settings.cta,
    seoScore: 0,
    conversionScore: 0,
    qualityWarnings: warnings,
  };
  result.seoScore = calculateSEOScore(row, result);
  result.conversionScore = calculateConversionScore(row, result);
  return result;
}

export function generateCategoryResult(row: CsvRow, index = 0, settings: GenerationSettings = defaultGenerationSettings) {
  return generateProductResult({ ...row, nombre_producto: row.categoria || `Categoría ${index + 1}` }, index, settings);
}

export function generatePreview(rows: CsvRow[], settings: GenerationSettings) {
  return rows.slice(0, 3).map((row, index) => settings.generationType === "Categorías SEO" ? generateCategoryResult(row, index, settings) : generateProductResult(row, index, settings));
}

export function createCsvContent(results: ProductResult[]) {
  const headers = ["sku", "nombre_producto", "seo_product_name", "keyword_principal", "keywords_secundarias", "keywords_long_tail", "short_description", "long_description_html", "bullet_points", "meta_title", "meta_description", "slug", "faqs", "schema_product_json", "image_alt_texts", "seo_score", "conversion_score", "quality_warnings"];
  const escape = (value: unknown) => `"${String(Array.isArray(value) ? value.join("; ") : value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...results.map((result) => headers.map((header) => escape((result as unknown as Record<string, unknown>)[header] ?? result[header as keyof ProductResult])).join(","))].join("\n");
}

export function createHtmlContent(results: ProductResult[]) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Rankelia resultados</title><style>body{font-family:system-ui;background:#f8fafc;color:#0f172a;padding:32px}.card{background:white;border:1px solid #e2e8f0;border-radius:20px;padding:24px;margin:16px 0}.score{color:#10b981;font-weight:800}</style></head><body><h1>Resultados SEO Rankelia</h1>${results.map((result) => `<article class="card"><h2>${result.seoProductName}</h2><p>${result.shortDescription}</p><p><b>Meta title:</b> ${result.metaTitle}</p><p><b>Meta description:</b> ${result.metaDescription}</p><p class="score">SEO ${result.seoScore}/100 · Conversión ${result.conversionScore}/100</p></article>`).join("")}</body></html>`;
}

export function createReportContent(job: Pick<AppJob, "fileName" | "rows" | "score" | "warnings" | "creditsUsed">, results: ProductResult[]) {
  return `Informe de calidad Rankelia.ai\n\nArchivo: ${job.fileName}\nFilas procesadas: ${job.rows}\nScore medio: ${job.score}/100\nAvisos principales: ${job.warnings}\nCréditos usados: ${job.creditsUsed}\n\nRecomendaciones:\n- Revisar certificaciones, claims y datos técnicos antes de publicar.\n- Priorizar productos con descripciones vacías o cortas.\n- Validar slugs y metadatos en el CMS antes de importar.\n\nPrimeros resultados:\n${results.map((result) => `- ${result.sku}: ${result.seoProductName} (${result.seoScore}/100)`).join("\n")}`;
}

export function buildDownloads(job: AppJob, results: ProductResult[]): AppDownload[] {
  const base = job.fileName.replace(/\.[^.]+$/, "");
  return [
    { id: `DL-${Date.now()}-CSV`, jobId: job.id, fileName: `${base}-optimizado.csv`, format: "CSV", platform: job.platform, rows: job.rows, score: job.score, size: "48 KB", createdAt: nowLabel(), content: createCsvContent(results) },
    { id: `DL-${Date.now()}-HTML`, jobId: job.id, fileName: `${base}.html`, format: "HTML", platform: job.platform, rows: job.rows, score: job.score, size: "32 KB", createdAt: nowLabel(), content: createHtmlContent(results) },
    { id: `DL-${Date.now()}-TXT`, jobId: job.id, fileName: `informe-${base}.txt`, format: "TXT", platform: job.platform, rows: job.rows, score: job.score, size: "9 KB", createdAt: nowLabel(), content: createReportContent(job, results) },
  ];
}

export function downloadAppFile(download: AppDownload) {
  const extension = download.format === "HTML" ? "html" : download.format === "TXT" ? "txt" : "csv";
  const mime = download.format === "HTML" ? "text/html" : download.format === "TXT" ? "text/plain" : "text/csv";
  if (download.format === "CSV") return downloadCsv(download.fileName, download.content);
  const blob = new Blob([download.content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = download.fileName.endsWith(extension) ? download.fileName : `${download.fileName}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const demoResults = generatePreview(parseCSV(appDemoCsv), defaultGenerationSettings);

export function createInitialAppState(): AppState {
  const completedJob: AppJob = {
    id: "JOB-2406-001",
    fileName: "productos-prestashop.csv",
    type: "Producto completo",
    platform: "Prestashop",
    rows: 500,
    status: "Completado",
    progress: 100,
    score: 86,
    creditsUsed: 125000,
    createdAt: "06 jun, 10:20",
    completedAt: "06 jun, 10:46",
    warnings: 12,
    errors: 0,
    logs: ["Archivo recibido", "Columnas detectadas", "Generando producto 1/500", "Calculando scores", "Creando CSV final", "Trabajo completado"],
  };
  const downloads = buildDownloads(completedJob, demoResults).map((download, index) => ({ ...download, id: `DL-DEMO-${index + 1}`, createdAt: "06 jun, 10:47" }));
  return {
    user: { name: "Roger demo", email: "roger@rankelia-demo.com", company: "Demo Commerce" },
    plan: { name: "Pro beta", monthlyCredits: 250000, status: "Beta privada" },
    credits: 250000,
    promoUsed: false,
    jobs: [
      completedJob,
      { id: "JOB-2406-002", fileName: "productos-shopify.csv", type: "Productos + categorías", platform: "Shopify", rows: 620, status: "Procesando", progress: 64, score: 82, creditsUsed: 155000, createdAt: "Hoy, 09:18", warnings: 18, errors: 0, logs: ["Archivo recibido", "Mapeo validado", "Generando productos", "Calculando scores"] },
      { id: "JOB-2406-003", fileName: "categorias-woocommerce.csv", type: "Categorías SEO", platform: "WooCommerce", rows: 24, status: "En cola", progress: 8, score: 0, creditsUsed: 60000, createdAt: "Hoy, 10:05", warnings: 0, errors: 0, logs: ["Trabajo creado", "Esperando worker disponible"] },
    ],
    downloads,
    transactions: [
      { id: "TR-001", date: "01 jun", concept: "Plan Pro beta", type: "Plan", credits: 250000, balance: 250000, amount: "49 €", status: "Pagado" },
      { id: "TR-002", date: "06 jun", concept: "Consumo productos-prestashop.csv", type: "Consumo", credits: -125000, balance: 125000, status: "Completado" },
      { id: "TR-003", date: "06 jun", concept: "Créditos beta añadidos", type: "Promo", credits: 125000, balance: 250000, status: "Aplicado" },
    ],
    templates: createTemplates(),
    settings: createDefaultSettings(),
    currentCSV: null,
    previewResults: [],
  };
}

export function createTemplates(): AppTemplate[] {
  const names = ["Producto ecommerce estándar", "Producto técnico", "Categoría SEO", "Prestashop técnico", "Shopify comercial", "WooCommerce natural", "Marketplace", "B2B industrial", "Moda", "Automoción", "Herramientas", "Belleza", "Electrónica", "Hogar", "Jardín"];
  return names.map((name, index) => ({
    id: `TPL-${String(index + 1).padStart(2, "0")}`,
    name,
    type: name.includes("Categoría") ? "Categoría" : "Producto",
    platform: name.includes("Shopify") ? "Shopify" : name.includes("WooCommerce") ? "WooCommerce" : name.includes("Prestashop") ? "Prestashop" : "Todas",
    sector: name.includes("B2B") ? "Industrial" : name,
    language: "Español",
    active: index < 4,
    quality: 82 + (index % 12),
    updatedAt: `${String(1 + index).padStart(2, "0")} jun`,
    prompt: `Genera contenido SEO ecommerce para ${name}. Usa atributos del CSV, evita keyword stuffing y no inventes características.`,
    fields: ["Descripción", "Metas", "Slug", "Keywords", "Avisos", "Score"],
    example: `${name}: meta title, descripción corta, bullets y warnings preparados para revisión.`,
  }));
}

export function createDefaultSettings(): ProjectSettings {
  return {
    projectName: "Demo Commerce SEO",
    website: "https://demo-commerce.test",
    defaultPlatform: "Prestashop",
    country: "España",
    language: "Español",
    currency: "EUR",
    brandTone: "Técnico profesional",
    defaultCta: "Comprar ahora",
    forbiddenWords: "barato, garantizado, el mejor",
    brandNotes: "Mantener tono claro, no inventar certificaciones y priorizar atributos reales del CSV.",
    mainSector: "Industrial",
    defaultLength: "Media",
    includeFaqs: true,
    includeSchema: true,
    includeAltText: true,
    defaultExportFormat: "CSV Prestashop",
    csvSeparator: ",",
    encoding: "UTF-8 BOM",
    includeTxtReport: true,
    includeErrorsCsv: true,
    notifyCompleted: true,
    notifyErrors: true,
    notifyLowCredits: true,
    weeklySummary: false,
  };
}
