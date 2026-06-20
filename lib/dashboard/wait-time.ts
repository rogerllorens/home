type Input = { status: string; rowsTotal?: number | null; rowsProcessed?: number | null; createdAt?: string | null; startedAt?: string | null; historicalSecondsPerRow?: number | null; workerMode?: string | null };
export function estimateJobWaitTime(input: Input) {
  if (["completed", "completed_with_warnings"].includes(input.status)) return { secondsRemaining: 0, label: "Completado", confidence: "high" as const, explanation: "El job ya terminó." };
  if (["failed", "cancelled", "failed_validation", "insufficient_credits"].includes(input.status)) return { secondsRemaining: null, label: "Sin ETA", confidence: "high" as const, explanation: "El job no está en procesamiento activo." };
  const total = Math.max(Number(input.rowsTotal ?? 0), 0);
  const processed = Math.max(Number(input.rowsProcessed ?? 0), 0);
  const remaining = Math.max(total - processed, 0);
  if (input.status === "processing" && processed > 0 && (input.startedAt || input.createdAt)) {
    const start = new Date(input.startedAt ?? input.createdAt ?? Date.now()).getTime();
    const elapsed = Math.max((Date.now() - start) / 1000, 1);
    const secondsPerRow = elapsed / processed;
    const seconds = Math.round(remaining * secondsPerRow);
    return { secondsRemaining: seconds, label: formatEta(seconds), confidence: "medium" as const, explanation: "Estimación basada en la velocidad real de filas procesadas." };
  }
  const fallback = Math.max(Number(input.historicalSecondsPerRow ?? 2.5), 1.5);
  const seconds = Math.round(Math.max(remaining || total || 50, 10) * fallback);
  return { secondsRemaining: seconds, label: input.status === "queued" || input.status === "ready_for_processing" ? `En cola · ${formatEta(seconds)}` : formatEta(seconds), confidence: "low" as const, explanation: "Estimación conservadora; el worker puede ejecutarse por lotes/cron." };
}
export function formatEta(seconds: number | null) { if (seconds == null) return "Sin ETA"; if (seconds <= 0) return "Completado"; const minutes = Math.ceil(seconds / 60); return minutes < 60 ? `~${minutes} min` : `~${Math.ceil(minutes / 60)} h`; }
