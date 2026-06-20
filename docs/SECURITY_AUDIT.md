# Security audit summary

- Shopify OAuth callbacks validate HMAC/state and normalize `*.myshopify.com` domains.
- Shopify webhooks use raw body HMAC, delivery IDs and duplicate protection.
- Shopify tokens and GSC tokens are encrypted server-side; tokens are not returned to frontend APIs.
- Shopify apply is gated by approved versions, dry run, `write_products`, `SHOPIFY_WRITE_ENABLED`, explicit confirmation and pre-apply snapshots.
- Field policy rejects unknown and forbidden Shopify fields by default.
- Supabase RLS policies cover Shopify read/import and apply/rollback tables; writes are intended for server/service-role paths only.
- Stripe webhook handling must continue to be validated with raw-body signature and duplicate event smoke tests before launch.
- Production launch remains blocked by real RLS A/B smoke and external provider smoke tests.

## Temporary advisory decision

`npm audit --omit=dev` currently reports a PostCSS advisory through Next. `npm audit fix --force` is not applied because it proposes breaking dependency changes. Mitigation: keep user-generated CSS out of trusted render paths, monitor Next/PostCSS patched releases, upgrade within the current major line when a compatible fix is available, and rerun typecheck/lint/tests/build before launch.

## Formatting decision

`npm run format:check` still fails repo-wide. Mass formatting is deferred to a dedicated PR to avoid mixing high-risk launch changes with mechanical rewrites.
