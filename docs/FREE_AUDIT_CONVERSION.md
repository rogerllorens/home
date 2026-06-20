# Free Audit Conversion Flow

The public SEO audit now supports a conversion-oriented flow: URL input, optional email report consent, premium result summary, secure public report link and CTA into signup/upload.

Flow:
1. User submits a URL.
2. Optional email requires explicit `consentEmailReport`.
3. Rankelia runs the existing SSRF-safe audit engine.
4. The conversion summary converts technical findings into top issues, opportunities and recommended actions.
5. A non-enumerable report token is generated; only its hash is stored.
6. `/auditoria/[token]` renders the public report server-side.
7. CTA points to `/login?mode=register&next=/app/upload&source=audit_report&auditToken=...`.

No rankings, traffic, automatic publishing or ecommerce API writes are promised.
