export type QualityLevel = "standard" | "pro" | "premium";

export const PRODUCT_STANDARD_CREDITS = 500;
export const PRODUCT_PRO_CREDITS = 1000;
export const PRODUCT_PREMIUM_CREDITS = 2000;
export const METADATA_CREDITS = 50;
export const CATEGORY_SEO_CREDITS = 5000;
export const FREE_PRODUCTS = 3;

export const QUALITY_OPTIONS = [
  { id: "standard" as const, label: "Estándar", multiplier: 1, credits: PRODUCT_STANDARD_CREDITS, description: "Meta title, metadescripción, slug, descripción HTML, 3 FAQs, tags y schema básico." },
  { id: "pro" as const, label: "Pro", multiplier: 2, credits: PRODUCT_PRO_CREDITS, description: "Todo estándar + descripción larga, 5 FAQs, enlaces internos, warnings y notas de conversión." },
  { id: "premium" as const, label: "Premium", multiplier: 4, credits: PRODUCT_PREMIUM_CREDITS, description: "Todo Pro + validación avanzada anti-claims, bloque comparativo, informe detallado y revisión de calidad." },
];

export const SUBSCRIPTION_PLANS = [
  { id: "free", name: "Free", price: "0 €", monthlyProducts: 3, featured: false, ideal: "Probar Rankelia sin tarjeta", equivalent: "3 estándar · 1 Pro · 0 Premium", features: ["3 productos estándar de prueba", "Diagnóstico CSV", "Preview demo", "1 proyecto/tienda", "Exportación limitada"] },
  { id: "starter", name: "Starter", price: "19 €/mes", monthlyProducts: 50, featured: false, ideal: "Tiendas pequeñas", equivalent: "50 estándar · 25 Pro · 12 Premium aprox.", features: ["50 productos estándar/mes", "Importación CSV", "Export CSV básico", "Metas, slug, descripción HTML", "3 FAQs y schema básico"] },
  { id: "pro", name: "Pro", price: "39 €/mes", monthlyProducts: 150, featured: true, ideal: "Ecommerce en crecimiento", equivalent: "150 estándar · 75 Pro · 37 Premium aprox.", features: ["150 productos estándar/mes", "Export Shopify/Prestashop/WooCommerce", "Enlaces internos", "Warnings y score SEO", "Hasta 3 proyectos"] },
  { id: "growth", name: "Growth", price: "69 €/mes", monthlyProducts: 350, featured: false, ideal: "Catálogos medianos", equivalent: "350 estándar · 175 Pro · 87 Premium aprox.", features: ["350 productos estándar/mes", "Procesamiento por lotes", "Plantillas por categoría", "Validación avanzada", "Prioridad media en cola"] },
  { id: "agency", name: "Agency", price: "149 €/mes", monthlyProducts: 1000, featured: false, ideal: "Agencias y multi-tiendas", equivalent: "1.000 estándar · 500 Pro · 250 Premium", features: ["1.000 productos estándar/mes", "Multi-cliente", "15 proyectos/tiendas", "Cola prioritaria", "Reportes y descargas avanzadas"] },
];

export const EXTRA_PRODUCT_PACKS = [
  { id: "products_25", quantity: 25, price: 9, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_25", recommendedFor: "Primer lote pequeño" },
  { id: "products_50", quantity: 50, price: 15, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_50", recommendedFor: "Tienda pequeña" },
  { id: "products_100", quantity: 100, price: 29, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_100", recommendedFor: "Campaña puntual" },
  { id: "products_250", quantity: 250, price: 59, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_250", recommendedFor: "Catálogo en crecimiento", highlighted: true },
  { id: "products_500", quantity: 500, price: 99, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_500", recommendedFor: "Migración ecommerce" },
  { id: "products_1000", quantity: 1000, price: 179, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_1000", recommendedFor: "Catálogo completo" },
  { id: "products_2500", quantity: 2500, price: 399, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_2500", recommendedFor: "Lote agencia" },
  { id: "products_5000", quantity: 5000, price: 699, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_5000", recommendedFor: "Multi-tienda" },
  { id: "products_10000", quantity: 10000, price: 1199, stripePriceEnvKey: "STRIPE_PRICE_PRODUCTS_10000", recommendedFor: "Operación masiva" },
].map((pack) => ({ ...pack, internalCredits: pack.quantity * PRODUCT_STANDARD_CREDITS, pricePerProduct: pack.price / pack.quantity, label: `${pack.quantity.toLocaleString("es-ES")} productos SEO extra` }));

export function getSubscriptionPlans() { return SUBSCRIPTION_PLANS; }
export function getExtraProductPacks() { return EXTRA_PRODUCT_PACKS; }
export function getPlanById(planId: string) { return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId.toLowerCase()) ?? SUBSCRIPTION_PLANS[0]; }
export function getExtraProductPackById(packId: string) { return EXTRA_PRODUCT_PACKS.find((pack) => pack.id === packId || `products_${pack.quantity}` === packId); }
export function getPlanProductAllowance(planId: string) { return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId.toLowerCase() || plan.name.toLowerCase() === planId.toLowerCase())?.monthlyProducts ?? FREE_PRODUCTS; }
export function getPlanInternalCredits(planId: string) { return getPlanProductAllowance(planId) * PRODUCT_STANDARD_CREDITS; }
export function getCreditsForExtraProductPack(packId: string) { return getExtraProductPackById(packId)?.internalCredits ?? 0; }
export function getProductsForExtraProductPack(packId: string) { return getExtraProductPackById(packId)?.quantity ?? 0; }
export function getProductsForPlan(planId: string) { return getPlanProductAllowance(planId); }
export function getCreditsForPlan(planId: string) { return getPlanInternalCredits(planId); }
export function getQualityMultiplier(qualityLevel: string = "standard") { return QUALITY_OPTIONS.find((option) => option.id === normalizeQualityLevel(qualityLevel))?.multiplier ?? 1; }
export function normalizeQualityLevel(value = "standard"): QualityLevel {
  if (/premium/i.test(value)) return "premium";
  if (/pro|equilibrado/i.test(value)) return "pro";
  return "standard";
}
export function calculateProductEquivalentCredits(count: number, qualityLevel: string = "standard") { return count * PRODUCT_STANDARD_CREDITS * getQualityMultiplier(qualityLevel); }
export function getVisibleProductCountFromCredits(credits: number) { return Math.floor(credits / PRODUCT_STANDARD_CREDITS); }
export function formatCreditsAsProducts(credits: number) { return `${getVisibleProductCountFromCredits(credits).toLocaleString("es-ES")} productos estándar equivalentes`; }
export function getProductPackByQuantity(quantity: number) { return EXTRA_PRODUCT_PACKS.find((pack) => pack.quantity >= quantity) ?? EXTRA_PRODUCT_PACKS[EXTRA_PRODUCT_PACKS.length - 1]; }
export function getRecommendedPackForDeficit(deficitCredits: number) { return getProductPackByQuantity(Math.ceil(deficitCredits / PRODUCT_STANDARD_CREDITS)); }
export function normalizeGenerationType(value = "product_complete") {
  const type = value.toLowerCase().trim();
  if (/products[_ -]?categories|productos\s*\+\s*categor/i.test(type)) return "products_categories";
  if (/solo metadatos|metadata/i.test(type)) return "metadata_only";
  if (/categories_seo|categor/i.test(type) && !/product|producto/i.test(type)) return "categories_seo";
  return "product_complete";
}
export function calculateJobCredits(rowCount: number, settings?: { generationType?: string; quality?: string; qualityLevel?: string; categories?: number }) {
  const generationType = normalizeGenerationType(settings?.generationType ?? "product_complete");
  if (generationType === "metadata_only") return rowCount * METADATA_CREDITS;
  if (generationType === "categories_seo") return (settings?.categories ?? rowCount) * CATEGORY_SEO_CREDITS;
  if (generationType === "products_categories") return calculateProductEquivalentCredits(rowCount, settings?.qualityLevel ?? settings?.quality) + (settings?.categories ?? 0) * CATEGORY_SEO_CREDITS;
  return calculateProductEquivalentCredits(rowCount, settings?.qualityLevel ?? settings?.quality);
}
export function calculateProductEquivalentUsed(rowCount: number, qualityLevel: string = "standard") { return rowCount * getQualityMultiplier(qualityLevel); }
export function formatProductAllowance(plan: { monthlyProducts: number }) { return `${plan.monthlyProducts.toLocaleString("es-ES")} productos estándar/mes`; }
export function formatPricePerProduct(pack: { price: number; quantity: number }) { return `${(pack.price / pack.quantity).toLocaleString("es-ES", { maximumFractionDigits: 3 })} €/producto`; }
