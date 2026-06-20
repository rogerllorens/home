# Security hardening

## Free Audit SSRF / DNS rebinding

The Free SEO Audit validates the URL, resolves DNS with `dns.lookup(..., { all: true })`, rejects private/local/link-local/metadata ranges, stores the selected public IP and pins the outbound Node `http`/`https` request through a custom DNS lookup callback. Every redirect is revalidated and uses a fresh pinned request.

## Rate limiting

Upstash Redis is required in production. In-memory rate limiting is only a development/test fallback and must not be treated as serverless protection.

## HTTP headers and CSP

Global headers are configured in `next.config.ts`: frame denial, nosniff, strict referrer policy, permissions policy, HSTS and CSP compatible with Supabase/Stripe/Sentry.

## Storage

Signed URL endpoints must validate auth, ownership, bucket allow-list and short expiry server-side. Client code never signs private files.
