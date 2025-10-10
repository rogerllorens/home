# Massive Chat Rooms Integration Plan

## Overview
This document captures the requirements and proposed implementation steps for introducing
massive chat rooms (thousands of concurrent users) alongside the existing random 1:1,
small-group RTC, forum, wallet, and gifting experiences.

## Product Goals
- Surface random and themed rooms inside Discover with live occupancy, activity rate, and
  trend signals.
- Deliver scalable text + media chat timelines with gifts, direct token transfers, and
  inline top-ups using Créditos (TKN) with visible EUR anchoring.
- Preserve cost efficiency by relying on WebSocket fan-out and cached media delivery
  instead of WebRTC for large rooms.
- Offer robust moderation (owner/mod/helper roles, rate limits, flood control, shadowban)
  and reporting workflows that integrate with the existing admin backoffice.

## Feature Flags
| Flag | Purpose |
| --- | --- |
| `ROOMS_MASSIVE` | Toggle discovery and access to massive chat rooms. |
| `ROOMS_TOPICS` | Enable themed room taxonomies and filtering chips. |
| `ROOMS_POLLS` | Allow real-time polls inside rooms. |
| `ROOMS_TOKEN_TRANSFER` | Enable direct user-to-user token transfers in rooms. |
| `ROOMS_GIFTS` | Surface the gift bar inside room chat timelines. |
| `ROOMS_INLINE_TOPUP` | Show inline Créditos (TKN) top-up banners when balances are low. |

Each flag should map to environment variables for web, API, signal, and worker services to
permit staged rollouts.

## Architecture
### Realtime Topology
- **Gateway WebSocket Layer**: Horizontally-scaled Node.js workers managed via Kubernetes
  or Docker swarm. Each worker maintains room subscriptions and applies per-room slow mode
  and flood rules.
- **Pub/Sub Backbone**: Redis Streams or NATS JetStream for ordered message delivery with
  partitions by `roomId`. Messages include `ulid` ids for monotonic sorting.
- **Presence + Counters**: Redis sorted sets keyed by `roomId` storing `userId` with TTLs
  for online counts and rate tracking.
- **Media Storage**: Existing S3-compatible bucket with signed URLs; CDN in front for
  public thumbnails. Upload pipeline enforces 25 MB image / 200 MB video limits with MIME
  checks and asynchronous scanning (ClamAV or third-party).

### Backpressure and Fan-out
- Rate-limit ingress per user and room. Burst queue drains prioritize moderator actions
  before member chatter.
- Gateway maintains bounded queues; if a shard exceeds processing thresholds, the server
  downgrades updates (e.g., collapse typing indicators) and emits `rate.limit.hit` events.
- Messages publish once per partition; each subscribed gateway fetches and forwards to all
  sockets in that room. Payload is compact JSON with optional compression (permessage-deflate).

### Persistence
- **Postgres**: New tables `room`, `room_member`, `room_message`, `room_media`,
  `room_reaction`, `room_report`, `room_token_transfer` following the schema outlined in
  the product brief. Indexes on `(room_id, created_at desc)` for pagination.
- **Redis Cache**: Maintain last 200 messages per room for fast join replay; fallback to
  Postgres cursor queries beyond cache window.

## API Contracts
### WebSocket (Signal Service)
- `room.join` / `room.leave`
- `msg.send` / `msg.recv` with reply threading, reaction deltas, polls, and attachments
  referencing pre-signed upload ids.
- `tokens.transfer`, `gift.send`, `poll.create|vote|close`
- Moderation frames: `msg.delete`, `user.mute`, `user.kick`, `user.ban`, `user.shadowban`
- Control signals: `slowmode.info`, `rate.limit.hit`, `automute.applied`

### REST (API Service)
- `POST /rooms` owner creation, `GET /rooms` discovery tabs (random, topics, trending).
- `POST /uploads/sign` for room media attachments.
- `GET /rooms/:id/history` cursor pagination (before/after).
- `POST /reports` standard reasons referencing room or message.

## UX Considerations
- Discover lobby tabs with chips, activity thermometers, and occupancy numbers.
- Timeline with reactions, quote replies, inline top-ups, and gift streak banners.
- Moderator HUD overlay for authorized roles exposing quick actions and recent report feed.
- Accessibility: focus outlines, ARIA labels, and high contrast theme compliance.

## Moderation & Safety
- Roles: owner, moderator, helper, member. Helpers can pin and delete recent messages but
  cannot ban.
- Auto-mute thresholds: configurable via env (`ROOM_AUTOMUTE_THRESHOLD`), integrating with
  existing enforcement tables.
- Reports feed into admin backoffice; actions recorded in `admin_audit_log`.

## Token Economy Integration
- Inline Créditos (TKN) conversions displayed near balance chips and transfer modals.
- Direct transfer modal ensures daily/monthly limits and conversion (100 TKN ≈ 1 €).
- Gift bar reuses existing catalogue and wallet spend flow with additional telemetry for
  streaks and top supporters lists.

## Telemetry & Monitoring
- Emit metrics (`room_join`, `msg_send_rate`, `msg_drop_rate`, `gift_send`,
  `token_transfer`, `report_submit`, `automute_triggered`) via OTEL.
- Add dashboards for p50/p95 latency, shard throughput, and fan-out queue depth.

## Implementation Phases
1. **Schema & Contracts**: Extend Prisma models and update API/WS specs for massive rooms.
2. **Signal Enhancements**: Introduce room shards, pub/sub integration, and rate controls.
3. **API Services**: REST endpoints for room discovery, history, and media uploads.
4. **Frontend**: Feature-flagged UI surfaces (lobby, room timeline, moderation HUD, gift
   bar) integrated with existing session, wallet, and notification providers.
5. **Moderation & Analytics**: Wire admin actions, telemetry, and reporting dashboards.
6. **Load Testing**: Simulate 3k concurrent users with tooling to validate <200 ms p95
   delivery and backpressure behavior.

## Next Steps
- Align on pub/sub technology (Redis Streams vs. NATS) based on existing infra.
- Define rollout plan using `ROOMS_*` feature flags across environments.
- Schedule load-testing rehearsal once minimal slice is complete.

