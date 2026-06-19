import type { ParsedHtmlSummary } from "../types";
export function answerReadiness(parsed: ParsedHtmlSummary) {
  let score = 10; const issues: string[] = []; const strengths: string[] = [];
  if ((parsed.metaDescription?.length ?? 0) > 80) { score += 25; strengths.push("Meta description útil"); } else issues.push("Meta description débil o ausente");
  if (parsed.wordCount >= 250) { score += 25; strengths.push("Contenido textual suficiente"); } else issues.push("Contenido textual escaso");
  if (parsed.h1Texts.length === 1) score += 20; else issues.push("H1 ausente o múltiple");
  if (/[.!?]/.test(parsed.bodyTextPreview) && /\b(es|somos|ofrece|permite|ayuda|especializado)\b/i.test(parsed.bodyTextPreview)) score += 20;
  return { score: Math.min(100, score), strengths, issues };
}
