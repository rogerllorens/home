import assert from "node:assert/strict";
import test from "node:test";
import { parseHtmlSummary } from "../lib/audit/html-parser";
import { generateLlmsTxt, validateLlmsTxt } from "../lib/audit/llms";

test("generates minimal llms.txt without inventing URLs and includes disclaimers", () => {
  const parsed = parseHtmlSummary(`<html><head><title>Example Store</title></head><body><h1>Example Store</h1></body></html>`, "https://example.com/");
  const result = generateLlmsTxt({ normalizedUrl: "https://example.com/", domain: "example.com", parsed, platform: { platform: "Shopify", confidence: 80, evidence: [] }, robots: { robotsTxtFound: true, robotsTxtUrl: "https://example.com/robots.txt", robotsDisallowAll: false, sitemapFound: true, sitemapUrl: "https://example.com/sitemap.xml", sitemapDeclaredInRobots: true, sitemapUrlCountEstimate: 10, sitemapContainsProducts: true, sitemapContainsCategories: true, warnings: [] } });
  assert.ok(result.llms_txt_content.includes("- Home: https://example.com/"));
  assert.ok(result.llms_txt_content.includes("Sitemap"));
  assert.ok(result.llms_txt_content.includes("precio, stock"));
  assert.equal(validateLlmsTxt(result.llms_txt_content).valid, true);
});
