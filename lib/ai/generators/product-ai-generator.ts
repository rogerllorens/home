import type { CsvRow } from "../../csv";
import { productAIOutputSchema } from "../schemas/product-output-schema";
import { metadataAIOutputSchema } from "../schemas/metadata-output-schema";
import { callAIModel } from "../providers";
import { buildMessages, buildRepairMessages } from "../prompt-registry";
import { extractJSONFromText, validateWithSchema } from "../json-validator";
import { routeModelByQuality, shouldUseAI } from "../model-router";
import { estimatePromptUsage, getCostLimits } from "../cost-estimator";
import { detectKeywordStuffing, detectUnsupportedClaims } from "../claim-detector";
import { normalizeProductOutput } from "../output-normalizer";
import type { AIProcessingSettings, AIRowResult, PromptKind } from "../types";
import { processRowWithFallback } from "./fallback";

function promptKind(settings: AIProcessingSettings): PromptKind {
  const type = String(settings.generation_type ?? settings.generationType ?? "").toLowerCase();
  if (type.includes("metadata")) return "metadata";
  if (type.includes("categor")) return "category";
  return "product";
}

async function repairJSON(raw: string, route: ReturnType<typeof routeModelByQuality>, schemaName: string) {
  if (process.env.AI_REPAIR_JSON === "false") return null;
  const repaired = await callAIModel(route, buildRepairMessages(raw, schemaName), { temperature: 0 });
  return repaired;
}

export async function generateOutputWithAI(row: CsvRow, settings: AIProcessingSettings): Promise<AIRowResult> {
  if (!shouldUseAI(settings)) return processRowWithFallback(row, settings, "generation_engine=template");
  const kind = promptKind(settings);
  const route = routeModelByQuality(settings, kind === "category" ? "product" : kind);
  if (!route.configured) return processRowWithFallback(row, settings, route.reason ?? "AI provider not configured");
  const { messages, promptVersion } = buildMessages(kind === "category" ? "product" : kind, route.tier, row, settings);
  route.promptVersion = promptVersion;
  const promptText = messages.map((message) => message.content).join("\n");
  const estimated = estimatePromptUsage(route, promptText);
  if (estimated.cost > getCostLimits(route.tier).maxRow) return processRowWithFallback(row, settings, `Coste estimado por fila ${estimated.cost.toFixed(4)} supera límite`);

  const maxRetries = Number(process.env.AI_MAX_RETRIES ?? 2);
  let attempts = 0;
  let lastErrors: string[] = [];
  let rawText = "";
  for (; attempts < Math.max(1, maxRetries); attempts += 1) {
    try {
      const response = await callAIModel(route, messages);
      rawText = response.text;
      let parsed = extractJSONFromText(response.text);
      let validation = kind === "metadata" ? validateWithSchema(parsed, metadataAIOutputSchema) : validateWithSchema(parsed, productAIOutputSchema);
      let jsonRepaired = false;
      let usage = response.usage;
      if (!validation.ok) {
        lastErrors = validation.errors;
        try {
          const repair = await repairJSON(response.text, route, kind === "metadata" ? "MetadataAIOutput" : "ProductAIOutput");
          if (repair) {
            parsed = extractJSONFromText(repair.text);
            validation = kind === "metadata" ? validateWithSchema(parsed, metadataAIOutputSchema) : validateWithSchema(parsed, productAIOutputSchema);
            usage = { inputTokens: response.usage.inputTokens + repair.usage.inputTokens, outputTokens: response.usage.outputTokens + repair.usage.outputTokens, cost: response.usage.cost + repair.usage.cost };
            jsonRepaired = true;
          }
        } catch (error) {
          lastErrors = [...lastErrors, error instanceof Error ? error.message : "JSON repair failed"];
        }
      }
      if (!validation.ok || !validation.data) throw new Error(validation.ok ? "JSON validation failed" : validation.errors.join("; "));
      const output = normalizeProductOutput(validation.data, row, settings);
      const unsupportedClaims = detectUnsupportedClaims(row, output);
      const stuffing = detectKeywordStuffing(output) ? ["Posible keyword stuffing detectado."] : [];
      const warnings = Array.from(new Set([...unsupportedClaims.map((claim) => `Claim no soportado detectado: ${claim}`), ...stuffing]));
      const finalOutput = warnings.length ? { ...output, seo_score: Math.max(45, output.seo_score - warnings.length * 4), quality_warnings: [output.quality_warnings, ...warnings].filter(Boolean).join(" | ") } : output;
      return { output: finalOutput, rawAIOutput: parsed, provider: route.provider, model: route.model, promptVersion, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, cost: usage.cost, fallbackUsed: false, jsonRepaired, validationErrors: lastErrors, unsupportedClaims, generationAttempts: attempts + 1 };
    } catch (error) {
      lastErrors = [error instanceof Error ? error.message : "AI row generation failed"];
    }
  }
  return processRowWithFallback(row, settings, `IA inválida tras ${attempts} intento(s): ${lastErrors.join("; ")}. Raw: ${rawText.slice(0, 160)}`, attempts);
}
