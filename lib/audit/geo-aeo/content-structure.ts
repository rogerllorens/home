import type { ParsedHtmlSummary } from "../types";
export function contentStructure(parsed: ParsedHtmlSummary) {
  let score = 20; const strengths: string[] = []; const issues: string[] = [];
  if (parsed.h2Texts.length >= 2) { score += 30; strengths.push("Estructura H2 clara"); } else issues.push("Pocos H2 descriptivos");
  if (parsed.imageCount > 0) score += 10;
  if (parsed.internalLinksCount >= 3) { score += 15; strengths.push("Enlazado interno visible"); } else issues.push("Enlazado interno limitado");
  if (/\?|preguntas|faq/i.test(parsed.bodyTextPreview)) { score += 25; strengths.push("Señales de FAQ o respuestas visibles"); } else issues.push("No se detectan FAQs/respuestas claras");
  return { score: Math.min(100, score), strengths, issues };
}
