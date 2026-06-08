# Smoke test E2E beta

1. Ejecutar `npm run dev`.
2. Ejecutar `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Crear usuario nuevo y confirmar wallet Free: 3 productos / 1.500 créditos internos.
4. Comprar pack test de productos extra con tarjeta `4242 4242 4242 4242`.
5. Confirmar webhook y saldo actualizado en `/app/credits`.
6. Contratar plan Starter o Pro en `/app/billing`.
7. Confirmar `subscriptions` y grant por invoice.
8. Subir CSV pequeño en `/app/upload`.
9. Analizar CSV y validar mapping.
10. Generar preview IA; repetir sin API key para validar fallback.
11. Crear job con saldo suficiente.
12. Ejecutar `npm run worker:dev` o `npm run worker:job -- <JOB_ID>`.
13. Ver `credit_reservations`: reserved → consumed, o released si falla.
14. Ver job completado y outputs en `/app/jobs`.
15. Descargar CSV en `/app/downloads`.
16. Descargar HTML en `/app/downloads`.
17. Descargar TXT report en `/app/downloads`.
18. Descargar errors CSV si hay filas fallidas.
19. Entrar como admin.
20. Ver usuario.
21. Ver job.
22. Ver wallet.
23. Ver Stripe event.
24. Ver logs.
25. Crear usuario B y comprobar aislamiento de jobs/downloads/wallet.
26. Probar signed URL caducada/no autorizada.
