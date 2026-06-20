import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationOutput } from "@/lib/generation/template-generator";
import { buildProposalDiff } from "./diff";
import { calculateBeforeAfterScores } from "./scoring";
import { createProposalEvent } from "./events";
import type { ManualEditRequest, OptimizationProposal, OptimizationProposalVersion, ProposalDetail, ProposalVersionScope, ProposalVersionSource } from "./types";

type Client = SupabaseClient;
const VERSION_SELECT = "*";
const PROPOSAL_SELECT = "*";

function firstText(data: Record<string, unknown>, keys: string[]) { for (const key of keys) { const value = data[key]; if (value != null && String(value).trim()) return String(value).trim(); } return null; }
function toWarnings(output: Record<string, unknown>) { return String(output.quality_warnings ?? "").split(" | ").filter(Boolean); }

export async function createProposalFromJobRow(client: Client, input: { userId: string; jobId: string; jobRowId: string; rowIndex?: number; originalData: Record<string, unknown>; outputData: GenerationOutput & Record<string, unknown>; metadata?: { provider?: string | null; model?: string | null; promptVersion?: string | null; fallbackUsed?: boolean; cost?: number | null; generationEngine?: string | null; templateId?: string | null; promptVersionId?: string | null; sectorRuleId?: string | null; aiGenerationRunId?: string | null; tokenUsage?: Record<string, unknown> | null } }) {
  const existing = await client.from("optimization_proposals").select(PROPOSAL_SELECT).eq("job_row_id", input.jobRowId).maybeSingle<OptimizationProposal>();
  if (existing.data?.id) return existing.data;
  const scores = calculateBeforeAfterScores(input.originalData, input.outputData);
  const catalog = await client.from("catalog_items").upsert({ user_id: input.userId, source: "csv", source_id: input.jobRowId, job_id: input.jobId, job_row_id: input.jobRowId, product_name: firstText(input.outputData, ["seo_product_name", "product_name"]) ?? firstText(input.originalData, ["nombre_producto", "product_name", "name"]), sku: firstText(input.originalData, ["sku", "SKU", "reference"]), handle: firstText(input.originalData, ["handle", "slug"]), product_url: firstText(input.originalData, ["product_url", "url"]), category: firstText(input.originalData, ["category", "categoria", "categoria_producto"]), brand: firstText(input.originalData, ["brand", "marca"]), original_data: input.originalData, normalized_data: input.outputData }, { onConflict: "job_row_id" }).select("*").single<{ id: string }>();
  if (catalog.error || !catalog.data?.id) throw catalog.error ?? new Error("catalog_item_failed");
  const proposal = await client.from("optimization_proposals").insert({ user_id: input.userId, catalog_item_id: catalog.data.id, job_id: input.jobId, job_row_id: input.jobRowId, source: "job", proposal_type: "product", status: "active", review_status: "pending_review", original_snapshot: input.originalData, current_snapshot: input.outputData, original_scores: scores.original, active_scores: scores.proposed, score_delta: scores.delta, main_keyword: firstText(input.outputData, ["main_keyword", "keyword"]), human_review_required: Boolean(input.outputData.human_review_required ?? true), ready_to_export: false, version_count: 0, created_by: input.userId }).select(PROPOSAL_SELECT).single<OptimizationProposal>();
  if (proposal.error || !proposal.data?.id) throw proposal.error ?? new Error("proposal_failed");
  const version = await createProposalVersion(client, { proposal: proposal.data, userId: input.userId, outputData: input.outputData, originalData: input.originalData, source: input.metadata?.fallbackUsed ? "fallback" : "initial", scope: "full_product", instructions: null, metadata: input.metadata });
  await client.from("optimization_proposals").update({ active_version_id: version.id, version_count: 1, current_snapshot: input.outputData, active_scores: version.scores, score_delta: scores.delta, updated_at: new Date().toISOString() }).eq("id", proposal.data.id);
  await client.from("catalog_items").update({ latest_proposal_id: proposal.data.id }).eq("id", catalog.data.id);
  await client.from("job_rows").update({ catalog_item_id: catalog.data.id, proposal_id: proposal.data.id, active_version_id: version.id, original_scores: scores.original, proposed_scores: scores.proposed, score_delta: scores.delta, approval_status: "pending_review" }).eq("id", input.jobRowId);
  await createProposalEvent(client, { proposalId: proposal.data.id, versionId: version.id, userId: input.userId, eventType: "created", metadata: { row_index: input.rowIndex } });
  await createProposalEvent(client, { proposalId: proposal.data.id, versionId: version.id, userId: input.userId, eventType: "version_created", metadata: { source: version.source } });
  return { ...proposal.data, active_version_id: version.id, version_count: 1 };
}

export async function createProposalVersion(client: Client, input: { proposal: OptimizationProposal; userId: string; outputData: GenerationOutput & Record<string, unknown>; originalData?: Record<string, unknown>; source: ProposalVersionSource; scope: ProposalVersionScope; instructions?: string | null; metadata?: Record<string, unknown> | null }) {
  const latest = await client.from("optimization_proposal_versions").select("version_number").eq("proposal_id", input.proposal.id).order("version_number", { ascending: false }).limit(1).maybeSingle<{ version_number: number }>();
  const versionNumber = (latest.data?.version_number ?? 0) + 1;
  const original = input.originalData ?? input.proposal.original_snapshot ?? {};
  const scores = calculateBeforeAfterScores(original as Record<string, unknown>, input.outputData).proposed;
  const diff = buildProposalDiff(original as Record<string, unknown>, input.outputData);
  const insert = await client.from("optimization_proposal_versions").insert({ proposal_id: input.proposal.id, user_id: input.userId, version_number: versionNumber, version_label: `v${versionNumber}`, source: input.source, scope: input.scope, instructions: input.instructions ?? null, output_data: input.outputData, changed_fields: diff.fields.filter((field) => field.changed).map((field) => field.field), diff_summary: diff, scores, quality_audit: { source: input.source }, warnings: toWarnings(input.outputData), recommendations: [], model_used: input.metadata?.model ?? null, provider: input.metadata?.provider ?? null, prompt_version: input.metadata?.promptVersion ?? null, template_id: input.metadata?.templateId ?? null, prompt_version_id: input.metadata?.promptVersionId ?? null, sector_rule_id: input.metadata?.sectorRuleId ?? null, ai_generation_run_id: input.metadata?.aiGenerationRunId ?? null, token_usage: input.metadata?.tokenUsage ?? {}, generation_engine: input.metadata?.generationEngine ?? null, fallback_used: Boolean(input.metadata?.fallbackUsed), ai_cost_estimate: input.metadata?.cost ?? null, human_review_required: Boolean(input.outputData.human_review_required ?? true), ready_to_export: input.outputData.ready_to_publish === "ready", created_by: input.userId }).select(VERSION_SELECT).single<OptimizationProposalVersion>();
  if (insert.error || !insert.data?.id) throw insert.error ?? new Error("version_failed");
  return insert.data;
}

export async function getProposalDetail(client: Client, userId: string, proposalId: string): Promise<ProposalDetail> {
  const proposalResult = await client.from("optimization_proposals").select(PROPOSAL_SELECT).eq("id", proposalId).eq("user_id", userId).maybeSingle<OptimizationProposal>();
  if (!proposalResult.data) throw new Error("proposal_not_found");
  const proposal = proposalResult.data;
  const versionsResult = await client.from("optimization_proposal_versions").select(VERSION_SELECT).eq("proposal_id", proposalId).eq("user_id", userId).order("version_number", { ascending: false }).returns<OptimizationProposalVersion[]>();
  const versions = versionsResult.data ?? [];
  const activeVersion = versions.find((version) => version.id === proposal.active_version_id) ?? versions[0] ?? null;
  const approvedVersion = versions.find((version) => version.id === proposal.approved_version_id) ?? null;
  return { proposal, versions, activeVersion, approvedVersion, diff: activeVersion?.diff_summary ?? buildProposalDiff(proposal.original_snapshot, proposal.current_snapshot), allowedActions: { regenerate: true, approve: Boolean(activeVersion), activate: versions.length > 0, manualEdit: true, exportApproved: Boolean(approvedVersion) } };
}

export async function listProposals(client: Client, userId: string, filters: { jobId?: string | null; reviewStatus?: string | null; status?: string | null; limit?: number } = {}) {
  let query = client.from("optimization_proposals").select(PROPOSAL_SELECT).eq("user_id", userId).order("created_at", { ascending: false }).limit(filters.limit ?? 50);
  if (filters.jobId) query = query.eq("job_id", filters.jobId);
  if (filters.reviewStatus) query = query.eq("review_status", filters.reviewStatus);
  if (filters.status) query = query.eq("status", filters.status);
  return query.returns<OptimizationProposal[]>();
}

export async function setActiveVersion(client: Client, userId: string, proposalId: string, versionId: string) {
  const detail = await getProposalDetail(client, userId, proposalId);
  const version = detail.versions.find((item) => item.id === versionId);
  if (!version) throw new Error("version_not_found");
  const scores = calculateBeforeAfterScores(detail.proposal.original_snapshot, version.output_data);
  await client.from("optimization_proposals").update({ active_version_id: version.id, current_snapshot: version.output_data, active_scores: version.scores, score_delta: scores.delta, status: "active", updated_at: new Date().toISOString() }).eq("id", proposalId).eq("user_id", userId);
  await client.from("job_rows").update({ active_version_id: version.id, output_data: version.output_data, proposed_scores: version.scores, score_delta: scores.delta }).eq("id", detail.proposal.job_row_id).eq("user_id", userId);
  await createProposalEvent(client, { proposalId, versionId, userId, eventType: "activated" });
  return version;
}

export async function approveVersion(client: Client, userId: string, proposalId: string, versionId: string, options: { confirmHumanReview?: boolean } = {}) {
  const detail = await getProposalDetail(client, userId, proposalId);
  const version = detail.versions.find((item) => item.id === versionId);
  if (!version) throw new Error("version_not_found");
  if (version.human_review_required && !options.confirmHumanReview) throw new Error("human_review_confirmation_required");
  await client.from("optimization_proposals").update({ approved_version_id: version.id, approved_scores: version.scores, status: "approved", review_status: "approved", ready_to_export: true, approved_by: userId, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", proposalId).eq("user_id", userId);
  await client.from("job_rows").update({ approved_version_id: version.id, approval_status: "approved" }).eq("id", detail.proposal.job_row_id).eq("user_id", userId);
  await createProposalEvent(client, { proposalId, versionId, userId, eventType: "approved" });
  return version;
}

export async function markNeedsReview(client: Client, userId: string, proposalId: string, metadata: Record<string, unknown> = {}) {
  await client.from("optimization_proposals").update({ status: "needs_review", review_status: "needs_changes", ready_to_export: false, updated_at: new Date().toISOString() }).eq("id", proposalId).eq("user_id", userId);
  await client.from("job_rows").update({ approval_status: "needs_changes" }).eq("proposal_id", proposalId).eq("user_id", userId);
  await createProposalEvent(client, { proposalId, userId, eventType: "marked_needs_review", metadata });
}

const ALLOWED_MANUAL_FIELDS = new Set(["seo_product_name", "meta_title", "meta_description", "short_description", "long_description", "long_description_html", "primary_image_alt", "gallery_image_alts", "slug", "faq", "schema_jsonld"]);
export function sanitizeManualFields(fields: ManualEditRequest["fields"]) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (!ALLOWED_MANUAL_FIELDS.has(key)) throw new Error("field_not_allowed");
    if (typeof value === "string") cleaned[key] = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").slice(0, key.includes("description") ? 5000 : 500);
    else if (Array.isArray(value)) cleaned[key] = value.slice(0, 10).map((item) => String(item).slice(0, 300));
    else cleaned[key] = value;
  }
  return cleaned;
}
