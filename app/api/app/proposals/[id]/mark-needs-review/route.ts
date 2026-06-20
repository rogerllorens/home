import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { markNeedsReview } from "@/lib/proposals";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "proposals:needs-review", context.user.id, 30, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  try { const { id } = await params; await markNeedsReview(createServiceClient(), context.user.id, id, { note: String(body.note ?? "").slice(0, 500) }); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "needs_review_failed" }, { status: 400 }); }
}
