# Prompt 8 — IA real, JSON validado y fallback robusto

## Qué añade

- Capa modular `lib/ai/*` para proveedores IA server-side.
- Provider real OpenAI/OpenAI-compatible mediante `fetch` a `/chat/completions`.
- Routing de modelos `economy`, `standard` y `premium` según calidad y tipo de generación.
- Prompts versionados para producto, categoría, metadatos y reparación JSON.
- Validación estricta con Zod y reparación de JSON una sola vez.
- Fallback template-based si falta API key, si el coste supera límites, si falla el provider o si el JSON no valida.
- Coste estimado, tokens, modelo, provider, prompt version, errores de validación y claims guardados en jobs/job_rows.
- Preview IA en `/app/upload` desde route handler server-side, nunca desde componentes cliente.

## Variables de entorno

```env
AI_PROVIDER=openai
AI_MODEL_ECONOMY=
AI_MODEL_STANDARD=
AI_MODEL_PREMIUM=
OPENAI_API_KEY=
QWEN_API_KEY=
QWEN_BASE_URL=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
AI_MAX_RETRIES=2
AI_REPAIR_JSON=true
AI_USE_FALLBACK=true
AI_DEFAULT_QUALITY=balanced
AI_PREVIEW_MAX_ROWS=5
AI_WORKER_MAX_CONCURRENCY=1
AI_ROW_TIMEOUT_MS=60000
AI_MAX_COST_PER_JOB=5
AI_MAX_COST_PER_ROW_ECONOMY=0.01
AI_MAX_COST_PER_ROW_STANDARD=0.03
AI_MAX_COST_PER_ROW_PREMIUM=0.08
```

`OPENAI_API_KEY` y claves equivalentes solo deben existir en servidor/worker. No uses claves IA en el navegador.

## SQL a ejecutar

Después de las migraciones anteriores, ejecuta:

```sql
-- supabase/sql/005_ai_generation_fields.sql
```

Añade campos IA a `jobs` y `job_rows`, más `ai_prompt_templates` protegida por RLS para administradores.

## Cómo probar preview IA

1. Configura Supabase y una API key IA en `.env.local`.
2. Ejecuta `npm run dev`.
3. Inicia sesión.
4. Ve a `/app/upload`.
5. Sube o pega un CSV.
6. Pulsa **Generar preview con IA**.
7. Revisa provider, modelo, coste estimado, JSON validado, scores y warnings.
8. Quita la API key y repite: debe aparecer fallback template con warning.

## Cómo probar job completo

1. Crea un job desde `/app/upload`.
2. Ejecuta `npm run worker:dev`.
3. El worker leerá jobs `queued` o `ready_for_processing`.
4. Si hay API key, llamará al provider IA, validará JSON y guardará `job_rows.output_data`.
5. Si falla, usará fallback y añadirá logs `source='ai'`.
6. Revisa `/app/jobs`, `/app/downloads` y `/admin/jobs`.

## Validación y fallback

Flujo por fila:

1. Construir prompt con datos mínimos del CSV.
2. Estimar tokens/coste.
3. Llamar al provider server-side.
4. Extraer JSON aunque venga con fences o texto alrededor.
5. Validar con Zod.
6. Reparar JSON una vez si falla.
7. Detectar keyword stuffing y claims no soportados.
8. Recalcular scores en backend.
9. Guardar stats IA.
10. Aplicar fallback template si cualquier paso no es seguro.

## Seguridad

- No hay llamadas IA desde componentes cliente.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en worker.
- Las API keys IA solo se usan en route handlers/worker.
- Los usuarios siguen protegidos por RLS y solo ven sus jobs/rows/downloads.
- Admin ve costes y errores solo con rol `admin`.
- No se envían emails ni datos de usuario al provider; solo la fila CSV necesaria y configuración del job.

## Pendiente Prompt 9

- Stripe Checkout.
- Webhooks.
- Reserva/consumo real de productos/créditos.
- Límites reales por plan.
- Facturación y packs extra pagados.
