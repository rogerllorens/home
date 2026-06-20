# Import History

`import_runs` records retryable import previews and normalized imports: source type, file, sheet, encoding, delimiter, platform guess, mapping confidence, row counts, warnings, errors and normalized storage path.

The first migration prepares the data model. Full UI retry controls remain a follow-up.

Prompt 6 adds `/api/app/import/runs`, `/api/app/import/runs/[id]` and `/api/app/import/runs/[id]/retry` with ownership checks. The retry endpoint returns the normalized storage path when available; it does not duplicate jobs automatically without the existing jobs/create idempotency flow.
