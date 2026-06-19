# Worker Rankelia

El worker procesa jobs `queued` o `ready_for_processing`, descarga el CSV privado, genera outputs con IA/fallback, crea downloads y consume/libera reservas.

Comandos:

```bash
npm run worker:dev
npm run worker:job -- <JOB_ID>
```

Requiere `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, buckets creados y claves IA si se quiere generación real. Si no hay API key, se aplica fallback template-based.
