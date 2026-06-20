import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { assertGscEnabled, syncGscProperty } from "@/lib/gsc";
export const dynamic = "force-dynamic";
const schema = z.object({ propertyId: z.string().uuid(), dateRanges: z.array(z.enum(["28d", "90d"])).default(["28d", "90d"]), force: z.boolean().optional() });
export async function POST(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "gsc:sync", context.user.id, 5, 3600); if (limited) return limited; const parsed = schema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); try { assertGscEnabled(); const result = await syncGscProperty(createServiceClient(), { userId: context.user.id, propertyId: parsed.data.propertyId, dateRanges: parsed.data.dateRanges, force: parsed.data.force }); return NextResponse.json(result); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "gsc_sync_failed" }, { status: 500 }); } }
