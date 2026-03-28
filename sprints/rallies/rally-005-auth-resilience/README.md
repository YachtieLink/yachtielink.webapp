# Rally 005 — Auth Resilience Hardening

**Trigger:** Production incident 2026-03-28. Dev server login redirect loop sent 1,500+ auth requests in minutes, exhausting Supabase rate limit and locking all users out of production.
**Scope:** 12 fixes across ~15 files
**Estimated effort:** 1 day sequential, 4 hours with parallel subagents
**Status:** Ready for execution

## Why This Rally Exists

A single stale cookie + unprotected middleware took the entire app offline. The auth layer has no error handling, no backoff, no graceful degradation. Every `getUser()` call is a potential DDoS vector against our own Supabase instance. This rally makes auth failures safe.

---

## Fixes (priority order)

### CRITICAL — Fix before next deploy

#### Fix 1: Middleware try-catch around getUser()
- **Severity:** CRITICAL
- **File:** `middleware.ts` lines 42-46
- **Problem:** `getUser()` has no try-catch. If Supabase is down, rate-limited, or times out, middleware crashes → 500 for ALL users → complete outage.
- **Fix:** Wrap in try-catch. On error, treat user as `null` (unauthenticated). Log the error. Do NOT redirect to login on auth failure — that creates a loop.
- **Test:** Kill Supabase connection → app should still render public pages and show login for protected pages (not 500).

```typescript
// middleware.ts — CURRENT (lines 42-46):
let user: { id: string } | null = null
if (needsAuth) {
  const { data } = await auth.supabase.auth.getUser()
  user = data.user
}

// middleware.ts — FIXED:
let user: { id: string } | null = null
if (needsAuth) {
  try {
    const { data } = await auth.supabase.auth.getUser()
    user = data.user
  } catch (e) {
    // Auth service unavailable or rate-limited — treat as unauthenticated.
    // Do NOT redirect to login here — that would create a loop.
    // Protected routes will still redirect to /welcome via the null user check below.
    console.error('[middleware] getUser() failed:', e instanceof Error ? e.message : e)
    user = null
  }
}
```

---

#### Fix 2: Cookie security — httpOnly + secure
- **Severity:** CRITICAL
- **Files:** `lib/supabase/client.ts`, `lib/supabase/middleware.ts`, `lib/supabase/server.ts`
- **Problem:** Auth cookies default to `httpOnly: false`. Session tokens are readable by JavaScript — any XSS vulnerability = full session hijack. Also missing `secure: true` for production.
- **Fix:** Override cookie options in all three clients.
- **Test:** After login, open browser DevTools → Application → Cookies. Auth cookies should show HttpOnly flag and Secure flag.

**IMPORTANT NOTE:** Setting `httpOnly: true` on the browser client will BREAK `@supabase/ssr`'s ability to read cookies from `document.cookie`. The browser client MUST keep `httpOnly: false` because it reads cookies client-side. Only the middleware and server clients can set `httpOnly: true` on their response cookies.

```typescript
// lib/supabase/middleware.ts — in setAll(), update cookie options:
response.cookies.set(name, value, {
  ...options,
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  // Harden cookie security
  ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
})

// lib/supabase/server.ts — in setAll(), update cookie options:
cookieStore.set(name, value, {
  ...options,
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
})
```

**Note on httpOnly:** The @supabase/ssr library requires `httpOnly: false` for the browser client to function. This is a known limitation. The `secure: true` flag is the important production hardening. HttpOnly would require a server-side-only auth architecture (not compatible with @supabase/ssr's cookie-based approach).

---

#### Fix 3: needsAuth logic — simplify and make explicit
- **Severity:** CRITICAL
- **File:** `middleware.ts` lines 37-40
- **Problem:** The boolean logic uses negated OR which is confusing and makes ALL unlisted routes require auth by default. API routes like `/api/user-photos` get double-called (middleware + handler).
- **Fix:** Invert the logic — only call `getUser()` for routes that explicitly need it.

```typescript
// CURRENT (confusing, double-negation):
const needsAuth = !SKIP_AUTH_PREFIXES.some((p) => pathname.startsWith(p)) ||
  PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
  AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) ||
  pathname === '/'

// FIXED (explicit, clear):
const needsAuth =
  PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
  AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) ||
  pathname === '/'
```

This means:
- `/app/*`, `/onboarding` → auth check (protected)
- `/login`, `/signup`, `/welcome`, `/reset-password` → auth check (redirect logged-in users)
- `/` → auth check (redirect to profile if logged in)
- `/u/*`, `/api/*`, everything else → NO auth check in middleware (API routes check their own auth)

This eliminates ~80 redundant `getUser()` calls per API request.

---

#### Fix 4: Skip middleware auth for API routes entirely
- **Severity:** CRITICAL
- **File:** `middleware.ts` — matcher config (line 106-108)
- **Problem:** API routes already call `getUser()` themselves. Running it again in middleware doubles the Supabase auth load. On a page with 5 API calls, that's 5 extra `getUser()` calls.
- **Fix:** The `needsAuth` fix (Fix 3) handles this — API routes no longer match any prefix that requires auth. But additionally, consider excluding `/api/` from the matcher entirely (API routes don't need cookie refresh from middleware).

```typescript
// CURRENT matcher:
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// OPTION: Also exclude /api/ from middleware entirely:
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Trade-off:** If we exclude `/api/` from the matcher, middleware won't refresh cookies on API calls. But API routes use the server client which reads cookies from the request headers — middleware cookie refresh is only needed for page navigations. API routes get their auth from the same cookies that were refreshed during the page load.

**Recommendation:** Exclude `/api/` from the matcher. API routes don't need middleware.

---

### HIGH — Fix this sprint

#### Fix 5: Layout deduplication — remove getUser() from layouts
- **Severity:** HIGH
- **Files:** `app/(protected)/app/layout.tsx`, `app/(auth)/layout.tsx`
- **Problem:** Both layouts call `getUser()` after middleware already called it. This is 2 extra auth calls per page render. The middleware already gates access — the layout checks are redundant.
- **Fix:** Trust middleware. Remove `getUser()` from layouts. Pass user data via searchParams, headers, or a shared utility that reads the cookie without calling the auth endpoint.

**However:** There's a subtlety. Middleware can't pass data to Server Components directly (no shared context). The layouts call `getUser()` because they need the user ID to query the database. The Supabase server client's `getUser()` reads from cookies (set by middleware) and validates the JWT locally — it does NOT make a network call to Supabase Auth unless the token is expired.

**Revised fix:** Keep `getUser()` in layouts but wrap it in try-catch:

```typescript
// app/(protected)/app/layout.tsx — FIXED:
const supabase = await createClient()
let user: User | null = null
try {
  const { data } = await supabase.auth.getUser()
  user = data.user
} catch {
  // Auth service unavailable — middleware should have caught this
  // but belt-and-suspenders: treat as unauthenticated
}
if (!user) redirect('/welcome')
```

Same pattern for `app/(auth)/layout.tsx`.

---

#### Fix 6: Polling jitter — useNetworkBadge
- **Severity:** HIGH
- **File:** `lib/hooks/useNetworkBadge.ts` line 30
- **Problem:** All users poll at exactly 60-second intervals. At 1000 users, 1000 requests fire simultaneously every 60 seconds. Thundering herd.
- **Fix:** Add random jitter to the interval. Also increase base interval to 5 minutes (300s) — badge count doesn't need to be real-time.

```typescript
// CURRENT:
const interval = setInterval(fetchCount, 60_000)

// FIXED:
// Base interval 5 minutes + random jitter of 0-60 seconds
const jitter = Math.random() * 60_000
const interval = setInterval(fetchCount, 300_000 + jitter)
```

- **Test:** Badge count still updates, but not every 60 seconds. Verify network tab shows ~5 minute intervals with variance.

---

#### Fix 7: Server Component error logging
- **Severity:** HIGH
- **File:** `lib/supabase/server.ts` lines 35-38
- **Problem:** Silent catch swallows all cookie write errors. If something unexpected fails, no one knows.
- **Fix:** Add structured logging.

```typescript
// CURRENT:
} catch {
  // Server Components cannot set cookies — session refresh is
  // handled by middleware.ts so this is safe to ignore.
}

// FIXED:
} catch (error) {
  // Server Components can't set cookies — middleware handles refresh.
  // Log unexpected errors for monitoring.
  if (process.env.NODE_ENV === 'development') {
    console.warn('[supabase/server] Cookie write failed (expected in Server Components):',
      error instanceof Error ? error.message : error)
  }
}
```

---

#### Fix 8: Auth callback cookie persistence
- **Severity:** HIGH
- **File:** `app/auth/callback/route.ts`
- **Problem:** `exchangeCodeForSession()` calls `setAll()` on the server client, which uses `cookieStore.set()`. In a Route Handler this should work (unlike Server Components), but the redirect response may not carry the cookies.
- **Fix:** Verify cookies are actually being set. If not, explicitly copy cookies to the redirect response.

```typescript
// app/auth/callback/route.ts — FIXED:
if (code) {
  const supabase = await createClient()
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const url = new URL('/welcome', origin)
    url.searchParams.set('error', 'auth_error')
    url.searchParams.set('error_description', exchangeError.message)
    return NextResponse.redirect(url)
  }

  const safeNext = next.startsWith('/') ? next : '/app/profile'
  // Next.js Route Handlers CAN set cookies — the redirect response
  // will carry them. No additional action needed IF createClient()
  // uses the cookies() store correctly. But verify in testing.
  return NextResponse.redirect(new URL(safeNext, origin))
}
```

- **Test:** Create a new account → check email → click verification link → should land on `/app/profile` logged in. If it lands on `/welcome`, the callback cookies are broken.

---

### MEDIUM — Fix before launch

#### Fix 9: Dev/prod environment guard
- **Severity:** MEDIUM
- **File:** New file `lib/supabase/env-guard.ts` + update `.env.local` docs
- **Problem:** Dev and prod share the same Supabase instance. Dev server can exhaust production rate limits.
- **Fix:** Add a warning/guard that detects when a dev environment is pointing at production Supabase.

```typescript
// lib/supabase/env-guard.ts — NEW FILE:
/**
 * Warn if dev environment is using production Supabase.
 * This prevents dev servers from exhausting production rate limits.
 * Call once at app startup.
 */
export function checkSupabaseEnvSafety() {
  if (process.env.NODE_ENV !== 'production') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    // Production Supabase URLs don't contain 'localhost' or '127.0.0.1'
    const isLocalSupabase = url.includes('localhost') || url.includes('127.0.0.1')
    if (!isLocalSupabase) {
      console.warn(
        '\n⚠️  WARNING: Dev environment is using a remote Supabase instance.\n' +
        '   This can exhaust production rate limits.\n' +
        '   Consider using a local Supabase instance for development.\n' +
        `   Current URL: ${url}\n`
      )
    }
  }
}
```

Call in `next.config.ts` or `instrumentation.ts`.

---

#### Fix 10: onAuthStateChange listener
- **Severity:** MEDIUM
- **File:** New `components/providers/AuthStateListener.tsx`, wire into root layout
- **Problem:** No browser-side auth state listener. If session expires mid-use, user sees broken UI instead of being redirected to login. Also no cross-tab sync.
- **Fix:** Add a minimal listener in a root layout provider.

```typescript
// components/providers/AuthStateListener.tsx — NEW FILE:
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthStateListener() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          // Session expired or user signed out in another tab
          router.push('/welcome')
        }
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          router.refresh()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return null
}
```

Wire into `app/(protected)/app/layout.tsx` as a client component child.

---

#### Fix 11: www.yachtie.link redirect
- **Severity:** MEDIUM
- **File:** `middleware.ts` or Vercel config
- **Problem:** `www.yachtie.link` is excluded from subdomain detection but not explicitly redirected to `yachtie.link`. Could cause split-brain auth state if both domains are accessible.
- **Fix:** Add explicit redirect in middleware.

```typescript
// middleware.ts — after isSubdomain check, add:
if (host === 'www.yachtie.link') {
  const url = new URL(request.url)
  url.host = 'yachtie.link'
  return NextResponse.redirect(url, 301)
}
```

Alternatively, handle in Vercel project settings (domain redirect). Vercel config is preferred as it's faster (no middleware execution needed).

---

#### Fix 12: Redis failOpen awareness
- **Severity:** MEDIUM
- **File:** `lib/rate-limit/limiter.ts`
- **Problem:** When Redis is down, all `failOpen: true` rate limits become no-ops. Combined with a traffic spike, this means NO rate limiting at all. The `failOpen` approach is correct (don't block users because Redis is down), but we should log/alert when it happens.
- **Fix:** Add monitoring for Redis failures.

```typescript
// lib/rate-limit/limiter.ts — in the catch block (lines 64-67):

// CURRENT:
} catch {
  return { allowed: failOpen, remaining: 0, resetAt }
}

// FIXED:
} catch (e) {
  console.error('[rate-limit] Redis unavailable, failOpen:', failOpen,
    'key:', key, 'error:', e instanceof Error ? e.message : e)
  return { allowed: failOpen, remaining: 0, resetAt }
}
```

---

## Build Order

```
Wave 1 (CRITICAL — no dependencies):
  Fix 1: Middleware try-catch
  Fix 2: Cookie security (secure flag)
  Fix 3: needsAuth logic simplification
  Fix 4: Exclude /api/ from middleware matcher
  — type-check + build after wave

Wave 2 (HIGH — depends on Wave 1 for middleware stability):
  Fix 5: Layout getUser() try-catch
  Fix 6: Polling jitter
  Fix 7: Server Component error logging
  Fix 8: Auth callback verification
  — type-check + build after wave

Wave 3 (MEDIUM — independent):
  Fix 9: Dev/prod env guard
  Fix 10: onAuthStateChange listener
  Fix 11: www redirect
  Fix 12: Redis failOpen logging
  — type-check + build + drift-check after wave

Full review chain: /review → /yachtielink-review → /test-yl
```

---

## Exit Criteria

```
[ ] Middleware does not crash when Supabase is unavailable (try-catch)
[ ] Auth cookies have secure=true in production
[ ] needsAuth logic only matches protected + auth-only + root routes
[ ] /api/* routes excluded from middleware matcher
[ ] Layout getUser() wrapped in try-catch
[ ] useNetworkBadge polls at 5min + jitter, not 60s
[ ] Server Component cookie catch logs in dev mode
[ ] Auth callback sets cookies correctly (test email verification flow)
[ ] Dev environment warning when using remote Supabase
[ ] onAuthStateChange listener in protected layout
[ ] www.yachtie.link redirects to yachtie.link
[ ] Redis failOpen logs errors
[ ] npm run build zero errors
[ ] npm run drift-check PASS (or justified new baseline)
[ ] No regression in login flow
[ ] No regression in signup flow
[ ] No regression in public profile viewing
```

---

## Files Summary

### Modified:
```
middleware.ts                           — try-catch, needsAuth fix, www redirect, matcher update
lib/supabase/middleware.ts              — secure cookie flag
lib/supabase/server.ts                  — secure cookie flag, error logging
lib/hooks/useNetworkBadge.ts            — 5min interval + jitter
app/(protected)/app/layout.tsx          — getUser() try-catch, AuthStateListener
app/(auth)/layout.tsx                   — getUser() try-catch
app/auth/callback/route.ts             — verify cookie persistence
lib/rate-limit/limiter.ts              — Redis error logging
```

### New:
```
lib/supabase/env-guard.ts              — dev/prod Supabase detection warning
components/providers/AuthStateListener.tsx — onAuthStateChange listener
```

### NOT touched:
```
lib/supabase/client.ts                 — httpOnly stays false (required by @supabase/ssr)
lib/supabase/admin.ts                  — service role, no changes needed
app/(auth)/login/page.tsx              — login flow reverted, working correctly
app/(auth)/signup/page.tsx             — no changes needed
All 80+ API routes                     — they handle their own auth, no changes needed
```

---

## Notes

> **The root cause of today's incident was not a code bug — it was an architecture gap.** The auth layer assumed Supabase would always be available and fast. When it wasn't (due to rate limiting from dev server), every safety mechanism failed: middleware crashed, redirects looped, and the entire app went down. This rally adds the missing error boundaries.

> **httpOnly cookies are NOT possible with @supabase/ssr.** The library reads cookies from `document.cookie` on the browser side, which requires `httpOnly: false`. This is a known limitation. The `secure` flag IS possible and should be set. Full httpOnly support would require migrating to a server-side-only auth architecture.

> **The `getUser()` deduplication is the biggest performance win.** Reducing from 3-4 calls per request to 1 (in middleware for pages, in the handler for API routes) cuts Supabase auth load by 60-75%. At scale, this is the difference between hitting rate limits and not.

> **Dev/prod separation is an ops concern, not a code concern.** The env guard is a band-aid. The real fix is using a separate Supabase project for development. Document this in the onboarding guide.
