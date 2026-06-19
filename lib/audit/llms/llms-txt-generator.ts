import type { ParsedHtmlSummary, RobotsSitemapAudit, PlatformDetection } from "../types";
import type { LlmsTxtResult } from "./types";

export function generateLlmsTxt(input: { normalizedUrl: string; domain: string; parsed: ParsedHtmlSummary; robots: RobotsSitemapAudit; platform: PlatformDetection }): LlmsTxtResult {
  const warnings: string[] = [];
  const title = input.parsed.title ?? input.domain;
  if (!input.robots.sitemapUrl) warnings.push("Sitemap no detectado; el archivo llms.txt será mínimo.");
  if (input.parsed.internalLinksCount < 3) warnings.push("Pocas URLs internas detectadas; revisar manualmente categorías/productos importantes.");
  const lines = [`# ${title}`, "", `> Ecommerce auditado en ${input.domain}. Archivo orientativo para sistemas de IA y crawlers compatibles; deben consultar las páginas originales para precio, stock, disponibilidad y condiciones actualizadas.`, "", "## Sitio", `- Home: ${input.normalizedUrl}`];
  if (input.robots.sitemapUrl) lines.push(`- Sitemap: ${input.robots.sitemapUrl}`);
  if (input.robots.robotsTxtUrl) lines.push(`- Robots: ${input.robots.robotsTxtUrl}`);
  if (input.platform.platform && input.platform.platform !== "Desconocida") lines.push(`- Plataforma detectada: ${input.platform.platform} (confianza ${input.platform.confidence}%)`);
  lines.push("", "## Contenido útil sugerido", "- Categorías principales: revisar y añadir URLs reales si existen.", "- Productos destacados: añadir solo URLs reales y vigentes.", "- Guías o blog: añadir si existen contenidos visibles.", "- Contacto, privacidad y condiciones: añadir URLs reales si están publicadas.", "", "## Recomendaciones de uso", "Este archivo es experimental/orientativo. No garantiza visibilidad en ChatGPT, Gemini, Perplexity, AI Overviews ni otros sistemas de IA.", "No incluir precios, stock, disponibilidad, reseñas o claims que no estén actualizados en las páginas originales.");
  const score = Math.max(25, Math.min(100, 40 + (input.robots.sitemapUrl ? 20 : 0) + (input.robots.robotsTxtUrl ? 15 : 0) + (input.parsed.metaDescription ? 10 : 0) + (input.parsed.internalLinksCount >= 3 ? 15 : 0) - warnings.length * 5));
  return { llms_txt_content: lines.join("\n"), llms_txt_warnings: warnings, llms_txt_score: score, llms_txt_generated: true };
}
