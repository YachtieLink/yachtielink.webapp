import { kv } from '@vercel/kv';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  // Fail open if KV is not configured (local dev / missing env vars)
  const kvUrl = process.env.KV_REST_API_URL ?? '';
  if (!kvUrl || kvUrl.includes('REPLACE') || kvUrl.includes('replace')) {
    return { allowed: true, remaining: limit, resetAt };
  }

  try {
    const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;
    const current = await kv.incr(windowKey);

    // Set expiry on first request in window
    if (current === 1) {
      await kv.expire(windowKey, windowSeconds);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  } catch {
    // KV unavailable — fail open so real features still work
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
