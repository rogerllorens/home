import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { verifyShopifyWebhookRequest } from "@/lib/shopify/webhooks";
export async function POST(request: Request) { const event = await verifyShopifyWebhookRequest(request); const supabase = createServiceClient(); const existing = await supabase.from("shopify_webhook_deliveries").select("id").eq("delivery_id", event.deliveryId).maybeSingle(); if (existing.data) return NextResponse.json({ ok: true, duplicate: true }); const store = (await supabase.from("shopify_stores").select("id,user_id").eq("myshopify_domain", event.shopDomain).maybeSingle()).data; await supabase.from("shopify_webhook_deliveries").insert({ store_id: store?.id ?? null, user_id: store?.user_id ?? null, topic: event.topic, shop_domain: event.shopDomain, delivery_id: event.deliveryId, hmac_valid: event.hmacValid, payload_hash: event.payloadHash, status: event.hmacValid ? "processed" : "failed", processed_at: event.hmacValid ? new Date().toISOString() : null, error_message: event.hmacValid ? null : "invalid_hmac" }); if (!event.hmacValid) return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 }); if (event.topic === "app/uninstalled" && store) await supabase.from("shopify_stores").update({ status: "uninstalled", access_token_encrypted: null, disconnected_at: new Date().toISOString() }).eq("id", store.id);
  if (event.topic === "app/scopes_update" && store) {
    const payload = JSON.parse(event.rawBody || "{}") as { current?: string[]; access_scopes?: string[] };
    await supabase.from("shopify_stores").update({ granted_scopes: payload.current ?? payload.access_scopes ?? [], last_error: null }).eq("id", store.id);
  }
  if ((event.topic === "products/create" || event.topic === "products/update") && store) await supabase.from("shopify_stores").update({ last_error: "shopify_product_changed_needs_resync" }).eq("id", store.id);
  if (event.topic === "products/delete" && store) {
    const payload = JSON.parse(event.rawBody || "{}") as { admin_graphql_api_id?: string; id?: number | string };
    await supabase.from("shopify_products").update({ status: "deleted", last_synced_at: new Date().toISOString() }).eq("store_id", store.id).eq("shopify_product_gid", payload.admin_graphql_api_id ?? `gid://shopify/Product/${payload.id}`);
  }
  return NextResponse.json({ ok: true }); }
