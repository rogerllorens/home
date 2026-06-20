import type { Opportunity } from "./types";
import { clampOpportunityScore, priorityFromScore } from "./scoring";

type ProposalLike = { id: string; job_id?: string | null; catalog_item_id?: string | null; current_snapshot?: Record<string, unknown>; original_scores?: Record<string, number>; active_scores?: Record<string, number>; score_delta?: Record<string, number>; review_status?: string; status?: string; approved_version_id?: string | null; exported_at?: string | null; human_review_required?: boolean };
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
function productName(p: ProposalLike) { return text(p.current_snapshot?.seo_product_name ?? p.current_snapshot?.product_name ?? p.current_snapshot?.nombre_producto) || "Producto"; }
function category(p: ProposalLike) { return text(p.current_snapshot?.category ?? p.current_snapshot?.categoria) || null; }
function base(p: ProposalLike, type: import("./types").InternalOpportunityType, score: number, title: string, description: string, action = "Revisar propuesta"): Opportunity { return { source: "internal", id: `${type}:${p.id}`, type, label: labelFor(type), priority: priorityFromScore(score), score: clampOpportunityScore(score), title, description, recommendedAction: action, href: `/app/proposals/${p.id}`, productName: productName(p), proposalId: p.id, jobId: p.job_id ?? null, catalogItemId: p.catalog_item_id ?? null, category: category(p), metrics: { beforeScore: num(p.original_scores?.overall), afterScore: num(p.active_scores?.overall), delta: num(p.score_delta?.overall), imageSeoScore: num(p.active_scores?.image_seo), geoAeoScore: num(p.active_scores?.geo_aeo), confidence: num(p.active_scores?.confidence) } }; }
export function labelFor(type: import("./types").OpportunityType) { return ({ low_seo_score: "SEO bajo", high_score_delta: "Alto impacto", missing_alt: "ALT pendiente", low_image_seo: "Image SEO bajo", needs_human_review: "Revisión humana", ready_to_approve: "Lista para aprobar", approved_not_exported: "Aprobada sin exportar", schema_issue: "Schema", geo_aeo_gap: "GEO/AEO", confidence_gap: "Confianza", failed_rows: "Filas fallidas", category_quality_gap: "Categoría", gsc_high_impressions_low_ctr: "GSC CTR bajo", gsc_quick_win_position_4_15: "GSC quick win", gsc_position_16_30_content_gap: "GSC contenido", gsc_impressions_no_clicks: "GSC sin clics", gsc_query_not_in_meta: "Query no está en meta", gsc_query_not_in_title: "Query no está en título", gsc_page_with_low_quality_score: "GSC + calidad baja", gsc_missing_alt_with_impressions: "GSC + ALT", gsc_schema_gap_with_impressions: "GSC + schema", gsc_geo_aeo_gap_with_impressions: "GSC + GEO/AEO", gsc_approved_not_exported_with_gsc_demand: "GSC + aprobada", gsc_product_priority: "Prioridad GSC" } as const)[type] ?? String(type); }
export function buildOpportunitiesFromProposals(proposals: ProposalLike[]): Opportunity[] {
  const ops: Opportunity[] = [];
  for (const p of proposals) {
    const delta = num(p.score_delta?.overall); const seo = num(p.original_scores?.seo); const image = num(p.active_scores?.image_seo); const geo = num(p.active_scores?.geo_aeo); const confidence = num(p.active_scores?.confidence);
    if (delta >= 25) ops.push(base(p, "high_score_delta", 50 + delta, `Alto potencial de mejora: ${productName(p)}`, `Score estimado ${num(p.original_scores?.overall)} → ${num(p.active_scores?.overall)} (+${delta}).`));
    if (seo && seo < 55) ops.push(base(p, "low_seo_score", 65 + (55 - seo), `SEO bajo en ${productName(p)}`, "El contenido original tiene señales SEO incompletas o débiles."));
    if (image && image < 60) ops.push(base(p, "low_image_seo", 60 + (60 - image), `Image SEO bajo`, "Revisa ALT e imágenes antes de exportar."));
    if (!text(p.current_snapshot?.primary_image_alt) && text(p.current_snapshot?.primary_image_url)) ops.push(base(p, "missing_alt", 72, "Imagen con ALT pendiente", "Hay URL de imagen sin ALT principal claro."));
    if (p.human_review_required || p.review_status === "pending_review") ops.push(base(p, "needs_human_review", 55, "Pendiente de revisión humana", "La propuesta debe revisarse antes de aprobar/exportar."));
    if (p.status === "active" && delta >= 10) ops.push(base(p, "ready_to_approve", 58 + delta, "Lista para evaluación", "La propuesta activa tiene mejora estimada y puede revisarse para aprobación."));
    if (p.approved_version_id && !p.exported_at) ops.push(base(p, "approved_not_exported", 80, "Aprobada pendiente de descarga", "Esta propuesta ya fue aprobada y puede exportarse.", "Exportar aprobadas"));
    if (geo && geo < 55) ops.push(base(p, "geo_aeo_gap", 50 + (55 - geo), "GEO/AEO mejorable", "La propuesta puede estructurarse mejor para lectura por buscadores y sistemas de IA."));
    if (confidence && confidence < 60) ops.push(base(p, "confidence_gap", 45 + (60 - confidence), "Confianza baja", "Faltan datos o hay warnings que recomiendan revisión."));
  }
  return ops.sort((a, b) => b.score - a.score);
}
