import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
const schema = z.object({ propertyId: z.string().uuid() });
export async function POST(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "gsc:select", context.user.id, 30, 300); if (limited) return limited; const parsed = schema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); const client = createServiceClient(); const existing = await client.from("gsc_properties").select("id").eq("id", parsed.data.propertyId).eq("user_id", context.user.id).maybeSingle(); if (!existing.data) return NextResponse.json({ error: "property_not_found" }, { status: 404 }); await client.from("gsc_properties").update({ is_selected: false }).eq("user_id", context.user.id); const { data, error } = await client.from("gsc_properties").update({ is_selected: true, updated_at: new Date().toISOString() }).eq("id", parsed.data.propertyId).eq("user_id", context.user.id).select("id,site_url,is_selected").single(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ property: data }); }
