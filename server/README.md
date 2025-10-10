# TuWeb API & Signal Service

This service provides a minimal Fastify-based API and WebSocket signal gateway that the Next.js frontend can consume when running the MVP locally. It implements:

- Authentication flows for guests, registration, login, refresh and guest upgrade with JWT httpOnly cookies.
- Wallet endpoints for balance retrieval, token purchase checkout creation and webhook-based idempotent confirmation, plus direct spend and transfer helpers.
- Gift and direct token transfer endpoints aligned with the TKN economy copy (`Créditos (TKN)`).
- Massive-room discovery, history and moderation primitives together with a WebSocket fan-out handler that supports joining rooms, sending messages, reactions, gifts and inline transfers under slow-mode and basic anti-spam guards.
- Random 1:1 match queue handling so the Match UI can negotiate WebRTC sessions once TURN/SFU credentials are wired.
- Upload signing placeholder responses so the UI can request pre-signed keys while the real S3/Wasabi integration is configured.

## Getting started

```bash
cd server
npm install
npm run dev
```

The service listens on `http://localhost:8080` by default and exposes a WebSocket endpoint at `ws://localhost:8080/signal`.

Environment variables can be provided through `.env`; refer to `src/config.ts` for the supported keys such as `JWT_SECRET`, `ALLOWED_ORIGINS`, `ROOMS_*` feature flags, and TURN credentials.

> **Note:** Storage is in-memory for local development so restarting the process resets wallets, rooms, and sessions. Connect the handlers to Postgres/Redis/S3 before production use.
