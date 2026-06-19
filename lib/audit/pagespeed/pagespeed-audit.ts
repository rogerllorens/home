import { rateLimit } from "@/lib/rate-limit";
import type { ValidatedAuditUrl } from "../types";
import type { NormalizedPageSpeedResult, PageSpeedStrategy } from "./types";
import { fetchPageSpeed, isPageSpeedEnabled, hasPageSpeedKey } from "./client";
import { normalizePageSpeedResponse, buildPageSpeedCacheKey } from "./normalizer";
import { calculateRankeliaPerformanceScore } from "./scoring";
import { buildPerformanceRecommendations } from "./recommendations";
import { getMemoryPageSpeedCache, setMemoryPageSpeedCache } from "./cache";
import { findCachedPageSpeedAudit, savePageSpeedAudit } from "./repository";


function fromCachedRow(row: Record<string, unknown>, strategy: PageSpeedStrategy, url: string): NormalizedPageSpeedResult {
  return { strategy, status: "completed", psiFetchTimeMs: typeof row.psi_fetch_time_ms === "number" ? row.psi_fetch_time_ms : undefined, lighthouseVersion: typeof row.lighthouse_version === "string" ? row.lighthouse_version : undefined, performanceScore: typeof row.performance_score === "number" ? row.performance_score : null, accessibilityScore: typeof row.accessibility_score === "number" ? row.accessibility_score : null, bestPracticesScore: typeof row.best_practices_score === "number" ? row.best_practices_score : null, seoScore: typeof row.seo_score === "number" ? row.seo_score : null, pwaScore: typeof row.pwa_score === "number" ? row.pwa_score : null, firstContentfulPaintMs: typeof row.first_contentful_paint_ms === "number" ? row.first_contentful_paint_ms : null, largestContentfulPaintMs: typeof row.largest_contentful_paint_ms === "number" ? row.largest_contentful_paint_ms : null, totalBlockingTimeMs: typeof row.total_blocking_time_ms === "number" ? row.total_blocking_time_ms : null, cumulativeLayoutShift: typeof row.cumulative_layout_shift === "number" ? row.cumulative_layout_shift : null, speedIndexMs: typeof row.speed_index_ms === "number" ? row.speed_index_ms : null, interactionToNextPaintMs: typeof row.interaction_to_next_paint_ms === "number" ? row.interaction_to_next_paint_ms : null, timeToInteractiveMs: typeof row.time_to_interactive_ms === "number" ? row.time_to_interactive_ms : null, serverResponseTimeMs: typeof row.server_response_time_ms === "number" ? row.server_response_time_ms : null, renderBlockingSavingsMs: typeof row.render_blocking_savings_ms === "number" ? row.render_blocking_savings_ms : null, unusedJsSavingsBytes: typeof row.unused_js_savings_bytes === "number" ? row.unused_js_savings_bytes : null, unusedCssSavingsBytes: typeof row.unused_css_savings_bytes === "number" ? row.unused_css_savings_bytes : null, imageOptimizationSavingsBytes: typeof row.image_optimization_savings_bytes === "number" ? row.image_optimization_savings_bytes : null, modernImageSavingsBytes: typeof row.modern_image_savings_bytes === "number" ? row.modern_image_savings_bytes : null, domSize: typeof row.dom_size === "number" ? row.dom_size : null, fieldData: typeof row.field_data === "object" && row.field_data ? row.field_data as Record<string, unknown> : {}, labData: typeof row.lab_data === "object" && row.lab_data ? row.lab_data as Record<string, unknown> : {}, opportunities: Array.isArray(row.critical_opportunities) ? row.critical_opportunities as NormalizedPageSpeedResult["opportunities"] : [], diagnostics: Array.isArray(row.diagnostics) ? row.diagnostics as NormalizedPageSpeedResult["diagnostics"] : [], rawSummary: typeof row.raw_summary === "object" && row.raw_summary ? row.raw_summary as Record<string, unknown> : {}, cacheKey: typeof row.cache_key === "string" ? row.cache_key : buildPageSpeedCacheKey(url, strategy), expiresAt: typeof row.expires_at === "string" ? row.expires_at : new Date(Date.now() + 60 * 60 * 1000).toISOString() };
}

function skipped(strategy: PageSpeedStrategy, url: string, reason: string): NormalizedPageSpeedResult {
  return { strategy, status: "skipped", errorMessage: reason, performanceScore: null, accessibilityScore: null, bestPracticesScore: null, seoScore: null, pwaScore: null, firstContentfulPaintMs: null, largestContentfulPaintMs: null, totalBlockingTimeMs: null, cumulativeLayoutShift: null, speedIndexMs: null, interactionToNextPaintMs: null, timeToInteractiveMs: null, serverResponseTimeMs: null, renderBlockingSavingsMs: null, unusedJsSavingsBytes: null, unusedCssSavingsBytes: null, imageOptimizationSavingsBytes: null, modernImageSavingsBytes: null, domSize: null, fieldData: {}, labData: {}, opportunities: [], diagnostics: [], rawSummary: {}, cacheKey: buildPageSpeedCacheKey(url, strategy), expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
}

async function runOne(validated: ValidatedAuditUrl, strategy: PageSpeedStrategy) {
  const memory = getMemoryPageSpeedCache(validated.normalizedUrl, strategy);
  if (memory) return memory;
  const key = buildPageSpeedCacheKey(validated.normalizedUrl, strategy);
  const cached = await findCachedPageSpeedAudit(validated.normalizedUrl, strategy, key).catch(() => null);
  if (cached) return fromCachedRow(cached, strategy, validated.normalizedUrl);
  const response = await fetchPageSpeed(validated.normalizedUrl, strategy) as { status: string; errorMessage?: string; data?: unknown; psiFetchTimeMs?: number };
  if (response.status !== "completed") return { ...skipped(strategy, validated.normalizedUrl, response.errorMessage ?? response.status), status: response.status } as NormalizedPageSpeedResult;
  const normalized = normalizePageSpeedResponse(response.data, strategy, validated.normalizedUrl, response.psiFetchTimeMs);
  setMemoryPageSpeedCache(normalized);
  await savePageSpeedAudit(normalized, { normalizedUrl: validated.normalizedUrl, domain: validated.domain }).catch(() => null);
  return normalized;
}

export async function runPageSpeedPair(validated: ValidatedAuditUrl, sourceIp = "unknown") {
  if (!isPageSpeedEnabled()) return calculateRankeliaPerformanceScore(skipped("mobile", validated.normalizedUrl, "PageSpeed disabled"), skipped("desktop", validated.normalizedUrl, "PageSpeed disabled"));
  if (!hasPageSpeedKey()) return calculateRankeliaPerformanceScore(skipped("mobile", validated.normalizedUrl, "PageSpeed API key not configured"), skipped("desktop", validated.normalizedUrl, "PageSpeed API key not configured"));
  const daily = Number(process.env.PAGESPEED_MAX_URLS_PER_DAY ?? 100);
  const ipLimit = await rateLimit(`pagespeed:ip:${sourceIp}`, daily, 86400);
  const domainLimit = await rateLimit(`pagespeed:domain:${validated.domain}`, daily, 86400);
  if (!ipLimit.allowed || !domainLimit.allowed) return calculateRankeliaPerformanceScore({ ...skipped("mobile", validated.normalizedUrl, "PageSpeed rate limited"), status: "rate_limited" }, { ...skipped("desktop", validated.normalizedUrl, "PageSpeed rate limited"), status: "rate_limited" });
  const [mobile, desktop] = await Promise.all([runOne(validated, "mobile"), runOne(validated, "desktop")]);
  const summary = calculateRankeliaPerformanceScore(mobile, desktop);
  return { ...summary, performance_opportunities: buildPerformanceRecommendations(summary) };
}
