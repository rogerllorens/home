import type { OnboardingStep } from "./types";
export type OnboardingState = { hasAudit?: boolean; hasCatalog: boolean; hasJob: boolean; hasCompletedJob: boolean; hasProposal: boolean; hasApprovedProposal: boolean; hasDownload: boolean; hasCredits: boolean };
export function buildOnboardingChecklist(state: OnboardingState): OnboardingStep[] {
  const defs = [
    { id: "upload", done: state.hasCatalog, title: "Sube tu catálogo", description: "Carga un CSV para crear productos analizables.", href: "/app/upload", cta: "Subir catálogo" },
    { id: "job", done: state.hasJob, title: "Genera tu primer job", description: "Procesa el catálogo con el worker de Rankelia.", href: "/app/upload", cta: "Crear job" },
    { id: "proposals", done: state.hasProposal, title: "Revisa propuestas", description: "Compara original vs propuesta antes de aprobar.", href: "/app/proposals", cta: "Revisar" },
    { id: "approve", done: state.hasApprovedProposal, title: "Aprueba una versión", description: "Marca como aprobada solo la versión revisada.", href: "/app/proposals", cta: "Aprobar" },
    { id: "download", done: state.hasDownload, title: "Descarga resultados", description: "Exporta CSV/reportes para revisión e importación manual.", href: "/app/downloads", cta: "Descargar" },
  ];
  const firstPending = defs.findIndex((step) => !step.done);
  return defs.map((step, index) => ({ id: step.id, title: step.title, description: step.description, href: step.href, cta: step.cta, status: step.done ? "done" : index === firstPending ? "current" : "pending" }));
}
