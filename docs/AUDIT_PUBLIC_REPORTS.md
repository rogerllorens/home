# Public Audit Reports

Public audit reports use random 32-byte URL-safe tokens. Rankelia stores only a SHA-256 hash and validates reports server-side. Anonymous clients do not read Supabase directly.

Default expiration is `AUDIT_REPORT_TOKEN_DAYS=30`. Expired or invalid links show a safe state with a CTA to create a new audit.
