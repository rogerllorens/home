import { calculateJobCredits } from "./pricing";
export type CsvValue = string;
export type CsvRow = Record<string, CsvValue>;

export type ColumnMapping = {
  sku?: string;
  nombre_producto?: string;
  marca?: string;
  categoria?: string;
  subcategoria?: string;
  caracteristicas?: string;
  descripcion_actual?: string;
  keyword_principal?: string;
  keywords_secundarias?: string;
  plataforma?: string;
  precio?: string;
  url_actual?: string;
  imagen_url?: string;
};

export type CsvIssue = {
  rowIndex: number;
  issue: string;
  priority: "Alta" | "Media" | "Baja";
  validationStatus: "valid" | "warning" | "invalid";
};

export type CsvAnalysisSummary = {
  products: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  categories: number;
  platforms: string[];
  emptyDescriptions: number;
  shortDescriptions: number;
  pendingMetaDescriptions: number;
  missingKeywords: number;
  insufficientFeatures: number;
  possibleDuplicates: number;
  estimatedCredits: number;
  currentScore: number;
  estimatedScore: number;
  issues: CsvIssue[];
  preview: Array<Record<string, string | string[]> & { __issues: string[]; __priority: "Alta" | "Media" | "Baja"; __validationStatus: "valid" | "warning" | "invalid" }>;
};

export type GenerationCreditSettings = {
  generationType?: string;
};

const aliases: Record<keyof ColumnMapping, string[]> = {
  sku: ["sku", "reference", "referencia", "id", "product_id"],
  nombre_producto: ["nombre_producto", "nombre", "name", "title", "product_name", "nombre producto"],
  marca: ["marca", "brand", "vendor", "fabricante"],
  categoria: ["categoria", "category", "categories", "categorias"],
  subcategoria: ["subcategoria", "subcategory", "sub_category", "sub category"],
  caracteristicas: ["caracteristicas", "features", "attributes", "atributos", "features_html"],
  descripcion_actual: ["descripcion_actual", "description", "descripcion", "body", "body_html", "short_description"],
  keyword_principal: ["keyword_principal", "keyword", "focus_keyword", "main_keyword", "kw"],
  keywords_secundarias: ["keywords_secundarias", "keywords", "secondary_keywords", "tags"],
  plataforma: ["plataforma", "platform", "cms"],
  precio: ["precio", "price", "regular_price"],
  url_actual: ["url_actual", "url", "handle", "link", "permalink"],
  imagen_url: ["imagen_url", "image", "imagen", "image_url", "image src"],
};

export const demoCsv = `sku,nombre_producto,marca,categoria,caracteristicas,descripcion_actual,keyword_principal,keywords_secundarias,plataforma
BOTA-S3-001,Bota seguridad S3 negra,WorkSafe,Calzado laboral,"puntera reforzada; suela antideslizante; piel resistente","Bota cómoda para trabajar",bota seguridad s3,"bota trabajo; calzado laboral; bota puntera reforzada",Prestashop
TAL-18V-022,Taladro percutor 18V,PowerMax,Herramientas,"batería 18V; portabrocas rápido; luz LED","",taladro percutor 18v,"taladro batería; herramienta eléctrica; taladro profesional",Shopify
GUANTE-NIT-04,Guantes nitrilo caja 100,NitriPro,EPIs,"sin polvo; color azul; uso profesional","Guantes de nitrilo de buena calidad",guantes nitrilo,"guantes desechables; guantes profesionales; guantes sin polvo",WooCommerce`;

export const requiredColumns = ["sku", "nombre_producto", "categoria", "keyword_principal", "plataforma"];

export function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

export function normalizeHeader(header: string) {
  return header.trim().replace(/^\uFEFF/, "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseCSV(text: string) {
  const delimiter = detectDelimiter(text);
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 1) return { headers: [] as string[], rows: [] as CsvRow[], delimiter };
  const rawHeaders = parseLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line, delimiter);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header || `columna_${index + 1}`] = values[index] ?? "";
      return row;
    }, {});
  });
  return { headers, rows, delimiter };
}

export function detectColumns(headers: string[]) {
  return headers.map((header) => ({ header, normalized: normalizeHeader(header) }));
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map((header) => normalizeHeader(header));
  return (Object.keys(aliases) as Array<keyof ColumnMapping>).reduce<ColumnMapping>((mapping, field) => {
    const found = normalized.find((header) => aliases[field].includes(header));
    if (found) mapping[field] = found;
    return mapping;
  }, {});
}

function value(row: CsvRow, mapping: ColumnMapping, field: keyof ColumnMapping) {
  const key = mapping[field];
  return key ? row[key]?.trim() ?? "" : "";
}

export function detectDuplicateRows(rows: CsvRow[], mapping: ColumnMapping) {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();
  rows.forEach((row, index) => {
    const description = value(row, mapping, "descripcion_actual").toLowerCase();
    if (!description) return;
    if (seen.has(description)) {
      duplicates.add(index);
      duplicates.add(seen.get(description) ?? index);
    } else {
      seen.set(description, index);
    }
  });
  return duplicates;
}

export function validateRows(rows: CsvRow[], mapping: ColumnMapping) {
  const duplicateIndexes = detectDuplicateRows(rows, mapping);
  return rows.map((row, index) => {
    const issues: string[] = [];
    const name = value(row, mapping, "nombre_producto");
    const sku = value(row, mapping, "sku");
    const description = value(row, mapping, "descripcion_actual");
    const keyword = value(row, mapping, "keyword_principal");
    const features = value(row, mapping, "caracteristicas");
    if (!name && !sku) issues.push("Fila inválida: falta SKU y nombre de producto.");
    if (!description) issues.push("Descripción vacía.");
    if (description && description.length < 60) issues.push("Descripción corta.");
    if (!keyword) issues.push("Keyword principal faltante.");
    if (!features || features.length < 20) issues.push("Características insuficientes.");
    if (duplicateIndexes.has(index)) issues.push("Posible duplicado por descripción repetida.");
    const invalid = !name && !sku;
    const high = invalid || !description;
    const medium = !high && (description.length < 60 || !keyword || !features || duplicateIndexes.has(index));
    return {
      rowIndex: index,
      issues,
      priority: high ? "Alta" as const : medium ? "Media" as const : "Baja" as const,
      validationStatus: invalid ? "invalid" as const : issues.length ? "warning" as const : "valid" as const,
    };
  });
}

export function calculateCurrentScore(summary: Pick<CsvAnalysisSummary, "totalRows" | "emptyDescriptions" | "shortDescriptions" | "missingKeywords" | "insufficientFeatures" | "invalidRows">) {
  const total = Math.max(summary.totalRows, 1);
  const penalty = Math.round((summary.emptyDescriptions * 14 + summary.shortDescriptions * 7 + summary.missingKeywords * 5 + summary.insufficientFeatures * 4 + summary.invalidRows * 12) / total);
  return Math.max(30, Math.min(70, 60 - penalty));
}

export function calculateEstimatedScore(summary: Pick<CsvAnalysisSummary, "invalidRows" | "insufficientFeatures" | "totalRows">) {
  const qualityPenalty = Math.round(((summary.invalidRows + summary.insufficientFeatures) / Math.max(summary.totalRows, 1)) * 8);
  return Math.max(82, Math.min(90, 90 - qualityPenalty));
}

export function calculateEstimatedCredits(summary: Pick<CsvAnalysisSummary, "validRows" | "categories">, settings?: GenerationCreditSettings) {
  const type = settings?.generationType ?? "Producto completo";
  return calculateJobCredits(summary.validRows, { generationType: type, categories: summary.categories });
}

export function analyzeCSVRows(rows: CsvRow[], mapping: ColumnMapping, settings?: GenerationCreditSettings): CsvAnalysisSummary {
  const validations = validateRows(rows, mapping);
  const categories = new Set(rows.map((row) => value(row, mapping, "categoria")).filter(Boolean));
  const platforms = Array.from(new Set(rows.map((row) => value(row, mapping, "plataforma")).filter(Boolean)));
  const emptyDescriptions = rows.filter((row) => !value(row, mapping, "descripcion_actual")).length;
  const shortDescriptions = rows.filter((row) => {
    const description = value(row, mapping, "descripcion_actual");
    return Boolean(description && description.length < 60);
  }).length;
  const missingKeywords = rows.filter((row) => !value(row, mapping, "keyword_principal")).length;
  const insufficientFeatures = rows.filter((row) => value(row, mapping, "caracteristicas").length < 20).length;
  const invalidRows = validations.filter((row) => row.validationStatus === "invalid").length;
  const summaryBase = {
    products: rows.length - invalidRows,
    totalRows: rows.length,
    validRows: rows.length - invalidRows,
    invalidRows,
    categories: categories.size,
    platforms,
    emptyDescriptions,
    shortDescriptions,
    pendingMetaDescriptions: rows[0] && Object.prototype.hasOwnProperty.call(rows[0], "meta_description") ? 0 : rows.length,
    missingKeywords,
    insufficientFeatures,
    possibleDuplicates: detectDuplicateRows(rows, mapping).size,
  };
  const currentScore = calculateCurrentScore(summaryBase);
  const estimatedScore = calculateEstimatedScore(summaryBase);
  const estimatedCredits = calculateEstimatedCredits(summaryBase, settings);
  return {
    ...summaryBase,
    estimatedCredits,
    currentScore,
    estimatedScore,
    issues: validations.filter((row) => row.issues.length).map((row) => ({ rowIndex: row.rowIndex, issue: row.issues[0], priority: row.priority, validationStatus: row.validationStatus })),
    preview: rows.slice(0, 10).map((row, index) => ({ ...row, __issues: validations[index]?.issues ?? [], __priority: validations[index]?.priority ?? "Baja", __validationStatus: validations[index]?.validationStatus ?? "valid" })),
  };
}

export function generateCSVTemplate() {
  return `sku,nombre_producto,marca,categoria,subcategoria,caracteristicas,material,medidas,color,uso_recomendado,precio,url_actual,descripcion_actual,keyword_principal,keywords_secundarias,idioma,pais,tono,cta,notas
BOTA-S3-001,Bota seguridad S3 negra,WorkSafe,Calzado laboral,Botas de seguridad,"puntera reforzada; suela antideslizante; piel resistente",piel,"tallas 39-46",negro,talleres y obra,49.90,https://example.com/bota-s3,"Bota cómoda para trabajar",bota seguridad s3,"bota trabajo; calzado laboral",es,ES,técnico,Comprar ahora,Confirmar certificación exacta
TAL-18V-022,Taladro percutor 18V,PowerMax,Herramientas,Taladros,"batería 18V; portabrocas rápido; luz LED",metal/plástico,18V,azul,instaladores profesionales,89.00,https://example.com/taladro-18v,"",taladro percutor 18v,"taladro batería; herramienta eléctrica",es,ES,profesional,Ver producto,No inventar autonomía`;
}
