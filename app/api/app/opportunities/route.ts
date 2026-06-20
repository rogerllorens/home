import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { buildGscOpportunities, buildOpportunitiesFromProposals } from "@/lib/opportunities";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "opportunities:list", context.user.id, 120, 60); if (limited) return limited;
  const url = new URL(request.url); const type = url.searchParams.get("type"); const priority = url.searchParams.get("priority"); const source = url.searchParams.get("source");
  const { data, error } = await createServiceClient().from("optimization_proposals").select("id,job_id,catalog_item_id,status,review_status,approved_version_id,exported_at,current_snapshot,original_scores,active_scores,score_delta,human_review_required,ready_to_export,created_at").eq("user_id", context.user.id).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const client = createServiceClient(); const selected = (await client.from("gsc_properties").select("id").eq("user_id", context.user.id).eq("is_selected", true).maybeSingle()).data; const urlMetrics = selected ? (await client.from("gsc_url_metrics").select("id,page_url,clicks,impressions,ctr,position,matched_catalog_item_id,matched_proposal_id,match_confidence").eq("user_id", context.user.id).eq("property_id", selected.id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(300)).data ?? [] : []; const pageQueryMetrics = selected ? (await client.from("gsc_page_query_metrics").select("id,page_url,query,clicks,impressions,ctr,position,matched_catalog_item_id,matched_proposal_id,match_confidence").eq("user_id", context.user.id).eq("property_id", selected.id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(300)).data ?? [] : []; let opportunities = [...buildGscOpportunities({ urlMetrics: urlMetrics as never, pageQueryMetrics: pageQueryMetrics as never, proposals: (data ?? []) as never }), ...buildOpportunitiesFromProposals(data ?? [])].sort((a, b) => b.score - a.score);
  if (source) opportunities = opportunities.filter((op) => (op.source ?? "internal") === source);
  if (type) opportunities = opportunities.filter((op) => op.type === type);
  if (priority) opportunities = opportunities.filter((op) => op.priority === priority);
  return NextResponse.json({ opportunities });
}
