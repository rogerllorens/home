import type { AdvancedSchemaAudit } from "./types";
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export function calculateSchemaStatus(score: number, invalid: boolean, missing: boolean): AdvancedSchemaAudit["schema_status"] {
  if (invalid) return "invalid"; if (missing) return "missing"; if (score >= 90) return "excellent"; if (score >= 75) return "good"; if (score >= 50) return "needs_work"; return "poor";
}
export function calculateSchemaScore(input: { parseable: boolean; hasOrganizationOrWebsite: boolean; hasProduct: boolean; hasBreadcrumb: boolean; hasFaq: boolean; hasRisky: boolean; issueCount: number }) {
  let score = 0;
  if (input.parseable) score += 20;
  if (input.hasOrganizationOrWebsite) score += 25;
  if (input.hasProduct) score += 20;
  if (input.hasBreadcrumb) score += 10;
  if (input.hasFaq) score += 10;
  score += input.hasRisky ? 0 : 15;
  score -= Math.min(25, input.issueCount * 4);
  return clamp(score);
}
