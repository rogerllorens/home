# Environment Variables

This document consolidates runtime configuration for each service.

## Shared secrets

| Variable | Service(s) | Description |
| --- | --- | --- |
| `INTERNAL_API_SECRET` | API, Signal, SFU | Shared HMAC used for internal auth between services. Rotate at least quarterly. |
| `API_JWT_SECRET` or `JWT_PUBLIC_KEY` | API, Signal | Secret/private key used to verify JWT access tokens. |
| `ADMIN_API_SECRET` | API | Required for administrative endpoints. |
| `SENTRY_DSN` | API, Signal | Server-side DSN for Sentry error + performance telemetry. |
| `SENTRY_ENVIRONMENT` | API, Signal | Overrides environment name reported to Sentry (default `production`). |

## API (NestJS)

```
NODE_ENV=production
PORT=8080
DB_URL=postgres://user:pass@host:5432/app
REDIS_URL=redis://redis:6379/0
ALLOWED_ORIGINS=https://www.tuweb.com
REQUEST_LOG_LEVEL=info
REQUEST_LOG_SAMPLE_RATE=0.1
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
S3_ENDPOINT=...
S3_REGION=...
S3_BUCKET_PRIVATE=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
PRIVATE_URL_EXPIRY_SECONDS=300
PAYMENT_PROVIDER=CCBILL|SEGPAY|EPOCH
PAYMENT_PUBLIC_KEY=...
PAYMENT_SECRET=...
PAYMENT_WEBHOOK_SECRET=...
ADMIN_ALLOWED_IPS=203.0.113.0/24,198.51.100.0/28
ADMIN_TOTP_ISSUER=TKN Social Admin
ADMIN_TOTP_ENFORCE=true
SUPPORT_EMAIL=soporte@tuweb.com
MEDIA_STORAGE_QUOTA_GB=50
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
FEATURE_GUEST=true
FEATURE_GROUPS=true
FEATURE_FORUM=true
FEATURE_PASSES=true
FEATURE_LIVE=false
FEATURE_RECORDING=false
FEATURE_SSO=true
FEATURE_PAYOUTS=true
PAYOUTS_REQUIRE_KYC=false
ROOMS_MASSIVE=false
ROOMS_TOPICS=false
ROOMS_POLLS=false
ROOMS_TOKEN_TRANSFER=false
ROOMS_GIFTS=false
ROOMS_INLINE_TOPUP=false
TURN_URI=turn:turn.tuweb.com:3478?transport=udp
TURN_USER=rtc
TURN_PASS=...
SFU_PROVIDER=mediasoup
SFU_ANNOUNCED_IP=<public-ip>
SFU_UDP_RANGE_START=40000
SFU_UDP_RANGE_END=41000
```

## Signal service

```
PORT=8081
REDIS_URL=redis://redis:6379/0
INTERNAL_API_SECRET=...
API_JWT_SECRET=... (or JWT_PUBLIC_KEY if using asymmetric tokens)
WS_RATE_LIMITS_JSON={"ticket_create":{"burst":1,"period":1},"next":{"burst":1,"period":2}}
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

## SFU (mediasoup node)

```
ANNOUNCED_IP=<public-ip>
UDP_START=40000
UDP_END=41000
INTERNAL_API_SECRET=...
REDIS_URL=redis://redis:6379/0
```

## Coturn

Configuration is file-based (`turnserver.conf`) with credentials defined as `user=rtc:<password>`.

## Caddy

```
DOMAIN_ROOT=tuweb.com
API_HOST=api.tuweb.com
SIGNAL_HOST=signal.tuweb.com
```

## Frontend (Cloudflare Pages)

```
NEXT_PUBLIC_API_URL=https://api.tuweb.com
NEXT_PUBLIC_SIGNAL_URL=wss://signal.tuweb.com
NEXT_PUBLIC_FEATURE_GROUP=true
NEXT_PUBLIC_ENABLE_MOCKS=false
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_RUNTIME_ENV=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.01
NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1
```

## Staging helpers

```
STAGING_DB_URL=postgres://app:password@staging-postgres:5432/app
STAGING_DB_PASSWORD=app
SMOKE_API_URL=https://stg.api.tuweb.com
SMOKE_SIGNAL_URL=https://stg.signal.tuweb.com
SMOKE_TURN_HOST=stg.turn.tuweb.com
```
