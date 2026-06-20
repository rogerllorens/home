# Shopify Webhooks

`/api/integrations/shopify/webhooks` validates the raw body with `X-Shopify-Hmac-SHA256`, stores delivery IDs in `shopify_webhook_deliveries`, ignores duplicates, and handles uninstall by nulling the encrypted token. Product webhooks are recorded for future queued resync.
