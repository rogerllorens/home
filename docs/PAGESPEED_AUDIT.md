# PageSpeed + Performance Audit

Rankelia enriches the Free SEO Audit with PageSpeed Insights for mobile and desktop. It is diagnostic only: Rankelia does not modify themes, minify assets, compress images or guarantee rankings.

## What it measures

- Lighthouse performance score for mobile and desktop.
- SEO, best-practices and accessibility category scores when returned by PSI.
- Lab metrics: FCP, LCP, TBT, CLS, Speed Index, TTI, INP if available, server response time and DOM size.
- Opportunities: render-blocking resources, unused JS/CSS, image optimization, WebP/AVIF, offscreen images, redirects, compression, third-party impact and main-thread work.

## Core Web Vitals

- LCP: good <= 2500ms, needs improvement <= 4000ms, poor > 4000ms.
- CLS: good <= 0.1, needs improvement <= 0.25, poor > 0.25.
- INP: good <= 200ms, needs improvement <= 500ms, poor > 500ms.
- If INP is absent, Rankelia uses TBT as a lab proxy and marks that INP field data is unavailable.

## Scoring

Rankelia Performance Score weighs mobile more heavily than desktop:

- Mobile performance: 40%.
- Desktop performance: 20%.
- Core Web Vitals: 25%.
- Opportunity severity: 10%.
- Technical hygiene: 5%.

If PageSpeed is unavailable, the basic SEO audit remains valid and the global audit score does not get unfairly penalized.

## Cache and cost control

Results use `cache_key = sha256(strategy + normalized_url + config version)` and expire after `PAGESPEED_CACHE_TTL_HOURS` (default 24h). Rate limits are applied before calling PSI. Configure Upstash for distributed production limits.

## Environment

```env
PAGESPEED_API_KEY=
PAGESPEED_ENABLED=true
PAGESPEED_TIMEOUT_MS=45000
PAGESPEED_CACHE_TTL_HOURS=24
PAGESPEED_MAX_URLS_PER_DAY=100
```

In production, if `PAGESPEED_ENABLED=true` and `PAGESPEED_API_KEY` is missing, env validation reports an explicit error. The runtime skips PageSpeed and still returns the basic audit.

## Database

`supabase/sql/012_pagespeed_audit.sql` creates `pagespeed_audits` with RLS. It stores normalized metrics and recommendations only, not the full Lighthouse payload.

## Limitations

- No automatic optimization.
- No crawler or multi-URL PageSpeed batch yet.
- No headless browser owned by Rankelia.
- PSI data can vary between runs.
- Field data depends on Google's real-user data availability.
