import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enqueueShopifySyncRun, getOwnedShopifyStore } from "@/lib/shopify";
export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) { const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const limited = await enforceRateLimit(request, "shopify:sync", context.user.id, 10, 60); if (limited) return limited; const { storeId } = await params; const supabase = createServiceClient(); const store = await getOwnedShopifyStore(supabase, context.user.id, storeId); if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 }); const run = await enqueueShopifySyncRun(supabase, context.user.id, storeId); if (run.error) return NextResponse.json({ error: run.error.message }, { status: 500 }); return NextResponse.json({ queued: true, syncRunId: run.data.id }); }
