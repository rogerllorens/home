# Prompt 9 — Stripe, productos SEO, wallet y reservas

## Qué incluye

- Stripe Checkout para suscripciones y productos SEO extra.
- Stripe Customer Portal.
- Webhook verificado con `STRIPE_WEBHOOK_SECRET`.
- Idempotencia mediante `payment_events.stripe_event_id`, `stripe_session_id` e `stripe_invoice_id`.
- Wallet real con `balance`, `reserved_balance`, compras, grants, uso y reembolsos.
- Reservas de créditos para jobs antes de procesar y consumo/liberación desde worker.
- UX real en `/app/credits` y `/app/billing`.
- Admin en `/admin/credits` con wallets, transacciones, reservas y eventos Stripe.

## Variables de entorno

Añade a `.env.local`:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_GROWTH_MONTHLY=
STRIPE_PRICE_AGENCY_MONTHLY=
STRIPE_PRICE_PRODUCTS_25=
STRIPE_PRICE_PRODUCTS_50=
STRIPE_PRICE_PRODUCTS_100=
STRIPE_PRICE_PRODUCTS_250=
STRIPE_PRICE_PRODUCTS_500=
STRIPE_PRICE_PRODUCTS_1000=
STRIPE_PRICE_PRODUCTS_2500=
STRIPE_PRICE_PRODUCTS_5000=
STRIPE_PRICE_PRODUCTS_10000=
APP_URL=http://localhost:3000
```

## SQL

Ejecuta después de las migraciones anteriores:

```sql
-- supabase/sql/006_billing_stripe_wallet.sql
```

Crea `billing_customers`, `subscriptions`, `checkout_sessions`, `payment_events`, `credit_reservations`, amplía wallets/transacciones y añade RPCs `add_credits`, `reserve_credits`, `consume_reserved_credits`, `release_reserved_credits`.

## Crear productos y precios en Stripe

1. Crea productos de suscripción: Starter, Pro, Growth y Agency.
2. Crea precios mensuales:
   - Starter 19 €/mes.
   - Pro 39 €/mes.
   - Growth 69 €/mes.
   - Agency 149 €/mes.
3. Crea productos one-time para packs extra:
   - 25, 50, 100, 250, 500, 1.000, 2.500, 5.000 y 10.000 productos.
4. Copia cada `price_...` a las variables `STRIPE_PRICE_*`.

## Webhooks locales

```bash
npm run dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copia el `whsec_...` a `STRIPE_WEBHOOK_SECRET`.

Eventos mínimos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Probar productos extra

1. Entra a `/app/credits`.
2. Selecciona un pack.
3. Pulsa **Comprar productos extra**.
4. Usa tarjeta test `4242 4242 4242 4242`.
5. Vuelve a `/app/credits`.
6. Verifica que el saldo solo cambia tras webhook.
7. Revisa tablas `checkout_sessions`, `payment_events`, `credit_transactions` y `credit_wallets`.

## Probar suscripción

1. Entra a `/app/billing`.
2. Elige Starter/Pro/Growth/Agency.
3. Completa Checkout.
4. Verifica `subscriptions` y grants por `invoice.payment_succeeded`.
5. Abre **Gestionar en Stripe** para Customer Portal.

## Probar reservas de jobs

1. Asegúrate de tener saldo suficiente en wallet.
2. Crea un job desde `/app/upload`.
3. Ejecuta `npm run worker:dev`.
4. El worker llama `reserve_credits` antes de procesar.
5. Si completa, llama `consume_reserved_credits`.
6. Si falla, llama `release_reserved_credits`.
7. Si no hay saldo, el job queda `insufficient_credits` y no se procesa.

## Seguridad

- El frontend envía `planId` o `packId`; nunca precio ni créditos.
- El backend lee precios/productos desde config server-side.
- `success_url` no concede saldo.
- Webhook es fuente de verdad.
- API keys de Stripe y service role solo server/worker.
- RPCs de wallet se revocan a `anon`/`authenticated` y se conceden a `service_role`.
- RLS permite lectura propia al usuario y lectura global al admin.

## Pendiente Prompt 10

- Hardening final, auditoría, alertas y observabilidad.
- Facturación fiscal avanzada si aplica.
- Portal admin más granular para ajustes manuales server-side.
- Expiración de productos extra a 12 meses si negocio lo requiere.
