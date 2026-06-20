import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { buildShopifyOAuthUrl, createShopifyState, getOptionalWriteScopes, getOwnedShopifyStore } from "@/lib/shopify";
const schema = z.object({ storeId: z.string().uuid(), changeSetId: z.string().uuid().optional(), redirectAfter: z.string().optional() });
export async function POST(request: Request) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "shopify:write-upgrade", context.user.id, 3, 60);
  if (limited) return limited;
  const body = schema.parse(await request.json().catch(() => ({})));
  const supabase = createServiceClient();
  const store = await getOwnedShopifyStore(supabase, context.user.id, body.storeId);
  if (!store) return NextResponse.json({ error: "shopify_store_not_found" }, { status: 404 });
  const state = createShopifyState();
  const redirectAfter = body.redirectAfter ?? (body.changeSetId ? `/app/integrations/shopify/change-sets/${body.changeSetId}` : `/app/integrations/shopify/${body.storeId}`);
  await supabase.from("shopify_oauth_states").insert({ user_id: context.user.id, shop_domain: store.myshopify_domain, state, requested_scopes: [...getOptionalWriteScopes()], mode: "write_upgrade", redirect_after: redirectAfter });
  return NextResponse.json({ url: buildShopifyOAuthUrl(store.myshopify_domain, state, "write_upgrade") });
}
