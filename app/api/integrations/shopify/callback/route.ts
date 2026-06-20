import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { encryptShopifyToken, exchangeShopifyCode, getReadScopes, normalizeShopDomain, verifyShopifyOAuthHmac } from "@/lib/shopify";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!verifyShopifyOAuthHmac(url.searchParams)) return NextResponse.redirect(new URL("/app/integrations/shopify?error=invalid_hmac", request.url));
  const shop = normalizeShopDomain(url.searchParams.get("shop") ?? "");
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const supabase = createServiceClient();
  const { data: oauthState } = await supabase.from("shopify_oauth_states").select("*").eq("state", state).eq("shop_domain", shop).is("consumed_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!oauthState) return NextResponse.redirect(new URL("/app/integrations/shopify?error=invalid_state", request.url));
  const token = await exchangeShopifyCode(shop, code);
  const scopes = (token.scope ?? getReadScopes().join(",")).split(",").map((scope) => scope.trim()).filter(Boolean);
  if (!scopes.includes("read_products")) return NextResponse.redirect(new URL("/app/integrations/shopify?error=missing_read_products", request.url));
  await supabase.from("shopify_oauth_states").update({ consumed_at: new Date().toISOString() }).eq("id", oauthState.id);
  await supabase.from("shopify_stores").upsert({ user_id: oauthState.user_id, shop_domain: shop, myshopify_domain: shop, access_token_encrypted: encryptShopifyToken(token.access_token), granted_scopes: scopes, status: "connected", read_connected_at: new Date().toISOString(), disconnected_at: null, last_error: null }, { onConflict: "user_id,myshopify_domain" });
  return NextResponse.redirect(new URL(oauthState.redirect_after ?? "/app/integrations/shopify", request.url));
}
