import { normalizeQualityLevel, type QualityLevel } from "./pricing";

export type PlanId = "free" | "starter" | "pro" | "growth" | "agency";

export type PlanLimits = {
  maxProductsPerJob: number;
  maxConcurrentJobs: number;
  previewsPerDay: number;
  allowedQualities: QualityLevel[];
  allowedGenerationTypes: string[];
  allowedExportFormats: string[];
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: { maxProductsPerJob: 100, maxConcurrentJobs: 1, previewsPerDay: 3, allowedQualities: ["standard"], allowedGenerationTypes: ["product_complete", "metadata_only"], allowedExportFormats: ["generic"] },
  starter: { maxProductsPerJob: 250, maxConcurrentJobs: 1, previewsPerDay: 10, allowedQualities: ["standard"], allowedGenerationTypes: ["product_complete", "metadata_only"], allowedExportFormats: ["generic"] },
  pro: { maxProductsPerJob: 1000, maxConcurrentJobs: 2, previewsPerDay: 30, allowedQualities: ["standard", "pro"], allowedGenerationTypes: ["product_complete", "products_categories", "metadata_only"], allowedExportFormats: ["generic", "shopify", "woocommerce", "prestashop"] },
  growth: { maxProductsPerJob: 2500, maxConcurrentJobs: 3, previewsPerDay: 60, allowedQualities: ["standard", "pro"], allowedGenerationTypes: ["product_complete", "products_categories", "metadata_only", "categories_seo"], allowedExportFormats: ["generic", "shopify", "woocommerce", "prestashop"] },
  agency: { maxProductsPerJob: 5000, maxConcurrentJobs: 5, previewsPerDay: 100, allowedQualities: ["standard", "pro", "premium"], allowedGenerationTypes: ["product_complete", "products_categories", "metadata_only", "categories_seo"], allowedExportFormats: ["generic", "shopify", "woocommerce", "prestashop"] },
};

export function normalizePlanId(planId?: string | null): PlanId {
  const id = String(planId ?? "free").toLowerCase();
  if (id === "starter" || id === "pro" || id === "growth" || id === "agency") return id;
  return "free";
}

export function getPlanLimits(planId?: string | null) {
  return PLAN_LIMITS[normalizePlanId(planId)];
}

export function isQualityAllowed(planId: string | null | undefined, quality: string) {
  return getPlanLimits(planId).allowedQualities.includes(normalizeQualityLevel(quality));
}

export function isGenerationTypeAllowed(planId: string | null | undefined, generationType: string) {
  return getPlanLimits(planId).allowedGenerationTypes.includes(generationType);
}

export function normalizeExportFormat(platform = "generic") {
  if (/shopify/i.test(platform)) return "shopify";
  if (/woo/i.test(platform)) return "woocommerce";
  if (/presta/i.test(platform)) return "prestashop";
  return "generic";
}

export function isExportFormatAllowed(planId: string | null | undefined, platform: string) {
  return getPlanLimits(planId).allowedExportFormats.includes(normalizeExportFormat(platform));
}
