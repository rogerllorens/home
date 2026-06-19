export type PageSpeedStrategy = "mobile" | "desktop";
export type MetricStatus = "good" | "needs_improvement" | "poor" | "unavailable";

export type PageSpeedOpportunity = {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  numericValue?: number;
  estimatedSavingsMs?: number;
  estimatedSavingsBytes?: number;
  severity: "critical" | "warning" | "opportunity" | "info";
  recommendation: string;
};

export type NormalizedPageSpeedResult = {
  strategy: PageSpeedStrategy;
  status: "completed" | "failed" | "skipped" | "rate_limited";
  errorMessage?: string;
  psiFetchTimeMs?: number;
  lighthouseVersion?: string;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  pwaScore: number | null;
  firstContentfulPaintMs: number | null;
  largestContentfulPaintMs: number | null;
  totalBlockingTimeMs: number | null;
  cumulativeLayoutShift: number | null;
  speedIndexMs: number | null;
  interactionToNextPaintMs: number | null;
  timeToInteractiveMs: number | null;
  serverResponseTimeMs: number | null;
  renderBlockingSavingsMs: number | null;
  unusedJsSavingsBytes: number | null;
  unusedCssSavingsBytes: number | null;
  imageOptimizationSavingsBytes: number | null;
  modernImageSavingsBytes: number | null;
  domSize: number | null;
  fieldData: Record<string, unknown>;
  labData: Record<string, unknown>;
  opportunities: PageSpeedOpportunity[];
  diagnostics: PageSpeedOpportunity[];
  rawSummary: Record<string, unknown>;
  cacheKey: string;
  expiresAt: string;
};

export type CoreWebVitalsStatus = {
  lcp_status: MetricStatus;
  cls_status: MetricStatus;
  inp_status: MetricStatus;
  cwv_overall_status: MetricStatus;
  field_data_available: boolean;
  lab_data_used: boolean;
  inp_available: boolean;
};

export type RankeliaPerformanceSummary = {
  available: boolean;
  status: "completed" | "partial" | "skipped" | "failed" | "rate_limited";
  performance_score: number | null;
  mobile_score: number | null;
  desktop_score: number | null;
  average_performance_score: number | null;
  worst_strategy: PageSpeedStrategy | null;
  best_strategy: PageSpeedStrategy | null;
  core_web_vitals_score: number | null;
  core_web_vitals_status: CoreWebVitalsStatus;
  performance_status: "excellent" | "good" | "needs_work" | "poor" | "unavailable";
  main_performance_issue: string | null;
  critical_performance_issues: PageSpeedOpportunity[];
  performance_opportunities: PageSpeedOpportunity[];
  estimated_savings_summary: { ms: number; bytes: number };
  mobile?: NormalizedPageSpeedResult;
  desktop?: NormalizedPageSpeedResult;
};
