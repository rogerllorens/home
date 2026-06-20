import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "./client";
import { getStripeExtraPackConfig, getStripePlanConfig } from "./config";

type User = { id: string; email: string };

export async function getOrCreateStripeCustomer(user: User) {
  const supabase = createServiceClient();
  const existing = await supabase.from("billing_customers").select("*").eq("user_id", user.id).maybeSingle<{ stripe_customer_id: string | null }>();
  if (existing.data?.stripe_customer_id) return existing.data.stripe_customer_id;
  const stripe = getStripe();
  const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
  await supabase.from("billing_customers").upsert({ user_id: user.id, stripe_customer_id: customer.id, email: user.email }, { onConflict: "user_id" });
  return customer.id;
}

export async function createExtraProductsCheckoutSession(user: User, packId: string) {
  const pack = getStripeExtraPackConfig(packId);
  if (!pack) throw new Error("Pack de productos no válido.");
  if (!pack.priceId) throw new Error(`Falta configurar ${pack.stripePriceEnvKey}.`);
  const stripe = getStripe();
  const supabase = createServiceClient();
  const customer = await getOrCreateStripeCustomer(user);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [{ price: pack.priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/app/credits?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/app/credits?checkout=cancelled`,
    metadata: { user_id: user.id, item_type: "extra_products", pack_id: pack.id, products: String(pack.quantity), credits: String(pack.internalCredits) },
  });
  await supabase.from("checkout_sessions").insert({ user_id: user.id, stripe_session_id: session.id, mode: "payment", item_type: "extra_products", extra_pack_id: pack.id, products: pack.quantity, credits: pack.internalCredits, amount_total: session.amount_total, currency: session.currency ?? "eur", status: "created" });
  return session;
}

export async function createSubscriptionCheckoutSession(user: User, planId: string) {
  const plan = getStripePlanConfig(planId);
  if (!plan) throw new Error("El plan Free no necesita Checkout.");
  if (!plan.priceId) throw new Error(`Falta configurar ${plan.envKey}.`);
  const stripe = getStripe();
  const supabase = createServiceClient();
  const customer = await getOrCreateStripeCustomer(user);
  const active = await supabase.from("subscriptions").select("stripe_subscription_id,status").eq("user_id", user.id).in("status", ["active", "trialing", "past_due"]).maybeSingle();
  if (active.data?.stripe_subscription_id) throw new Error("Ya tienes una suscripción activa. Usa el portal de Stripe para cambiarla.");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/app/billing?checkout=cancelled`,
    metadata: { user_id: user.id, item_type: "subscription", plan_id: plan.id, product_allowance: String(plan.products), internal_credit_allowance: String(plan.internalCredits) },
    subscription_data: { metadata: { user_id: user.id, plan_id: plan.id } },
  });
  await supabase.from("checkout_sessions").insert({ user_id: user.id, stripe_session_id: session.id, mode: "subscription", item_type: "subscription", plan_id: plan.id, products: plan.products, credits: plan.internalCredits, amount_total: session.amount_total, currency: session.currency ?? "eur", status: "created" });
  return session;
}

export async function createCustomerPortalSession(user: User) {
  const supabase = createServiceClient();
  const customer = await supabase.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle<{ stripe_customer_id: string | null }>();
  if (!customer.data?.stripe_customer_id) throw new Error("Aún no tienes customer de Stripe. Contrata un plan o compra productos extra primero.");
  return getStripe().billingPortal.sessions.create({ customer: customer.data.stripe_customer_id, return_url: `${getAppUrl()}/app/billing` });
}

export function sessionUrl(session: Stripe.Checkout.Session | Stripe.BillingPortal.Session) {
  if (!session.url) throw new Error("Stripe no devolvió URL de redirección.");
  return session.url;
}
