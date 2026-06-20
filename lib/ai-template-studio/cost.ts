import type { ModelConfig } from "./types";

export function estimateTokensFromChars(text: string) { return Math.max(1, Math.ceil(text.length / 4)); }
export function estimateAiCost(input: { modelConfig?: Pick<ModelConfig, "input_cost_per_1m" | "output_cost_per_1m"> | null; inputTokens?: number | null; outputTokens?: number | null }) {
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const inCost = input.modelConfig?.input_cost_per_1m;
  const outCost = input.modelConfig?.output_cost_per_1m;
  if (inCost == null || outCost == null) return { cost: null, estimated: true, warning: "Coste no disponible para el modelo." };
  return { cost: (inputTokens / 1_000_000) * Number(inCost) + (outputTokens / 1_000_000) * Number(outCost), estimated: true };
}
export function aggregateGenerationCost(runs: Array<{ estimated_cost?: number | null; task_type?: string; model?: string; prompt_version_id?: string | null }>) { return { total: runs.reduce((sum, run) => sum + Number(run.estimated_cost ?? 0), 0), byTask: groupCost(runs, "task_type"), byModel: groupCost(runs, "model"), byPromptVersion: groupCost(runs, "prompt_version_id") }; }
function groupCost<T extends Record<string, unknown>>(runs: T[], key: keyof T) { return runs.reduce<Record<string, number>>((acc, run) => { const name = String(run[key] ?? "unknown"); acc[name] = (acc[name] ?? 0) + Number((run as { estimated_cost?: number | null }).estimated_cost ?? 0); return acc; }, {}); }
