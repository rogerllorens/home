import type { CoreWebVitalsStatus, MetricStatus, NormalizedPageSpeedResult, RankeliaPerformanceSummary } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
function status(value: number | null | undefined, good: number, needs: number, lowerIsBetter = true): MetricStatus {
  if (value === null || value === undefined) return "unavailable";
  if (lowerIsBetter ? value <= good : value >= good) return "good";
  if (lowerIsBetter ? value <= needs : value >= needs) return "needs_improvement";
  return "poor";
}
const statusScore = (s: MetricStatus) => s === "good" ? 100 : s === "needs_improvement" ? 65 : s === "poor" ? 25 : 70;

export function calculateCoreWebVitalsStatus(primary?: NormalizedPageSpeedResult): CoreWebVitalsStatus {
  const lcp = status(primary?.largestContentfulPaintMs, 2500, 4000);
  const cls = status(primary?.cumulativeLayoutShift, 0.1, 0.25);
  const inpMetric = primary?.interactionToNextPaintMs ?? primary?.totalBlockingTimeMs ?? null;
  const inp = status(inpMetric, primary?.interactionToNextPaintMs ? 200 : 200, primary?.interactionToNextPaintMs ? 500 : 600);
  const values = [lcp, cls, inp].filter((item) => item !== "unavailable");
  const overall = values.includes("poor") ? "poor" : values.includes("needs_improvement") ? "needs_improvement" : values.length ? "good" : "unavailable";
  return { lcp_status: lcp, cls_status: cls, inp_status: inp, cwv_overall_status: overall, field_data_available: Boolean(primary && Object.keys(primary.fieldData).length), lab_data_used: true, inp_available: Boolean(primary?.interactionToNextPaintMs) };
}

export function calculateRankeliaPerformanceScore(mobile?: NormalizedPageSpeedResult, desktop?: NormalizedPageSpeedResult): RankeliaPerformanceSummary {
  const completed = [mobile, desktop].filter((item): item is NormalizedPageSpeedResult => item?.status === "completed");
  if (!completed.length) return { available: false, status: mobile?.status === "rate_limited" || desktop?.status === "rate_limited" ? "rate_limited" : mobile?.status === "skipped" && desktop?.status === "skipped" ? "skipped" : "failed", performance_score: null, mobile_score: mobile?.performanceScore ?? null, desktop_score: desktop?.performanceScore ?? null, average_performance_score: null, worst_strategy: null, best_strategy: null, core_web_vitals_score: null, core_web_vitals_status: calculateCoreWebVitalsStatus(undefined), performance_status: "unavailable", main_performance_issue: "PageSpeed no disponible", critical_performance_issues: [], performance_opportunities: [], estimated_savings_summary: { ms: 0, bytes: 0 }, mobile, desktop };
  const mobileScore = mobile?.performanceScore ?? desktop?.performanceScore ?? 0;
  const desktopScore = desktop?.performanceScore ?? mobile?.performanceScore ?? 0;
  const primary = mobile?.status === "completed" ? mobile : desktop;
  const cwv = calculateCoreWebVitalsStatus(primary);
  const cwvScore = clamp((statusScore(cwv.lcp_status) + statusScore(cwv.cls_status) + statusScore(cwv.inp_status)) / 3);
  const opportunities = [...(mobile?.opportunities ?? []), ...(desktop?.opportunities ?? [])];
  const savingsMs = opportunities.reduce((sum, item) => sum + (item.estimatedSavingsMs ?? 0), 0);
  const savingsBytes = opportunities.reduce((sum, item) => sum + (item.estimatedSavingsBytes ?? 0), 0);
  const critical = opportunities.filter((item) => item.severity === "critical").slice(0, 5);
  const opportunityPenalty = Math.min(20, critical.length * 5 + opportunities.filter((item) => item.severity === "warning").length * 2);
  let score = mobileScore * 0.4 + desktopScore * 0.2 + cwvScore * 0.25 + Math.max(0, 100 - opportunityPenalty) * 0.1 + 80 * 0.05;
  if (cwv.lcp_status === "poor") score -= 15;
  if (cwv.cls_status === "poor") score -= 10;
  if (cwv.inp_status === "poor") score -= 10;
  if (savingsBytes > 1_000_000) score -= 5;
  const finalScore = clamp(score);
  const statusLabel = finalScore >= 90 ? "excellent" : finalScore >= 75 ? "good" : finalScore >= 50 ? "needs_work" : "poor";
  const pair = completed.map((item) => ({ strategy: item.strategy, score: item.performanceScore ?? 0 })).sort((a, b) => a.score - b.score);
  return { available: true, status: completed.length === 2 ? "completed" : "partial", performance_score: finalScore, mobile_score: mobile?.performanceScore ?? null, desktop_score: desktop?.performanceScore ?? null, average_performance_score: clamp((mobileScore * 0.65) + (desktopScore * 0.35)), worst_strategy: pair[0]?.strategy ?? null, best_strategy: pair[pair.length - 1]?.strategy ?? null, core_web_vitals_score: cwvScore, core_web_vitals_status: cwv, performance_status: statusLabel, main_performance_issue: critical[0]?.title ?? opportunities[0]?.title ?? null, critical_performance_issues: critical, performance_opportunities: opportunities.slice(0, 8), estimated_savings_summary: { ms: savingsMs, bytes: savingsBytes }, mobile, desktop };
}
