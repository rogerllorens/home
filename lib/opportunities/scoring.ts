import type { OpportunityPriority } from "./types";
export function priorityFromScore(score: number): OpportunityPriority { if (score >= 85) return "critical"; if (score >= 65) return "high"; if (score >= 40) return "medium"; return "low"; }
export function clampOpportunityScore(value: number) { return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0))); }
