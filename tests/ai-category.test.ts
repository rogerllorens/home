import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("category AI uses category prompt and schema instead of product schema", () => {
  const generator = readFileSync("lib/ai/generators/product-ai-generator.ts", "utf8");
  assert.match(generator, /categoryAIOutputSchema/);
  assert.match(generator, /buildMessages\(kind/);
  assert.match(generator, /normalizeCategoryOutput/);
  assert.doesNotMatch(generator, /kind === "category" \? "product"/);
});
