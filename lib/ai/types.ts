import type { CsvRow } from "../csv";
import type { GenerationOutput, WorkerGenerationSettings } from "../generation/template-generator";

export type AIProvider = "openai" | "openai-compatible" | "qwen" | "anthropic" | "gemini" | "deepseek";
export type ModelTier = "economy" | "standard" | "premium";
export type PromptKind = "product" | "category" | "metadata" | "repair";

export type AIRoute = {
  provider: AIProvider;
  model: string;
  tier: ModelTier;
  baseUrl: string;
  apiKey?: string;
  configured: boolean;
  promptVersion: string;
  reason?: string;
};

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };
export type AIUsage = { inputTokens: number; outputTokens: number; cost: number };
export type AIProviderResponse = { text: string; raw: unknown; usage: AIUsage };

export type AIProcessingSettings = WorkerGenerationSettings & {
  generation_engine?: "template" | "ai";
  plan?: string;
};

export type AIRowResult = {
  output: GenerationOutput;
  rawAIOutput: unknown;
  provider: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  fallbackUsed: boolean;
  jsonRepaired: boolean;
  validationErrors: string[];
  unsupportedClaims: string[];
  generationAttempts: number;
};

export type AIInput = { row: CsvRow; settings: AIProcessingSettings; rowIndex?: number };
