import { getExtraProductPackById, getPlanById, getPlanInternalCredits, getPlanProductAllowance, getSubscriptionPlans, getExtraProductPacks } from "@/lib/pricing";

export type CheckoutItemType = "subscription" | "extra_products";
const PLAN_PRICE_ENV: Record<string, string> = { starter: "STRIPE_PRICE_STARTER_MONTHLY", pro: "STRIPE_PRICE_PRO_MONTHLY", growth: "STRIPE_PRICE_GROWTH_MONTHLY", agency: "STRIPE_PRICE_AGENCY_MONTHLY" };

export function getStripePlanConfig(planId: string) {
  const plan = getPlanById(planId);
  if (plan.id === "free") return null;
  const envKey = PLAN_PRICE_ENV[plan.id];
  const priceId = envKey ? process.env[envKey] : undefined;
  return { ...plan, envKey, priceId, products: getPlanProductAllowance(plan.id), internalCredits: getPlanInternalCredits(plan.id) };
}

export function getStripeExtraPackConfig(packId: string) {
  const pack = getExtraProductPackById(packId);
  if (!pack) return null;
  return { ...pack, priceId: process.env[pack.stripePriceEnvKey] };
}

export function getPlanByStripePriceId(priceId?: string | null) {
  if (!priceId) return null;
  return getSubscriptionPlans().find((plan) => process.env[PLAN_PRICE_ENV[plan.id] ?? ""] === priceId) ?? null;
}

export function getAllStripePlans() { return getSubscriptionPlans().map((plan) => plan.id === "free" ? { ...plan, priceId: null, products: plan.monthlyProducts, internalCredits: getPlanInternalCredits(plan.id) } : getStripePlanConfig(plan.id)); }
export function getAllStripePacks() { return getExtraProductPacks().map((pack) => getStripeExtraPackConfig(pack.id)); }
