# QA checklist beta — Rankelia.ai

## Auth y roles
- Registro, login, logout y reset password.
- Usuario customer no accede a `/admin`.
- Admin accede a usuarios, jobs, logs y billing.
- Primer admin creado mediante SQL controlado.

## CSV y jobs
- CSV válido con columnas ecommerce.
- CSV vacío, sin cabeceras, XLSX y archivo grande muestran errores claros.
- Mapping de columnas revisable.
- Preview IA con API key y fallback sin API key.
- Job creado con saldo suficiente y bloqueado con saldo insuficiente.
- Worker procesa, completa, falla controladamente y deja logs.

## Descargas y Storage
- Outputs CSV/HTML/TXT/errors CSV se crean en buckets privados.
- Signed URL funciona para propietario y admin.
- Usuario B no descarga archivos de usuario A.
- Storage paths incluyen `user_id/job_id` y no aceptan traversal.

## Stripe y wallet
- Checkout productos extra test.
- Checkout suscripción Starter/Pro/Growth/Agency.
- Webhook duplica evento sin duplicar créditos.
- Success URL no concede saldo.
- Invoice grant crea transacción única.
- Portal Stripe abre solo customer autenticado.

## IA y seguridad de contenido
- JSON inválido dispara reparación/fallback.
- Claims sospechosos generan warnings.
- No se inventan certificaciones, garantías, materiales o precios.
- Scores se recalculan backend.

## Responsive y accesibilidad
- Landing, app y admin en móvil, tablet y desktop.
- Inputs con labels, botones con texto, tablas con scroll.
- Error/empty/loading states visibles.
