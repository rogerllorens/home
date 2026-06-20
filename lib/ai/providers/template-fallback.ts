import type { AiGenerateJsonInput, AiGenerateJsonResult } from "./types";
export async function generateTemplateFallbackJson(input: AiGenerateJsonInput): Promise<AiGenerateJsonResult> { void input; return { output: { quality_warnings: ["template_fallback"], confidence_score: 50 }, rawText: "{}", provider: "template_fallback", model: "rankelia-template", latencyMs: 0, fallbackUsed: true }; }
