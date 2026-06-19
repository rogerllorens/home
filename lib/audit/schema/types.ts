import type { AuditFinding } from "../types";

export type JsonLdParseResult = { items: Record<string, unknown>[]; types: string[]; parse_errors: string[]; raw_count: number; valid_count: number; invalid_count: number; graph_count: number };
export type SchemaTypeAudit = { found: boolean; count: number; evidence: string[]; confidence: number; issues: AuditFinding[]; recommendations: AuditFinding[] };
export type AdvancedSchemaAudit = {
  schema_score: number;
  schema_status: "excellent" | "good" | "needs_work" | "poor" | "missing" | "invalid";
  schema_strengths: string[];
  schema_issues: AuditFinding[];
  schema_recommendations: AuditFinding[];
  schema_safe_suggestions: string[];
  risky_schema_detected: boolean;
  parser: JsonLdParseResult;
  detected: Record<string, SchemaTypeAudit>;
};
