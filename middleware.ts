import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/app', '/onboarding']

// Routes only for unauthenticated users
const AUTH_ONLY_PREFIXES = ['/welcome', '/login', '/signup', '/reset-password']

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isSubdomain =
    host.endsWith('.yachtie.link') &&
    host !== 'yachtie.link' &&
    host !== 'www.yachtie.link'

  // ── Supabase auth (cookie refresh) — runs for ALL requests ───────────
  // Must run before subdomain rewrite so expired cookies get refreshed
  // and the subdomain page can identify the viewer.
  const { supabase, response } = createMiddlewareClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Subdomain detection ──────────────────────────────────────────────
  // {handle}.yachtie.link → rewrite to /subdomain/{handle}
  if (isSubdomain) {
    const subdomain = host.split('.yachtie.link')[0]
    if (!subdomain) return response // guard against malformed host like ".yachtie.link"
    const url = request.nextUrl.clone()
    url.pathname = `/subdomain/${subdomain}`
    const rewrite = NextResponse.rewrite(url, { request })
    // Carry auth cookie refresh headers through to the rewrite
    response.cookies.getAll().forEach((cookie) => {
      rewrite.cookies.set(cookie.name, cookie.value, cookie)
    })
    return rewrite
  }

  // ── Invite-only gate ─────────────────────────────────────────────────
  if (
    process.env.SIGNUP_MODE === 'invite' &&
    (request.nextUrl.pathname === '/welcome' || request.nextUrl.pathname === '/signup') &&
    !request.nextUrl.searchParams.has('invite')
  ) {
    return NextResponse.redirect(new URL('/invite-only', request.url))
  }

  // ── Route protection ─────────────────────────────────────────────────
  const { pathname, searchParams } = request.nextUrl

  // Redirect authenticated users from root to their profile
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/app/profile', request.url))
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL('/welcome', request.url)
    url.searchParams.set('returnTo', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth-only routes
  if (user && AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const returnTo = searchParams.get('returnTo')
    const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/app/profile'
    return NextResponse.redirect(new URL(safeReturnTo, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
