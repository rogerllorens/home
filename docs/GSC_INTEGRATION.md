# Google Search Console integration

Rankelia uses Google Search Console in readonly mode to enrich catalog/proposal opportunities with real demand signals: clicks, impressions, CTR and average position. It never writes to Google properties and never publishes SEO changes automatically.

## Environment
Set `GSC_ENABLED=true`, OAuth credentials, readonly scope and a strong token encryption key. Production validation requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_GSC_SCOPES=https://www.googleapis.com/auth/webmasters.readonly` and `GOOGLE_TOKEN_ENCRYPTION_KEY`.

## Data model
Migration `016_gsc_integration.sql` creates encrypted connections, OAuth states, properties, sync runs, URL/query/page+query metric tables and catalog match records. RLS limits all GSC data to the owning user; service role writes happen only on server routes/scripts.

Prompt 6 adds `npm run smoke:gsc`. Because OAuth is interactive, the script validates config and skips clearly unless a connected test account/token is available. A real GSC pass still requires manual OAuth in staging.
