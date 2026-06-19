import type { AIProcessingSettings, AIProvider, AIRoute, ModelTier, PromptKind } from "./types";

function providerFromEnv(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (["qwen", "anthropic", "gemini", "deepseek", "openai-compatible"].includes(provider)) return provider as AIProvider;
  return "openai";
}

export function qualityToTier(settings: AIProcessingSettings): ModelTier {
  const quality = String(settings.quality_level ?? settings.quality ?? process.env.AI_DEFAULT_QUALITY ?? "balanced").toLowerCase();
  const generationType = String(settings.generation_type ?? settings.generationType ?? "").toLowerCase();
  if (generationType.includes("metadata")) return "economy";
  if (quality.includes("premium")) return "premium";
  if (quality.includes("pro") || quality.includes("balanced") || quality.includes("equilibrado")) return "standard";
  return "economy";
}

export function getPromptVersion(kind: PromptKind, tier: ModelTier) {
  return `${kind}-${tier}-v1.0.0`;
}

export function routeModelByQuality(settings: AIProcessingSettings, kind: PromptKind = "product"): AIRoute {
  const tier = qualityToTier(settings);
  const provider = providerFromEnv();
  const model = tier === "premium" ? process.env.AI_MODEL_PREMIUM : tier === "standard" ? process.env.AI_MODEL_STANDARD : process.env.AI_MODEL_ECONOMY;
  const apiKey = provider === "qwen" ? process.env.QWEN_API_KEY : provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : provider === "gemini" ? process.env.GEMINI_API_KEY : provider === "deepseek" ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY;
  const baseUrl = provider === "qwen" ? (process.env.QWEN_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1") : provider === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1";
  const defaultModel = tier === "premium" ? "gpt-4o" : tier === "standard" ? "gpt-4o-mini" : "gpt-4o-mini";
  const configured = Boolean(apiKey && (model || defaultModel) && ["openai", "openai-compatible", "qwen", "deepseek"].includes(provider));
  return { provider, model: model || defaultModel, tier, baseUrl, apiKey, configured, promptVersion: getPromptVersion(kind, tier), reason: configured ? undefined : `Provider ${provider} no configurado para llamadas server-side.` };
}

export function shouldUseAI(settings: AIProcessingSettings) {
  if (settings.generation_engine === "template") return false;
  return process.env.AI_USE_FALLBACK !== "template-only";
}
