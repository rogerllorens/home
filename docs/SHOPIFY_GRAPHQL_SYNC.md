# Shopify GraphQL Sync

Product read uses GraphQL Admin API `/admin/api/{SHOPIFY_API_VERSION}/graphql.json`. The sync worker paginates products, respects cost throttle status, and stores products in `shopify_products`. Endpoints enqueue `shopify_sync_runs`; heavy sync is done by `npm run sync:shopify`.
