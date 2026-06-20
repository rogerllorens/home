import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { getGscConfig, getGscStatus } from "@/lib/gsc";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "gsc:status", context.user.id, 120, 60); if (limited) return limited; const config = getGscConfig(); return NextResponse.json(await getGscStatus(createServiceClient(), context.user.id, config.enabled)); }
