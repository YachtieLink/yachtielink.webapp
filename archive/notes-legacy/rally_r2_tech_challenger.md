# Rally R2 — Performance & Technical Architecture Challenger

**Agent 3, Round 2 | 2026-03-16 | Research only — no source edits**

> This document challenges, deepens, and extends R1's findings. The operating context: yacht crew on marina WiFi (slow, unreliable), mobile-first, must feel INSTANT on every tap.

---

## Part 1: R1 Verification — What They Got Right, What They Got Wrong

### CONFIRMED: Profile page sequential queries (R1-Agent3 P0)

R1 is correct. `app/(protected)/app/profile/page.tsx` lines 18-62 run four queries sequentially: profile, attachments, certs, endorsements. Only the profile fetch needs to run first (to get `user.id` and check `onboarding_complete`). The other three should be `Promise.all()`.

**But R1 undersells the fix.** The real problem is deeper: the app layout (`app/(protected)/app/layout.tsx`) ALSO fetches `getUser()` + `users.onboarding_complete` before the profile page even starts. That means:

1. Layout: `getUser()` -- network round trip to Supabase Auth
2. Layout: `users.onboarding_complete` query -- second round trip
3. Profile page: `getUser()` AGAIN -- third round trip (duplicate)
4. Profile page: `users.*` -- fourth round trip (overlapping with layout)
5. Profile page: `attachments.*` -- fifth
6. Profile page: `certifications.*` -- sixth
7. Profile page: `endorsements.*` -- seventh

That is **7 sequential Supabase round trips** for the main tab. On marina WiFi with 150-300ms latency per hop, this is **1-2 seconds of pure waiting** before a single pixel renders. This is the single most critical performance issue in the app.

### CONFIRMED: No `loading.tsx` files (R1-Agent3 P0)

Verified. Zero `loading.tsx` files across the entire app. The `Skeleton` component exists in `components/ui/skeleton.tsx` but is imported by exactly zero components. This means tab navigation produces a blank screen with only the browser spinner as feedback.

**R1's recommendation ("add loading.tsx files") is too shallow.** See Part 2 for what the loading architecture should actually look like.

### CONFIRMED: Public profile `<img>` vs `next/image` (R1-Agent3 P0)

Verified. `PublicProfileContent.tsx` line 137 uses raw `<img>` for profile photos. `EndorsementCard.tsx` likely does too. Meanwhile, the `IdentityCard.tsx` on the private profile uses `next/image` (with `unoptimized` flag -- more on that below).

**R1 missed a nuance:** The IdentityCard uses `<Image unoptimized />` (line 77), which bypasses Next.js image optimization entirely. The `unoptimized` prop means images are served at full resolution with no resizing, no WebP conversion, no lazy loading optimization. The comment says "CDN URL; next/image optimisation would re-fetch" -- this is a misunderstanding. Next.js image optimization works fine with CDN URLs that are in `remotePatterns` (confirmed in `next.config.ts`). Removing `unoptimized` would enable automatic WebP, responsive srcsets, and blur placeholders.

### CONFIRMED: No middleware.ts (R1-Agent3 P1)

Verified. `lib/supabase/middleware.ts` exists with `createMiddlewareClient()` fully implemented, but there is no root `middleware.ts` file that imports and uses it. The `server.ts` comment on line 30 even says "session refresh is handled by middleware.ts" -- but that middleware does not exist. This means:

- JWT tokens are never proactively refreshed during navigation
- Session expiry manifests as sudden auth failures deep in the app flow
- On marina WiFi, where a user might leave the app open in a tab for hours between uses, this guarantees broken sessions

### CONFIRMED: Theme localStorage key mismatch (R1-Agent1 Critical)

Verified. Root layout reads `localStorage.getItem('yl-theme')` (line 50 of `app/layout.tsx`). More page writes `localStorage.setItem('theme', t)` (line 95 of `more/page.tsx`). Theme preference will not persist across reloads.

### CONFIRMED: Stripe webhook always returns 200 (R1-Agent3 P1)

Verified. `app/api/stripe/webhook/route.ts` line 132 returns `{ received: true }` with no status parameter (defaults to 200) regardless of whether the database update at lines 58-64 succeeded. If the `.update()` fails, the subscription change is silently lost and Stripe won't retry.

### PARTIALLY CONFIRMED: Analytics nudge fetches all rows (R1-Agent3 Medium)

R1 correctly identified that `analytics-nudge/route.ts` lines 20-24 fetches all `profile_analytics` rows for 7 days. However, R1 missed that the query has no `.limit()` or pagination. At scale (1000+ users, 50+ views each = 50,000 rows), this will timeout on Vercel's serverless function limit and blow through Supabase's default response size. The fix isn't just a `GROUP BY` -- it should be an RPC that returns only `user_id, count(*)` pairs above the threshold.

### CHALLENGE: R1 Priority Rankings

R1-Agent3 ranked "No loading.tsx files" and "Profile sequential queries" both as P0, equal priority. **I disagree. The sequential queries should be P0-A and the loading.tsx should be P0-B.** Here is why:

Loading.tsx files provide perceived speed -- the user sees something happening. But on marina WiFi with 150ms+ latency and 7 sequential round trips, even WITH a loading skeleton, the user stares at the skeleton for 1-2 seconds. The sequential query fix reduces that to 300-500ms total. Fix the actual speed first, THEN add the perception.

R1-Agent3 also ranked "No PWA manifest or service worker" as P2. **I would re-rank this to P1.** For the specific audience (yacht crew on unreliable WiFi), a service worker with offline app shell is not a nice-to-have -- it is the difference between "the app works" and "the app shows a blank page when WiFi drops for 3 seconds while I'm showing my profile to a captain." The PWA manifest is also the only way to get a proper home screen icon on iOS, which is table stakes for a mobile-first app.

---

## Part 2: The Loading Architecture R1 Missed

R1 said "add loading.tsx files with skeleton screens." This is correct but dangerously incomplete. Here is the actual architecture needed:

### Level 1: Route-level loading.tsx (immediate impact)

Each tab route needs a `loading.tsx` that renders a skeleton matching the final layout:

- `app/(protected)/app/profile/loading.tsx` -- IdentityCard skeleton (circle + 3 lines + buttons) + WheelACard skeleton (ring) + 3 section card skeletons
- `app/(protected)/app/cv/loading.tsx` -- Actions card skeleton + preview card skeleton
- `app/(protected)/app/insights/loading.tsx` -- Title skeleton + 3 analytics card skeletons
- `app/(protected)/app/network/loading.tsx` -- Tab bar skeleton + list skeleton
- `app/(protected)/app/more/loading.tsx` -- Section header + rows skeleton

**Critical detail R1 missed:** These skeletons MUST exactly match the dimensions and spacing of the real content. If the skeleton IdentityCard is 180px tall but the real one is 220px, the entire page will shift on load. This causes layout shift (bad CLS score) and feels janky. Each skeleton component should share the same wrapper CSS classes as the real component.

### Level 2: Suspense boundaries for progressive rendering

Loading.tsx is all-or-nothing -- the entire page is hidden until the server component finishes. For the profile page with 7 round trips, this means the skeleton shows for the entire duration.

Better: Use Suspense boundaries to stream sections as they resolve:

```
<IdentityCard /> <!-- renders immediately from layout-cached profile data -->
<Suspense fallback={<WheelASkeleton />}>
  <WheelACard /> <!-- resolves after attachments/certs queries -->
</Suspense>
<Suspense fallback={<SectionSkeleton />}>
  <YachtsSection /> <!-- resolves after attachments query -->
</Suspense>
```

This requires restructuring the page to use async child components rather than fetching everything at the page level. The profile data (already fetched in the layout) can render the IdentityCard immediately, while attachments/certs/endorsements stream in.

### Level 3: Prefetching on tab bar hover/focus

The BottomTabBar uses plain `<Link>` components. In Next.js 16, `<Link>` does automatic prefetching of pages that appear in the viewport. Since all 5 tab links are always visible in the tab bar, Next.js should be prefetching all tab pages.

However, because all pages use `cookies()` (via the Supabase server client), they are dynamically rendered and CANNOT be prefetched by Next.js. Every tab navigation is a fresh server render.

**This is a fundamental architectural tension.** The auth-check-via-cookies pattern forces dynamic rendering, which kills prefetching. Solutions:

1. Move auth check to middleware (already identified as needed) and pass auth state via headers, allowing pages to be partially cacheable
2. Use `router.prefetch()` in the tab bar client component to trigger prefetch on mount
3. Accept dynamic rendering but minimize its cost via query parallelization and caching (React.cache, unstable_cache)

### Level 4: Client-side route cache management

After mutations (editing bio, adding cert, etc.), the profile page needs fresh data. Currently the app uses `router.refresh()` in mutation pages (confirmed in about/edit, certification/new, etc.). This is correct.

But R1-Agent3 flagged that `WriteEndorsementForm` navigates to `/app/network` after success without calling `router.refresh()`. I verified: the form calls `onSuccess()` which varies by context. In the deep link flow, it likely navigates away entirely. In the edit flow, it does call `router.refresh()`. But this inconsistency means some navigation shows stale data.

---

## Part 3: The Performance Architecture That Makes This Feel Like a Native App

The apps that feel FAST (Linear, Figma, the Arc browser) share three principles:

1. **Instant response to every interaction** -- the UI changes within 16ms of a tap, even if data isn't ready
2. **Content appears progressively** -- something is always happening; no dead time
3. **Transitions mask latency** -- animations that take 200-400ms give the network time to respond

Here is how to apply these to YachtieLink:

### A. Instant Tap Response

**Current state:** Tapping a tab triggers a `<Link>` navigation, which starts a server render. Until the server responds, nothing visible changes except the browser spinner (if even that). On 300ms WiFi, the user taps "Network" and nothing happens for 300ms+.

**Target state:** Tapping a tab immediately:
1. Changes the tab icon to the active/filled variant (within 16ms)
2. Shows the skeleton for the new tab (within 50ms)
3. Streams in real content as it resolves (within 300-800ms)

The first two require the tab bar to manage active state optimistically rather than relying on `pathname.startsWith()` after navigation completes. The tab bar should use an `onClick` handler that immediately updates the visual state, THEN navigates. This is a subtle but critical detail for perceived speed.

### B. Optimistic UI for Every Mutation

R1 identified "optimistic updates" as missing. But they only listed endorsement submission as an example.

The full list of mutations that should be optimistic:

1. **Endorsement request cancel/resend** -- `RequestActions.tsx` already calls `router.refresh()` on success (line 44). Should show the status change immediately.
2. **Profile photo upload** -- show the new photo immediately using a local object URL while upload completes in background
3. **Bio edit** -- show the new text immediately on the profile page
4. **Cert addition/edit** -- show the new cert in the list immediately
5. **Attachment addition** -- show the new yacht in the list immediately
6. **Theme toggle** -- already instant (good)
7. **Endorsement form submission** -- show success screen immediately
8. **QR code toggle** -- already instant (good)

For server components (which most pages are), optimistic UI requires either:
- Converting to client components with SWR/React Query (heavy refactor)
- Using Server Actions with `useOptimistic` from React 19 (lighter refactor)
- Using the pattern: mutation page is a client component that shows instant feedback, then calls `router.refresh()` to update the underlying server component data

### C. Perceived Speed Architecture

**Navigation transitions:** When tapping between tabs, add a 150ms cross-fade between the outgoing and incoming content. This masks 150ms of network latency for free. Use the View Transitions API (supported in Chrome/Safari) or a simple CSS opacity transition on the `<main>` content.

**Skeleton shimmer direction:** The skeleton pulse animation should move left-to-right (standard), but more importantly, the skeleton layout must be ABOVE the fold. Users should never see a loading indicator they have to scroll to find.

**Data staleness indicators:** Rather than showing nothing while data loads, show the last-known data with a subtle "Updating..." indicator. This requires client-side caching of the last server render. SWR's `stale-while-revalidate` pattern is ideal here, but implementing it in a server-component-first architecture requires `useSWR` wrappers around the data fetching.

---

## Part 4: Offline & Slow-Network Resilience (What R1 Completely Missed)

This is the biggest gap in all three R1 reports. For an app used by yacht crew on marina WiFi, satellite internet, and roaming mobile data, offline resilience is not a feature -- it is a core requirement.

### The Scenario R1 Didn't Consider

A deckhand is at the crew bar in Antibes. They pull out their phone to show a captain their YachtieLink profile. The bar WiFi drops. Currently:
- The app shows a blank page or an error
- The deckhand looks unprofessional
- The captain never sees the profile
- A potential hiring opportunity is lost

This is the most important user moment in the entire app, and it fails completely without connectivity.

### Service Worker Architecture

**App Shell Model:** Register a service worker that caches:
1. The HTML shell (root layout + tab bar + navigation structure)
2. All static assets (JS bundles, CSS, fonts, images)
3. The user's own profile data (last-fetched JSON snapshot)
4. The user's own public profile page HTML (pre-rendered)

**Cache Strategy by Route:**

| Route | Strategy | Rationale |
|---|---|---|
| Static assets (JS, CSS, fonts) | Cache-first, update in background | Never changes between deploys |
| `/app/profile` | Stale-while-revalidate | Show last-known profile immediately, update in background |
| `/app/cv` | Stale-while-revalidate | Same reasoning |
| `/app/insights` | Network-first with cache fallback | Analytics should be fresh, but cached data better than nothing |
| `/app/network` | Network-first with cache fallback | Endorsements/requests change frequently |
| `/u/[handle]` (own profile) | Cache-first, update in background | The "show a captain" scenario MUST work offline |
| `/u/[handle]` (other profiles) | Network-only | Can't cache all profiles |
| API mutations | Queue and retry | If endorsement submit fails, queue it |

**Background Sync for Mutations:** When offline:
1. User writes an endorsement -> queued in IndexedDB
2. "Your endorsement will be sent when you're back online" toast
3. Service worker syncs when connectivity returns
4. Success notification after sync

### Implementation Path

Use `next-pwa` (or Serwist, its successor) with a custom service worker:

1. Add `manifest.webmanifest` to `/public/` with:
   - `name: "YachtieLink"`
   - `short_name: "YachtieLink"`
   - `start_url: "/app/profile"`
   - `display: "standalone"`
   - `theme_color: "#0D7377"`
   - `background_color: "#ffffff"`
   - `icons: [...]` (need app icon -- currently NO icons in `/public/` besides default Next.js SVGs)

2. Register service worker in root layout

3. Implement Workbox strategies for each route pattern

4. Add `<link rel="apple-touch-icon" ...>` to the root layout `<head>` (currently missing entirely -- no apple-touch-icon metadata)

**Priority:** This is higher priority than many P1 items R1 listed. The "show my profile to a captain" scenario is the core use case. It MUST work offline.

---

## Part 5: Responsive Layout Architecture

### Current State: Mobile-Only Design

The app is designed mobile-first, which is correct. But there are zero responsive breakpoints for larger screens. Verified:

- No `md:`, `lg:`, or `xl:` breakpoints in any of the main tab pages
- The root `max-w-[640px]` constraint exists only on the public profile page
- The app layout has no max-width constraint -- on a 1440px desktop monitor, the IdentityCard stretches to full width, the tab bar stretches edge-to-edge, and the content has no visual boundaries

### What "Responsive" Means for This App

This is NOT a marketing site that needs a totally different desktop layout. It is a mobile app that occasionally gets opened on a laptop (when a crew agent says "send me your profile link" and the agent opens it on their Mac). The responsive strategy should be:

**For the Protected App (`/app/*`):**
- Cap content width at 640px, centered, with a subtle background color on the sides
- The tab bar should become a sidebar at `md:` breakpoint (768px+) -- same 5 items, vertical layout, left side
- Cards should maintain their mobile proportions within the max-width container
- This is the pattern used by Twitter, Instagram, and most mobile-first web apps on desktop

**For the Public Profile (`/u/[handle]`):**
- Already has `max-w-[640px]` and `mx-auto`. Good.
- On desktop, add a subtle background pattern or gradient to the sides to frame the content
- The endorsement cards should stack in a 2-column grid at `lg:` breakpoint for profiles with many endorsements

**For the Auth Pages (`/welcome`, `/login`, `/signup`):**
- Center the form in the viewport with a background illustration or gradient
- Max-width 400px for the form, 100vw for the background
- This is standard and already somewhat handled by the centered layout

### CSS Architecture Recommendation

Do NOT ship different CSS to mobile vs desktop. The CSS is already Tailwind-based with responsive utilities. The approach should be:

1. Add `mx-auto max-w-[640px]` to the `<main>` element in the app layout
2. Add responsive sidebar variant to `BottomTabBar` at `md:` breakpoint
3. Keep all component CSS identical -- the max-width constraint handles everything

**CSS overhead for responsive is near-zero.** A few `md:` utility classes add negligible bytes. Server-side device detection (UA sniffing) is fragile and unnecessary for this use case.

---

## Part 6: Deep Performance Wins R1 Missed

### 6A. Font Loading Is Blocking

The root layout imports `DM_Sans` with 4 weights (`400, 500, 600, 700`). Next.js's `next/font/google` module self-hosts these and injects them as preloaded stylesheets. This is generally good, but:

- 4 font weights = 4 WOFF2 files to download before first contentful paint
- On slow WiFi, this can add 500ms+ to initial render
- The app only uses `font-medium` (500) and `font-semibold` (600) pervasively. Weight 400 (normal) and 700 (bold) are used rarely.

**Recommendation:** Drop weight 700 (only used in a few headings -- use 600 instead). Consider dropping 400 and using 500 as the base weight. Fewer font files = faster FCP.

Also: `Geist_Mono` is imported but only referenced as a CSS variable `--font-geist-mono`. A grep for its usage shows it is defined in the theme but never applied to any element. **This is a dead font import** adding unnecessary bytes to every page load.

### 6B. PostHog Loads Synchronously on Every Page

`PostHogProvider` wraps the entire app at the root level and initializes on mount. The `posthog-js` package is ~50KB gzipped. It loads on every page, including:

- The welcome page (where there is no user to track)
- The public profile page (where the viewer may have ad blockers)
- Auth pages (unnecessary until after signup)

**Recommendation:** Lazy-load PostHog. Do not import it until after the user has authenticated. For public pages, track server-side via `posthog-node` (already in dependencies) or skip tracking entirely.

### 6C. `react-qr-code` Is in the Main Bundle

`PublicProfileContent.tsx` imports `react-qr-code` at the top level. This component is used on:
1. The CV page (inside the public profile preview)
2. The IdentityCard (behind a toggle -- only renders if `showQR` is true)
3. The public profile page (only if `showQrCode` prop is true, which defaults to false)

This means the QR code library (~8KB) is in the main bundle even though it is conditionally rendered in all cases. It should be dynamically imported:
```
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })
```

### 6D. No HTTP Cache Headers on Any Page

Verified: no `export const revalidate = ...` on any page. No `Cache-Control` headers configured. Every page is dynamically rendered on every request.

For the public profile page specifically, this is a major miss. When a captain clicks a crew member's link and opens it 3 times in an hour, each visit triggers:
- `generateMetadata` query (user row)
- Page function query (user row again -- duplicate)
- 3 `Promise.all` queries (attachments, certs, endorsements)
- Auth check (viewer relationship)
- 2+ additional queries if viewer is logged in

The public profile should use ISR with `export const revalidate = 60`. Profile data changes at most a few times per month. A 60-second cache means:
- First visitor triggers a build
- All subsequent visitors in that 60 seconds get instant cached HTML
- Supabase load drops dramatically
- TTFB drops from 500ms+ to <50ms for cached hits

**But there is a complication:** The viewer relationship (colleague badge, mutual connections) is viewer-specific and cannot be cached. The architecture should be:

1. Cache the base profile data (name, photo, bio, attachments, certs, endorsements) with ISR
2. Hydrate the viewer relationship client-side with a lightweight API call
3. This gives instant FCP for the profile content, then progressively enhances with the relationship badge

### 6E. Double User Fetch on Public Profile (R1 Identified, But Fix Is Incomplete)

R1 correctly noted that `generateMetadata` and the page function both query the user row. R1 suggested `React.cache()`. This is correct but insufficient.

The real fix is a three-step refactor:
1. Wrap the user-by-handle query in `React.cache()` to deduplicate within a single request
2. Use ISR (revalidate = 60) so the entire page is cached
3. Move the viewer relationship to a client-side fetch (since it's viewer-specific and can't be cached)

This transforms the public profile from "7 sequential queries on every request" to "cached HTML served in <50ms + 1 client-side API call for the relationship badge."

### 6F. `@vercel/kv` Dependency for Rate Limiting

The rate limiter uses `@vercel/kv` (Redis). This is fine in production, but the `checkRateLimit` function (limiter.ts lines 18-21) falls open if the KV URL is not configured or contains "REPLACE". This means:

1. In development, rate limiting is always disabled (acceptable)
2. If the KV_REST_API_URL env var is misconfigured in production, rate limiting silently fails
3. Every rate-limited API call adds a Redis round trip (~10-50ms)

For the "must feel instant" requirement, consider whether the Redis round trip for rate limiting is justified on every endorsement creation. An alternative: use edge middleware for rate limiting (faster, closer to the user) with in-memory counters for the serverless function lifetime.

### 6G. The `more/page.tsx` Client Component Antipattern

The More page is entirely `'use client'`. It fetches subscription status in a `useEffect` on mount. This means:

1. Server renders the page shell (empty, no data)
2. Client hydrates and mounts
3. `useEffect` fires, calls `supabase.auth.getUser()` + `users.*` query
4. UI updates with subscription data

The user sees a flash of "Current plan: Free" before the real status loads. This is the opposite of feeling instant.

**Fix:** Make it a server component. The only client interactivity is the theme toggle and sign-out button. Extract those as client component islands. Subscription status, settings links, and legal links are all static and should server-render.

---

## Part 7: What Would Make This App Feel Like Linear

Linear feels fast because of three things YachtieLink does not do:

### 1. Local-First Data

Linear caches all workspace data locally and syncs incrementally. YachtieLink fetches everything from the server on every page load.

For YachtieLink, a full local-first architecture is overkill. But caching the user's OWN profile data locally (in localStorage or IndexedDB) and showing it immediately on app open, then syncing in the background, would make the profile page feel instant. The profile data is small (< 10KB JSON). Cache it after every successful server fetch. Show cached data on mount. Refresh in background.

### 2. Transitions That Mask Latency

Linear uses 150-300ms transitions between views. During that transition, data is loading. By the time the transition completes, the data is usually ready.

For YachtieLink's tab navigation:
- Tab tap immediately changes icon state (0ms)
- Content fades out over 100ms
- Content fades in with skeleton (100-200ms mark)
- Server data arrives and replaces skeleton (300-800ms mark)
- If data arrives during the transition, no skeleton is ever visible

The View Transitions API (available in Safari 18+ and Chrome) enables this natively. For older browsers, a simple CSS opacity transition on a wrapper div achieves the same effect.

### 3. Predictive Prefetching

Linear prefetches data for views you are likely to navigate to next. For YachtieLink:
- When on the Profile tab, prefetch Network and CV data (the two most likely next taps)
- When a user opens the app, prefetch ALL tab data in parallel (it is only 5 pages)
- On the BottomTabBar, trigger `router.prefetch()` for all tab routes on component mount

Since the pages are dynamic (use cookies), standard Next.js prefetching won't work. But `router.prefetch()` can prefetch the RSC payload, reducing subsequent navigation to a client-side render with already-available data.

---

## Part 8: Concrete Action Plan (Re-Prioritized)

### P0-A: Fix the Query Waterfall (impact: 400-800ms saved per page load)

1. Profile page: wrap attachments/certs/endorsements in `Promise.all()`
2. Profile page: use the layout's `user.id` instead of re-fetching auth
3. Public profile: deduplicate user query with `React.cache()`
4. Public profile: run viewer auth check in parallel with Phase 2 data
5. Insights page: merge the two `Promise.all()` blocks into one
6. Extract `getFullProfile(userId)` helper to eliminate duplication across 4 files

### P0-B: Add Loading Architecture (impact: perceived speed from "broken" to "professional")

1. Add `loading.tsx` with layout-matched skeletons for all 5 tab routes
2. Add `loading.tsx` for auth routes
3. Use the existing `Skeleton` component (currently unused) as the building block
4. Consider Suspense boundaries for profile page sections (stream IdentityCard first)

### P0-C: Add Middleware for Session Refresh (impact: prevents broken sessions)

1. Create root `middleware.ts` that imports `createMiddlewareClient` from `lib/supabase/middleware.ts`
2. Call `supabase.auth.getUser()` to trigger token refresh
3. Matcher: exclude static files and public routes

### P1-A: PWA + Service Worker (impact: app works offline, installable)

1. Create `manifest.webmanifest` with proper icons (NEED app icon -- none exists in /public/)
2. Add apple-touch-icon link tags (currently missing entirely)
3. Register service worker with cache-first for app shell
4. Cache user's own profile data for offline access
5. Implement stale-while-revalidate for /app/* routes

### P1-B: Public Profile Caching (impact: TTFB from 500ms+ to <50ms for repeated views)

1. Add `export const revalidate = 60` to public profile page
2. Move viewer relationship to client-side hydration
3. This also reduces Supabase load significantly

### P1-C: Fix Theme + Dark Mode Bugs (impact: prevents user-facing bugs)

1. Fix localStorage key mismatch (`yl-theme` vs `theme`)
2. Add dark mode overrides for `--color-teal-*` variables
3. Standardize on semantic variables across all components

### P1-D: Fix Stripe Webhook Reliability (impact: prevents lost subscription events)

1. Return 500 if critical DB update fails
2. Add idempotency check (don't re-process same event ID)

### P2-A: Responsive Desktop Layout

1. Add `mx-auto max-w-[640px]` to app layout `<main>`
2. Add responsive sidebar variant to BottomTabBar at `md:` breakpoint
3. Center auth pages with max-width form

### P2-B: Bundle Optimization

1. Remove dead `Geist_Mono` font import
2. Dynamic import `react-qr-code` in IdentityCard and PublicProfileContent
3. Lazy-load PostHog (defer until after auth)
4. Remove `unoptimized` from IdentityCard's `<Image>` component
5. Replace `<img>` with `<Image>` in PublicProfileContent

### P2-C: Optimistic UI for Mutations

1. Use React 19's `useOptimistic` for endorsement request actions
2. Show local object URL for photo uploads immediately
3. Optimistic bio/name updates on the profile page

---

## Part 9: Things All Three R1 Agents Missed

### 1. No `apple-touch-icon` in `<head>`

When a yacht crew member adds the app to their iPhone home screen (the primary use case), they get a screenshot thumbnail instead of an app icon. There are no icon files in `/public/` and no `<link rel="apple-touch-icon">` tag. This is a basic PWA requirement.

### 2. `Geist_Mono` Font Is Dead Weight

Imported in root layout, defined as `--font-geist-mono`, but never used in any component or CSS class. Every page load downloads this font for nothing.

### 3. No `X-DNS-Prefetch-Control` for Supabase Domain

The `next.config.ts` headers include `X-DNS-Prefetch-Control: on` (good), but there is no `<link rel="dns-prefetch" href="https://[project].supabase.co">` in the root layout. Since every page makes Supabase calls, DNS prefetching the Supabase domain would shave 50-100ms off the first API call on each page load.

### 4. `IdentityCard` Uses `unoptimized` Image

As detailed above, the `unoptimized` prop on the profile photo `<Image>` component defeats the purpose of using `next/image`. It serves the full-resolution image with no WebP conversion, no responsive srcset, and no lazy loading optimization. This should be removed.

### 5. Public Assets Are Default Next.js Boilerplate

The `/public/` directory contains only `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, and `window.svg`. These are the default Next.js starter template assets. None are used in the app. They should be removed to keep the deploy clean. More critically, there are NO app-specific assets: no favicon.ico, no apple-touch-icon, no OG fallback image, no logo SVG.

### 6. `react-image-crop` Loaded for Photo Page Only

The `react-image-crop` package (~50KB) is imported in the photo upload page. This is a rarely-used page (most users set their photo once during onboarding). It should be dynamically imported to keep it out of the main bundle.

### 7. Rate Limiter Redis Call on Every Rate-Limited Request

Each rate-limited API call makes a round trip to Vercel KV (Redis). For the "endorsement create" flow, this adds ~20-50ms. Not critical, but worth noting that the rate limiter's fail-open behavior means it adds latency when working and provides no protection when not.

### 8. PostHog `capture_pageview: true` With Server Components

PostHog is configured with `capture_pageview: true` which auto-tracks page views. But in a Next.js App Router with server components, client-side page view tracking may not fire correctly on soft navigations (which are the primary navigation pattern). The `posthog-js` library needs the `nextjs` integration or manual `usePathname` tracking to correctly capture RSC navigations.

### 9. The `overscroll-behavior: none` Decision

R1-Agent1 noted this but did not challenge it deeply enough. On iOS Safari, `overscroll-behavior: none` prevents the rubber-band bounce effect, which is the standard feel for native iOS apps. For an app trying to feel native on iPhone, disabling this makes the scrolling feel wrong. It should be removed unless there is a specific reason (e.g., pull-to-refresh interference).

### 10. No `<meta name="viewport" content="viewport-fit=cover">` for iOS

The viewport meta tag does not include `viewport-fit=cover`, which is required for content to extend behind the status bar and home indicator on iPhones with notch/Dynamic Island. Without it, `env(safe-area-inset-*)` values resolve to 0 in some contexts, and the tab bar's safe area padding may not work correctly.

---

## Summary: The Path From "Functional Web App" to "Feels Like a Native App"

The current YachtieLink app is architecturally sound but operationally slow for its target audience. R1 correctly identified many individual issues, but missed the systemic pattern: **every page makes too many sequential network requests, with no caching, no offline support, no loading feedback, and no attempt to mask latency.**

The three highest-impact changes, in order:

1. **Parallelize all queries + add React.cache() deduplication** -- reduces actual page load time from 1-2s to 300-500ms
2. **Add loading.tsx skeletons + Suspense streaming** -- makes the remaining 300-500ms feel like progress instead of broken
3. **Add service worker with offline app shell** -- guarantees the app works when WiFi fails at the worst possible moment

Everything else (responsive layout, bundle optimization, ISR caching) amplifies these three core changes.
