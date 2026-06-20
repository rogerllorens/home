# GSC Sync Production

The GSC sync endpoint now enqueues sync runs instead of doing heavy work in the route. `npm run sync:gsc` remains the worker path for selected properties. Production still requires real Google OAuth, selected property, cron/worker scheduling and smoke testing with a real account.
