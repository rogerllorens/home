# GSC OAuth

OAuth starts at `/api/integrations/gsc/connect`, creates a server-side state and PKCE verifier, then redirects to Google with only `webmasters.readonly`. The callback validates state expiry/consumption, exchanges the code, encrypts tokens with AES-256-GCM and stores them server-side only. API responses never include access or refresh tokens.

Disconnect marks the connection disconnected, clears encrypted tokens and unselects properties while retaining historical metrics for analysis.
