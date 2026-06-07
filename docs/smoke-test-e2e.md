# Smoke test E2E beta

1. Ejecutar `npm run dev`.
2. Ejecutar `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Crear usuario nuevo y confirmar wallet Free: 3 productos / 1.500 créditos internos.
4. Comprar pack test de productos extra con tarjeta `4242 4242 4242 4242`.
5. Confirmar webhook y saldo actualizado en `/app/credits`.
6. Contratar plan Starter o Pro en `/app/billing`.
7. Confirmar `subscriptions` y grant por invoice.
8. Subir CSV pequeño en `/app/upload`.
9. Generar preview IA; repetir sin API key para validar fallback.
10. Crear job con saldo suficiente.
11. Ejecutar `npm run worker:dev` o `npm run worker:job -- <JOB_ID>`.
12. Ver `credit_reservations`: reserved → consumed, o released si falla.
13. Ver job completado y outputs en `/app/jobs`.
14. Descargar CSV/HTML/TXT en `/app/downloads`.
15. Entrar como admin y revisar usuario, job, wallet, evento Stripe, logs y coste IA.
16. Crear usuario B y verificar que no ve jobs, downloads ni wallet de usuario A.
17. Probar signed URL caducada/no autorizada.
