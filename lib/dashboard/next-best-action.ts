import type { DashboardOverview, NextBestAction } from "./types";
export function getNextBestAction(input: Pick<DashboardOverview, "catalog" | "jobs" | "proposals" | "downloads" | "credits">): NextBestAction {
  if (input.credits.lowCredits) return { type: "buy_credits", title: "Añade productos disponibles", description: "Tu saldo es bajo para procesar nuevos lotes.", href: "/app/credits", cta: "Ver créditos", priority: "high" };
  if (!input.catalog.products) return { type: "upload_catalog", title: "Sube tu primer catálogo", description: "Empieza importando un CSV para generar propuestas revisables.", href: "/app/upload", cta: "Subir catálogo", priority: "high" };
  if (!input.jobs.total) return { type: "create_job", title: "Genera tu primera optimización", description: "Crea un job para obtener propuestas SEO versionadas.", href: "/app/upload", cta: "Crear job", priority: "high" };
  if (input.jobs.active) return { type: "view_job_progress", title: "Revisa el progreso del job", description: "Hay procesamiento activo o en cola.", href: "/app/jobs", cta: "Ver jobs", priority: "medium" };
  if (input.proposals.pendingReview) return { type: "review_proposals", title: "Revisa propuestas pendientes", description: `${input.proposals.pendingReview} propuestas esperan revisión humana.`, href: "/app/proposals?reviewStatus=pending_review", cta: "Revisar propuestas", priority: "high" };
  if (input.proposals.highImpact) return { type: "approve_high_impact", title: "Aprueba productos prioritarios", description: "Hay propuestas con alto delta de score listas para evaluar.", href: "/app/opportunities?type=high_score_delta", cta: "Ver oportunidades", priority: "high" };
  if (input.proposals.approved > input.downloads.approvedExports) return { type: "download_approved", title: "Descarga aprobadas", description: "Tienes versiones aprobadas pendientes de exportación.", href: "/app/downloads", cta: "Descargar", priority: "medium" };
  return { type: "optimize_next_batch", title: "Optimiza otro lote", description: "El flujo básico está completo; procesa más productos cuando quieras.", href: "/app/upload", cta: "Nuevo lote", priority: "low" };
}
