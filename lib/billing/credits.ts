import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_STANDARD_CREDITS, getVisibleProductCountFromCredits } from "@/lib/pricing";

export type WalletRow = { user_id: string; balance: number; reserved_balance: number; lifetime_used: number; lifetime_purchased: number; lifetime_granted: number; lifetime_refunded: number; updated_at?: string };
export type CreditTransactionRow = { id: string; user_id: string; job_id?: string | null; reservation_id?: string | null; stripe_session_id?: string | null; stripe_event_id?: string | null; stripe_invoice_id?: string | null; amount: number; product_equivalent?: number | null; balance_after?: number | null; type: string; status: string; description?: string | null; metadata?: Record<string, unknown> | null; created_at: string };
export type CreditReservationRow = { id: string; user_id: string; job_id: string; amount: number; product_equivalent?: number | null; status: string; reason?: string | null; created_at: string; released_at?: string | null; consumed_at?: string | null };

export function creditsToProducts(credits: number) { return getVisibleProductCountFromCredits(credits); }
export function productsToCredits(products: number) { return products * PRODUCT_STANDARD_CREDITS; }

export async function addCredits(supabase: SupabaseClient, userId: string, amount: number, type: string, description: string, metadata: Record<string, unknown> = {}) {
  return supabase.rpc("add_credits", { p_user_id: userId, p_amount: amount, p_type: type, p_description: description, p_metadata: metadata });
}
export async function reserveCredits(supabase: SupabaseClient, userId: string, jobId: string, amount: number) {
  return supabase.rpc("reserve_credits", { p_user_id: userId, p_job_id: jobId, p_amount: amount });
}
export async function consumeReservedCredits(supabase: SupabaseClient, reservationId: string, actualAmount: number) {
  return supabase.rpc("consume_reserved_credits", { p_reservation_id: reservationId, p_actual_amount: actualAmount });
}
export async function releaseReservedCredits(supabase: SupabaseClient, reservationId: string, reason: string) {
  return supabase.rpc("release_reserved_credits", { p_reservation_id: reservationId, p_reason: reason });
}
