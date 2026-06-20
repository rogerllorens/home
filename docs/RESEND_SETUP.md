# Resend Setup

Set:

- `EMAIL_REPORTS_ENABLED=true`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- optional `EMAIL_REPLY_TO`

Production validation requires `RESEND_API_KEY` and `EMAIL_FROM` only when email reports are enabled. Test email rendering locally before sending real traffic.

Prompt 6 adds `npm run smoke:resend`. It sends a test email only when `EMAIL_REPORTS_ENABLED=true`, `RESEND_API_KEY`, `EMAIL_FROM` and `SMOKE_TEST_EMAIL_TO` are present; otherwise it reports a clear skip.
