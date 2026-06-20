import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOnboardingChecklist } from "./onboarding";
import { getNextBestAction } from "./next-best-action";
import { estimateJobWaitTime } from "./wait-time";
import type { DashboardOverview, DashboardActivityItem } from "./types";
import { buildGscOpportunities, buildOpportunitiesFromProposals, labelFor } from "@/lib/opportunities";
import { getGscConfig } from "@/lib/gsc/config";
import { getGscStatus } from "@/lib/gsc/repository";

type Client = SupabaseClient;
const activeStatuses = ["queued", "ready_for_processing", "processing", "retrying"];
const avg = (items: number[]) => items.length ? Math.round(items.reduce((s, n) => s + n, 0) / items.length) : null;
const countWhere = <T>(items: T[], fn: (item: T) => boolean) => items.filter(fn).length;
const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;

export async function getDashboardOverview(client: Client, user: { id: string; email?: string | null }): Promise<DashboardOverview> {
  const [walletRes, jobsRes, proposalsRes, catalogRes, downloadsRes, eventsRes] = await Promise.all([
    client.from("credit_wallets").select("balance,reserved_balance").eq("user_id", user.id).maybeSingle<{ balance: number; reserved_balance: number }>(),
    client.from("jobs").select("id,original_filename,status,rows_total,rows_processed,rows_failed,average_score,created_at,started_at,platform,estimated_credits").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    client.from("optimization_proposals").select("id,job_id,catalog_item_id,status,review_status,approved_version_id,exported_at,current_snapshot,original_scores,active_scores,score_delta,human_review_required,ready_to_export,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
    client.from("catalog_items").select("id,category,normalized_data,original_data,created_at").eq("user_id", user.id).limit(500),
    client.from("downloads").select("id,job_id,filename,file_type,rows_count,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    client.from("proposal_events").select("id,proposal_id,event_type,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);
  const jobs = jobsRes.data ?? []; const proposals = proposalsRes.data ?? []; const catalog = catalogRes.data ?? []; const downloads = downloadsRes.data ?? [];
  const internalOpportunities = buildOpportunitiesFromProposals(proposals);
  const gscConfig = getGscConfig();
  const gscStatus = await getGscStatus(client, user.id, gscConfig.enabled).catch(() => ({ enabled: gscConfig.enabled, connected: false, selectedProperty: null, lastSync: null, metrics28d: { clicks: 0, impressions: 0, ctr: 0, position: 0 } }));
  const gscUrlMetrics = gscStatus.selectedProperty ? (await client.from("gsc_url_metrics").select("id,page_url,clicks,impressions,ctr,position,matched_catalog_item_id,matched_proposal_id,match_confidence").eq("user_id", user.id).eq("property_id", gscStatus.selectedProperty.id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(200)).data ?? [] : [];
  const gscPageQueryMetrics = gscStatus.selectedProperty ? (await client.from("gsc_page_query_metrics").select("id,page_url,query,clicks,impressions,ctr,position,matched_catalog_item_id,matched_proposal_id,match_confidence").eq("user_id", user.id).eq("property_id", gscStatus.selectedProperty.id).eq("date_range", "28d").order("impressions", { ascending: false }).limit(200)).data ?? [] : [];
  const gscOpportunities = buildGscOpportunities({ urlMetrics: gscUrlMetrics as never, pageQueryMetrics: gscPageQueryMetrics as never, proposals: proposals as never });
  const opportunities = [...gscOpportunities, ...internalOpportunities].sort((a, b) => b.score - a.score);
  const activeJobs = jobs.filter((job) => activeStatuses.includes(job.status));
  const approvedExports = downloads.filter((download) => /approved/i.test(download.filename)).length;
  const scores = proposals.map((p) => p.active_scores ?? {});
  const overviewBase = {
    credits: { available: n(walletRes.data?.balance), reserved: n(walletRes.data?.reserved_balance), lowCredits: n(walletRes.data?.balance) < 500 },
    health: { overallScore: avg(scores.map((s) => n(s.overall)).filter(Boolean)), seoScore: avg(scores.map((s) => n(s.seo)).filter(Boolean)), imageSeoScore: avg(scores.map((s) => n(s.image_seo)).filter(Boolean)), geoAeoScore: avg(scores.map((s) => n(s.geo_aeo)).filter(Boolean)), confidenceScore: avg(scores.map((s) => n(s.confidence)).filter(Boolean)), readinessScore: avg(scores.map((s) => n(s.readiness)).filter(Boolean)), productsAnalyzed: catalog.length || proposals.length, productsReady: countWhere(proposals, (p) => p.ready_to_export || p.status === "approved"), productsNeedReview: countWhere(proposals, (p) => p.review_status === "pending_review" || p.status === "needs_review") },
    jobs: { total: jobs.length, active: activeJobs.length, completed: countWhere(jobs, (j) => j.status === "completed" || j.status === "completed_with_warnings"), failed: countWhere(jobs, (j) => j.status?.includes("failed")), recent: jobs.slice(0, 6).map((job) => ({ id: job.id, filename: job.original_filename, status: job.status, rowsTotal: job.rows_total ?? 0, rowsProcessed: job.rows_processed ?? 0, progress: job.rows_total ? Math.round((job.rows_processed / job.rows_total) * 100) : 0, createdAt: job.created_at, etaLabel: estimateJobWaitTime({ status: job.status, rowsTotal: job.rows_total, rowsProcessed: job.rows_processed, createdAt: job.created_at, startedAt: job.started_at }).label })) },
    proposals: { total: proposals.length, pendingReview: countWhere(proposals, (p) => p.review_status === "pending_review"), needsChanges: countWhere(proposals, (p) => p.review_status === "needs_changes" || p.status === "needs_review"), approved: countWhere(proposals, (p) => Boolean(p.approved_version_id)), exported: countWhere(proposals, (p) => Boolean(p.exported_at) || p.status === "exported"), highImpact: countWhere(proposals, (p) => n(p.score_delta?.overall) >= 25), avgScoreDelta: avg(proposals.map((p) => n(p.score_delta?.overall)).filter(Boolean)) },
    catalog: { products: catalog.length, categories: new Set(catalog.map((item) => String(item.category ?? item.normalized_data?.category ?? "")).filter(Boolean)).size, withImages: countWhere(catalog, (item) => Boolean(item.normalized_data?.primary_image_url || item.original_data?.image_url || item.original_data?.["Image Src"])), missingAlt: countWhere(catalog, (item) => Boolean(item.normalized_data?.primary_image_url || item.original_data?.image_url) && !item.normalized_data?.primary_image_alt), lowSeoScore: countWhere(proposals, (p) => n(p.active_scores?.seo) > 0 && n(p.active_scores?.seo) < 60), lowImageScore: countWhere(proposals, (p) => n(p.active_scores?.image_seo) > 0 && n(p.active_scores?.image_seo) < 60) },
    gsc: { enabled: gscStatus.enabled, connected: gscStatus.connected, selectedProperty: gscStatus.selectedProperty, lastSync: gscStatus.lastSync, metrics: { clicks28d: gscStatus.metrics28d?.clicks ?? 0, impressions28d: gscStatus.metrics28d?.impressions ?? 0, ctr28d: gscStatus.metrics28d?.ctr ?? 0, position28d: gscStatus.metrics28d?.position ?? 0, clicks90d: 0, impressions90d: 0, ctr90d: 0, position90d: 0 }, opportunities: { total: gscOpportunities.length, highPriority: countWhere(gscOpportunities, (o) => o.priority === "critical" || o.priority === "high"), quickWins: countWhere(gscOpportunities, (o) => o.type === "gsc_quick_win_position_4_15"), lowCtr: countWhere(gscOpportunities, (o) => o.type === "gsc_high_impressions_low_ctr"), impressionsNoClicks: countWhere(gscOpportunities, (o) => o.type === "gsc_impressions_no_clicks") } },
    downloads: { total: downloads.length, recent: downloads.slice(0, 6).map((d) => ({ id: d.id, jobId: d.job_id, filename: d.filename, fileType: d.file_type, approvedOnly: /approved/i.test(d.filename), createdAt: d.created_at, rowsCount: d.rows_count })), approvedExports },
    opportunities: { total: opportunities.length, highPriority: countWhere(opportunities, (o) => o.priority === "critical" || o.priority === "high"), byType: Object.entries(opportunities.reduce<Record<string, number>>((acc, op) => { acc[op.type] = (acc[op.type] ?? 0) + 1; return acc; }, {})).map(([type, count]) => ({ type, label: labelFor(type as never), count })), top: opportunities.slice(0, 8) },
  };
  const onboarding = buildOnboardingChecklist({ hasCatalog: overviewBase.catalog.products > 0, hasJob: overviewBase.jobs.total > 0, hasCompletedJob: overviewBase.jobs.completed > 0, hasProposal: overviewBase.proposals.total > 0, hasApprovedProposal: overviewBase.proposals.approved > 0, hasDownload: overviewBase.downloads.total > 0, hasCredits: overviewBase.credits.available > 0 });
  const activity: DashboardActivityItem[] = [...jobs.slice(0, 4).map((j) => ({ id: `job:${j.id}`, type: "job" as const, label: j.original_filename ?? "Job CSV", description: `Estado ${j.status}`, href: `/app/jobs/${j.id}`, createdAt: j.created_at })), ...downloads.slice(0, 3).map((d) => ({ id: `download:${d.id}`, type: "download" as const, label: d.filename, description: d.file_type, href: "/app/downloads", createdAt: d.created_at })), ...(eventsRes.data ?? []).slice(0, 3).map((e) => ({ id: `event:${e.id}`, type: "event" as const, label: e.event_type, description: "Evento de propuesta", href: `/app/proposals/${e.proposal_id}`, createdAt: e.created_at }))].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
  const overview = { user, ...overviewBase, onboarding, nextBestAction: getNextBestAction(overviewBase), activity };
  return overview;
}
