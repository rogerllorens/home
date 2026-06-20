import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "catalog:list", context.user.id, 120, 60); if (limited) return limited;
  const url = new URL(request.url); const search = url.searchParams.get("search")?.toLowerCase(); const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);
  const client = createServiceClient();
  const { data, error } = await client.from("catalog_items").select("*, optimization_proposals(id,status,review_status,active_version_id,approved_version_id,original_scores,active_scores,score_delta,ready_to_export)").eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data ?? []).map((item) => item.id);
  const gscRows = ids.length ? (await client.from("gsc_url_metrics").select("matched_catalog_item_id,clicks,impressions,ctr,position,match_confidence").eq("user_id", context.user.id).eq("date_range", "28d").in("matched_catalog_item_id", ids).order("impressions", { ascending: false })).data ?? [] : [];
  const gscByItem = new Map(gscRows.map((row) => [row.matched_catalog_item_id, row]));
  const items = (data ?? []).map((item) => ({ ...item, gsc_28d: gscByItem.get(item.id) ?? null })).filter((item) => !search || [item.product_name, item.sku, item.product_url, item.category].some((v) => String(v ?? "").toLowerCase().includes(search)));
  return NextResponse.json({ items });
}
