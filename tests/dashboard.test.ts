import assert from "node:assert/strict";
import test from "node:test";
import { buildOnboardingChecklist, estimateJobWaitTime, getNextBestAction } from "../lib/dashboard";
import { buildOpportunitiesFromProposals } from "../lib/opportunities";

test("next best action guides new and review-ready users without GSC data", () => {
  const base = { credits: { available: 1000, reserved: 0, lowCredits: false }, catalog: { products: 0 }, jobs: { total: 0, active: 0 }, proposals: { pendingReview: 0, highImpact: 0, approved: 0 }, downloads: { approvedExports: 0 } } as never;
  assert.equal(getNextBestAction(base).type, "upload_catalog");
  assert.equal(getNextBestAction({ ...(base as object), catalog: { products: 10 }, jobs: { total: 1, active: 0 }, proposals: { pendingReview: 3, highImpact: 0, approved: 0 }, downloads: { approvedExports: 0 }, credits: { lowCredits: false } } as never).type, "review_proposals");
});

test("onboarding marks current step and uses real app links", () => {
  const steps = buildOnboardingChecklist({ hasCatalog: true, hasJob: true, hasCompletedJob: true, hasProposal: false, hasApprovedProposal: false, hasDownload: false, hasCredits: true });
  assert.equal(steps.find((step) => step.id === "proposals")?.status, "current");
  assert.ok(steps.every((step) => step.href.startsWith("/app/")));
});

test("opportunity engine uses internal quality signals and never creates query opportunities", () => {
  const ops = buildOpportunitiesFromProposals([{ id: "p1", status: "active", review_status: "pending_review", current_snapshot: { seo_product_name: "Taladro", primary_image_url: "https://cdn.example.com/a.jpg" }, original_scores: { seo: 35, overall: 40 }, active_scores: { overall: 85, image_seo: 40, geo_aeo: 50, confidence: 55 }, score_delta: { overall: 45 }, human_review_required: true }]);
  assert.ok(ops.some((op) => op.type === "high_score_delta"));
  assert.ok(ops.some((op) => op.type === "missing_alt"));
  assert.equal(ops.some((op) => /query|click|impression|ctr|position/i.test(`${op.type} ${op.title}`)), false);
});

test("wait time is honest and never NaN", () => {
  assert.equal(estimateJobWaitTime({ status: "completed" }).label, "Completado");
  const eta = estimateJobWaitTime({ status: "processing", rowsTotal: 100, rowsProcessed: 10, startedAt: new Date(Date.now() - 60_000).toISOString() });
  assert.equal(Number.isNaN(eta.secondsRemaining), false);
  assert.match(eta.label, /~/);
});
