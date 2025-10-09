# Networking & DNS

## Domains

| Hostname | Purpose | Origin |
| --- | --- | --- |
| `www.tuweb.com` | Public web frontend (Next.js static export) | Cloudflare Pages |
| `api.tuweb.com` | REST/GraphQL API served from VPS via Caddy | VPS (Docker) |
| `signal.tuweb.com` | WebSocket matchmaking/signalling | VPS (Docker) |
| `turn.tuweb.com` | TURN relay for WebRTC | VPS (coturn) |
| `stg.www.tuweb.com` | Staging frontend | Cloudflare Pages |
| `stg.api.tuweb.com` | Staging API | Staging VPS (Docker) |
| `stg.signal.tuweb.com` | Staging signalling | Staging VPS (Docker) |

All DNS records should be managed in Cloudflare with **proxied** status enabled for `www`, `api`, `signal` and their staging equivalents. Set `turn`/`stg.turn` to **DNS only** to avoid breaking UDP.

## Firewall rules

Configure `ufw` (or equivalent) on the VPS:

```
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3478/udp
ufw allow 40000:41000/udp
ufw enable
ufw allow from 203.0.113.0/24 to any port 443 proto tcp comment 'Admin panel allowlist'
ufw deny in on eth0 to any port 443 proto tcp comment 'Block admin from non-allowlisted IPs'
```

If Postgres is self-hosted on the same VPS, keep port 5432 closed publicly. Access via SSH tunnel when needed.

## TLS termination

Caddy handles TLS certificates via Let's Encrypt/ZeroSSL using the ACME email defined by `DOMAIN_ROOT`. Certificates are stored in the `caddy_data` volume.

## WebRTC reachability

* Ensure the VPS has a public IPv4 address and open UDP range 40000-41000.
* TURN clients use credentials configured in `turnserver.conf` and advertised via `TURN_URI`.
* For restrictive networks, enable TLS on TURN (`tls-listening-port=5349`) and open TCP 5349.

## Cloudflare configuration

* Create an A record for `api`, `signal`, and `turn` pointing to the VPS IP, and mirror the same for `stg.*` hostnames on the staging VPS.
* For `www`, connect the Git repository to Cloudflare Pages and link the custom domain.
* Disable Cloudflare proxy on `turn` (grey cloud) to avoid UDP blocking.
* Protect `/admin/*` with Cloudflare Access or rules that match the allowlisted CIDR ranges.

## Monitoring

* Use Cloudflare health checks for `api` and `signal` endpoints.
* Optionally expose Prometheus endpoints on the VPS behind internal network security.
