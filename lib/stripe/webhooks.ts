import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { getPlanByStripePriceId } from "./config";
import { getExtraProductPackById, getPlanById } from "@/lib/pricing";
import { addCredits } from "@/lib/billing/credits";

const unixToIso = (value?: number | null) => value ? new Date(value * 1000).toISOString() : null;

async function recordEvent(event: Stripe.Event) {
  const supabase = createServiceClient();
  const existing = await supabase.from("payment_events").select("id,processed").eq("stripe_event_id", event.id).maybeSingle();
  if (existing.data?.processed) return { supabase, duplicate: true };
  if (!existing.data) await supabase.from("payment_events").insert({ stripe_event_id: event.id, event_type: event.type, payload: event as unknown as Record<string, unknown>, processed: false });
  return { supabase, duplicate: false };
}

async function markProcessed(eventId: string, error?: string) {
  const supabase = createServiceClient();
  await supabase.from("payment_events").update({ processed: !error, error_message: error ?? null, processed_at: new Date().toISOString() }).eq("stripe_event_id", eventId);
}

export async function handleStripeEvent(event: Stripe.Event) {
  const { duplicate } = await recordEvent(event);
  if (duplicate) return { duplicate: true };
  try {
    if (event.type === "checkout.session.completed") await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, event.id);
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") await upsertSubscription(event.data.object as Stripe.Subscription);
    if (event.type === "customer.subscription.deleted") await deleteSubscription(event.data.object as Stripe.Subscription);
    if (event.type === "invoice.payment_succeeded") await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, event.id);
    if (event.type === "invoice.payment_failed") await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
    await markProcessed(event.id);
    return { duplicate: false };
  } catch (error) {
    await markProcessed(event.id, error instanceof Error ? error.message : "Webhook failed");
    throw error;
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const supabase = createServiceClient();
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  await supabase.from("checkout_sessions").update({ status: "completed", completed_at: new Date().toISOString(), amount_total: session.amount_total, currency: session.currency ?? "eur" }).eq("stripe_session_id", session.id);
  if (!userId) throw new Error("checkout.session.completed sin user_id");
  await supabase.from("billing_customers").upsert({ user_id: userId, stripe_customer_id: String(session.customer ?? ""), email: session.customer_details?.email ?? session.customer_email ?? null }, { onConflict: "user_id" });
  if (session.mode === "payment" && metadata.item_type === "extra_products") {
    const pack = getExtraProductPackById(metadata.pack_id ?? "");
    if (!pack) throw new Error("Pack de productos desconocido en metadata.");
    const existing = await supabase.from("credit_transactions").select("id").eq("stripe_session_id", session.id).maybeSingle();
    if (!existing.data) await addCredits(supabase, userId, pack.internalCredits, "purchase", `${pack.quantity.toLocaleString("es-ES")} productos extra comprados`, { stripe_session_id: session.id, stripe_event_id: eventId, products: pack.quantity, amount_total: session.amount_total });
  }
  if (session.mode === "subscription") {
    const plan = getPlanById(metadata.plan_id ?? "starter");
    await supabase.from("subscriptions").upsert({ user_id: userId, stripe_customer_id: String(session.customer ?? ""), stripe_subscription_id: String(session.subscription ?? ""), plan_id: plan.id, status: "incomplete", product_allowance: plan.monthlyProducts, internal_credit_allowance: plan.monthlyProducts * 500, price_id: null }, { onConflict: "stripe_subscription_id" });
  }
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const supabase = createServiceClient();
  const sub = subscription as unknown as { customer?: string; id: string; status: string; items?: { data?: Array<{ price?: { id?: string } }> }; metadata?: Record<string, string>; current_period_start?: number; current_period_end?: number; cancel_at_period_end?: boolean; canceled_at?: number | null; trial_end?: number | null; latest_invoice?: string | { id?: string } | null };
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const plan = getPlanByStripePriceId(priceId) ?? getPlanById(sub.metadata?.plan_id ?? "free");
  const customer = String(sub.customer ?? "");
  const billingCustomer = await supabase.from("billing_customers").select("user_id").eq("stripe_customer_id", customer).maybeSingle<{ user_id: string }>();
  const userId = sub.metadata?.user_id ?? billingCustomer.data?.user_id;
  if (!userId) throw new Error("Subscription sin user_id resoluble.");
  await supabase.from("subscriptions").upsert({ user_id: userId, stripe_customer_id: customer, stripe_subscription_id: sub.id, plan_id: plan.id, status: sub.status, price_id: priceId, product_allowance: plan.monthlyProducts, internal_credit_allowance: plan.monthlyProducts * 500, current_period_start: unixToIso(sub.current_period_start), current_period_end: unixToIso(sub.current_period_end), cancel_at_period_end: Boolean(sub.cancel_at_period_end), canceled_at: unixToIso(sub.canceled_at), trial_end: unixToIso(sub.trial_end), latest_invoice_id: typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id ?? null }, { onConflict: "stripe_subscription_id" });
}

async function deleteSubscription(subscription: Stripe.Subscription) { await upsertSubscription({ ...subscription, status: "canceled" } as Stripe.Subscription); }

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  const supabase = createServiceClient();
  const inv = invoice as unknown as { id: string; subscription?: string | { id?: string } | null; customer?: string; lines?: { data?: Array<{ price?: { id?: string }, period?: { start?: number; end?: number } }> } };
  const invoiceId = inv.id;
  const existing = await supabase.from("credit_transactions").select("id").eq("stripe_invoice_id", invoiceId).maybeSingle();
  if (existing.data) return;
  const priceId = inv.lines?.data?.[0]?.price?.id ?? null;
  const plan = getPlanByStripePriceId(priceId);
  if (!plan) return;
  const customer = String(inv.customer ?? "");
  const billingCustomer = await supabase.from("billing_customers").select("user_id").eq("stripe_customer_id", customer).maybeSingle<{ user_id: string }>();
  if (!billingCustomer.data?.user_id) throw new Error("Invoice sin usuario resoluble.");
  const credits = plan.monthlyProducts * 500;
  await addCredits(supabase, billingCustomer.data.user_id, credits, "subscription_grant", `${plan.monthlyProducts} productos estándar del plan ${plan.name}`, { stripe_invoice_id: invoiceId, stripe_event_id: eventId, plan_id: plan.id, products: plan.monthlyProducts, period: inv.lines?.data?.[0]?.period ?? null });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createServiceClient();
  const inv = invoice as unknown as { customer?: string; subscription?: string | { id?: string } | null };
  const customer = String(inv.customer ?? "");
  await supabase.from("subscriptions").update({ status: "past_due" }).eq("stripe_customer_id", customer);
}
