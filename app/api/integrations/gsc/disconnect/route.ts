import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "gsc:disconnect", context.user.id, 10, 300); if (limited) return limited; const client = createServiceClient(); await client.from("gsc_connections").update({ status: "disconnected", access_token_encrypted: null, refresh_token_encrypted: null, disconnected_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", context.user.id); await client.from("gsc_properties").update({ is_selected: false }).eq("user_id", context.user.id); return NextResponse.json({ disconnected: true }); }
