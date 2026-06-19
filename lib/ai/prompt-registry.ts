import { buildBaseSystemPrompt } from "./prompts/base-system-prompt";
import { buildProductSystemPrompt, buildProductUserPrompt } from "./prompts/product-prompt";
import { buildCategorySystemPrompt, buildCategoryUserPrompt } from "./prompts/category-prompt";
import { buildMetadataPrompt } from "./prompts/metadata-prompt";
import { buildRepairJSONPrompt } from "./prompts/repair-json-prompt";
import { getPromptVersion } from "./model-router";
import type { CsvRow } from "../csv";
import type { AIProcessingSettings, ModelTier, PromptKind } from "./types";

export function buildMessages(kind: PromptKind, tier: ModelTier, row: CsvRow, settings: AIProcessingSettings) {
  const base = buildBaseSystemPrompt();
  if (kind === "category") return { promptVersion: getPromptVersion(kind, tier), messages: [{ role: "system" as const, content: `${base}\n${buildCategorySystemPrompt(tier)}` }, { role: "user" as const, content: buildCategoryUserPrompt(row, settings) }] };
  if (kind === "metadata") return { promptVersion: getPromptVersion(kind, tier), messages: [{ role: "system" as const, content: base }, { role: "user" as const, content: buildMetadataPrompt(row, settings) }] };
  return { promptVersion: getPromptVersion(kind, tier), messages: [{ role: "system" as const, content: `${base}\n${buildProductSystemPrompt(tier)}` }, { role: "user" as const, content: buildProductUserPrompt(row, settings) }] };
}

export function buildRepairMessages(raw: string, schemaName: string) {
  return [{ role: "system" as const, content: buildBaseSystemPrompt() }, { role: "user" as const, content: buildRepairJSONPrompt(raw, schemaName) }];
}
