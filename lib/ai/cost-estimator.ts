import type { AIRoute, AIUsage, ModelTier } from "./types";

const COSTS: Record<ModelTier, { inputPer1M: number; outputPer1M: number; maxRow: number }> = {
  economy: { inputPer1M: 0.5, outputPer1M: 1.5, maxRow: Number(process.env.AI_MAX_COST_PER_ROW_ECONOMY ?? 0.01) },
  standard: { inputPer1M: 3, outputPer1M: 10, maxRow: Number(process.env.AI_MAX_COST_PER_ROW_STANDARD ?? 0.03) },
  premium: { inputPer1M: 10, outputPer1M: 30, maxRow: Number(process.env.AI_MAX_COST_PER_ROW_PREMIUM ?? 0.08) },
};

export function estimateTokensFromText(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateCost(route: Pick<AIRoute, "tier">, inputTokens: number, outputTokens: number) {
  const cost = COSTS[route.tier];
  return (inputTokens / 1_000_000) * cost.inputPer1M + (outputTokens / 1_000_000) * cost.outputPer1M;
}

export function estimatePromptUsage(route: Pick<AIRoute, "tier">, prompt: string, expectedOutputTokens = 1400): AIUsage {
  const inputTokens = estimateTokensFromText(prompt);
  const outputTokens = expectedOutputTokens;
  return { inputTokens, outputTokens, cost: estimateCost(route, inputTokens, outputTokens) };
}

export function getCostLimits(tier: ModelTier) {
  return { maxRow: COSTS[tier].maxRow, maxJob: Number(process.env.AI_MAX_COST_PER_JOB ?? 5) };
}
