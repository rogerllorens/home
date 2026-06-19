import type { AIMessage, AIProviderResponse, AIRoute } from "./types";
import { estimateCost, estimateTokensFromText } from "./cost-estimator";

export async function callAIModel(route: AIRoute, messages: AIMessage[], options: { timeoutMs?: number; temperature?: number } = {}): Promise<AIProviderResponse> {
  if (!route.configured || !route.apiKey) throw new Error(route.reason ?? "AI provider not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? Number(process.env.AI_ROW_TIMEOUT_MS ?? 60000));
  try {
    const response = await fetch(`${route.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${route.apiKey}` },
      body: JSON.stringify({ model: route.model, messages, temperature: options.temperature ?? 0.2, response_format: { type: "json_object" } }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI provider error ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("AI provider returned an empty response");
    const inputTokens = json.usage?.prompt_tokens ?? estimateTokensFromText(messages.map((m) => m.content).join("\n"));
    const outputTokens = json.usage?.completion_tokens ?? estimateTokensFromText(text);
    return { text, raw: json, usage: { inputTokens, outputTokens, cost: estimateCost(route, inputTokens, outputTokens) } };
  } finally {
    clearTimeout(timeout);
  }
}
