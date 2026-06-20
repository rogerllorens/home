import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { buildProposalDiff } from "@/lib/proposals";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "catalog:detail", context.user.id, 120, 60); if (limited) return limited;
  const { id } = await params; const client = createServiceClient();
  const item = await client.from("catalog_items").select("*").eq("id", id).eq("user_id", context.user.id).maybeSingle();
  if (!item.data) return NextResponse.json({ error: "catalog_item_not_found" }, { status: 404 });
  const proposal = await client.from("optimization_proposals").select("*").eq("catalog_item_id", id).eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const versions = proposal.data?.id ? await client.from("optimization_proposal_versions").select("*").eq("proposal_id", proposal.data.id).eq("user_id", context.user.id).order("version_number", { ascending: false }) : { data: [] };
  const active = (versions.data ?? []).find((v) => v.id === proposal.data?.active_version_id) ?? versions.data?.[0] ?? null;
  const gscMetrics = await client.from("gsc_url_metrics").select("page_url,clicks,impressions,ctr,position,match_confidence,date_range").eq("user_id", context.user.id).eq("matched_catalog_item_id", id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(5);
  const gscQueries = await client.from("gsc_page_query_metrics").select("page_url,query,clicks,impressions,ctr,position,match_confidence,date_range").eq("user_id", context.user.id).eq("matched_catalog_item_id", id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(10);
  const diff = proposal.data ? buildProposalDiff(proposal.data.original_snapshot ?? item.data.original_data ?? {}, active?.output_data ?? proposal.data.current_snapshot ?? {}) : null;
  return NextResponse.json({ item: item.data, proposal: proposal.data ?? null, versions: versions.data ?? [], activeVersion: active, diff, gscMetrics: gscMetrics.data ?? [], gscQueries: gscQueries.data ?? [] });
}
