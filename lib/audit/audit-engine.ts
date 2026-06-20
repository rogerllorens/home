import { validateAuditUrl } from "./url-validation";
import { safeFetchHtml } from "./safe-fetch";
import { parseHtmlSummary } from "./html-parser";
import { detectPlatform } from "./platform-detector";
import { auditRobotsAndSitemap } from "./robots-sitemap";
import { auditSchema } from "./schema-audit";
import { auditImages } from "./image-audit";
import { evaluateIndexability } from "./indexability";
import { auditGeoAeo } from "./geo-aeo-audit";
import { calculateFreeAuditScores } from "./scoring";
import { runPageSpeedPair } from "./pagespeed/pagespeed-audit";
import { runAdvancedSchemaAudit } from "./schema";
import { runAdvancedGeoAeoAudit } from "./geo-aeo";
import { generateLlmsTxt } from "./llms";
import { buildBaseFindings } from "./findings";
import type { AuditFinding, FreeSeoAuditResult } from "./types";

const emptyScores = { overall: 0, seo: 0, technical: 0, images: 0, schema: 0, indexability: 0, geo_aeo: 0 };

function splitFindings(findings: AuditFinding[]) {
  return {
    critical_issues: findings.filter((finding) => finding.severity === "critical"),
    warnings: findings.filter((finding) => finding.severity === "warning"),
    opportunities: findings.filter((finding) => finding.severity === "opportunity" || finding.severity === "info"),
  };
}

function ctas() {
  return [
    { label: "Subir catálogo CSV", href: "/login?mode=register&next=/app/upload", kind: "primary" as const },
    { label: "Crear cuenta y guardar informe", href: "/login?mode=register", kind: "secondary" as const },
    { label: "Conectar Search Console (próximamente)", kind: "future" as const },
  ];
}

export async function runFreeSeoAudit(inputUrl: string, options: { sourceIp?: string } = {}): Promise<FreeSeoAuditResult> {
  const created_at = new Date().toISOString();
  let validated;
  try {
    validated = await validateAuditUrl(inputUrl);
  } catch (error) {
    return { status: "blocked", error_message: error instanceof Error ? error.message : "URL bloqueada.", input_url: inputUrl, normalized_url: inputUrl, domain: "", platform: null, platform_confidence: 0, http_status: null, final_url: null, redirect_count: 0, fetch_time_ms: null, html_size_bytes: null, title: null, title_length: null, meta_description: null, meta_description_length: null, h1_count: 0, h1_texts: [], canonical_url: null, robots_meta: null, is_indexable: null, robots_txt_found: null, robots_txt_url: null, sitemap_found: null, sitemap_url: null, sitemap_declared_in_robots: false, schema_types: [], product_schema_found: false, organization_schema_found: false, breadcrumb_schema_found: false, faq_schema_found: false, image_count: 0, images_without_alt: 0, images_with_empty_alt: 0, large_image_candidates: 0, internal_links_count: 0, external_links_count: 0, ...splitFindings([{ severity: "critical", category: "security", title: "URL bloqueada", description: "La URL no es apta para una auditoría pública segura.", recommendation: "Usa una URL pública http/https sin IPs privadas, localhost ni puertos no estándar.", impact: "high", effort: "low" }]), scores: emptyScores, raw_summary: {}, ctas: ctas(), created_at };
  }

  const fetchResult = await safeFetchHtml(validated);
  if (!fetchResult.html || fetchResult.errorCode) {
    const finding: AuditFinding = { severity: fetchResult.errorCode === "blocked_url" ? "critical" : "warning", category: "technical", title: "No se pudo auditar el HTML", description: fetchResult.errorMessage ?? "La página no devolvió HTML usable.", recommendation: "Comprueba que la URL pública carga HTML y no bloquea solicitudes estándar.", impact: "medium", effort: "medium" };
    return { status: fetchResult.errorCode === "blocked_url" ? "blocked" : "failed", error_message: fetchResult.errorMessage ?? fetchResult.errorCode ?? "fetch_failed", input_url: validated.inputUrl, normalized_url: validated.normalizedUrl, domain: validated.domain, platform: null, platform_confidence: 0, http_status: fetchResult.httpStatus ?? null, final_url: fetchResult.finalUrl ?? null, redirect_count: fetchResult.redirectCount, fetch_time_ms: fetchResult.fetchTimeMs, html_size_bytes: fetchResult.htmlSizeBytes ?? null, title: null, title_length: null, meta_description: null, meta_description_length: null, h1_count: 0, h1_texts: [], canonical_url: null, robots_meta: null, is_indexable: null, robots_txt_found: null, robots_txt_url: null, sitemap_found: null, sitemap_url: null, sitemap_declared_in_robots: false, schema_types: [], product_schema_found: false, organization_schema_found: false, breadcrumb_schema_found: false, faq_schema_found: false, image_count: 0, images_without_alt: 0, images_with_empty_alt: 0, large_image_candidates: 0, internal_links_count: 0, external_links_count: 0, ...splitFindings([finding]), scores: emptyScores, raw_summary: {}, ctas: ctas(), created_at };
  }

  const parsed = parseHtmlSummary(fetchResult.html, fetchResult.finalUrl ?? validated.normalizedUrl);
  const [robots, schema] = await Promise.all([auditRobotsAndSitemap(validated), Promise.resolve(auditSchema(parsed.jsonLdBlocks))]);
  const platform = detectPlatform(fetchResult.html, fetchResult.headers, fetchResult.finalUrl ?? validated.normalizedUrl);
  const advancedSchema = runAdvancedSchemaAudit(parsed);
  const advancedGeo = runAdvancedGeoAeoAudit(parsed, advancedSchema);
  const llmsTxt = generateLlmsTxt({ normalizedUrl: validated.normalizedUrl, domain: validated.domain, parsed, robots, platform });
  const indexability = evaluateIndexability(fetchResult, parsed, robots);
  const findings = [...buildBaseFindings(parsed, robots, schema), ...auditImages(parsed), ...auditGeoAeo(parsed, schema), ...indexability.issues];
  const performanceSummary = await runPageSpeedPair(validated, options.sourceIp ?? "unknown").catch(() => undefined);
  const scores = calculateFreeAuditScores(fetchResult, parsed, robots, schema);
  scores.schema = advancedSchema.schema_score;
  scores.geo_aeo = advancedGeo.geo_aeo_score;
  scores.llms_txt = llmsTxt.llms_txt_score;
  if (performanceSummary?.available && performanceSummary.performance_score !== null) {
    scores.performance = performanceSummary.performance_score;
    scores.overall = Math.round(scores.seo * 0.17 + scores.indexability * 0.15 + scores.schema * 0.16 + scores.images * 0.10 + performanceSummary.performance_score * 0.18 + scores.geo_aeo * 0.16 + llmsTxt.llms_txt_score * 0.08);
  } else {
    scores.performance = null;
  }
  return {
    status: "completed", error_message: null, input_url: validated.inputUrl, normalized_url: validated.normalizedUrl, domain: validated.domain,
    platform: platform.platform, platform_confidence: platform.confidence, http_status: fetchResult.httpStatus ?? null, final_url: fetchResult.finalUrl ?? null, redirect_count: fetchResult.redirectCount, fetch_time_ms: fetchResult.fetchTimeMs, html_size_bytes: fetchResult.htmlSizeBytes ?? null,
    title: parsed.title, title_length: parsed.titleLength, meta_description: parsed.metaDescription, meta_description_length: parsed.metaDescriptionLength, h1_count: parsed.h1Texts.length, h1_texts: parsed.h1Texts, canonical_url: parsed.canonicalUrl, robots_meta: parsed.robotsMeta, is_indexable: indexability.isIndexable,
    robots_txt_found: robots.robotsTxtFound, robots_txt_url: robots.robotsTxtUrl, sitemap_found: robots.sitemapFound, sitemap_url: robots.sitemapUrl, sitemap_declared_in_robots: robots.sitemapDeclaredInRobots,
    schema_types: schema.schemaTypes, product_schema_found: schema.productSchemaFound, organization_schema_found: schema.organizationSchemaFound, breadcrumb_schema_found: schema.breadcrumbSchemaFound, faq_schema_found: schema.faqSchemaFound,
    image_count: parsed.imageCount, images_without_alt: parsed.imagesWithoutAlt, images_with_empty_alt: parsed.imagesWithEmptyAlt, large_image_candidates: parsed.largeImageCandidates, internal_links_count: parsed.internalLinksCount, external_links_count: parsed.externalLinksCount,
    ...splitFindings([...findings, ...advancedSchema.schema_issues, ...advancedSchema.schema_recommendations, ...advancedGeo.geo_aeo_issues]), scores, performance_summary: performanceSummary, schema_advanced: advancedSchema, geo_aeo_advanced: advancedGeo, llms_txt: llmsTxt, raw_summary: { lang: parsed.lang, viewport: Boolean(parsed.viewport), charset: parsed.charset, h2_count: parsed.h2Texts.length, word_count: parsed.wordCount, platform_evidence: platform.evidence, robots_warnings: robots.warnings, schema_warnings: schema.warnings, sitemap_url_count_estimate: robots.sitemapUrlCountEstimate, sitemap_contains_products: robots.sitemapContainsProducts, sitemap_contains_categories: robots.sitemapContainsCategories, pagespeed_status: performanceSummary?.status ?? "unavailable", pagespeed_mobile_score: performanceSummary?.mobile_score ?? null, pagespeed_desktop_score: performanceSummary?.desktop_score ?? null, core_web_vitals_status: performanceSummary?.core_web_vitals_status ?? null, schema_status: advancedSchema.schema_status, schema_score: advancedSchema.schema_score, geo_aeo_status: advancedGeo.geo_aeo_status, llms_txt_score: llmsTxt.llms_txt_score }, ctas: ctas(), created_at,
  };
}
