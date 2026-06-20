import type { GenerationOutput } from "@/lib/generation/template-generator";
import type { ProposalVersionScope } from "./types";

export const REGENERATABLE_SCOPES: ProposalVersionScope[] = ["full_product", "seo_product_name", "meta_title", "meta_description", "short_description", "long_description", "primary_image_alt", "gallery_image_alts", "image_alt", "slug", "schema", "faq"];

export function validateRegenerationInput(scope: string, instructions?: string): asserts scope is ProposalVersionScope {
  if (!REGENERATABLE_SCOPES.includes(scope as ProposalVersionScope)) throw new Error("invalid_scope");
  if (instructions && instructions.length > 1000) throw new Error("instructions_too_long");
}

export function sanitizeInstructions(instructions?: string) {
  return (instructions ?? "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F]/g, " ").trim().slice(0, 1000);
}

function appendInstruction(value: string, instructions: string) {
  if (!instructions) return value;
  return `${value}`.slice(0, 220).replace(/[.!?]*$/, "") + ` · Ajuste: ${instructions.slice(0, 120)}`;
}

export function buildRegeneratedOutput(base: GenerationOutput & Record<string, unknown>, scope: ProposalVersionScope, instructions: string) {
  const next: Record<string, unknown> = { ...base };
  if (scope === "full_product") {
    next.meta_title = appendInstruction(String(base.meta_title ?? base.seo_product_name ?? ""), instructions).slice(0, 80);
    next.meta_description = appendInstruction(String(base.meta_description ?? base.short_description ?? ""), instructions).slice(0, 170);
    next.short_description = appendInstruction(String(base.short_description ?? ""), instructions).slice(0, 500);
  } else if (scope === "long_description") {
    next.long_description_html = appendInstruction(String(base.long_description_html ?? base.long_description ?? ""), instructions).slice(0, 5000);
  } else if (scope === "image_alt") {
    next.primary_image_alt = appendInstruction(String(base.primary_image_alt ?? base.seo_product_name ?? ""), instructions).slice(0, 125);
  } else {
    const current = String(base[scope] ?? base.seo_product_name ?? "");
    next[scope] = appendInstruction(current, instructions).slice(0, scope.includes("description") ? 500 : 170);
  }
  next.quality_warnings = [base.quality_warnings, "Regeneración beta: revisar antes de exportar"].filter(Boolean).join(" | ");
  next.human_review_required = true;
  next.ready_to_publish = "needs_review";
  return next as GenerationOutput & Record<string, unknown>;
}
