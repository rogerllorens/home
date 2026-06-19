import type { PageSpeedOpportunity, RankeliaPerformanceSummary } from "./types";

export function buildPerformanceRecommendations(summary: RankeliaPerformanceSummary): PageSpeedOpportunity[] {
  if (!summary.available) return [];
  const recommendations = [...summary.performance_opportunities];
  if (summary.core_web_vitals_status.lcp_status === "poor") recommendations.unshift({ id: "rankelia-lcp", title: "LCP lento en mobile", description: "El elemento principal tarda demasiado en cargar.", severity: "critical", recommendation: "Optimiza imagen hero, servidor, CSS crítico y recursos bloqueantes.", estimatedSavingsMs: 0 });
  if (summary.core_web_vitals_status.cls_status === "poor") recommendations.unshift({ id: "rankelia-cls", title: "Layout shift elevado", description: "La página se mueve durante la carga.", severity: "critical", recommendation: "Reserva dimensiones para imágenes, banners y bloques dinámicos.", estimatedSavingsMs: 0 });
  return recommendations.slice(0, 8);
}
