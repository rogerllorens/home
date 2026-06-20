import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import type { FreeSeoAuditResult } from "./types";
import type { AuditConversionSummary } from "./conversion-summary";

function hash(value: string | null) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function saveFreeSeoAudit(result: FreeSeoAuditResult, context: { userId?: string | null; leadEmail?: string | null; leadName?: string | null; companyName?: string | null; sourceIp?: string | null; userAgent?: string | null; tokenHash?: string | null; tokenExpiresAt?: Date | null; conversionSummary?: AuditConversionSummary | null; consentEmailReport?: boolean; consentMarketing?: boolean; utm?: Record<string, string | null | undefined>; referrer?: string | null }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { auditId: null, skipped: true };
  const supabase = createServiceClient();
  const payload = {
    user_id: context.userId ?? null,
    lead_email: context.leadEmail?.toLowerCase() ?? null,
    email: context.leadEmail?.toLowerCase() ?? null,
    lead_name: context.leadName ?? null,
    company_name: context.companyName ?? null,
    url: result.input_url,
    input_url: result.input_url,
    normalized_url: result.normalized_url,
    domain: result.domain,
    status: result.status,
    error_message: result.error_message ?? null,
    platform: result.platform,
    platform_guess: result.platform,
    platform_confidence: result.platform_confidence,
    http_status: result.http_status,
    final_url: result.final_url,
    redirect_count: result.redirect_count,
    fetch_time_ms: result.fetch_time_ms,
    html_size_bytes: result.html_size_bytes,
    title: result.title,
    title_length: result.title_length,
    meta_description: result.meta_description,
    meta_description_length: result.meta_description_length,
    h1_count: result.h1_count,
    h1_texts: result.h1_texts,
    canonical_url: result.canonical_url,
    robots_meta: result.robots_meta,
    is_indexable: result.is_indexable,
    robots_txt_found: result.robots_txt_found,
    robots_txt_url: result.robots_txt_url,
    sitemap_found: result.sitemap_found,
    sitemap_url: result.sitemap_url,
    sitemap_declared_in_robots: result.sitemap_declared_in_robots,
    schema_types: result.schema_types,
    product_schema_found: result.product_schema_found,
    organization_schema_found: result.organization_schema_found,
    breadcrumb_schema_found: result.breadcrumb_schema_found,
    faq_schema_found: result.faq_schema_found,
    image_count: result.image_count,
    images_without_alt: result.images_without_alt,
    images_with_empty_alt: result.images_with_empty_alt,
    large_image_candidates: result.large_image_candidates,
    internal_links_count: result.internal_links_count,
    external_links_count: result.external_links_count,
    critical_issues: result.critical_issues,
    warnings: result.warnings,
    opportunities: result.opportunities,
    scores: result.scores,
    overall_score: result.scores.overall,
    seo_score: result.scores.seo,
    technical_score: result.scores.technical,
    image_score: result.scores.images,
    schema_score: result.scores.schema,
    performance_score: result.scores.performance ?? null,
    geo_aeo_score: result.scores.geo_aeo,
    llms_score: result.scores.llms_txt ?? null,
    audit_result: result as unknown as Record<string, unknown>,
    executive_summary: context.conversionSummary?.executiveSummary ?? {},
    top_issues: context.conversionSummary?.topIssues ?? [],
    top_opportunities: context.conversionSummary?.topOpportunities ?? [],
    recommended_actions: context.conversionSummary?.recommendedActions ?? [],
    rankelia_value_summary: context.conversionSummary?.rankeliaValueSummary ?? {},
    public_token_hash: context.tokenHash ?? null,
    public_token_created_at: context.tokenHash ? new Date().toISOString() : null,
    public_token_expires_at: context.tokenExpiresAt?.toISOString() ?? null,
    consent_email_report: Boolean(context.consentEmailReport),
    consent_marketing: Boolean(context.consentMarketing),
    utm_source: context.utm?.utm_source ?? null,
    utm_medium: context.utm?.utm_medium ?? null,
    utm_campaign: context.utm?.utm_campaign ?? null,
    utm_term: context.utm?.utm_term ?? null,
    utm_content: context.utm?.utm_content ?? null,
    referrer: context.referrer ?? null,
    raw_summary: result.raw_summary,
    schema_status: result.schema_advanced?.schema_status ?? null,
    schema_summary: result.schema_advanced ? { parser: result.schema_advanced.parser, strengths: result.schema_advanced.schema_strengths, detected: result.schema_advanced.detected } : {},
    schema_issues: result.schema_advanced?.schema_issues ?? [],
    schema_recommendations: result.schema_advanced?.schema_recommendations ?? [],
    schema_safe_suggestions: result.schema_advanced?.schema_safe_suggestions ?? [],
    geo_aeo_status: result.geo_aeo_advanced?.geo_aeo_status ?? null,
    geo_aeo_summary: result.geo_aeo_advanced ?? {},
    geo_aeo_issues: result.geo_aeo_advanced?.geo_aeo_issues ?? [],
    geo_aeo_recommendations: result.geo_aeo_advanced?.geo_aeo_recommendations ?? [],
    llms_txt_generated: result.llms_txt?.llms_txt_generated ?? false,
    llms_txt_preview: result.llms_txt?.llms_txt_content ?? null,
    llms_txt_warnings: result.llms_txt?.llms_txt_warnings ?? [],
    llms_txt_score: result.llms_txt?.llms_txt_score ?? null,
    source_ip_hash: hash(context.sourceIp ?? null),
    user_agent_hash: hash(context.userAgent ?? null),
    ip_hash: hash(context.sourceIp ?? null),
  };
  const { data, error } = await supabase.from("free_seo_audits").insert(payload).select("id").single<{ id: string }>();
  if (error) return { auditId: null, skipped: false, error: error.message };
  return { auditId: data.id, skipped: false };
}

export async function recordAuditReportEvent(auditId: string | null | undefined, eventType: string, metadata: Record<string, unknown> = {}, userId?: string | null) {
  if (!auditId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { skipped: true };
  const supabase = createServiceClient();
  const { error } = await supabase.from("audit_report_events").insert({ audit_id: auditId, user_id: userId ?? null, event_type: eventType, metadata });
  return { skipped: false, error: error?.message };
}

export async function markAuditEmailSent(auditId: string | null | undefined) {
  if (!auditId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  await createServiceClient().from("free_seo_audits").update({ report_sent_at: new Date().toISOString() }).eq("id", auditId);
}
