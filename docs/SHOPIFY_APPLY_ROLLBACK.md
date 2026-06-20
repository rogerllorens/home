# Shopify apply, dry run and rollback

Rankelia now has the code foundation for safe Shopify write workflows, but production launch still requires real Shopify app configuration and external smoke tests.

## Safety gates

Apply is blocked unless all of these are true:

1. The change set was created from approved proposal versions.
2. Dry run completed successfully.
3. `SHOPIFY_WRITE_ENABLED=true`.
4. The connected store granted `write_products`.
5. The user sends the exact confirmation `APLICAR CAMBIOS`.
6. A pre-apply snapshot can be written before mutation processing.

Rollback is blocked unless an apply run has applied items with pre-apply snapshots and the user sends `REVERTIR CAMBIOS`.

## Allowed fields

Allowed by default: `seo.title`, `seo.description`, `descriptionHtml`, `bodyHtml`, `images.altText`.

Sensitive fields (`title`, `handle`) are not included by default and require additional review.

Blocked fields include price, inventory, variants, vendor, collections, status and publication.

## Workers

Endpoints enqueue work only. Long-running operations are handled by:

```bash
npm run apply:shopify -- --run-id=<apply_run_id>
npm run rollback:shopify -- --run-id=<rollback_run_id>
```

Both scripts skip when `SHOPIFY_WRITE_ENABLED` is not true.

## Prompt 9 closure

Dry run now attempts a live Shopify product fetch when Shopify env and encrypted store token are available. If live check is not configured, missing, or fails, the item is blocked and apply cannot enqueue/process it.

Apply re-fetches the live Shopify product immediately before mutation execution. If the live value differs from the dry-run value, the item is marked as conflict and skipped; the run can become partial/failed and must be reviewed item by item.

`images.altText` remains prepared for preview/export, but Shopify image ALT write is blocked unless `SHOPIFY_IMAGE_ALT_WRITE_ENABLED=true` and a staging smoke test validates the mutation for the configured API version.
