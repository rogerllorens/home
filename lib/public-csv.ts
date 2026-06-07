export type CsvRow = Record<string, string>;

export type PublicDiagnosis = {
  rows: CsvRow[];
  products: number;
  categories: number;
  emptyDescriptions: number;
  shortDescriptions: number;
  pendingMetaDescriptions: number;
  possibleDuplicates: number;
  insufficientData: number;
  detectedKeywords: number;
  estimatedCredits: number;
  manualHours: number;
  rankeliaHours: number;
  savedHours: number;
  manualCost: number;
  rankeliaCost: number;
  estimatedSavings: number;
  currentScore: number;
  estimatedScore: number;
  preview: Array<{
    product: string;
    category: string;
    description: string;
    keyword: string;
    issue: string;
    priority: "Alta" | "Media" | "Baja";
  }>;
};

export const publicDemoCsv = `sku,nombre_producto,marca,categoria,caracteristicas,descripcion_actual,keyword_principal,keywords_secundarias,plataforma
BOTA-S3-001,Bota seguridad S3 negra,WorkSafe,Calzado laboral,"puntera reforzada; suela antideslizante; piel resistente","Bota cómoda para trabajar",bota seguridad s3,"bota trabajo; calzado laboral; bota puntera reforzada",Prestashop
TAL-18V-022,Taladro percutor 18V,PowerMax,Herramientas,"batería 18V; portabrocas rápido; luz LED","",taladro percutor 18v,"taladro batería; herramienta eléctrica; taladro profesional",Shopify
GUANTE-NIT-04,Guantes nitrilo caja 100,NitriPro,EPIs,"sin polvo; color azul; uso profesional","Guantes de nitrilo de buena calidad",guantes nitrilo,"guantes desechables; guantes profesionales; guantes sin polvo",WooCommerce
ACEITE-5W30-01,Aceite motor 5W30 5L,MotoLub,Recambios coche,"sintético; 5 litros; protección motor","Aceite para coche",aceite motor 5w30,"aceite sintético; lubricante motor; aceite coche",Prestashop
FILTRO-AIR-22,Filtro de aire universal,AirMax,Recambios coche,"compatible universal; mejora flujo de aire; fácil instalación","",filtro de aire coche,"filtro motor; recambio coche; mantenimiento coche",WooCommerce`;

export const publicTemplateCsv = `sku,nombre_producto,marca,categoria,subcategoria,caracteristicas,material,medidas,color,uso_recomendado,precio,url_actual,descripcion_actual,keyword_principal,keywords_secundarias,idioma,pais,tono,cta,notas
BOTA-S3-001,Bota seguridad S3 negra,WorkSafe,Calzado laboral,Botas de seguridad,"puntera reforzada; suela antideslizante; piel resistente",Piel,"38-47",Negro,"talleres; obra; industria",59.90,https://tienda.com/bota-s3,"Bota cómoda para trabajar",bota seguridad s3,"bota trabajo; calzado laboral",es,ES,profesional,Comprar ahora,Revisar certificación exacta
TAL-18V-022,Taladro percutor 18V,PowerMax,Herramientas,Taladros,"batería 18V; portabrocas rápido; luz LED",Metal/plástico,"18V",Azul,"bricolaje; instaladores; mantenimiento",89.00,https://tienda.com/taladro-18v,"",taladro percutor 18v,"taladro batería; herramienta eléctrica",es,ES,técnico,Ver disponibilidad,Incluir autonomía si está disponible`;

export const platformExamples = {
  Shopify: `Handle,Title,Body HTML,Vendor,Tags,SEO Title,SEO Description,Image Alt Text
bota-seguridad-s3-negra,Bota de seguridad S3 negra,"<p>Bota S3 con puntera reforzada...</p>",WorkSafe,"bota seguridad,calzado laboral",Bota de seguridad S3 negra | Trabajo,"Compra bota de seguridad S3 negra...",Bota seguridad S3 negra con puntera reforzada`,
  Prestashop: `Reference,Name,Short description,Description,Meta title,Meta description,URL rewritten,Categories
BOTA-S3-001,Bota de seguridad S3 negra,"Bota S3 resistente para uso profesional","Descripción larga optimizada...",Bota de seguridad S3 negra,"Compra bota S3 con puntera reforzada...",bota-seguridad-s3-negra,Calzado laboral`,
  WooCommerce: `SKU,Name,Short description,Description,Categories,Tags,Yoast title,Yoast description,Slug
BOTA-S3-001,Bota de seguridad S3 negra,"Bota S3 para trabajos exigentes","Descripción larga optimizada...",Calzado laboral,"bota seguridad,calzado laboral",Bota de seguridad S3 negra,"Compra bota S3 con puntera reforzada...",bota-seguridad-s3-negra`,
  "CSV genérico": `sku,title,short_description,long_description,meta_title,meta_description,slug,primary_keyword
BOTA-S3-001,Bota de seguridad S3 negra,Bota S3 resistente,Descripción larga optimizada,Bota de seguridad S3 negra,Compra bota S3 con puntera reforzada,bota-seguridad-s3-negra,bota seguridad s3`,
} as const;

export function parseCSV(text: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((cells) => headers.reduce<CsvRow>((record, header, index) => {
    record[header] = cells[index]?.trim() ?? "";
    return record;
  }, {})).filter((record) => Object.values(record).some(Boolean));
}

export function createSlug(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function detectQualityIssues(row: CsvRow) {
  const description = row.descripcion_actual?.trim() ?? "";
  const features = row.caracteristicas?.trim() ?? "";
  const keyword = row.keyword_principal?.trim() ?? "";

  if (!description) return "Descripción vacía";
  if (description.length < 60) return "Descripción corta";
  if (!keyword) return "Keyword detectada pendiente";
  if (features.length < 18) return "Faltan características";
  if (["buena calidad", "cómoda", "universal"].some((word) => description.toLowerCase().includes(word))) return "Riesgo de texto genérico";
  return "Optimizable";
}

export function calculateDemoScore(row: CsvRow) {
  let score = 60;
  const description = row.descripcion_actual?.trim() ?? "";
  if (!description) score -= 18;
  if (description && description.length < 60) score -= 10;
  if (!row.keyword_principal?.trim()) score -= 8;
  if (!row.caracteristicas?.trim() || row.caracteristicas.trim().length < 18) score -= 8;
  return Math.max(35, Math.min(65, score));
}

export function getRecommendedPack(credits: number) {
  const packs = [
    { credits: 10000, price: 9 },
    { credits: 25000, price: 19 },
    { credits: 50000, price: 29 },
    { credits: 100000, price: 49 },
    { credits: 250000, price: 99 },
    { credits: 500000, price: 179 },
    { credits: 1000000, price: 299 },
  ];
  return packs.find((pack) => pack.credits >= credits) ?? packs[packs.length - 1];
}

export function analyzePublicCSV(rows: CsvRow[]): PublicDiagnosis {
  const validRows = rows.filter((row) => row.nombre_producto || row.sku);
  const descriptions = validRows.map((row) => (row.descripcion_actual ?? "").trim().toLowerCase()).filter(Boolean);
  const duplicateDescriptions = descriptions.filter((description, index) => descriptions.indexOf(description) !== index);
  const emptyDescriptions = validRows.filter((row) => !(row.descripcion_actual ?? "").trim()).length;
  const shortDescriptions = validRows.filter((row) => {
    const description = (row.descripcion_actual ?? "").trim();
    return description.length > 0 && description.length < 60;
  }).length;
  const insufficientData = validRows.filter((row) => !(row.caracteristicas ?? "").trim() || (row.caracteristicas ?? "").trim().length < 18).length;
  const detectedKeywords = validRows.filter((row) => (row.keyword_principal ?? "").trim()).length;
  const averageCurrentScore = validRows.length ? Math.round(validRows.reduce((sum, row) => sum + calculateDemoScore(row), 0) / validRows.length) : 42;
  const currentScore = Math.max(35, Math.min(65, averageCurrentScore - emptyDescriptions * 2));
  const estimatedScore = Math.max(82, Math.min(90, 86 + Math.round((detectedKeywords / Math.max(validRows.length, 1)) * 4) - insufficientData));
  const estimatedCredits = validRows.length * 250;
  const manualHours = Math.round((validRows.length * 8) / 60);
  const rankeliaHours = Math.max(1, Math.round((validRows.length * 0.5) / 60));
  const savedHours = Math.max(0, manualHours - rankeliaHours);
  const manualCost = manualHours * 25;
  const recommendedPack = getRecommendedPack(estimatedCredits);
  const rankeliaCost = recommendedPack.price;

  return {
    rows: validRows,
    products: validRows.length,
    categories: new Set(validRows.map((row) => row.categoria).filter(Boolean)).size,
    emptyDescriptions,
    shortDescriptions,
    pendingMetaDescriptions: validRows.length,
    possibleDuplicates: duplicateDescriptions.length,
    insufficientData,
    detectedKeywords,
    estimatedCredits,
    manualHours,
    rankeliaHours,
    savedHours,
    manualCost,
    rankeliaCost,
    estimatedSavings: Math.max(0, manualCost - rankeliaCost),
    currentScore,
    estimatedScore,
    preview: validRows.slice(0, 5).map((row) => {
      const issue = detectQualityIssues(row);
      return {
        product: row.nombre_producto || row.sku || "Producto sin nombre",
        category: row.categoria || "Sin categoría",
        description: row.descripcion_actual || "Vacía",
        keyword: row.keyword_principal || "Pendiente",
        issue,
        priority: issue.includes("vacía") || issue.includes("Faltan") ? "Alta" : issue.includes("corta") || issue.includes("genérico") ? "Media" : "Baja",
      };
    }),
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
