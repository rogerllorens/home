import type { CsvRow } from "../../csv";
import { generateOutputForRow } from "../../generation/template-generator";
import type { AIProcessingSettings, AIRowResult } from "../types";

export function processRowWithFallback(row: CsvRow, settings: AIProcessingSettings, reason: string, attempts = 0): AIRowResult {
  const output = generateOutputForRow(row, settings);
  const warnings = [output.quality_warnings, `Fallback template aplicado: ${reason}`].filter(Boolean).join(" | ");
  return { output: { ...output, quality_warnings: warnings }, rawAIOutput: { fallback_reason: reason }, provider: "template", model: "template-generator-v1", promptVersion: "template-v1.0.0", inputTokens: 0, outputTokens: 0, cost: 0, fallbackUsed: true, jsonRepaired: false, validationErrors: reason ? [reason] : [], unsupportedClaims: [], generationAttempts: attempts };
}
