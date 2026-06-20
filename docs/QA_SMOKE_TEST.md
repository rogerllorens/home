# QA smoke test beta

1. Ejecutar migraciones `001`-`010` y crear buckets privados.
2. Crear usuario A, iniciar sesión y confirmar wallet Free (3 productos estándar).
3. Entrar en `/app/upload`, subir CSV válido, revisar mapeo y preview IA/fallback.
4. Confirmar job: `/api/jobs/create` debe crear job, insertar todas las filas permitidas y reservar créditos server-side.
5. Ejecutar `npm run worker:once`; comprobar progreso, job_rows, downloads y consumo/liberación de reserva.
6. Descargar CSV, HTML y TXT con signed URLs; usuario B no debe poder acceder.
7. Probar CSV inválido, CSV > `WORKER_MAX_ROWS_PER_JOB` y saldo insuficiente.
8. Comprar productos extra con Stripe test y reenviar webhook duplicado: saldo solo aumenta una vez.
9. Contratar plan test y verificar grant por invoice.
10. Entrar como admin y revisar usuarios, jobs, wallets, reservations, payment_events y logs.
11. Verificar downloads: Rankelia Generic CSV + CSV de plataforma elegida cuando aplique.
12. Abrir `Rankelia Warnings` y confirmar que faltas de SKU/precio/imagen aparecen.

## Free SEO Audit

1. Desde la home, introducir `https://example.com` y confirmar resultado visual.
2. Probar `http://localhost`, `http://127.0.0.1`, `http://192.168.1.1` y confirmar bloqueo SSRF.
3. Verificar que no se devuelve HTML crudo ni stack trace.
4. Confirmar CTA a subir catálogo, registro y Search Console próximamente.

## PageSpeed Audit

1. With `PAGESPEED_ENABLED=false`, run Free SEO Audit and confirm basic report works.
2. With missing API key, confirm UI shows PageSpeed unavailable without failing the audit.
3. With a test key, confirm mobile/desktop scores and Core Web Vitals render.
4. Re-run same URL and verify cache/rate-limit behavior.

## Schema/GEO/llms.txt

1. Audit a Shopify-like page with Product schema.
2. Audit a page with invalid JSON-LD and confirm the audit still completes.
3. Confirm GEO/AEO cards render and explain that visibility is not guaranteed.
4. Download and copy llms.txt; verify it includes home, sitemap if detected and price/stock disclaimer.

## Smoke Image SEO / ALT text

1. Subir CSV con `Image Src` y `Image Alt Text` y comprobar que el ALT existente se preserva.
2. Subir CSV WooCommerce con `Images` separadas por coma y comprobar galería.
3. Subir CSV PrestaShop con `Image URLs` y revisar export.
4. Subir producto sin imagen y comprobar warning `no image URL`.
5. Exportar Shopify y comprobar `Image Src` + `Image Alt Text`.
6. Abrir HTML/TXT report y verificar resumen Image SEO sin HTML/CSV injection.

## Proposals smoke test

1. Upload a small CSV and run the worker.
2. Open `/app/proposals` and verify proposals were created.
3. Open a proposal detail page and compare before/after fields.
4. Regenerate `meta_title`; verify a new inactive version appears.
5. Edit `meta_description` manually; verify a manual version appears.
6. Activate a version, approve it, and export approved for the job.
7. Confirm pending proposals are not included in approved exports.

## Dashboard interno

1. Usuario nuevo entra en `/app` y ve CTA real para subir catálogo.
2. Tras procesar un CSV, `/app/catalog` muestra productos reales.
3. `/app/opportunities` muestra oportunidades internas sin métricas GSC.
4. `/app/jobs/[id]` muestra progreso, ETA, propuestas y logs.
5. Aprobar una propuesta cambia el dashboard hacia descarga aprobada.
6. `/app/downloads` etiqueta exports completos y solo aprobados.

## GSC smoke test
1. Set `GSC_ENABLED=true` with Google OAuth secrets and encryption key.
2. Connect Search Console from `/app/search-console`.
3. Confirm readonly consent and property list.
4. Select a property and sync 28/90 days.
5. Verify top GSC opportunities in `/app/opportunities?source=gsc`.
6. Open matched catalog/proposal detail and confirm query/page metrics.
7. Disconnect and verify tokens are nulled and UI returns to disconnected state.

## Universal import smoke test

1. Upload a Shopify CSV.
2. Upload a Spanish semicolon CSV encoded as Windows-1252.
3. Upload a multi-sheet XLSX and select the product sheet.
4. Paste a table from Google Sheets.
5. Upload a basic XML product feed.
6. Review mapping confidence and row warnings.
7. Create a job from the normalized import.
8. Run the worker and verify proposals, catalog items, opportunities, GSC matching and approved exports still work.

## Free audit conversion smoke test

1. Run a free audit without email and verify the visual report appears.
2. Run a free audit with email + report consent and verify the API returns a public report URL.
3. Open `/auditoria/[token]` and confirm no email/IP/user-agent is shown.
4. Click “Empezar a optimizar mi tienda” and verify the register URL includes `source=audit_report` and `auditToken`.
5. Upload a multi-sheet XLSX and verify sheet metadata can be shown.
6. Paste table data, apply bulk trim/remove-empty helpers and create a job.
7. Import a Merchant-like XML feed with CDATA and repeated image links.
