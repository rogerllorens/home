import { validateImageAlt } from "./alt-validator";
import type { ImageAltContext, ImageAltEvaluation } from "./types";

export function calculateImageSeoScore(params: { imageUrls: string[]; altTexts: string[]; context?: ImageAltContext }) {
  const imageUrls = params.imageUrls.filter(Boolean);
  const altTexts = params.altTexts.map((alt) => alt.trim()).filter(Boolean);
  if (!imageUrls.length) return { score: 18, warnings: ["no_image_url"], status: "missing" as const, evaluations: [] as ImageAltEvaluation[] };
  const evaluations = imageUrls.slice(0, 10).map((_, index) => validateImageAlt(altTexts[index] ?? "", params.context));
  const covered = evaluations.filter((evaluation) => evaluation.status === "good" || evaluation.status === "warning").length;
  const avgAlt = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / Math.max(evaluations.length, 1);
  const coverage = Math.round((covered / Math.max(imageUrls.length, 1)) * 100);
  const uniqueAlts = new Set(altTexts.map((alt) => alt.toLowerCase())).size;
  const duplicatePenalty = altTexts.length > 1 && uniqueAlts < altTexts.length ? 10 : 0;
  const score = Math.max(0, Math.min(100, Math.round(avgAlt * 0.65 + coverage * 0.25 + 10 - duplicatePenalty)));
  const warnings = Array.from(new Set([...evaluations.flatMap((evaluation) => evaluation.warnings), ...(duplicatePenalty ? ["duplicate_alt"] : []), ...(imageUrls.length > 10 ? ["too_many_images"] : [])]));
  const status = score >= 82 ? "good" : score >= 55 ? "warning" : "needs_review";
  return { score, warnings, status, evaluations };
}
