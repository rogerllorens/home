import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

export function initSentry(): void {
  const dsn = Config.SENTRY_DSN;
  if (dsn) {
    Sentry.init({ dsn, tracesSampleRate: 1.0 });
  }
}

export function startTransaction(name: string) {
  if (Sentry.startTransaction) {
    return Sentry.startTransaction({ name });
  }
  return null;
}

export function capture(error: any): void {
  if (Sentry.captureException) {
    Sentry.captureException(error);
  } else {
    console.error(error);
  }
}
