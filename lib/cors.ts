import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://yachtie.link',
  'https://www.yachtie.link',
  'https://*.yachtie.link', // custom subdomains
];

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace('*', '[a-z0-9-]+') + '$');
      return pattern.test(origin);
    }
    return allowed === origin;
  });

  if (!isAllowed) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCorsPreFlight(req: NextRequest): NextResponse | null {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}
