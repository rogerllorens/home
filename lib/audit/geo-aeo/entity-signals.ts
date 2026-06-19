import type { ParsedHtmlSummary } from "../types";
export function entityClarity(parsed: ParsedHtmlSummary, schemaTypes: string[]) {
  let score = 20; const strengths: string[] = []; const issues: string[] = [];
  if (parsed.title && parsed.h1Texts[0] && parsed.title.toLowerCase().includes(parsed.h1Texts[0].split(" ")[0]?.toLowerCase() ?? "")) { score += 25; strengths.push("Title y H1 alineados"); } else issues.push("Title/H1 poco alineados");
  if (schemaTypes.includes("Organization") || schemaTypes.includes("WebSite")) { score += 20; strengths.push("Entidad de marca apoyada por schema"); } else issues.push("Falta Organization/WebSite schema");
  if (/tienda|ecommerce|shop|comprar|productos|categor/i.test(parsed.bodyTextPreview)) { score += 20; strengths.push("Señales ecommerce claras"); } else issues.push("La propuesta ecommerce no es suficientemente explícita");
  if (parsed.lang) score += 10;
  return { score: Math.min(100, score), strengths, issues };
}
