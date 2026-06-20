# GSC sync

`POST /api/integrations/gsc/sync` and `npm run sync:gsc` synchronize selected properties for 28 and 90 day ranges. End date is delayed by `GSC_SYNC_DATA_DELAY_DAYS` because Search Console data can lag. The sync imports dimensions `page`, `query` and `page,query`, paginates with row limits, upserts by unique metric keys and keeps old data if a later run fails.

Run `npm run sync:gsc -- --dry-run` before enabling a cron. Avoid excessive sync frequency to protect Google quota.
