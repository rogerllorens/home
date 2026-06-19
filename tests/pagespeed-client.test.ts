import assert from "node:assert/strict";
import test from "node:test";
import { fetchPageSpeed } from "../lib/audit/pagespeed/client";

test("fetchPageSpeed builds official API URL without exposing key to clients", async () => {
  process.env.PAGESPEED_ENABLED = "true";
  process.env.PAGESPEED_API_KEY = "secret-key";
  let called = "";
  const result = await fetchPageSpeed("https://example.com/", "mobile", { timeoutMs: 1000, fetchImpl: async (url: string | URL | Request) => { called = String(url); return new Response(JSON.stringify({ lighthouseResult: { categories: {}, audits: {} } }), { status: 200, headers: { "content-type": "application/json" } }); } });
  assert.equal(result.status, "completed");
  assert.ok(called.startsWith("https://www.googleapis.com/pagespeedonline/v5/runPagespeed"));
  assert.ok(called.includes("strategy=mobile"));
  assert.ok(called.includes("category=performance"));
  assert.ok(called.includes("key=secret-key"));
});

test("fetchPageSpeed handles quota and missing key as non-throwing states", async () => {
  process.env.PAGESPEED_ENABLED = "true";
  delete process.env.PAGESPEED_API_KEY;
  assert.equal((await fetchPageSpeed("https://example.com/", "desktop")).status, "skipped");
  process.env.PAGESPEED_API_KEY = "secret-key";
  const quota = await fetchPageSpeed("https://example.com/", "desktop", { fetchImpl: async () => new Response("quota", { status: 429 }) });
  assert.equal(quota.status, "rate_limited");
});
