import Redis from 'ioredis';

// Rate limiting backed by Redis (Redis Labs via Vercel integration).
// Uses REDIS_URL — auto-injected by Vercel when the yachtielink-ratelimit
// database is connected to the project.
//
// Current tier: Redis/30 MB (free, shared infrastructure).
// Revisit at ~5,000 DAU: upgrade to a dedicated tier for guaranteed latency.

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
}

// Singleton client — reused across requests in the same serverless instance.
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!_redis) {
    _redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: false,
    });
  }

  return _redis;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  // Fail open if Redis is not configured (local dev / missing env vars)
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, remaining: limit, resetAt };
  }

  try {
    const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;
    const current = await redis.incr(windowKey);

    // Set expiry on first request in window
    if (current === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  } catch {
    // Redis unavailable — fail open so real features still work
    return { allowed: true, remaining: limit, resetAt };
  }
}

export function rateLimitResponse(resetAt: number) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetAt - Math.floor(Date.now() / 1000)),
        'X-RateLimit-Reset': String(resetAt),
      },
    },
  );
}
