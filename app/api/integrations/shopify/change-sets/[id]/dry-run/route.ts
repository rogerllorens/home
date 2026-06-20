import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { runShopifyChangeSetDryRun } from "@/lib/shopify";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "shopify:dry-run", context.user.id, 10, 60);
  if (limited) return limited;
  const { id } = await params;
  try { return NextResponse.json(await runShopifyChangeSetDryRun(createServiceClient(), { userId: context.user.id, changeSetId: id })); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "dry_run_failed" }, { status: 400 }); }
}
