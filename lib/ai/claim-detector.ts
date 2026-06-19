import type { CsvRow } from "../csv";
import type { GenerationOutput } from "../generation/template-generator";

const riskyClaims = ["certificado", "homologado", "impermeable", "garantía", "garantizado", "oficial", "compatible con cualquier", "el mejor", "máxima seguridad", "calidad superior", "s3", "normativa", "antiestático"];

export function detectUnsupportedClaims(input: CsvRow, output: Partial<GenerationOutput>) {
  const inputText = Object.values(input).join(" ").toLowerCase();
  const outputText = [output.seo_product_name, output.short_description, output.long_description_html, output.bullet_points, output.meta_description, output.faqs].join(" ").toLowerCase();
  return riskyClaims.filter((claim) => outputText.includes(claim) && !inputText.includes(claim));
}

export function detectKeywordStuffing(output: Partial<GenerationOutput>) {
  const keyword = output.keyword_principal?.toLowerCase().trim();
  if (!keyword || keyword.length < 3) return false;
  const text = [output.meta_title, output.meta_description, output.short_description, output.long_description_html].join(" ").toLowerCase();
  return (text.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length > 8;
}
