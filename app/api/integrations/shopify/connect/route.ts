import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { buildShopifyOAuthUrl, createShopifyState, getReadScopes, getShopifyConfig, isShopifyEnabled, normalizeShopDomain } from "@/lib/shopify";

export async function POST(request: Request) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "shopify:connect", context.user.id, 10, 60);
  if (limited) return limited;
  if (!isShopifyEnabled()) return NextResponse.json({ error: "Shopify is disabled in this environment." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const shop = normalizeShopDomain(String(body.shop ?? ""));
  const state = createShopifyState();
  await createServiceClient().from("shopify_oauth_states").insert({ user_id: context.user.id, shop_domain: shop, state, requested_scopes: getReadScopes(), mode: "read", redirect_after: body.redirectAfter ?? "/app/integrations/shopify" });
  return NextResponse.json({ url: buildShopifyOAuthUrl(shop, state, "read"), scopes: getReadScopes(), writeEnabled: getShopifyConfig().writeEnabled });
}
