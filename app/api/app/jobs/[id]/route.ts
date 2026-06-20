import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { estimateJobWaitTime } from "@/lib/dashboard";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext(); if (!context.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(request, "jobs:detail", context.user.id, 120, 60); if (limited) return limited;
  const { id } = await params; const client = createServiceClient();
  const job = await client.from("jobs").select("*").eq("id", id).eq("user_id", context.user.id).maybeSingle();
  if (!job.data) return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  const [rows, proposals, downloads, logs] = await Promise.all([
    client.from("job_rows").select("id,row_index,status,validation_status,seo_score,conversion_score,detected_issues,approval_status,proposal_id,active_version_id,approved_version_id,output_data").eq("job_id", id).eq("user_id", context.user.id).order("row_index").limit(100),
    client.from("optimization_proposals").select("id,status,review_status,active_version_id,approved_version_id,score_delta,current_snapshot,ready_to_export,exported_at").eq("job_id", id).eq("user_id", context.user.id).limit(200),
    client.from("downloads").select("*").eq("job_id", id).eq("user_id", context.user.id).order("created_at", { ascending: false }),
    client.from("job_logs").select("id,level,source,message,context,created_at").eq("job_id", id).eq("user_id", context.user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const proposalList = proposals.data ?? [];
  const summary = { total: proposalList.length, pending: proposalList.filter((p) => p.review_status === "pending_review").length, approved: proposalList.filter((p) => p.approved_version_id).length, needsReview: proposalList.filter((p) => p.review_status === "needs_changes" || p.status === "needs_review").length, exported: proposalList.filter((p) => p.exported_at || p.status === "exported").length };
  return NextResponse.json({ job: job.data, eta: estimateJobWaitTime({ status: job.data.status, rowsTotal: job.data.rows_total, rowsProcessed: job.data.rows_processed, createdAt: job.data.created_at, startedAt: job.data.started_at }), rows: rows.data ?? [], proposals: proposalList, proposalSummary: summary, downloads: downloads.data ?? [], logs: logs.data ?? [] });
}
