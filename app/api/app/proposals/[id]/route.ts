import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { getProposalDetail } from "@/lib/proposals";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "proposals:detail", context.user.id, 120, 60);
  if (limited) return limited;
  try {
    const { id } = await params;
    const detail = await getProposalDetail(createServiceClient(), context.user.id, id);
    const client = createServiceClient();
    const gscMetrics = await client.from("gsc_url_metrics").select("page_url,clicks,impressions,ctr,position,match_confidence,date_range").eq("user_id", context.user.id).eq("matched_proposal_id", id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(5);
    const gscQueries = await client.from("gsc_page_query_metrics").select("page_url,query,clicks,impressions,ctr,position,match_confidence,date_range").eq("user_id", context.user.id).eq("matched_proposal_id", id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(10);
    return NextResponse.json({ ...detail, gscMetrics: gscMetrics.data ?? [], gscQueries: gscQueries.data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Proposal not found" }, { status: 404 });
  }
}
