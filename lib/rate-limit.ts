type RateLimitResult = { allowed: true; remaining: number; resetAt: number } | { allowed: false; remaining: 0; resetAt: number; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function nowMs() { return Date.now(); }
export function hasDistributedRateLimitEnv() { return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN); }
export function memoryRateLimitAllowed() { return process.env.NODE_ENV !== "production" || process.env.ALLOW_IN_MEMORY_RATE_LIMIT === "true"; }

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function redisRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redisKey = `rl:${key}`;
  const resetAt = nowMs() + windowSeconds * 1000;
  const base = url.replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${token}` };
  const encoded = encodeURIComponent(redisKey);
  const incr = await fetch(`${base}/incr/${encoded}`, { headers, cache: "no-store" });
  if (!incr.ok) return null;
  const count = Number(((await incr.json()) as { result?: number }).result ?? 1);
  if (count === 1) await fetch(`${base}/expire/${encoded}/${windowSeconds}`, { headers, cache: "no-store" }).catch(() => null);
  if (count > limit) return { allowed: false, remaining: 0, resetAt, retryAfterSeconds: windowSeconds };
  return { allowed: true, remaining: Math.max(limit - count, 0), resetAt };
}

function memoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const resetAt = nowMs() + windowSeconds * 1000;
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= nowMs()) {
    memoryBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt };
  }
  if (bucket.count >= limit) return { allowed: false, remaining: 0, resetAt: bucket.resetAt, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - nowMs()) / 1000)) };
  bucket.count += 1;
  return { allowed: true, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt };
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const distributed = await redisRateLimit(key, limit, windowSeconds).catch(() => null);
  if (distributed) return distributed;
  if (!memoryRateLimitAllowed()) throw new Error("Distributed rate limiting is required in production. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  return memoryRateLimit(key, limit, windowSeconds);
}

export async function enforceRateLimit(request: Request, scope: string, identifier: string, limit: number, windowSeconds: number) {
  try {
    const result = await rateLimit(`${scope}:${identifier}:${getClientIp(request)}`, limit, windowSeconds);
    if (!result.allowed) return Response.json({ error: "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.", retryAfterSeconds: result.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } });
    return null;
  } catch (error) {
    return Response.json({ error: "rate_limit_not_configured", message: error instanceof Error ? error.message : "Rate limit unavailable." }, { status: 503 });
  }
}
