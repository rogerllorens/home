import type { DemoUser, Download, Job, PricingPack, Template } from "@/types";

export const demoUser: DemoUser = {
  name: "Laura SEO",
  email: "laura@agencia-demo.com",
  company: "Agencia Demo Commerce",
  plan: "Growth",
  credits: 12480,
};

export const demoCredits = {
  available: 12480,
  usedThisMonth: 8420,
  reserved: 960,
  nextRenewal: "15 jun 2026",
};

export const demoJobs: Job[] = [
  { id: "JOB-1029", name: "Catálogo EPIs junio", platform: "Prestashop", rows: 1240, status: "Procesando", progress: 68, score: 74, createdAt: "Hoy, 09:24" },
  { id: "JOB-1028", name: "Herramientas eléctricas", platform: "Shopify", rows: 420, status: "Listo", progress: 100, score: 86, createdAt: "Ayer, 18:10" },
  { id: "JOB-1027", name: "Categorías B2B", platform: "WooCommerce", rows: 86, status: "En cola", progress: 18, score: 62, createdAt: "Ayer, 16:32" },
  { id: "JOB-1026", name: "Importación legacy", platform: "CSV genérico", rows: 980, status: "Error", progress: 42, score: 41, createdAt: "5 jun 2026" },
];

export const demoDownloads: Download[] = [
  { id: "DL-88", fileName: "shopify_herramientas_seo_ready.csv", platform: "Shopify", rows: 420, size: "3.8 MB", readyAt: "Ayer, 18:55" },
  { id: "DL-87", fileName: "prestashop_calzado_laboral_preview.csv", platform: "Prestashop", rows: 260, size: "2.1 MB", readyAt: "4 jun 2026" },
  { id: "DL-86", fileName: "woocommerce_epis_faqs.csv", platform: "WooCommerce", rows: 180, size: "1.7 MB", readyAt: "2 jun 2026" },
];

export const demoTemplates: Template[] = [
  { id: "TPL-01", name: "Producto técnico B2B", platform: "Prestashop", sector: "Industrial", outputs: ["Descripción", "Metas", "FAQs", "Schema Product"], status: "Activa" },
  { id: "TPL-02", name: "Categoría ecommerce SEO", platform: "WooCommerce", sector: "Retail", outputs: ["H1", "Texto superior", "Texto inferior", "Schema CollectionPage"], status: "Activa" },
  { id: "TPL-03", name: "Shopify fast import", platform: "Shopify", sector: "DTC", outputs: ["Body HTML", "Tags", "Alt text", "Slugs"], status: "Borrador" },
];

export const pricingPacks: PricingPack[] = [
  { name: "Starter", credits: 5000, price: "49 €", description: "Para validar catálogos pequeños y previews SEO." },
  { name: "Growth", credits: 25000, price: "149 €", description: "Para ecommerce en crecimiento y agencias pequeñas.", featured: true },
  { name: "Scale", credits: 100000, price: "449 €", description: "Para agencias y catálogos grandes con jobs recurrentes." },
];

export const platforms = ["Shopify", "Prestashop", "WooCommerce", "CSV genérico"];

export const csvFormats = [
  { platform: "Shopify", description: "Export listo para columnas SEO, tags, handle y alt text." },
  { platform: "Prestashop", description: "Campos adaptados a referencia, URL reescrita, metas y descripciones." },
  { platform: "WooCommerce", description: "CSV compatible con SKU, slug, descripciones y atributos SEO." },
  { platform: "CSV genérico", description: "Formato neutro para ERPs, PIMs o integraciones personalizadas." },
];

export const dashboardStats = [
  { title: "Créditos disponibles", value: "12.480", description: "960 reservados en jobs activos", trend: "+18% vs mes anterior", icon: "◆" },
  { title: "Jobs activos", value: "2", description: "1 procesando y 1 en cola", trend: "68% avance medio", icon: "◷" },
  { title: "Descargas listas", value: "3", description: "CSV revisables generados", trend: "Última hace 15 h", icon: "↓" },
  { title: "Productos procesados", value: "4.286", description: "Productos + categorías", trend: "+1.240 esta semana", icon: "▦" },
  { title: "Score medio", value: "78/100", description: "SEO + conversión", trend: "+12 puntos", icon: "◎" },
  { title: "Plan actual", value: "Growth", description: "Preparado para agencias", trend: "Renueva 15 jun", icon: "✦" },
];

export const adminStats = [
  { title: "Usuarios demo", value: "128", description: "34 activos esta semana", trend: "+9% WoW", icon: "◎" },
  { title: "Jobs recientes", value: "412", description: "38 en las últimas 24 h", trend: "98,2% success", icon: "◷" },
  { title: "Errores", value: "7", description: "CSV inválido o timeout mock", trend: "Revisar logs", icon: "!" },
  { title: "Créditos asignados", value: "2,4 M", description: "Saldo agregado clientes", trend: "+180k hoy", icon: "◆" },
  { title: "Coste IA estimado", value: "384 €", description: "Mock mensual interno", trend: "0,009 €/fila", icon: "Σ" },
  { title: "Ingresos simulados", value: "12.840 €", description: "MRR + packs mock", trend: "+22% MoM", icon: "€" },
  { title: "Margen estimado", value: "81%", description: "Después de coste IA mock", trend: "Saludable", icon: "%" },
];

export const diagnosisDemo = {
  rows: 1840,
  products: 1716,
  categories: 124,
  emptyDescriptions: 392,
  missingMetas: 1180,
  duplicateRisks: 47,
  opportunities: ["Crear FAQs por categoría", "Normalizar slugs", "Añadir entidades técnicas", "Mejorar meta descriptions truncadas"],
};
