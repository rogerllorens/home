import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { enqueueShopifyRollbackRun } from "@/lib/shopify";
const schema = z.object({ confirmation: z.string(), idempotencyKey: z.string().max(120).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "shopify:rollback", context.user.id, 3, 60);
  if (limited) return limited;
  const body = schema.parse(await request.json().catch(() => ({})));
  const { id } = await params;
  try { return NextResponse.json(await enqueueShopifyRollbackRun(createServiceClient(), { userId: context.user.id, applyRunId: id, ...body })); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "rollback_enqueue_failed" }, { status: 400 }); }
}
