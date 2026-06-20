import assert from "node:assert/strict";
import test from "node:test";
import { buildProposalDiff, calculateBeforeAfterScores } from "../lib/proposals";
import { buildRegeneratedOutput, validateRegenerationInput } from "../lib/proposals/regeneration";

test("before/after scoring rewards complete proposed output without NaN", () => {
  const original = { nombre_producto: "Taladro Bosch", sku: "BOS-1", image_url: "https://cdn.example.com/a.jpg" };
  const proposed = { seo_product_name: "Taladro percutor Bosch GSB 13 RE", meta_title: "Taladro percutor Bosch GSB 13 RE", meta_description: "Taladro percutor Bosch para bricolaje y montaje profesional.", short_description: "Taladro Bosch con descripción revisable.", seo_score: 88, conversion_score: 82, image_seo_score: 92, confidence_score: 84, eeat_score: 76, geo_ai_readiness_score: 80, ready_to_publish: "review", human_review_required: true };
  const scores = calculateBeforeAfterScores(original, proposed as unknown as import("../lib/generation/template-generator").GenerationOutput);
  assert.ok(scores.proposed.overall > scores.original.overall);
  assert.ok(scores.delta.overall >= 0);
  for (const value of Object.values(scores.delta)) assert.equal(Number.isNaN(value), false);
});

test("proposal diff detects changed SEO fields and lengths", () => {
  const diff = buildProposalDiff({ meta_title: "Taladro", image_alt: "" }, { meta_title: "Taladro percutor Bosch GSB 13 RE", primary_image_alt: "Taladro percutor Bosch GSB 13 RE" });
  const meta = diff.fields.find((field) => field.field === "meta_title");
  const alt = diff.fields.find((field) => field.field === "primary_image_alt");
  assert.equal(meta?.changed, true);
  assert.ok((meta?.afterLength ?? 0) > (meta?.beforeLength ?? 0));
  assert.equal(alt?.improvementType, "added");
  assert.ok(diff.summary.changedFields >= 2);
});

test("field regeneration validates scope and changes only requested field", () => {
  assert.throws(() => validateRegenerationInput("price", ""), /invalid_scope/);
  assert.throws(() => validateRegenerationInput("meta_title", "x".repeat(1001)), /instructions_too_long/);
  const base = { seo_product_name: "Producto", meta_title: "Meta original", meta_description: "Description original", seo_score: 80, conversion_score: 70 } as unknown as import("../lib/generation/template-generator").GenerationOutput;
  const regenerated = buildRegeneratedOutput(base, "meta_title", "más B2B");
  assert.notEqual(regenerated.meta_title, base.meta_title);
  assert.equal(regenerated.meta_description, base.meta_description);
  assert.equal(regenerated.human_review_required, true);
});
