import { createClient } from "@/lib/supabase/client";
import type { CreditReservationRow, CreditTransactionRow, WalletRow } from "@/lib/billing/credits";

export type SubscriptionRow = { id: string; user_id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null; plan_id: string; status: string; price_id: string | null; product_allowance: number; internal_credit_allowance: number; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; canceled_at: string | null; trial_end: string | null; latest_invoice_id: string | null; created_at: string; updated_at: string };
export type CheckoutSessionRow = { id: string; stripe_session_id: string; mode: string; item_type: string; plan_id: string | null; extra_pack_id: string | null; products: number; credits: number; amount_total: number | null; currency: string; status: string; created_at: string; completed_at: string | null };
export type PaymentEventRow = { id: string; stripe_event_id: string; event_type: string; processed: boolean; error_message: string | null; created_at: string; processed_at: string | null };
export type BillingCustomerRow = { user_id: string; stripe_customer_id: string | null; email: string | null; created_at: string; updated_at: string };

export async function getUserBillingData() {
  const supabase = createClient();
  const [{ data: wallet }, { data: transactions }, { data: reservations }, { data: subscription }, { data: checkouts }, { data: customer }] = await Promise.all([
    supabase.from("credit_wallets").select("*").maybeSingle<WalletRow>(),
    supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(100).returns<CreditTransactionRow[]>(),
    supabase.from("credit_reservations").select("*").order("created_at", { ascending: false }).limit(50).returns<CreditReservationRow[]>(),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle<SubscriptionRow>(),
    supabase.from("checkout_sessions").select("*").order("created_at", { ascending: false }).limit(20).returns<CheckoutSessionRow[]>(),
    supabase.from("billing_customers").select("*").maybeSingle<BillingCustomerRow>(),
  ]);
  return { wallet, transactions: transactions ?? [], reservations: reservations ?? [], subscription, checkouts: checkouts ?? [], customer };
}

export async function getAdminBillingData() {
  const supabase = createClient();
  const [wallets, transactions, reservations, subscriptions, checkouts, events] = await Promise.all([
    supabase.from("credit_wallets").select("*, profiles:user_id(email,full_name)").returns<Array<WalletRow & { profiles?: { email?: string | null; full_name?: string | null } }>>(),
    supabase.from("credit_transactions").select("*, profiles:user_id(email,full_name)").order("created_at", { ascending: false }).limit(200),
    supabase.from("credit_reservations").select("*, profiles:user_id(email,full_name), jobs:job_id(original_filename,status)").order("created_at", { ascending: false }).limit(200),
    supabase.from("subscriptions").select("*, profiles:user_id(email,full_name)").order("created_at", { ascending: false }).limit(200),
    supabase.from("checkout_sessions").select("*, profiles:user_id(email,full_name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("payment_events").select("id,stripe_event_id,event_type,processed,error_message,created_at,processed_at").order("created_at", { ascending: false }).limit(100).returns<PaymentEventRow[]>(),
  ]);
  return { wallets: wallets.data ?? [], transactions: transactions.data ?? [], reservations: reservations.data ?? [], subscriptions: subscriptions.data ?? [], checkouts: checkouts.data ?? [], events: events.data ?? [] };
}
