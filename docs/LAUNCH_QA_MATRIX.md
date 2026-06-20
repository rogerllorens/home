# Launch QA matrix

## Auth/RLS

- User A cannot read User B jobs, downloads, catalog, proposals, GSC, Shopify stores, import runs, AI generation runs, change sets, apply runs or rollback runs.
- Admin-only APIs reject non-admin users.

## Audit and onboarding

- Valid URL audit persists result and public token.
- Invalid/SSRF URL rejected.
- Email report sends only with configured Resend and consent.
- CTA tracking records audit report events.

## Import

- CSV UTF-8, CSV Windows-1252, XLSX multi-sheet, pasted table, XML Merchant and Shopify sync/import.
- Import history shows runs and retry creates or resumes a real job.

## Job/AI

- Create job, process worker, create proposals, generation runs and costs.
- Regenerate one field and full proposal without auto-approval.
- Approve and export approved versions.

## GSC

- OAuth, property select, queued sync, worker sync, cron, disconnect, token refresh, insufficient permissions and user A/B isolation.

## Shopify

- Connect read-only.
- Sync product to `shopify_products` and `catalog_items`.
- Verify webhook HMAC and duplicate delivery idempotency.
- Create change set from approved proposals.
- Dry run with conflicts/blockers.
- Upgrade write scope.
- Apply one staging test product only.
- Rollback the same staging test product.
- Uninstall app and verify token nulling.

## Stripe

- Checkout, billing portal, duplicate webhook, invalid signature and wallet balance/reservation behavior.

## Mobile

- Home, audit, upload, catalog, proposals, opportunities, jobs, downloads and Shopify apply pages.
