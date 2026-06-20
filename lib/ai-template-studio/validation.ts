import type { PromptVersion } from "./types";

export function validatePromptVersionForActivation(version: Pick<PromptVersion, "system_prompt" | "user_prompt_template" | "output_schema" | "safety_policy">) {
  const errors: string[] = [];
  if (!version.system_prompt.trim()) errors.push("system_prompt_required");
  if (!version.user_prompt_template.trim()) errors.push("user_prompt_template_required");
  const joined = `${version.system_prompt}\n${version.user_prompt_template}`.toLowerCase();
  for (const must of ["no invent", "claims", "json"]) if (!joined.includes(must)) errors.push(`missing_safety_${must.replace(/\s+/g, "_")}`);
  if (!version.output_schema || Object.keys(version.output_schema).length === 0) errors.push("output_schema_required");
  return { ok: errors.length === 0, errors };
}
