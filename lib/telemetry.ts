import * as Sentry from '@sentry/nextjs';

const TELEMETRY_ENABLED = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN);
export const telemetryEnabled = TELEMETRY_ENABLED;
const DEFAULT_LEVEL: SeverityLevel = 'info';

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

type TelemetryOptions = {
  level?: SeverityLevel;
  tags?: Record<string, string>;
  requestId?: string;
};

type TelemetryPayload = Record<string, unknown>;

const isProd = process.env.NODE_ENV === 'production';

export function captureTelemetryException(error: unknown, options: TelemetryOptions = {}) {
  if (TELEMETRY_ENABLED) {
    Sentry.withScope((scope) => {
      if (options.requestId) scope.setTag('request_id', options.requestId);
      if (options.tags) {
        for (const [key, value] of Object.entries(options.tags)) {
          scope.setTag(key, value);
        }
      }
      scope.setFingerprint(['exception']);
      Sentry.captureException(error);
    });
    return;
  }

  if (!isProd) {
    console.error('[telemetry] exception', error, options);
  }
}

export function recordTelemetryEvent(
  name: string,
  payload: TelemetryPayload = {},
  options: TelemetryOptions = {}
) {
  if (TELEMETRY_ENABLED) {
    Sentry.withScope((scope) => {
      scope.setFingerprint([name]);
      if (options.requestId) scope.setTag('request_id', options.requestId);
      if (options.tags) {
        for (const [key, value] of Object.entries(options.tags)) {
          scope.setTag(key, value);
        }
      }
      for (const [key, value] of Object.entries(payload)) {
        scope.setExtra(key, value);
      }
      Sentry.captureMessage(name, options.level ?? DEFAULT_LEVEL);
    });
    return;
  }

  if (!isProd) {
    // eslint-disable-next-line no-console -- debug logging in development
    console.info(`[telemetry] ${name}`, { payload, options });
  }
}

export function recordSpendFailure(
  reason: string,
  payload: TelemetryPayload = {},
  options: TelemetryOptions = {}
) {
  recordTelemetryEvent(
    'wallet.spend_failure',
    { reason, ...payload },
    { level: 'warning', ...options, tags: { feature: 'wallet', ...(options.tags ?? {}) } }
  );
}

export function recordSpendSuccess(
  concept: string,
  payload: TelemetryPayload = {},
  options: TelemetryOptions = {}
) {
  recordTelemetryEvent(
    'wallet.spend_success',
    { concept, ...payload },
    { level: 'info', ...options, tags: { feature: 'wallet', ...(options.tags ?? {}) } }
  );
}

export function recordNotificationReceived(
  type: string,
  payload: TelemetryPayload = {},
  options: TelemetryOptions = {}
) {
  recordTelemetryEvent(
    'notification.received',
    { type, ...payload },
    { level: 'info', ...options, tags: { feature: 'notifications', ...(options.tags ?? {}) } }
  );
}
