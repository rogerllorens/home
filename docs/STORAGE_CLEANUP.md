# Storage cleanup

Uploads are registered in `pending_uploads` after the browser stores the CSV in the private input bucket. `/api/jobs/create` marks the upload as consumed when a job is created. Run `npm run cleanup:orphan-uploads` from a trusted worker/cron with service-role env to remove expired pending uploads. Use `--dry-run` before enabling a daily cron.
