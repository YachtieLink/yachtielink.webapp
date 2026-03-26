import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/app', '/onboarding']

// Routes only for unauthenticated users
const AUTH_ONLY_PREFIXES = ['/welcome', '/login', '/signup', '/reset-password']

/** Copy auth cookie refresh headers onto a redirect/rewrite response */
function withCookies(target: NextResponse, source: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, cookie)
  })
  return target
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isSubdomain =
    host.endsWith('.yachtie.link') &&
    host !== 'yachtie.link' &&
    host !== 'www.yachtie.link'

  // ── Supabase auth (cookie refresh) — runs for ALL requests ───────────
  // Must run before subdomain rewrite so expired cookies get refreshed
  // and the subdomain page can identify the viewer.
  // NOTE: `auth` uses a getter — always reads the latest response after
  // Supabase's setAll has fired (see lib/supabase/middleware.ts).
  const auth = createMiddlewareClient(request)
  const {
    data: { user },
  } = await auth.supabase.auth.getUser()

  // ── Subdomain detection ──────────────────────────────────────────────
  // {handle}.yachtie.link → rewrite to /subdomain/{handle}
  if (isSubdomain) {
    const subdomain = host.split('.yachtie.link')[0]
    if (!subdomain) return auth.response // guard against malformed host

    const { pathname } = request.nextUrl

    // Only rewrite the root path to the subdomain profile page.
    // All other paths (e.g. /app/profile, /signup, /u/someone) redirect
    // to the main domain so links from the profile page work correctly.
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = `/subdomain/${subdomain}`
      return withCookies(NextResponse.rewrite(url, { request }), auth.response)
    }

    // Non-root paths on subdomain: redirect to main domain
    const mainUrl = new URL(pathname + request.nextUrl.search, 'https://yachtie.link')
    return withCookies(NextResponse.redirect(mainUrl), auth.response)
  }

  // ── Invite-only gate ─────────────────────────────────────────────────
  if (
    process.env.SIGNUP_MODE === 'invite' &&
    (request.nextUrl.pathname === '/welcome' || request.nextUrl.pathname === '/signup') &&
    !request.nextUrl.searchParams.has('invite')
  ) {
    return withCookies(NextResponse.redirect(new URL('/invite-only', request.url)), auth.response)
  }

  // ── Route protection ─────────────────────────────────────────────────
  const { pathname, searchParams } = request.nextUrl

  // Redirect authenticated users from root to their profile
  if (user && pathname === '/') {
    return withCookies(NextResponse.redirect(new URL('/app/profile', request.url)), auth.response)
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL('/welcome', request.url)
    url.searchParams.set('returnTo', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
    return withCookies(NextResponse.redirect(url), auth.response)
  }

  // Redirect authenticated users away from auth-only routes
  if (user && AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const returnTo = searchParams.get('returnTo')
    const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/app/profile'
    return withCookies(NextResponse.redirect(new URL(safeReturnTo, request.url)), auth.response)
  }

  return auth.response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
