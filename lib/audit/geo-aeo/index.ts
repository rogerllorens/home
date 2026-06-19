import type { AuditFinding, ParsedHtmlSummary } from "../types";
import type { AdvancedSchemaAudit } from "../schema/types";
import { entityClarity } from "./entity-signals";
import { answerReadiness } from "./answer-readiness";
import { contentStructure } from "./content-structure";
import type { AdvancedGeoAeoAudit } from "./types";

export function runAdvancedGeoAeoAudit(parsed: ParsedHtmlSummary, schema: AdvancedSchemaAudit): AdvancedGeoAeoAudit {
  const entity = entityClarity(parsed, schema.parser.types);
  const answer = answerReadiness(parsed);
  const structure = contentStructure(parsed);
  const schemaSupport = Math.min(100, schema.schema_score);
  const trust = schema.risky_schema_detected ? 45 : 80;
  const score = Math.round(entity.score * 0.22 + answer.score * 0.22 + structure.score * 0.22 + schemaSupport * 0.22 + trust * 0.12);
  const toFinding = (title: string): AuditFinding => ({ severity: "opportunity", category: "geo_aeo", title, description: "La página puede ser más fácil de entender, resumir o citar por buscadores conversacionales.", recommendation: "Añade secciones claras, respuestas directas, FAQs visibles y datos verificables.", impact: "medium", effort: "medium" });
  const issues = [...entity.issues, ...answer.issues, ...structure.issues].slice(0, 6).map(toFinding);
  return { geo_aeo_score: score, geo_aeo_status: score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 50 ? "needs_work" : "poor", entity_clarity_score: entity.score, answer_readiness_score: answer.score, content_structure_score: structure.score, ai_citation_friendly: score >= 75, extractable_answers_present: answer.score >= 60 && structure.score >= 60, geo_aeo_strengths: [...entity.strengths, ...answer.strengths, ...structure.strengths], geo_aeo_issues: issues, geo_aeo_recommendations: issues.length ? issues : [toFinding("Añadir más señales GEO/AEO útiles") ] };
}
export * from "./types";
