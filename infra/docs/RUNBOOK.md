# Operations Runbook

This runbook summarizes day-2 operations for the platform infra stack.

## Service overview

| Service | Purpose | Health endpoint | Responsible |
| --- | --- | --- | --- |
| Caddy | TLS termination & reverse proxy for API/Signal | `https://api.tuweb.com/health`, `https://signal.tuweb.com/healthz` (proxied) | SRE |
| API (NestJS) | REST backend | `http://localhost:8080/health` | Backend |
| Signal | WebSocket matchmaker | `http://localhost:8081/healthz` | Realtime |
| SFU | mediasoup router for ≤6 groups | `http://localhost:8082/healthz` | Realtime |
| Redis | Queues, rate limits, matchmaking state | `redis-cli PING` | SRE |
| Postgres | Primary relational database | `pg_isready` | DBAs |
| Coturn | TURN relay for WebRTC | `systemctl status coturn` or logs | SRE |

## Daily checks

1. `docker compose ps` – ensure all containers are `Up`.
2. `docker compose logs --tail=100` – inspect for recurring errors.
3. `curl -fsS http://localhost:8080/health` and `http://localhost:8081/healthz` – confirm 200 responses.
4. Monitor Redis memory (`redis-cli info memory`) and Postgres disk usage (`df -h /var/lib/postgresql`).
5. Check SSL expiry via `caddy list-modules` or Cloudflare dashboard.
6. Review Sentry dashboards for new issues (frontend/api/signal) and ensure p95 `/match` latency < 1.5 s.

## Incident response

### API 5xx spike

1. `docker compose logs api -f` – capture errors.
2. Validate Postgres connectivity: `docker compose exec api env | grep DB_URL` then `docker compose exec api npx prisma db push --preview-feature` (avoid in prod unless schema mismatch suspected).
3. If DB healthy, scale resources or roll back latest deployment.

### Signal matchmaking failures

1. Verify Redis available: `docker compose exec redis redis-cli PING`.
2. Tail Signal logs: `docker compose logs signal -f`.
3. Check TURN reachability from client networks (use `trickle-ice` or WebRTC internals).
4. Inspect Sentry issue list filtered by `feature:match` tag.

### TURN unreachable

1. Confirm firewall rules allow UDP 3478 and 40000-41000.
2. Ensure Cloudflare DNS record for `turn.tuweb.com` is **DNS only** (grey cloud).
3. Restart service: `docker restart coturn`.
4. Validate Cloudflare DNS for `turn`/`stg.turn` remain **DNS only**.

### Database issues

1. If self-hosted Postgres, capture backup via `infra/scripts/backup-db.sh`.
2. For Neon, use provider snapshots.
3. To restore locally: `psql $DATABASE_URL < backup.sql` (after decompression).

## Deployment rollback

1. Identify previous image tag (`docker images | grep tuorg/api`).
2. Run `docker compose down`.
3. Edit `docker-compose.yml` to pin `image: tuorg/api:<tag>` as needed.
4. `docker compose up -d` and verify health.

## Restore rehearsal

1. Schedule quarterly dry-run using staging Postgres.
2. Trigger latest backup download: `bash infra/scripts/backup-db.sh`.
3. Restore into staging using `bash infra/scripts/restore-test.sh <backup-file.sql.gz>`.
4. Run smoke tests (see below) against staging endpoints.
5. Document duration + issues in the ops log.

## Smoke tests

Automated script (GitHub Actions or cron) should run:

```
./infra/scripts/smoke-tests.sh
```

Expected checks:

1. `curl https://api.tuweb.com/health` → 200 with `service:api`.
2. `curl https://signal.tuweb.com/healthz` → 200 with `service:signal`.
3. TURN reachability using `trickle-ice --url turn:turn.tuweb.com:3478?transport=udp --user rtc --password $TURN_PASS`.
4. WebSocket roundtrip: `HELLO` → `WELCOME`, `TICKET_CREATE` → `MATCH_FOUND`, `LEAVE` (scripted using Node test client).

## Staging environment

- Deployed on a smaller VPS mirroring production compose stack (`stg.api`, `stg.signal`, `stg.turn`).
- Payments use PSP sandbox keys; wallets reset weekly.
- WebRTC regression tests (mobile data ↔ WiFi, corporate VPN) run here before promoting builds to production.
- Cloudflare Pages preview serves `stg.www.tuweb.com` with feature flags toggled for experiments.

## On-call contact

* Backend: backend@tuweb.com
* Realtime: realtime@tuweb.com
* SRE: sre@tuweb.com
