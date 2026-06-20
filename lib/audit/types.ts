export type AuditSeverity = "critical" | "warning" | "opportunity" | "info";

export type AuditFinding = {
  severity: AuditSeverity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  impact?: "low" | "medium" | "high";
  effort?: "low" | "medium" | "high";
  cta_type?: "upload_catalog" | "signup" | "gsc_future" | "image_alt";
};

export type AuditScores = {
  overall: number;
  seo: number;
  technical: number;
  images: number;
  schema: number;
  indexability: number;
  geo_aeo: number;
  performance?: number | null;
  llms_txt?: number | null;
};

export type ValidatedAuditUrl = {
  inputUrl: string;
  normalizedUrl: string;
  domain: string;
  url: URL;
  resolvedIp: string;
  resolvedFamily: 4 | 6;
};

export type SafeFetchResult = {
  ok: boolean;
  httpStatus?: number;
  finalUrl?: string;
  redirectCount: number;
  fetchTimeMs: number;
  html?: string;
  htmlSizeBytes?: number;
  headers: Record<string, string>;
  errorCode?: string;
  errorMessage?: string;
};

export type ParsedHtmlSummary = {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  robotsMeta: string | null;
  canonicalUrl: string | null;
  lang: string | null;
  charset: string | null;
  viewport: string | null;
  h1Texts: string[];
  h2Texts: string[];
  wordCount: number;
  bodyTextPreview: string;
  internalLinksCount: number;
  externalLinksCount: number;
  nofollowLinksCount: number;
  hreflangCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  imagesWithEmptyAlt: number;
  imagesMissingDimensions: number;
  lazyImagesCount: number;
  modernImageFormats: number;
  largeImageCandidates: number;
  imageSamples: string[];
  openGraph: { title: boolean; description: boolean; image: boolean };
  twitterCard: boolean;
  jsonLdBlocks: string[];
};

export type PlatformDetection = { platform: string; confidence: number; evidence: string[] };

export type RobotsSitemapAudit = {
  robotsTxtFound: boolean;
  robotsTxtUrl: string | null;
  robotsDisallowAll: boolean;
  sitemapFound: boolean;
  sitemapUrl: string | null;
  sitemapDeclaredInRobots: boolean;
  sitemapUrlCountEstimate: number;
  sitemapContainsProducts: boolean;
  sitemapContainsCategories: boolean;
  warnings: string[];
};

export type SchemaAudit = {
  schemaTypes: string[];
  productSchemaFound: boolean;
  organizationSchemaFound: boolean;
  breadcrumbSchemaFound: boolean;
  faqSchemaFound: boolean;
  invalidJsonLdCount: number;
  warnings: string[];
};

export type FreeSeoAuditResult = {
  audit_id?: string;
  status: "completed" | "failed" | "blocked";
  error_message?: string | null;
  input_url: string;
  normalized_url: string;
  domain: string;
  platform: string | null;
  platform_confidence: number;
  http_status: number | null;
  final_url: string | null;
  redirect_count: number;
  fetch_time_ms: number | null;
  html_size_bytes: number | null;
  title: string | null;
  title_length: number | null;
  meta_description: string | null;
  meta_description_length: number | null;
  h1_count: number;
  h1_texts: string[];
  canonical_url: string | null;
  robots_meta: string | null;
  is_indexable: boolean | null;
  robots_txt_found: boolean | null;
  robots_txt_url: string | null;
  sitemap_found: boolean | null;
  sitemap_url: string | null;
  sitemap_declared_in_robots: boolean;
  schema_types: string[];
  product_schema_found: boolean;
  organization_schema_found: boolean;
  breadcrumb_schema_found: boolean;
  faq_schema_found: boolean;
  image_count: number;
  images_without_alt: number;
  images_with_empty_alt: number;
  large_image_candidates: number;
  internal_links_count: number;
  external_links_count: number;
  critical_issues: AuditFinding[];
  warnings: AuditFinding[];
  opportunities: AuditFinding[];
  scores: AuditScores;
  raw_summary: Record<string, unknown>;
  performance_summary?: import("./pagespeed/types").RankeliaPerformanceSummary;
  schema_advanced?: import("./schema/types").AdvancedSchemaAudit;
  geo_aeo_advanced?: import("./geo-aeo/types").AdvancedGeoAeoAudit;
  llms_txt?: import("./llms/types").LlmsTxtResult;
  ctas: Array<{ label: string; href?: string; kind: "primary" | "secondary" | "future" }>;
  created_at: string;
};
