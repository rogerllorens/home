# Smoke test E2E beta

Ejecutar este smoke test antes de abrir beta pública. Usar Stripe test mode, un proyecto Supabase real de staging y buckets privados.

1. Ejecutar `npm run dev` con `.env.local` de staging.
2. Ejecutar `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Crear usuario A y confirmar email si aplica.
4. Confirmar wallet Free: 3 productos estándar / 1.500 créditos internos.
5. Comprar pack test de productos extra con tarjeta `4242 4242 4242 4242`.
6. Confirmar webhook `checkout.session.completed` y saldo actualizado en `/app/credits`.
7. Contratar plan Starter o Pro en `/app/billing`.
8. Confirmar `subscriptions`, `payment_events` y grant por `invoice.payment_succeeded`.
9. Subir CSV pequeño en `/app/upload`.
10. Analizar CSV y validar mapping automático/manual.
11. Generar preview IA; repetir sin API key para validar fallback marcado.
12. Crear job con saldo suficiente.
13. Ver reserva en `credit_reservations` antes del worker.
14. Ejecutar `npm run worker:dev` o `npm run worker:job -- <JOB_ID>`.
15. Confirmar job completado o `completed_with_warnings`.
16. Ver reserva `reserved → consumed`, o `released` si el job falla.
17. Confirmar `job_rows.output_data`, scores, warnings y `fallback_used` cuando aplique.
18. Descargar Rankelia CSV desde `/app/downloads`.
19. Descargar CSV Shopify/WooCommerce/PrestaShop si el formato elegido lo genera.
20. Descargar HTML report.
21. Descargar TXT report.
22. Descargar errors CSV si hay filas fallidas.
23. Entrar como admin.
24. Ver usuario, wallet, job, Stripe event y logs.
25. Crear usuario B y comprobar aislamiento de jobs/downloads/wallet.
26. Probar signed URL caducada/no autorizada y confirmar rechazo.
27. Forzar job fallido y comprobar liberación de reserva.
28. Subir/procesar un CSV con producto `=IMPORTXML("https://example.com","//x")` y comprobar que el CSV exportado neutraliza la fórmula con prefijo `'`.
29. Subir/procesar un CSV con `<script>alert(1)</script>` en nombre/descripción y comprobar que el HTML report no ejecuta JavaScript.

Criterio de salida: ninguna promesa de saldo, importación o publicación debe depender de frontend; Stripe webhook, worker y Storage privado deben ser la fuente de verdad.
