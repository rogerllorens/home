# Implementation Status Overview

This document captures the high-priority functional gaps that remain between the
current scaffold and the production-ready experience that was outlined in the
product requirements. Each section summarises the status, open work, and key
considerations so engineering, product, and operations can track progress at a
glance.

## 1. Payments & Token Ledger

**Status:** Client flows call the wallet checkout endpoint, but no PSP is wired.

**Outstanding work:**

- Integrate an adult-compliant PSP (e.g. CCBill, Segpay, Epoch) using the
  `/wallet/purchase` and `/wallet/webhook` contracts, including signature
  verification and the `provider_ref` idempotency guard.
- Enforce per-user hourly/daily purchase limits and the "suspend purchases"
  toggle surfaced in the admin tools.
- Provide administrative tooling to freeze/unfreeze purchases and review
  anomalous activity (high spend, chargebacks).

**Considerations:** Coordinate secret management (`PAYMENT_PUBLIC_KEY`,
`PAYMENT_SECRET`, `PAYMENT_WEBHOOK_SECRET`), 3DS/SCA coverage in supported
regions, and explicit refund policies.

## 2. Payouts, KYC & AML

**Status:** Payout request UI exists but is not connected to verification.

**Outstanding work:**

- Implement the `PAYOUTS_REQUIRE_KYC` flag in the API and surface KYC status in
  the client so creators cannot request withdrawals until verification succeeds.
- Capture KYC metadata (ID documents, proof-of-life, risk scoring) and store the
  review lifecycle (`requested`, `approved`, `rejected`).
- Ensure payouts post negative `PAYOUT` entries to the ledger only after KYC is
  satisfied.

**Considerations:** Document data-retention policy, secure storage of sensitive
files, and operational review SLAs for compliance staff.

## 3. Private Media Delivery

**Status:** Front-end still serves mock URLs.

**Outstanding work:**

- Connect media uploads to the real S3/Wasabi/Bunny bucket via the
  `/media/presign` flow and ensure PPV/PASS_ONLY assets are private.
- Serve playback through `/media/:id/secure-url`, binding signed URLs to the
  requesting user/session and expiring after 300 seconds.
- Implement storage quotas per user and garbage-collect orphaned uploads.

**Considerations:** Harden the download path against hotlinking via Referer and
signature checks and monitor bucket usage to manage costs.

## 4. Real-Time Stack (Signal, TURN, SFU)

**Status:** The UI talks to local mocks; no deployed signalling stack.

**Outstanding work:**

- Deploy the Signal WebSocket service with Redis-backed queues and connect the
  Match UI through authenticated tickets.
- Configure coturn and mediasoup (or LiveKit) with announced IPs, UDP ranges,
  and instrumentation for ICE success/latency metrics.
- Enforce group room capacity, VIP ticket charges, and reconnection attempts for
  unstable networks.

**Considerations:** Include heartbeat monitoring, alerting for queue backlog,
TURN reachability checks, and session metrics (bitrate, RTT) for triage.

## 5. Moderation & Enforcement

**Status:** Admin screens render sample data only.

**Outstanding work:**

- Wire `/admin/reports`, `/admin/enforcement`, and related endpoints so actions
  trigger bans, shadowbans, or content takedowns with entries in the
  `admin_audit_log` table.
- Notify affected users when enforcement occurs and ensure Signal respects
  shadowban rules in real time.

**Considerations:** Enable moderator roles distinct from full admins and track
  resolution times for DSA transparency reporting.

## 6. Notifications & Messaging

**Status:** In-app notification drawer exists; no backend feeds.

**Outstanding work:**

- Implement notification ingestion (unlock, gifts, passes, mentions) via API
  endpoints and persist read/unread state per user.
- Deliver transactional email and optional web-push events respecting marketing
  opt-in status.

**Considerations:** Localise templates, manage send rate limits, and expose
  notification preferences in account settings.

## 7. Analytics & Observability

**Status:** Sentry hooks are present but not configured with real DSNs.

**Outstanding work:**

- Provision Sentry projects for frontend, API, Signal, and SFU, and set DSNs in
  the deployment environments.
- Emit OpenTelemetry traces (request IDs, match IDs) and core product events
  (guest→register conversion, PPV unlocks, gift volume, CAC) to the analytics
  warehouse.
- Execute disaster-recovery drills using `infra/scripts/restore-test.sh` prior
  to launch.

**Considerations:** Ensure alerting thresholds cover API 5xx spikes, Signal
queue delays, and TURN reachability failures.

## 8. Massive Rooms Rollout

**Status:** Front-end lobby and room views are scaffolded behind feature flags
but backed by mock data only.

**Outstanding work:**

- Implement `/rooms` REST endpoints, `rooms` Prisma models, and Redis-backed
  sharding for fan-out.
- Extend the Signal service with the `ROOM_*` message family, backpressure
  handling, slow-mode enforcement, and aggregation of reactions/polls.
- Persist room membership, moderation actions, and token transfers/gifts in the
  ledger with the correct splits.

**Considerations:** Roll out per-environment flags (`ROOMS_MASSIVE`,
`ROOMS_TOPICS`, `ROOMS_TOKEN_TRANSFER`, `ROOMS_GIFTS`, `ROOMS_INLINE_TOPUP`,
`ROOMS_POLLS`) and monitor room-level metrics (join/concurrency, drop rate,
token volume) before general availability.

---

Maintaining this status document will help align the multi-disciplinary team on
what remains before a production launch and prevents regressions as new features
ship.
