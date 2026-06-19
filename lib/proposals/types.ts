import type { GenerationOutput } from "@/lib/generation/template-generator";

export type ProposalStatus = "draft" | "active" | "approved" | "rejected" | "needs_review" | "exported" | "archived";
export type ProposalReviewStatus = "pending_review" | "needs_changes" | "approved" | "rejected";
export type ProposalVersionSource = "initial" | "regeneration" | "field_regeneration" | "manual_edit" | "imported" | "fallback";
export type ProposalVersionScope = "full_product" | "seo_product_name" | "meta_title" | "meta_description" | "short_description" | "long_description" | "primary_image_alt" | "gallery_image_alts" | "image_alt" | "slug" | "schema" | "faq" | "category" | "manual_fields";

export type ProposalScores = {
  seo: number;
  conversion: number;
  geo_aeo: number;
  eeat: number;
  image_seo: number;
  schema: number;
  confidence: number;
  readiness: number;
  overall: number;
};

export type BeforeAfterField = {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
  beforeLength: number;
  afterLength: number;
  changed: boolean;
  improvementType: "added" | "expanded_relevance" | "shortened" | "unchanged" | "changed";
  warningsFixed: string[];
  warningsIntroduced: string[];
};

export type ProposalDiff = {
  fields: BeforeAfterField[];
  summary: {
    changedFields: number;
    warningsFixed: number;
    warningsIntroduced: number;
    humanReviewRequired: boolean;
  };
};

export type OptimizationProposal = {
  id: string;
  user_id: string;
  catalog_item_id: string | null;
  job_id: string | null;
  job_row_id: string | null;
  status: ProposalStatus;
  review_status: ProposalReviewStatus;
  active_version_id: string | null;
  approved_version_id: string | null;
  original_snapshot: Record<string, unknown>;
  current_snapshot: Record<string, unknown>;
  original_scores: ProposalScores | Record<string, unknown>;
  active_scores: ProposalScores | Record<string, unknown>;
  approved_scores: ProposalScores | Record<string, unknown>;
  score_delta: Partial<ProposalScores>;
  human_review_required: boolean;
  ready_to_export: boolean;
  version_count: number;
  created_at: string;
  updated_at?: string;
};

export type OptimizationProposalVersion = {
  id: string;
  proposal_id: string;
  user_id: string;
  version_number: number;
  version_label: string | null;
  source: ProposalVersionSource;
  scope: ProposalVersionScope;
  instructions: string | null;
  output_data: GenerationOutput & Record<string, unknown>;
  changed_fields: string[];
  diff_summary: ProposalDiff;
  scores: ProposalScores;
  warnings: string[];
  recommendations: string[];
  model_used: string | null;
  prompt_version: string | null;
  generation_engine: string | null;
  fallback_used: boolean;
  human_review_required: boolean;
  ready_to_export: boolean;
  created_at: string;
};

export type ProposalDetail = {
  proposal: OptimizationProposal;
  versions: OptimizationProposalVersion[];
  activeVersion: OptimizationProposalVersion | null;
  approvedVersion: OptimizationProposalVersion | null;
  diff: ProposalDiff;
  allowedActions: { regenerate: boolean; approve: boolean; activate: boolean; manualEdit: boolean; exportApproved: boolean };
};

export type RegenerationRequest = { scope: ProposalVersionScope; instructions?: string; baseVersionId?: string };
export type ManualEditRequest = { fields: Partial<Record<ProposalVersionScope, unknown>>; notes?: string };
