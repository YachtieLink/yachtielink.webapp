import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/app', '/onboarding']

// Routes only for unauthenticated users (redirect logged-in users away)
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

  // ── www redirect ─────────────────────────────────────────────────────
  // Canonical domain is yachtie.link — redirect www to prevent split-brain auth
  if (host === 'www.yachtie.link') {
    const url = new URL(request.url)
    url.host = 'yachtie.link'
    return NextResponse.redirect(url, 301)
  }

  const { pathname } = request.nextUrl

  // ── Supabase auth (cookie refresh) ─────────────────────────────────
  // Only call getUser() for routes that explicitly need auth state:
  // - Protected routes (/app/*, /onboarding) → gate access
  // - Auth-only routes (/login, /signup, etc.) → redirect logged-in users
  // - Root (/) → redirect to profile if logged in
  // Everything else (public profiles, API routes, static) skips auth
  // to avoid unnecessary token refresh and rate-limit loops.
  const auth = createMiddlewareClient(request)
  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname === '/'

  let user: { id: string } | null = null
  if (needsAuth) {
    try {
      const { data } = await auth.supabase.auth.getUser()
      user = data.user
    } catch (e) {
      // Auth service unavailable or rate-limited.
      // Treat as unauthenticated — protected routes redirect to /welcome,
      // auth-only routes render normally. No crash, no loop.
      console.error('[middleware] getUser() failed:', e instanceof Error ? e.message : e)
      user = null
    }
  }

  // ── Subdomain detection ──────────────────────────────────────────────
  // {handle}.yachtie.link → rewrite to /subdomain/{handle}
  if (isSubdomain) {
    const subdomain = host.split('.yachtie.link')[0]
    if (!subdomain) return auth.response // guard against malformed host

    // Root path → rewrite to subdomain profile page
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = `/subdomain/${subdomain}`
      return withCookies(NextResponse.rewrite(url, { request }), auth.response)
    }

    // Profile sub-pages on subdomain → redirect to /u/{handle}/{subpage}
    const subPageMatch = pathname.match(/^\/(endorsements|experience|certifications|gallery|cv)(\/.*)?$/)
    if (subPageMatch) {
      const mainUrl = new URL(`/u/${subdomain}${pathname}${request.nextUrl.search}`, 'https://yachtie.link')
      return withCookies(NextResponse.redirect(mainUrl), auth.response)
    }

    // Other paths on subdomain: redirect to main domain
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
  const { searchParams } = request.nextUrl

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
    /*
     * Match all paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico, sitemap.xml, robots.txt (SEO/browser)
     * - Image files (svg, png, jpg, jpeg, gif, webp)
     * - /api/* routes (they handle their own auth — no middleware needed)
     *
     * Excluding /api/ from middleware prevents redundant getUser() calls
     * (API routes already call getUser() themselves) and reduces Supabase
     * auth load by ~60-75% on pages with multiple API fetches.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
