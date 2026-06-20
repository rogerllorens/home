import assert from "node:assert/strict";
import test from "node:test";
import { createAuditReportToken, hashAuditReportToken } from "../lib/audit/report-token";
import { buildAuditConversionSummary } from "../lib/audit/conversion-summary";
import { renderAuditReportEmail } from "../lib/email/audit-report-email";
import type { FreeSeoAuditResult } from "../lib/audit/types";

const result: FreeSeoAuditResult = {
  status: "completed", input_url: "https://example.com", normalized_url: "https://example.com", domain: "example.com", platform: "Shopify", platform_confidence: 80, http_status: 200, final_url: "https://example.com", redirect_count: 0, fetch_time_ms: 10, html_size_bytes: 1000, title: "Home", title_length: 4, meta_description: null, meta_description_length: 0, h1_count: 1, h1_texts: ["Home"], canonical_url: null, robots_meta: null, is_indexable: true, robots_txt_found: true, robots_txt_url: null, sitemap_found: true, sitemap_url: null, sitemap_declared_in_robots: true, schema_types: [], product_schema_found: false, organization_schema_found: false, breadcrumb_schema_found: false, faq_schema_found: false, image_count: 4, images_without_alt: 3, images_with_empty_alt: 1, large_image_candidates: 0, internal_links_count: 10, external_links_count: 2,
  critical_issues: [{ severity: "critical", category: "Meta", title: "Meta description ausente", description: "Falta meta description", recommendation: "Genera metadatos revisables", impact: "high", effort: "low" }],
  warnings: [{ severity: "warning", category: "Imágenes", title: "Imágenes sin ALT", description: "Faltan ALT", recommendation: "Revisar ALT", impact: "medium", effort: "medium", cta_type: "image_alt" }],
  opportunities: [], scores: { overall: 42, seo: 40, technical: 70, images: 35, schema: 20, indexability: 90, geo_aeo: 45, performance: 55, llms_txt: 10 }, raw_summary: {}, ctas: [], created_at: new Date().toISOString()
};

test("audit report token is random and only hash is stable", () => {
  const one = createAuditReportToken();
  const two = createAuditReportToken();
  assert.notEqual(one.rawToken, two.rawToken);
  assert.equal(hashAuditReportToken(one.rawToken), one.tokenHash);
  assert.ok(one.rawToken.length >= 32);
});

test("conversion summary is commercial but avoids ranking guarantees", () => {
  const summary = buildAuditConversionSummary(result);
  assert.equal(summary.executiveSummary.priorityLevel, "critical");
  assert.ok(summary.topIssues.some((issue) => /Meta/.test(issue.title)));
  const serialized = JSON.stringify(summary).toLowerCase();
  assert.ok(!serialized.includes("garantiza rankings"));
  assert.ok(summary.rankeliaValueSummary.whatRankeliaCanDo.some((item) => item.includes("propuestas")));
});

test("audit report email escapes HTML and includes CTAs", () => {
  const summary = buildAuditConversionSummary(result);
  const email = renderAuditReportEmail({ domain: "evil<script>.com", score: 42, reportUrl: "https://rankelia.ai/auditoria/token", summary });
  assert.ok(email.html.includes("Ver informe completo"));
  assert.ok(email.html.includes("Empezar a optimizar"));
  assert.ok(!email.html.includes("<script>"));
  assert.ok(email.text.includes("Rankelia genera propuestas revisables"));
});
