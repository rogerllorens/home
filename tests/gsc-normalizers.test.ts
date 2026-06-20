import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQuery, normalizeUrlForMatching } from "../lib/gsc/normalizers";
import { matchGscUrlToCatalog } from "../lib/gsc/matcher";
test("normalizes URLs by removing tracking params and trailing slash", () => { assert.equal(normalizeUrlForMatching("https://EXAMPLE.com/products/taladro/?utm_source=x&gclid=1#frag"), "https://example.com/products/taladro"); });
test("matches exact, handle and avoids weak false positives", () => { const items = [{ id: "1", product_url: "https://example.com/products/taladro", handle: "taladro", sku: "ABC1234", optimization_proposals: [{ id: "p1" }] }]; assert.equal(matchGscUrlToCatalog("https://example.com/products/taladro/?utm_medium=cpc", items).method, "normalized_product_url"); assert.equal(matchGscUrlToCatalog("https://example.com/products/taladro-bosch", items).method, "handle_path"); assert.equal(matchGscUrlToCatalog("https://example.com/blog/tal", items).method, "none"); });
test("normalizes queries", () => { assert.equal(normalizeQuery(" Taladro   Bosch "), "taladro bosch"); });
