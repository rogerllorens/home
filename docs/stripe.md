# Stripe Rankelia

La app usa Checkout para suscripciones y productos extra, Customer Portal para gestión y webhook como única fuente de verdad para saldo.

- Frontend envía `planId` o `packId`, nunca importes ni créditos.
- Backend resuelve `priceId`, productos y créditos desde configuración.
- `checkout.session.completed` añade productos extra una sola vez.
- `invoice.payment_succeeded` concede productos mensuales por invoice única.
- `payment_events` evita procesar duplicados.
