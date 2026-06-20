# Security Audit Notes

Prompt 7 adds Shopify HMAC/state/token encryption tests and RLS-backed tables. Remaining manual checks before launch: Supabase RLS smoke with real users, Stripe live webhook idempotency, Google OAuth smoke, Resend verified domain and private bucket policy review.
