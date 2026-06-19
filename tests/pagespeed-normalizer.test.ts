import assert from "node:assert/strict";
import test from "node:test";
import { normalizePageSpeedResponse } from "../lib/audit/pagespeed/normalizer";
import { calculateCoreWebVitalsStatus, calculateRankeliaPerformanceScore } from "../lib/audit/pagespeed/scoring";

const raw = {
  loadingExperience: { metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2400 } } },
  lighthouseResult: {
    lighthouseVersion: "12.0.0",
    requestedUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    categories: { performance: { score: 0.72 }, seo: { score: 0.91 }, "best-practices": { score: 0.8 }, accessibility: { score: 0.88 } },
    audits: {
      "first-contentful-paint": { numericValue: 1100, displayValue: "1.1 s" },
      "largest-contentful-paint": { numericValue: 3100, displayValue: "3.1 s" },
      "total-blocking-time": { numericValue: 320, displayValue: "320 ms" },
      "cumulative-layout-shift": { numericValue: 0.18, displayValue: "0.18" },
      "speed-index": { numericValue: 2500 },
      "server-response-time": { numericValue: 700, title: "Reduce initial server response time", description: "Slow server", score: 0.3 },
      "render-blocking-resources": { title: "Eliminate render-blocking resources", description: "CSS blocks rendering", score: 0.2, details: { overallSavingsMs: 900 } },
      "unused-javascript": { title: "Reduce unused JavaScript", description: "Unused JS", score: 0.4, details: { overallSavingsBytes: 150000 } },
      "dom-size": { title: "Avoid excessive DOM size", description: "DOM", numericValue: 1200, score: 0.7 },
    },
  },
};

test("normalizes Lighthouse/PageSpeed response into compact metrics", () => {
  const result = normalizePageSpeedResponse(raw, "mobile", "https://example.com/", 123);
  assert.equal(result.performanceScore, 72);
  assert.equal(result.seoScore, 91);
  assert.equal(result.largestContentfulPaintMs, 3100);
  assert.equal(result.cumulativeLayoutShift, 0.18);
  assert.equal(result.renderBlockingSavingsMs, 900);
  assert.ok(result.opportunities.some((item) => item.id === "render-blocking-resources"));
});

test("calculates CWV status and weighted Rankelia performance score", () => {
  const mobile = normalizePageSpeedResponse(raw, "mobile", "https://example.com/", 123);
  const desktop = { ...mobile, strategy: "desktop" as const, performanceScore: 95, largestContentfulPaintMs: 1400, cumulativeLayoutShift: 0.02, totalBlockingTimeMs: 80 };
  const cwv = calculateCoreWebVitalsStatus(mobile);
  assert.equal(cwv.lcp_status, "needs_improvement");
  assert.equal(cwv.cls_status, "needs_improvement");
  assert.equal(cwv.inp_available, false);
  const summary = calculateRankeliaPerformanceScore(mobile, desktop);
  assert.equal(summary.mobile_score, 72);
  assert.equal(summary.desktop_score, 95);
  assert.ok((summary.performance_score ?? 0) < 95, "mobile and CWV should weigh down the score");
});

test("PageSpeed unavailable does not produce a failing performance score", () => {
  const summary = calculateRankeliaPerformanceScore();
  assert.equal(summary.available, false);
  assert.equal(summary.performance_score, null);
  assert.equal(summary.performance_status, "unavailable");
});
