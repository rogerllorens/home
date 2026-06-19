import type { AuditScores, ParsedHtmlSummary, RobotsSitemapAudit, SchemaAudit, SafeFetchResult } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateFreeAuditScores(fetchResult: SafeFetchResult, parsed: ParsedHtmlSummary, robots: RobotsSitemapAudit, schema: SchemaAudit): AuditScores {
  const titleScore = parsed.title ? (parsed.titleLength >= 30 && parsed.titleLength <= 65 ? 25 : 15) : 0;
  const metaScore = parsed.metaDescription ? (parsed.metaDescriptionLength >= 80 && parsed.metaDescriptionLength <= 160 ? 25 : 15) : 0;
  const seo = clamp(titleScore + metaScore + (parsed.h1Texts.length === 1 ? 15 : parsed.h1Texts.length ? 8 : 0) + (parsed.canonicalUrl ? 10 : 0) + (parsed.h2Texts.length >= 2 && parsed.wordCount > 250 ? 10 : 4) + ((parsed.openGraph.title && parsed.openGraph.description) ? 5 : 0) + (parsed.lang ? 5 : 0) + (parsed.viewport ? 5 : 0));
  const technical = clamp((fetchResult.httpStatus === 200 ? 25 : 5) + (parsed.canonicalUrl ? 15 : 0) + (parsed.viewport ? 8 : 0) + (parsed.lang ? 6 : 0) + (parsed.charset ? 6 : 0) + (robots.robotsTxtFound ? 10 : 0) + (robots.sitemapFound ? 15 : 0) + (fetchResult.redirectCount <= 1 ? 8 : 3) + ((fetchResult.htmlSizeBytes ?? 0) > 10_000 ? 7 : 2));
  const missingAlt = parsed.imageCount ? (parsed.imagesWithoutAlt + parsed.imagesWithEmptyAlt) / parsed.imageCount : 0;
  const images = parsed.imageCount ? clamp((1 - missingAlt) * 50 + (1 - Math.min(1, parsed.imagesMissingDimensions / parsed.imageCount)) * 20 + Math.min(20, (parsed.modernImageFormats / parsed.imageCount) * 40) + (parsed.imageCount > 2 ? 10 : 3)) : 70;
  const schemaScore = clamp((schema.invalidJsonLdCount ? 10 : 30) + (schema.organizationSchemaFound ? 20 : 0) + (schema.productSchemaFound ? 25 : 0) + (schema.breadcrumbSchemaFound ? 15 : 0) + (schema.faqSchemaFound ? 10 : 0));
  const noindex = (parsed.robotsMeta ?? "").toLowerCase().includes("noindex");
  const indexability = clamp((fetchResult.httpStatus === 200 ? 25 : 0) + (!noindex ? 25 : 0) + (parsed.canonicalUrl ? 15 : 0) + (robots.robotsTxtFound && !robots.robotsDisallowAll ? 15 : 0) + (robots.sitemapFound ? 15 : 0) + (parsed.wordCount > 150 ? 5 : 0));
  const geo = clamp((parsed.title && parsed.h1Texts.length ? 20 : 5) + (parsed.h2Texts.length >= 2 ? 20 : 5) + (schema.faqSchemaFound ? 15 : 0) + ((schema.productSchemaFound || schema.organizationSchemaFound) ? 20 : 5) + (parsed.wordCount > 350 ? 15 : 5) + (/\b(comprar|producto|tienda|categor|env[ií]o|marca)\b/i.test(parsed.bodyTextPreview) ? 10 : 3));
  const overall = clamp(seo * 0.25 + indexability * 0.2 + schemaScore * 0.15 + images * 0.15 + technical * 0.1 + geo * 0.15);
  return { overall, seo, technical, images, schema: schemaScore, indexability, geo_aeo: geo };
}
