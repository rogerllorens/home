# Production environment checklist

Run:

```bash
VALIDATE_ENV_MODE=production npm run validate:env
```

A local developer machine is expected to fail this command if production secrets are absent.

## Required for private beta

- App URLs: `NEXT_PUBLIC_APP_URL`.
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Upstash in production for rate limits.
- At least one AI provider or template fallback policy.
- Worker runtime with `worker:once`/scheduled processing.

## Required for public beta

- Stripe live/test configuration appropriate to launch mode.
- Resend verified domain if email reports are enabled.
- GSC OAuth app, redirect URI and token encryption key.
- Shopify app URLs, read scopes, webhook secret and token encryption key.
- Sentry and product analytics recommended.

## Required before Shopify apply launch

- `SHOPIFY_WRITE_ENABLED=true` only in staging/production after QA.
- Shopify app includes optional `write_products` scope.
- `ALLOW_SHOPIFY_SMOKE_WRITE=true` only for a staging smoke product.
- One staging product smoke: dry run, apply, verify and rollback.

## Optional

- PageSpeed API key for higher quota.
- PostHog for product analytics.
- Sentry for error reporting.
