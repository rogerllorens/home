type EventPayload = Record<string, unknown>;

export function captureException(error: unknown, context: EventPayload = {}) {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  console.error("observability.exception", { message: error instanceof Error ? error.message : String(error), ...context });
}

export function captureEvent(name: string, payload: EventPayload = {}) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  console.info("analytics.event", { name, ...payload });
}
