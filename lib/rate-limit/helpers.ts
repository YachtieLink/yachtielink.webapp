import { checkRateLimit, rateLimitResponse } from './limiter';
import { NextRequest } from 'next/server';

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Pre-configured rate limiters matching yl_security.md specs
// failOpen: false means expensive/sensitive routes block when Redis is unavailable
export const RATE_LIMITS = {
  auth:              { limit: 10,  window: 15 * 60,           scope: 'ip'   as const, failOpen: true  }, // 10/15min/IP
  profileView:       { limit: 100, window: 60,                scope: 'ip'   as const, failOpen: true  }, // 100/min/IP
  profileEdit:       { limit: 30,  window: 60,                scope: 'user' as const, failOpen: true  }, // 30/min/user
  endorsementCreate: { limit: 5,   window: 24 * 60 * 60,      scope: 'user' as const, failOpen: true  }, // 5/24h/user
  endorsementEdit:   { limit: 20,  window: 60 * 60,           scope: 'user' as const, failOpen: true  }, // 20/1h/user
  pdfGenerate:       { limit: 10,  window: 60 * 60,           scope: 'user' as const, failOpen: false }, // 10/1h/user — expensive
  fileUpload:        { limit: 20,  window: 60 * 60,           scope: 'user' as const, failOpen: false }, // 20/1h/user — expensive
  search:            { limit: 60,  window: 60,                scope: 'user' as const, failOpen: true  }, // 60/min/user
  accountFlag:       { limit: 10,  window: 7 * 24 * 60 * 60,  scope: 'user' as const, failOpen: true  }, // 10/7days/user
  aiSummary:         { limit: 10,  window: 60 * 60,           scope: 'user' as const, failOpen: false }, // 10/1h/user — expensive
  cvParse:           { limit: 10,  window: 60 * 60,           scope: 'user' as const, failOpen: true  }, // 10/1h/user — expensive, but Supabase RPC is the real gate
  cvPersonalParse:   { limit: 20,  window: 60 * 60,           scope: 'user' as const, failOpen: true  }, // 20/1h/user — lightweight AI call
  dataExport:        { limit: 5,   window: 60 * 60,           scope: 'user' as const, failOpen: true  }, // 5/1h/user — GDPR, must not block
} as const;

export async function applyRateLimit(
  req: NextRequest,
  category: keyof typeof RATE_LIMITS,
  userId?: string,
): Promise<Response | null> {
  const config = RATE_LIMITS[category];
  const scope = config.scope === 'ip' ? getClientIP(req) : (userId || 'anon');
  const key = `${category}:${scope}`;

  const result = await checkRateLimit(key, config.limit, config.window, { failOpen: config.failOpen });

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt);
  }

  return null; // allowed — proceed
}
