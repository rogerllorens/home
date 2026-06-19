import type { ProposalDiff, BeforeAfterField } from "./types";

const FIELD_MAP: Array<[string, string, string[]]> = [
  ["seo_product_name", "Nombre SEO", ["product_name", "nombre_producto", "name", "title"]],
  ["meta_title", "Meta title", ["meta_title", "title_tag", "seo_title"]],
  ["meta_description", "Meta description", ["meta_description", "seo_description"]],
  ["short_description", "Descripción corta", ["short_description", "description", "descripcion"]],
  ["long_description_html", "Descripción larga", ["long_description", "body_html", "description", "descripcion"]],
  ["slug", "Slug", ["slug", "handle"]],
  ["primary_image_alt", "ALT principal", ["primary_image_alt", "image_alt", "Image Alt Text", "alt_text"]],
  ["gallery_image_alts", "ALT galería", ["gallery_image_alts", "image_alt_texts"]],
  ["schema_jsonld", "Schema", ["schema", "jsonld", "structured_data"]],
  ["faq", "FAQ", ["faq", "faqs"]],
];

function pick(data: Record<string, unknown>, keys: string[]) { for (const key of keys) if (data[key] != null && String(data[key]).trim() !== "") return data[key]; return ""; }
function len(value: unknown) { return Array.isArray(value) ? value.join(" | ").length : String(value ?? "").length; }
function improvement(before: unknown, after: unknown): BeforeAfterField["improvementType"] {
  if (!String(before ?? "").trim() && String(after ?? "").trim()) return "added";
  if (len(after) > len(before)) return "expanded_relevance";
  if (len(after) < len(before)) return "shortened";
  return String(before ?? "") === String(after ?? "") ? "unchanged" : "changed";
}

export function buildProposalDiff(original: Record<string, unknown>, proposed: Record<string, unknown>): ProposalDiff {
  const fields = FIELD_MAP.map(([field, label, originalKeys]) => {
    const before = pick(original, originalKeys);
    const after = proposed[field] ?? "";
    const changed = JSON.stringify(before ?? "") !== JSON.stringify(after ?? "");
    return { field, label, before, after, beforeLength: len(before), afterLength: len(after), changed, improvementType: improvement(before, after), warningsFixed: !before && after ? [`${field}_missing`] : [], warningsIntroduced: [] };
  });
  const changedFields = fields.filter((field) => field.changed).length;
  return { fields, summary: { changedFields, warningsFixed: fields.reduce((sum, field) => sum + field.warningsFixed.length, 0), warningsIntroduced: 0, humanReviewRequired: true } };
}
