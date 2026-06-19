import type { ParsedHtmlSummary, AuditFinding } from "./types";

export function auditImages(parsed: ParsedHtmlSummary): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (!parsed.imageCount) return findings;
  const missing = parsed.imagesWithoutAlt + parsed.imagesWithEmptyAlt;
  if (missing > 0) findings.push({ severity: "opportunity", category: "images", title: `${missing} imágenes sin ALT útil`, description: "El HTML público contiene imágenes sin texto alternativo o con ALT vacío.", recommendation: "Sube tu catálogo para generar ALT text SEO revisable por producto.", impact: "medium", effort: "medium", cta_type: "image_alt" });
  if (parsed.imagesMissingDimensions > Math.max(3, parsed.imageCount * 0.5)) findings.push({ severity: "warning", category: "images", title: "Muchas imágenes sin width/height", description: "Faltan dimensiones declaradas en una proporción alta de imágenes.", recommendation: "Añade dimensiones para reducir cambios de layout y mejorar UX.", impact: "medium", effort: "medium" });
  if (parsed.modernImageFormats < parsed.imageCount * 0.2) findings.push({ severity: "opportunity", category: "images", title: "Poca presencia de WebP/AVIF", description: "No se detectan muchos formatos modernos en imágenes del HTML.", recommendation: "Convierte imágenes pesadas a WebP/AVIF donde tu plataforma lo permita.", impact: "medium", effort: "medium" });
  return findings;
}
