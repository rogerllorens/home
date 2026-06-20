import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { isShopifyEnabled } from "@/lib/shopify";
export async function GET() { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!isShopifyEnabled()) return NextResponse.json({ enabled: false, stores: [], writeEnabled: false }); const stores = (await createServiceClient().from("shopify_stores").select("id,shop_domain,myshopify_domain,store_name,status,granted_scopes,last_sync_at,last_error,created_at").eq("user_id", context.user.id).order("created_at", { ascending: false })).data ?? []; return NextResponse.json({ enabled: true, stores, writeEnabled: false }); }
