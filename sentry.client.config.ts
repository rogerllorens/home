import * as Sentry from '@sentry/nextjs';

const replayIntegration = 'replayIntegration' in Sentry ? [Sentry.replayIntegration()] : [];

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_RUNTIME_ENV ??
    process.env.NODE_ENV ??
    'development',
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  replaysOnErrorSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? '1.0'
  ),
  replaysSessionSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? '0.01'
  ),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  integrations: replayIntegration,
  tunnel: process.env.NEXT_PUBLIC_SENTRY_TUNNEL_URL
});
