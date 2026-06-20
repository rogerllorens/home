# Audit Email Reports

Email reports are sent only when the user provides an email and explicitly requests the report. Marketing consent is separate.

`EMAIL_REPORTS_ENABLED=true` enables Resend delivery. Without Resend env vars, the API still returns the on-page report and public report URL, and email delivery is skipped/fails without blocking the audit.

Email content includes score, issues, opportunities, a full report CTA, an optimization CTA and the statement that Rankelia generates proposals for review and does not publish changes automatically.
