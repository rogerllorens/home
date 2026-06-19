import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { buildOpportunitiesFromProposals } from "@/lib/opportunities";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "opportunities:list", context.user.id, 120, 60); if (limited) return limited;
  const url = new URL(request.url); const type = url.searchParams.get("type"); const priority = url.searchParams.get("priority");
  const { data, error } = await createServiceClient().from("optimization_proposals").select("id,job_id,catalog_item_id,status,review_status,approved_version_id,exported_at,current_snapshot,original_scores,active_scores,score_delta,human_review_required,ready_to_export,created_at").eq("user_id", context.user.id).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let opportunities = buildOpportunitiesFromProposals(data ?? []);
  if (type) opportunities = opportunities.filter((op) => op.type === type);
  if (priority) opportunities = opportunities.filter((op) => op.priority === priority);
  return NextResponse.json({ opportunities });
}
