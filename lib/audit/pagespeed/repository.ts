import { createServiceClient } from "@/lib/supabase/admin";
import type { NormalizedPageSpeedResult } from "./types";

export async function findCachedPageSpeedAudit(url: string, strategy: string, cacheKey: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const supabase = createServiceClient();
  const { data } = await supabase.from("pagespeed_audits").select("*").eq("cache_key", cacheKey).eq("strategy", strategy).eq("status", "completed").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!data) return null;
  return data as Record<string, unknown>;
}

export async function savePageSpeedAudit(result: NormalizedPageSpeedResult, meta: { normalizedUrl: string; domain: string; userId?: string | null; freeAuditId?: string | null }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { skipped: true };
  const supabase = createServiceClient();
  await supabase.from("pagespeed_audits").upsert({
    free_audit_id: meta.freeAuditId ?? null, user_id: meta.userId ?? null, normalized_url: meta.normalizedUrl, domain: meta.domain, strategy: result.strategy, status: result.status, error_message: result.errorMessage ?? null, psi_fetch_time_ms: result.psiFetchTimeMs ?? null, lighthouse_version: result.lighthouseVersion ?? null, performance_score: result.performanceScore, accessibility_score: result.accessibilityScore, best_practices_score: result.bestPracticesScore, seo_score: result.seoScore, pwa_score: result.pwaScore, first_contentful_paint_ms: result.firstContentfulPaintMs, largest_contentful_paint_ms: result.largestContentfulPaintMs, total_blocking_time_ms: result.totalBlockingTimeMs, cumulative_layout_shift: result.cumulativeLayoutShift, speed_index_ms: result.speedIndexMs, interaction_to_next_paint_ms: result.interactionToNextPaintMs, time_to_interactive_ms: result.timeToInteractiveMs, server_response_time_ms: result.serverResponseTimeMs, render_blocking_savings_ms: result.renderBlockingSavingsMs, unused_js_savings_bytes: result.unusedJsSavingsBytes, unused_css_savings_bytes: result.unusedCssSavingsBytes, image_optimization_savings_bytes: result.imageOptimizationSavingsBytes, modern_image_savings_bytes: result.modernImageSavingsBytes, dom_size: result.domSize, critical_opportunities: result.opportunities.filter((item) => item.severity === "critical"), diagnostics: result.diagnostics, field_data: result.fieldData, lab_data: result.labData, raw_summary: result.rawSummary, cache_key: result.cacheKey, expires_at: result.expiresAt,
  }, { onConflict: "cache_key,strategy" });
  return { skipped: false };
}
