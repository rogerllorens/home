# Shopify OAuth

OAuth starts at `/api/integrations/shopify/connect`, creates a short-lived state row and redirects to Shopify with `read_products` only. Callback verifies Shopify OAuth HMAC, validates state/shop/expiry, exchanges the code, encrypts the access token and upserts `shopify_stores`.
