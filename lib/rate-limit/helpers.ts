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
export const RATE_LIMITS = {
  auth:              { limit: 10,  window: 15 * 60,           scope: 'ip'   as const }, // 10/15min/IP
  profileView:       { limit: 100, window: 60,                scope: 'ip'   as const }, // 100/min/IP
  profileEdit:       { limit: 30,  window: 60,                scope: 'user' as const }, // 30/min/user
  endorsementCreate: { limit: 5,   window: 24 * 60 * 60,      scope: 'user' as const }, // 5/24h/user
  endorsementEdit:   { limit: 20,  window: 60 * 60,           scope: 'user' as const }, // 20/1h/user
  pdfGenerate:       { limit: 10,  window: 60 * 60,           scope: 'user' as const }, // 10/1h/user
  fileUpload:        { limit: 20,  window: 60 * 60,           scope: 'user' as const }, // 20/1h/user
  search:            { limit: 60,  window: 60,                scope: 'user' as const }, // 60/min/user
  accountFlag:       { limit: 10,  window: 7 * 24 * 60 * 60,  scope: 'user' as const }, // 10/7days/user
} as const;

export async function applyRateLimit(
  req: NextRequest,
  category: keyof typeof RATE_LIMITS,
  userId?: string,
): Promise<Response | null> {
  const config = RATE_LIMITS[category];
  const scope = config.scope === 'ip' ? getClientIP(req) : (userId || 'anon');
  const key = `${category}:${scope}`;

  const result = await checkRateLimit(key, config.limit, config.window);

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt);
  }

  return null; // allowed — proceed
}
