import { defaultModelConfigs } from "./defaults";
import type { AiProviderName, ModelConfig, RoutingRule } from "./types";

export function providerHasEnv(provider: AiProviderName) {
  if (provider === "template_fallback" || provider === "mock") return true;
  if (provider === "openai") return Boolean(process.env.AI_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  if (provider === "openai_compatible") return Boolean(process.env.AI_OPENAI_BASE_URL && process.env.AI_OPENAI_API_KEY);
  if (provider === "qwen") return Boolean(process.env.AI_QWEN_API_KEY || process.env.QWEN_API_KEY);
  if (provider === "deepseek") return Boolean(process.env.AI_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY);
  if (provider === "anthropic") return Boolean(process.env.AI_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (provider === "gemini") return Boolean(process.env.AI_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
  return false;
}

export function resolveModelForTask(input: { taskType: string; sector?: string | null; planKey?: string | null; priority?: "low" | "normal" | "high"; estimatedRows?: number; models?: ModelConfig[]; rules?: RoutingRule[] }) {
  const rule = input.rules?.find((candidate) => candidate.status !== "paused" && candidate.task_type === input.taskType && (!candidate.sector || candidate.sector === input.sector) && (!candidate.plan_key || candidate.plan_key === input.planKey));
  if (rule && providerHasEnv(rule.primary_provider)) return { provider: rule.primary_provider, model: rule.primary_model, fallbackProvider: rule.fallback_provider ?? "template_fallback", fallbackModel: rule.fallback_model ?? "rankelia-template", reason: "routing_rule" };
  const models = input.models?.length ? input.models : defaultModelConfigs;
  const wantedTier = input.taskType === "preview" || input.taskType === "repair_json" ? "cheap" : input.priority === "high" ? "premium" : "standard";
  const active = models.find((model) => model.status === "active" && model.quality_tier === wantedTier && providerHasEnv(model.provider)) ?? models.find((model) => model.status === "active" && providerHasEnv(model.provider)) ?? models.find((model) => model.provider === "template_fallback");
  return { provider: active?.provider ?? "template_fallback", model: active?.model ?? "rankelia-template", fallbackProvider: "template_fallback" as const, fallbackModel: "rankelia-template", reason: active?.provider === "template_fallback" ? "no_configured_provider" : `tier_${wantedTier}` };
}
