# Rate limiting

Production requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The memory fallback is only for local development and tests because Vercel/serverless can run many isolated instances.

Protected scopes include free audits, AI previews, job creation, upload pending registration, downloads signed URLs, original signed URLs and Stripe checkout/portal routes.
