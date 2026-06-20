import assert from "node:assert/strict";
import test from "node:test";
import { chooseExperimentVariant, defaultPromptKinds, defaultSectorRules, estimateAiCost, interpolateTemplate, resolveModelForTask, resolveSectorRule, validatePromptVersionForActivation } from "../lib/ai-template-studio";

test("AI template seed defaults include required prompt families and sectors", () => {
  assert.ok(defaultPromptKinds.some((item) => item.key === "product.seo.v1"));
  assert.ok(defaultPromptKinds.some((item) => item.key === "field_regeneration.v1"));
  assert.ok(defaultSectorRules.some((rule) => rule.key === "farmacia_parafarmacia_cautious"));
});

test("renderer interpolates variables without executing code", () => {
  const rendered = interpolateTemplate("Producto {{product_name}} {{manual_instructions}}", { product_name: "Zapato", manual_instructions: "{{constructor.constructor('return process')()}}" });
  assert.equal(rendered, "Producto Zapato {{constructor.constructor('return process')()}}");
});

test("sector resolver applies cautious pharmacy and generic fallback", () => {
  assert.equal(resolveSectorRule({ category: "Parafarmacia" }).key, "farmacia_parafarmacia_cautious");
  assert.equal(resolveSectorRule({ category: "Accesorios" }).key, "generic_ecommerce");
});

test("routing falls back to template when no provider env is configured", () => {
  const route = resolveModelForTask({ taskType: "preview", models: [{ provider: "template_fallback", model: "rankelia-template", display_name: "Fallback", status: "active", supports_json: true, quality_tier: "cheap" }] });
  assert.equal(route.provider, "template_fallback");
});

test("cost estimator calculates per-token costs and unknown model warning", () => {
  const known = estimateAiCost({ modelConfig: { input_cost_per_1m: 1, output_cost_per_1m: 2 }, inputTokens: 1000, outputTokens: 500 });
  assert.equal(known.cost, 0.002);
  const unknown = estimateAiCost({ modelConfig: null, inputTokens: 1000, outputTokens: 500 });
  assert.equal(unknown.cost, null);
  assert.ok(unknown.warning);
});

test("prompt activation validation enforces safety and schema", () => {
  const bad = validatePromptVersionForActivation({ system_prompt: "hello", user_prompt_template: "world", output_schema: {}, safety_policy: {} });
  assert.equal(bad.ok, false);
  const good = validatePromptVersionForActivation({ system_prompt: "No inventes claims y devuelve JSON", user_prompt_template: "JSON con claims seguros", output_schema: { type: "object" }, safety_policy: {} });
  assert.equal(good.ok, true);
});

test("experiments choose a stable variant", () => {
  const a = chooseExperimentVariant({ experimentId: "exp", variantA: "A", variantB: "B", stickyKey: "user-job-row" });
  const b = chooseExperimentVariant({ experimentId: "exp", variantA: "A", variantB: "B", stickyKey: "user-job-row" });
  assert.equal(a, b);
});
