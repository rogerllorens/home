import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "shopify:disconnect", context.user.id, 10, 60); if (limited) return limited; const body = await request.json().catch(() => ({})); const storeId = String(body.storeId ?? ""); await createServiceClient().from("shopify_stores").update({ status: "disconnected", access_token_encrypted: null, disconnected_at: new Date().toISOString() }).eq("id", storeId).eq("user_id", context.user.id); return NextResponse.json({ ok: true }); }
