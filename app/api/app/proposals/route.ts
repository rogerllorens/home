import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { listProposals } from "@/lib/proposals";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "proposals:list", context.user.id, 120, 60);
  if (limited) return limited;
  const url = new URL(request.url);
  const result = await listProposals(createServiceClient(), context.user.id, { jobId: url.searchParams.get("jobId"), reviewStatus: url.searchParams.get("reviewStatus"), status: url.searchParams.get("status"), limit: Number(url.searchParams.get("limit") ?? 50) });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ proposals: result.data ?? [] });
}
