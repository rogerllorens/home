# Shopify Security

Tokens are encrypted with AES-256-GCM using `SHOPIFY_TOKEN_ENCRYPTION_KEY`. Tokens never go to the frontend. OAuth requires HMAC + state. Webhooks require raw-body HMAC. RLS lets users read only their own stores/products/sync runs; writes are server-side/service-role only.
