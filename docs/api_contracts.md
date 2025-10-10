# API & Signaling Contracts

This document formalizes the REST and WebSocket contracts for the platform. All
responses are JSON encoded with UTF-8.

## 1. Common Conventions

- **Base URL:** `https://api.tuweb.com`
- **Authentication:** `Authorization: Bearer <jwt>` with scopes `guest`,
  `user`, or `admin` encoded in the token payload.
- **Errors:**
  ```json
  {
    "error": {
      "code": "STRING_CODE",
      "message": "Human readable",
      "details": {}
    }
  }
  ```
- **Pagination:** Cursor-based using `created_at` and `id` in descending order.
  Responses include `{ "items": [...], "nextCursor": "..." }` when more
  results are available.
- **Rate Limits:** Unless otherwise stated, requests exceeding rate limits
  return `429` with `code="RATE_LIMIT"`.
- **Correlation IDs:** Clients SHOULD send `X-Request-ID` with a UUID (or rely on
  the platform-generated value returned via the `X-Request-ID` response header)
  for traceability across services and Sentry logs.
- **Validation Highlights:**
  - `username`: `^[a-z0-9_]{3,20}$`
  - Password length ≥ 8
  - Token prices respect product ranges outlined in §3 of the product spec
  - Media limits: images ≤ 25 MB, videos ≤ 200 MB, 1 video per post, ≤5 media per
    post

## 2. Authentication & Sessions

| Endpoint | Method | Body | Notes |
| --- | --- | --- | --- |
| `/auth/guest` | POST | `{ "ageConfirmed": boolean }` | Creates/updates a guest `Session` with `is_guest=true` and returns `{ "sessionId", "accessToken" }`. |
| `/auth/register` | POST | `{ "username", "email?", "password" }` | Hash password with Argon2 and bind to guest wallet when provided. Response `{ "accessToken", "refreshToken" }`. |
| `/auth/login` | POST | `{ "usernameOrEmail", "password", "totp?" }` | On success returns `{ "accessToken", "refreshToken" }`. Admins must include a valid 6-digit TOTP code. |
| `/auth/refresh` | POST | `{ "refreshToken" }` | Rotates refresh token and returns `{ "accessToken" }`. |
| `/guest/upgrade` | POST | `{ "sessionId", "username", "email?", "password" }` | Migrates guest wallet/session data to a registered user. |

Rate limit: `POST /auth/*` ≤ 5/min/IP. JWT payload includes `sub`, `scope`, and
`ageConfirmed` claim. Registro y upgrade de invitados requieren resolver
`hCaptcha` y enviar `captcha_token` válido.

## 3. Profiles, Media & Feed

### 3.1 Profiles

- `GET /profiles/:username` → `{ profile, metrics }` (public metadata + counts)
- `PUT /profiles/me` (user) → `{ "display_name", "bio", "tags": string[] }`
- `POST /profiles/:username/follow` (user) → follows another user. `DELETE` to
  unfollow. Response `{ followed: boolean }`.
- `POST /blocks/:targetUserId` (user) → adds user to blocklist, prevents future
  matches and hides messages. `DELETE` removes block.

### 3.2 Media Lifecycle

1. `POST /media/presign` → `{ uploadUrl, storageKey, maxTTL }`
2. Upload media to S3 using returned URL.
3. `POST /media` → persists record with `{ storageKey, type, visibility,
   price_tokens? }` while validating ranges for PPV/PASS_ONLY.

Additional endpoints:

- `POST /media/:id/unlock` → Debits tokens via `WalletTx` (`SPEND` + `SPLIT`)
  and grants access.
- `GET /media/:id/secure-url` → Returns `{ url, expiresAt }` if user has access
  (owner, PPV purchased, or active pass). Signed URL TTL ≤ 300 s and includes
  user/session binding.
- `GET /access/media/:id` → `{ access: boolean, reason? }`

### 3.3 Posts

- `POST /posts` → `{ text?, mediaIds: string[] }`
- `GET /posts/user/:username?cursor=&limit=` → Mixed feed (public + locked with
  gating signals).
- `POST /posts/:id/like` and `DELETE /posts/:id/like`
- `POST /posts/:id/comment` → `{ body }`
- `POST /posts/:id/bookmark` / `DELETE /posts/:id/bookmark` → saves content to
  the user library.

PPV bundles unlock multiple media items in a single transaction.

### 3.4 Passes & Profile Access

- `POST /passes/:sellerId/buy` → `{ price_tokens }` with 499–2,999 range.
  Ledger entries: `SPEND` (buyer) + `SPLIT` (seller earnings 80 % / platform 20 %).
- `GET /access/profile/:userId` → `{ hasPass, expiresAt? }`

### 3.5 Social & Notificaciones

- `GET /notifications` → Lists the last 50 events (gift, PPV, pase, foro,
  comentario, mención, referidos, sistema) with read status.
- `POST /notifications/read` → Marks all notifications as read.
- `GET /notifications/preferences` → Returns the user toggle matrix for every
  notification type (`gift`, `ppv`, `pass`, `comment`, `mention`, `like`,
  `forum`, `referral`).
- `PUT /notifications/preferences` → `{ "type": "gift", "enabled": true }`
  toggles an individual channel. `system` notifications remain always-on.
- `POST /threads/:id/follow` / `DELETE` → Sigue hilos del foro.
- `GET /search?q=&type=` → Búsqueda global de usuarios, tags y hilos (full-text
  con ranking por actividad reciente y likes).
- `GET /favorites/posts` → Devuelve posts guardados con paginación.

### 3.6 Referidos, shares y embebidos

- `GET /referrals/summary` → `{ referrals, tokensEarned, pendingConversions,
  referralLink }`.
- `POST /referrals/claim` (admin/ops) → `{ referralId, conversion_type }`
  marca una conversión manual y dispara los bonuses correspondientes.
- `POST /referrals/bonus` (user) → `{ bonus_id }` para reclamar incentivos (p.
  ej. completar perfil, primer post foro, primer regalo). Devuelve `{ granted,
  tokens }`.
- `GET /share/meta?target=profile|post|thread&id=` → Metadatos OG/Twitter con
  previews borrosos para contenido adulto.
- `GET /embeds/profile/:username` → HTML responsive (iframe) con avatar, bio y
  CTA "Ver perfil" firmado (TTL ≤ 5 min, referer obligatorio).

## 4. Wallet & Payments

- `GET /wallet` → `{ balance, pending_earnings, available_earnings, daily_limit,
  monthly_limit, spent_today, spent_month, purchases_suspended }`
- `PUT /wallet/limits` → `{ daily_tokens, monthly_tokens }` updates user caps.
- `GET /wallet/packs` → Returns packs S/ M/ L/ XL/ XXL as defined in the
  economy section.
- `POST /wallet/buy` → `{ packId }` returns `{ checkoutUrl }` from PSP. Include
  `Idempotency-Key` header for retries.
- `POST /wallet/webhook` → PSP callback with signature + `provider_ref` for
  idempotency. Creates `WalletTx` with `type="PURCHASE"` and amount > 0. Always
  respond 2xx once processed or deduplicated.
- `POST /payouts/request` (user) → `{ amount }` in tokens. Requires `available`
  earnings ≥ amount and minimum 5 000 TKN (≈50 €). Creates a `PayoutRequest`
  with status `requested`.

## 5. Matchmaking & RTC Support

- `GET /rtc/turn-credentials` → Optional TURN credentials for WebRTC fallback.
- `POST /rooms/group` → `{ title?, vip_price_tokens? }` returns `{ roomId }`.
- `GET /rooms/group` → `{ rooms: [{ roomId, participants, vip_price_tokens? }] }`
- `POST /rooms/group/:id/join` → Charges VIP ticket (100–1,000 TKN) when set,
  returns `{ roomId, sfuParams }`.
- `POST /rooms/group/:id/leave` → Acknowledges leave.

### Massive rooms (feature-flag `ROOMS_MASSIVE`)

- `GET /rooms?tab=trending|random|topics&topic?=` → `{ rooms: RoomSummary[], nextCursor? }`.
  - `RoomSummary` includes: `id`, `title`, `type` (`random|topic`), `tags[]`,
    `participants`, `messages_per_minute`, `is_nsfw`, `slow_mode_seconds?`,
    `top_supporters?`.
- `GET /rooms/:id` → Returns a single `RoomSummary` plus `{ presence: { online,
  slow_mode_seconds? } }`.
- `GET /rooms/:id/history?cursor=&dir=backward` → Cursor-based message feed.
- `POST /rooms` (owner/mod) → `{ title, tags[], rules?, slow_mode_seconds? }`.
- `POST /rooms/:id/moderation` → `{ action: 'mute'|'ban'|'shadowban'|'delete_message', target_id, duration_sec?, reason? }`.
- `POST /rooms/:id/reports` → `{ target_message_id?|target_user_id?, reason, notes? }`.
- `POST /rooms/:id/transfers` *(flag `ROOMS_TOKEN_TRANSFER`)* → `{ to_user_id,
  amount_tokens, correlation_id }` → `{ balance, eur_equivalent }`.
- `POST /rooms/:id/gifts` *(flag `ROOMS_GIFTS`)* → `{ gift_id, target_user_id?,
  client_msg_id? }` mirrors `/gifts/send` ledgering.

## 6. Forum

| Endpoint | Method | Body |
| --- | --- | --- |
| `/forum/categories` | GET | – |
| `/forum/categories` | POST (admin) | `{ name }` |
| `/forum/threads` | GET | `?categoryId=&cursor=&limit=` |
| `/forum/threads` | POST | `{ categoryId, title, body?, mediaId? }` |
| `/forum/threads/:id` | GET | Returns thread and paginated posts |
| `/forum/posts` | POST | `{ threadId, body, mediaId? }` |

Attachments obey the same media limits. Sticky threads are handled via a future
flag.

## 7. Moderation & Admin

- `POST /report` → `{ target_user_id?, target_media_id?, target_post_id?, reason }`.
- `GET /admin/dashboard` → Aggregated KPIs (DAU, GMV/GSV, conversion, sources)
  for dashboard widgets.
- `GET /admin/users` → Tabular data with balances, earnings, flags, and report
  counts. Supports filters by date/flag in query params.
- `PATCH /admin/enforcement/:userId` → `{ type: 'BAN' | 'SHADOWBAN', reason }`
  which updates enforcement records and invalidates active sessions/WS tokens.
- `GET /admin/reports` → Filter by status, type, date. Response includes preview
  metadata only (PPV media stays blurred).
- `POST /admin/reports/:id/close` → Marks report as `CLOSED` with audit trail.
- `POST /admin/reports/:id/takedown` → Soft deletes target media/post and logs
  the action in `admin_audit_log`.
- `GET /admin/content` → Lists media uploads with filters for visibility,
  status, size, and owner tags.
- `PATCH /admin/content/:id` → `{ status: 'removed' | 'sensitive' }` or soft
  delete when `status='removed'`.
- `GET /admin/dashboard` → KPIs extendidos (conversiones invitado→usuario,
  usuario→comprador, usuarios activos en foro, reparto gifts/PPV/pases, posts
  más compartidos y top referidores con tokens ganados).
- `GET /admin/referrals` → Paginado `{ referralId, referrer, referred,
  status, conversion_type, tokens }` con filtros `status`, `country`, `risk` y
  export CSV.
- `GET /admin/economy` → Returns current token packs, gift catalog, and price
  ranges.
- `PUT /admin/economy/packs/:id` → `{ name, tokens, price_cents }` updates pack
  metadata (idempotent).
- `PUT /admin/economy/gifts/:id` → `{ name, tokens, anim_key, is_active }`.
- `GET /admin/chargebacks` → `{ alerts: [{ user, tokens, incidents, last_incident_at, risk }] }`.
- `PATCH /admin/users/:id/purchases` → `{ suspended: boolean }` activa o suspende
  compras de tokens para un usuario.
- `GET /admin/payouts` → Lists payout requests grouped by status with audit
  metadata.
- `POST /admin/payouts/:id/approve` → `{ reference, note? }` creates `WalletTx`
  `PAYOUT` entry and marks the request as paid.
- `POST /admin/payouts/:id/reject` → `{ note }` marks request as rejected.
- `GET /admin/forum/categories` → Full category list with moderator handles and
  pinned state.
- `POST /admin/forum/categories` → `{ name, moderator_handle? }` creates a
  category; optional `is_pinned` flag.
- `PATCH /admin/forum/categories/:id` → Toggle `is_pinned` or update moderator
  roster.
- Admin-only endpoints require both a JWT with `scope:"admin"` **and** the
  `x-admin-secret: ${ADMIN_API_SECRET}` header. Access from outside the
  allowlisted CIDR range returns `403`.

## 8. Discovery

- `GET /discover/top?cursor=&limit=&tag=`
- `GET /users/search?q=&cursor=&limit=`

Both endpoints surface public profiles respecting shadowban visibility rules.

## 9. WebSocket Signaling (`wss://signal.tuweb.com`)

### 9.1 Connection Lifecycle

1. Client sends `HELLO { clientVersion, intents: ['MATCH','CHAT','GIFT'] }`.
2. Server replies `WELCOME { serverVersion, heartbeatSec }`.
3. Clients send `PING` within `heartbeatSec`; server replies `PONG`.

Authentication is handled via `Authorization` header or `?token=` query param.

### 9.2 Random 1:1 Flow

- `TICKET_CREATE { mode: 'classic'|'deck', consents: string[] }`
  - Rate limit: 1/s.
  - Deck mode prevents repeat pairs for 24 h via Redis keys.
- Server pairs users with intersecting consents and emits `MATCH_FOUND { roomId,
  peer, iceServers }`.
- `NEXT { roomId }` (≤ 1 per 2 s) or `LEAVE { roomId }` removes participants.
- Shadowbanned users match exclusively with other shadowbanned users.

### 9.3 Chat & Gifts

- `CHAT_SEND { roomId, text, client_msg_id? }`
  - Rate limit: 3 msgs / 5 s; server broadcasts `CHAT_RECV` on success.
- `GIFT_SEND { roomId, giftId, client_msg_id? }`
  - Rate limit: 2 / 3 s.
  - Server validates balance via REST call, debits tokens, then broadcasts
    `GIFT_RECV { roomId, giftId, fromUserId, tokens }`.
  - Idempotency ensures duplicate `client_msg_id` within 60 s are ignored.

Errors are surfaced via `ERROR` frames, for example
`{ "type": "ERROR", "payload": { "code": "INSUFFICIENT_TOKENS", "message": "Top-up to continue" } }`.

### 9.4 Group Rooms (≤ 6)

- `GROUP_CREATE { title?, vip_price_tokens? }` → `GROUP_CREATED { roomId }`
- `GROUP_JOIN { roomId }` → charges VIP ticket before admission when required.
- `GROUP_PARTICIPANTS { roomId, participants: [...] }` is broadcast on join/leave.
- `GROUP_LEAVE { roomId }` acknowledges exit and updates the roster.

### 9.5 Massive Rooms (feature-flag `ROOMS_MASSIVE`)

- `ROOM_JOIN { roomId, cursor? }` → `ROOM_JOINED { roomId, shard, lastMessages,
  presence }`.
- `ROOM_LEAVE { roomId }` → acknowledgement.
- `ROOM_MESSAGE_SEND { roomId, clientMsgId, text?, replyTo?, attachments? }`
  → `ROOM_MESSAGE_ACK { clientMsgId, id }` + broadcast `ROOM_MESSAGE { … }`.
- `ROOM_REACTION { roomId, messageId, emoji }` and
  `ROOM_REACTION_REMOVE { roomId, messageId, emoji }` update aggregated counts.
- `ROOM_POLL_VOTE { roomId, pollId, optionId }` *(flag `ROOMS_POLLS`)*
  broadcasts the refreshed poll state.
- `ROOM_TRANSFER { roomId, toUserId, amountTokens }` *(flag
  `ROOMS_TOKEN_TRANSFER`)* responds with sender balances and emits a toast to the
  receiver.
- `ROOM_GIFT { roomId, giftId, toUserId? }` *(flag `ROOMS_GIFTS`)* triggers
  `ROOM_GIFT_EVENT { ... }` for fan-out animations.
- `ROOM_SLOWMODE { roomId, seconds }` notifies clients when limits change.
- `ROOM_RATE_LIMIT { roomId, retryAfter }` communicates backpressure.
- `ROOM_AUTOMUTE { roomId, userId, reason }` informs muted users without
  exposing state to others.

### 9.6 Heartbeats & Disconnects

Missed heartbeats trigger server-side cleanup, wallet auto-refunds are handled by
business logic (not via signaling).

## 10. Security & Compliance Highlights

- JWT scopes guard guest/user/admin endpoints; `ageConfirmed=true` is required
  before camera access or NSFW interactions.
- Shadowbanned users can browse but only match with other shadowbanned accounts;
  their messages/gifts do not broadcast to non-shadowbanned peers.
- Media URLs are short-lived, signed per user/session, and enforce referer
  checks to avoid hotlinking.
- PSP webhooks are IP and signature restricted; idempotency enforced via
  `provider_ref` or `Idempotency-Key` header.

These contracts align with the Prisma schema and product requirements for the v1
release.
