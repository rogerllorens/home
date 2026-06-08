import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCT_STANDARD_CREDITS, calculateJobCredits, getExtraProductPackById, getRecommendedPackForDeficit, getPlanInternalCredits, formatCreditsAsProducts, normalizeGenerationType } from "../lib/pricing";

test("pricing constants convert products to internal credits", () => {
  assert.equal(PRODUCT_STANDARD_CREDITS, 500);
  assert.equal(getPlanInternalCredits("pro"), 75000);
  assert.equal(formatCreditsAsProducts(5000), "10 productos estándar equivalentes");
});

test("job cost respects generation quality", () => {
  assert.equal(calculateJobCredits(3, { qualityLevel: "standard", generationType: "product_complete" }), 1500);
  assert.equal(calculateJobCredits(3, { qualityLevel: "pro", generationType: "product_complete" }), 3000);
  assert.equal(calculateJobCredits(3, { qualityLevel: "premium", generationType: "product_complete" }), 6000);
  assert.equal(calculateJobCredits(3, { generationType: "metadata_only" }), 150);
  assert.equal(normalizeGenerationType("products_categories"), "products_categories");
  assert.equal(calculateJobCredits(3, { generationType: "products_categories", qualityLevel: "standard", categories: 2 }), 11500);
});

test("recommended pack covers deficit without exposing credit packs publicly", () => {
  const pack = getRecommendedPackForDeficit(78000);
  assert.equal(pack?.id, "products_250");
  assert.equal(getExtraProductPackById("products_1000")?.internalCredits, 500000);
});
