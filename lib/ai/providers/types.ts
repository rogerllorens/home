export type AiGenerateJsonInput = { provider: string; model: string; messages: Array<{ role: "system" | "user" | "assistant"; content: string }>; apiKey?: string; baseUrl?: string; temperature?: number; timeoutMs?: number };
export type AiGenerateJsonResult = { output: unknown; rawText?: string; provider: string; model: string; inputTokens?: number; outputTokens?: number; totalTokens?: number; latencyMs: number; estimatedCost?: number; fallbackUsed?: boolean };
export type AiProviderAdapter = { provider: string; generateJson(input: AiGenerateJsonInput): Promise<AiGenerateJsonResult> };
