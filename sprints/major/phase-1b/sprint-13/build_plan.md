# Sprint 13 — Launch Polish + Marketing: Build Plan

## Context

Sprint 13 is the final sprint before soft launch. After this sprint, the product is live for 20-50 invited crew. The work splits into three categories:

1. **Code work** — marketing landing page, SEO, cookie banner, roadmap page
2. **Ops work** — production env vars, domain, KV, cron verification (founder tasks, not code)
3. **QA work** — manual testing across browsers, flows, and the full yacht graph (human task)

### What Already Exists (No Build Needed)

These are already production-ready and just need env vars configured:

| Feature | Status | Notes |
|---------|--------|-------|
| PostHog analytics | Configured | Client + server tracking, `PostHogProvider.tsx`, manual events only |
| Sentry monitoring | Configured | Client/server/edge configs, error boundaries, `tracesSampleRate: 0.1` |
| Error boundaries | Built | Global `app/error.tsx` + protected area boundary, Sentry capture |
| Rate limiting | Built | Redis backend, 15+ rate limit configs in `lib/rate-limit/helpers.ts` |
| GDPR data export | Built | `GET /api/account/export` — full JSON export of all user data |
| Account deletion | Built | `POST /api/account/delete` — Stripe cancel, storage cleanup, anonymization |
| OG image generation | Built | `GET /api/og` — dynamic 1200x630 images for `/u/[handle]` profiles |
| QR codes | Built | `PublicQRCode.tsx` — branded, links to `yachtie.link/u/{handle}` |
| Invite-only mode | Built | `SIGNUP_MODE=invite` in proxy middleware, `/invite-only` page |
| Cron jobs | Built | Cert expiry (daily 9am UTC) + analytics nudge (Mondays 10am UTC), `CRON_SECRET` secured |
| Cookie banner | Built | Basic essential-only banner, `localStorage` consent tracking |
| Security headers | Built | HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy in `next.config.ts` |
| Legal pages | Built | `/terms` and `/privacy` — comprehensive, GDPR-compliant. TODO: business address |
| Stripe integration | Built | Checkout, webhook, portal. Production-ready — just needs production keys |
| Custom subdomains | Built | Proxy middleware routes `{handle}.yachtie.link` → `/u/{handle}` |

### What Needs Building

| Feature | Type | Effort |
|---------|------|--------|
| Marketing landing page | Code | 2-3 days |
| Feature roadmap page (static) | Code | 0.5 day |
| SEO: sitemap, robots.txt, meta | Code | 0.5 day |
| Cookie banner update | Code | 0.5 day |
| Production env config | Ops (founder) | 0.5 day |
| Domain + SSL | Ops (founder) | 0.5 day |
| Manual QA pass | Human | 1-2 days |
| Legal sign-off | Human (founder) | External |

**Total code work: ~4 days. Total sprint including ops + QA: 5-7 days.**

### Dependencies

- Sprint 10.1, Sprint 11, Sprint 12 all complete
- Domain purchased and DNS accessible (yachtie.link)
- Stripe account switched to production mode (founder task)
- PostHog project created with API key (founder task)
- Sentry project created with DSN (founder task)
- Legal review completed by founder (terms + privacy business address)

---

## Part 1: Marketing Landing Page

**Current state:** Root route `/` (`app/page.tsx`) redirects authenticated users to `/app/profile` and unauthenticated users to `/welcome`. No marketing page exists.

**Target:** A public marketing page at `/` that converts visitors to signups. The `/welcome` page remains the auth entry point — the landing page links to it.

### 1.1 — Route Setup

**File to create:** `app/(public)/marketing/page.tsx` (or modify `app/page.tsx`)

The root route needs to serve the marketing page for unauthenticated users while still redirecting authenticated users to `/app/profile`. Two options:

**Option A:** Keep `app/page.tsx` as-is (redirect logic), create the marketing page at a different path and update the redirect target for unauthed users.
**Option B:** Replace `app/page.tsx` with the marketing page, add auth check that redirects to `/app/profile` if logged in.

**Recommended: Option B** — the root URL should be the marketing page. But move the auth check to middleware (proxy.ts), not the page component. This avoids a Supabase round-trip on every unauthenticated visit:

```typescript
// In proxy.ts — add to existing middleware logic:
// If authenticated user visits '/', redirect to '/app/profile'
if (pathname === '/' && session) {
  return NextResponse.redirect(new URL('/app/profile', request.url))
}
// Otherwise, serve the marketing page normally (no auth call needed in page component)
```

The marketing page itself is a pure server component with no auth check — it renders for everyone. Middleware handles the redirect for logged-in users at the edge.

### 1.2 — Page Structure

Mobile-first, single-page scroll. Uses Sprint 11's section colours and design system tokens.

```
┌─────────────────────────────────────────────────┐
│ HEADER                                          │
│ [YachtieLink logo]              [Sign up] [Log in]│
├─────────────────────────────────────────────────┤
│ HERO                                            │
│ "Your career on the water,                      │
│  in one place."                                 │
│                                                 │
│ A portable professional identity built on        │
│ real yacht history and trusted endorsements.     │
│                                                 │
│ [Get Started — It's Free]                       │
│                                                 │
│ [Illustration or sample profile preview]        │
├─────────────────────────────────────────────────┤
│ HOW IT WORKS (3-step)                           │
│                                                 │
│ 1. Build your profile                           │
│    Import your CV or add yachts manually         │
│                                                 │
│ 2. Connect through yachts                        │
│    Attach to yachts you've worked on.           │
│    Discover who else was on board.              │
│                                                 │
│ 3. Earn trusted endorsements                     │
│    Colleagues who shared the yacht can           │
│    endorse your work — real people, real boats.  │
├─────────────────────────────────────────────────┤
│ WHAT MAKES IT DIFFERENT                         │
│                                                 │
│ [Portable identity]  [Yacht graph]              │
│ Your profile goes    See everyone you've worked  │
│ where you go.        with, grouped by yacht.    │
│                                                 │
│ [Trusted endorsements] [Sea time tracking]      │
│ Only real coworkers   Know exactly how long      │
│ can endorse you.      you've been at sea.        │
├─────────────────────────────────────────────────┤
│ SOCIAL PROOF                                    │
│                                                 │
│ [Sample profile card / screenshot]              │
│ "X crew have joined" (live count from DB)       │
│ [Endorsement quote snippet]                     │
├─────────────────────────────────────────────────┤
│ CTA                                             │
│ "Ready to get started?"                         │
│ [Create Your Profile — Free]                    │
├─────────────────────────────────────────────────┤
│ FOOTER                                          │
│ Terms · Privacy · Roadmap                        │
│ © 2026 YachtieLink                              │
└─────────────────────────────────────────────────┘
```

### 1.3 — Design Notes

- **Typography:** DM Serif Display for hero headline, DM Sans for body (matches app)
- **Section colours:** Alternate between white and tinted backgrounds using Sprint 11's section colour system (teal hero, white how-it-works, light sand value props, etc.)
- **Animations:** Use `scrollReveal` and `fadeUp` from `lib/motion.ts` for section entrances
- **Mobile:** Sticky CTA button at bottom on mobile (fixed position, above safe area)
- **Salty:** Subtle cameo in the illustration or as a small accent — not the focus
- **Images:** Need at least one hero visual. Use Next.js `Image` component with `priority` for hero image (LCP), `sizes` prop for responsive, blur placeholder for loading. Store in `public/images/marketing/`. Alt text on every image.
- **Social proof:** Do NOT show real endorsement quotes on the marketing page — this creates legal risk (FTC endorsement rules, privacy exposure, and conflicts with D-003: never monetize trust). Instead:
  - Show crew count ONLY if > 100. At 20-50 users, "23 crew have joined" looks weak. Use a threshold: `{count > 100 && <p>{count} crew have joined...</p>}`
  - Before count hits threshold, use descriptive copy instead: "Join crew from yachts worldwide" (no number)
  - Crew count query: use ISR (revalidate every 5 minutes) or cache in `React.cache()` — do NOT query on every page load. The sitemap already needs admin client access (see 4.1)
- **Sticky CTA on mobile:** Must stack ABOVE cookie banner. Use `z-50` for CTA, `z-40` for cookie banner. Add `bottom-[calc(env(safe-area-inset-bottom)+4rem)]` when cookie banner is visible, `bottom-[env(safe-area-inset-bottom)]` when dismissed.

### 1.4 — Public Layout / Navigation

**File to create (or extend):** `app/(public)/layout.tsx`

Public pages (marketing, terms, privacy, invite-only) need a shared header and footer:

**Header:**
- YachtieLink logo (left) → links to `/`
- "Log in" (right, ghost button) → `/welcome`
- "Sign up" (right, primary button) → `/welcome`

**Footer:**
- Links: Terms · Privacy · Roadmap (if built)
- © 2026 YachtieLink
- Social links (if any exist)

Currently public pages have no shared navigation. Adding a lightweight public layout gives the pre-auth experience a consistent frame.

**Conflict to resolve:** Privacy and terms pages currently have their own `BackButton` pointing to `/welcome`. Adding a public layout with header/footer means these pages will have BOTH a header nav AND a BackButton — confusing. Resolution:
- Remove `BackButton` from privacy/terms pages when public layout is added
- Public header already has logo → `/` and "Log in" → `/welcome`, so BackButton is redundant
- OR: Skip the public layout for now, add header/footer only to the marketing page. Terms/privacy keep their BackButton. Simpler, faster.

---

## Part 2: Production Environment (Ops Checklist)

These are ops tasks for the founder, not code changes. Listed here as a reference.

### 2.1 — Vercel Environment Variables

Set in Vercel dashboard for the production environment:

| Variable | Source | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard | Production project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard | Production service role key |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog dashboard | Production project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog dashboard | Likely `https://us.i.posthog.com` |
| `SENTRY_DSN` | Sentry dashboard | Production DSN |
| `SENTRY_AUTH_TOKEN` | Sentry dashboard | For source map uploads |
| `STRIPE_SECRET_KEY` | Stripe dashboard | **Production mode** key |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard | Webhook signing secret (production) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe dashboard | Production price ID |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Stripe dashboard | Production price ID |
| `STRIPE_PRO_FOUNDING_PRICE_ID` | Stripe dashboard | Production price ID |
| `STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID` | Stripe dashboard | Production price ID |
| `NEXT_PUBLIC_APP_URL` | — | `https://yachtie.link` |
| `RESEND_API_KEY` | Resend dashboard | Email sending |
| `OPENAI_API_KEY` | OpenAI dashboard | CV parsing, content moderation |
| `REDIS_URL` | Redis provider | Rate limiting backend |
| `CRON_SECRET` | Generate | Random string for cron job auth |
| `SIGNUP_MODE` | — | Start with `invite`, switch to `public` later |

### 2.2 — Domain Configuration

- Custom domain: `yachtie.link` → Vercel project
- SSL: automatic via Vercel
- Subdomain wildcard: `*.yachtie.link` → Vercel (for custom subdomains)
- Verify proxy middleware handles subdomain routing in production

### 2.3 — Stripe Production Mode

- Switch Stripe dashboard from test mode to live mode
- Create production webhook endpoint pointing to `https://yachtie.link/api/stripe/webhook`
- Create production price IDs for all plan tiers
- Verify founding member pricing is configured (100-slot cap)

### 2.4 — Cron Job Verification

After deploying to production:
- Verify `vercel.json` cron schedules are active
- Trigger cert-expiry cron manually and verify email sends
- Trigger analytics-nudge cron manually and verify email sends
- Confirm `CRON_SECRET` is set and requests without it are rejected

---

### 1.5 — PostHog on Landing Page

**Issue:** PostHog provider (`PostHogProvider.tsx`) only initializes when `pathname.startsWith('/app')`. Landing page analytics won't fire.

**Fix:** Either:
- **Option A:** Expand PostHog provider to initialize on all routes (simple — change the pathname check)
- **Option B:** Add manual PostHog capture calls in the marketing page component only

**Recommended: Option A** — expanding the provider is simpler and captures all public page views. The provider already uses `capture_pageview: false` (manual only), so it won't add unwanted noise. Just widen the pathname filter.

---

## Part 3: Cookie Banner Update

**File to modify:** `components/CookieBanner.tsx`

Current banner is basic "essential cookies only." For launch, it needs to accurately reflect what tracking exists:

- **PostHog:** Uses `localStorage` (not cookies) for analytics persistence. Fires on `/app/*` routes only.
- **Sentry:** Error tracking with IP-based data. No cookies, but collects device/browser info.
- **Supabase Auth:** Session cookies (essential, not optional).

**Update:**
- Banner text should mention: "We use cookies for authentication and localStorage for anonymous analytics (PostHog) to improve the product. Error reports (Sentry) help us fix bugs."
- Add "Learn more" link → `/privacy`
- Keep the single "Got it" dismiss button (essential + analytics bundled — separating consent for localStorage analytics is not required by GDPR since PostHog's SDK can be configured to respect consent)
- Ensure `cookie_consent` localStorage key persists across sessions (already does)

**Privacy policy alignment:** The existing privacy policy already discloses PostHog and Sentry usage. The cookie banner just needs to surface this accurately.

---

## Part 4: SEO & Meta

### 4.1 — Sitemap

**File to create:** `app/sitemap.ts`

Next.js App Router supports dynamic sitemaps via `sitemap.ts`.

**Important:** The sitemap needs to read all user handles. The `createClient()` helper uses the anon key, which may be blocked by RLS on the `users` table. Use the admin client (`lib/supabase/admin.ts`) instead, which uses the service role key:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap() {
  const supabase = createAdminClient()

  // Public profile pages
  const { data: users } = await supabase
    .from('users')
    .select('handle, updated_at')
    .not('handle', 'is', null)

  const profileUrls = (users ?? []).map((user) => ({
    url: `https://yachtie.link/u/${user.handle}`,
    lastModified: user.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: 'https://yachtie.link', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1 },
    { url: 'https://yachtie.link/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: 'https://yachtie.link/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    ...profileUrls,
  ]
}
```

### 4.2 — Robots.txt

**File to create:** `app/robots.ts`

```typescript
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/app/', '/api/', '/welcome', '/invite-only'] },
    ],
    sitemap: 'https://yachtie.link/sitemap.xml',
  }
}
```

### 4.3 — Landing Page Meta Tags

The marketing landing page needs comprehensive meta tags:

```typescript
export const metadata: Metadata = {
  title: 'YachtieLink — Your Career on the Water, in One Place',
  description: 'A portable professional identity for yacht crew. Built on real employment history, trusted endorsements from real coworkers, and the yacht graph that connects the industry.',
  openGraph: {
    title: 'YachtieLink — Your Career on the Water, in One Place',
    description: 'Build your crew profile. Connect through yachts. Earn trusted endorsements.',
    url: 'https://yachtie.link',
    siteName: 'YachtieLink',
    type: 'website',
    // OG image: create a static marketing OG image (1200x630)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YachtieLink',
    description: 'A portable professional identity for yacht crew.',
  },
}
```

---

## Part 5: Feature Roadmap (Static)

### Scope Decision

The original Sprint 11 build plan includes a full roadmap feature: 4 database tables, 5 API routes, 19 components, Pro voting, feature request submissions. That's a full feature sprint.

**For soft launch (20-50 users), a static page is sufficient.** The founding users can give feedback directly. A database-backed roadmap with voting and submissions is appropriate at 500+ users, not 20.

### 5.1 — Static Roadmap Page

**File to create:** `app/(protected)/app/more/roadmap/page.tsx`

A simple, server-rendered page with hardcoded roadmap data:

```typescript
const ROADMAP_ITEMS = [
  { title: 'Crew search for Pro members', status: 'planned', category: 'Search & Discovery' },
  { title: 'Direct messaging', status: 'planned', category: 'Messaging' },
  { title: 'Endorsement signals (agree/disagree)', status: 'planned', category: 'Endorsements' },
  { title: 'Yacht owner & captain profiles', status: 'planned', category: 'Profile' },
  { title: 'Profile analytics dashboard', status: 'shipped', category: 'Analytics' },
  { title: 'PDF resume snapshot', status: 'shipped', category: 'CV & Employment' },
  { title: 'Sea time calculator', status: 'shipped', category: 'Profile' },
  // ... add more as needed
] as const
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ ← Feature Roadmap                               │
│                                                 │
│ See what's coming to YachtieLink.               │
│ Have an idea? Email us at hello@yachtie.link    │
│                                                 │
│ Coming Soon                                     │
│ ┌───────────────────────────────────────────┐   │
│ │ Crew search for Pro members               │   │
│ │ Search & Discovery · Planned              │   │
│ ├───────────────────────────────────────────┤   │
│ │ Direct messaging                          │   │
│ │ Messaging · Planned                       │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Recently Shipped                                │
│ ┌───────────────────────────────────────────┐   │
│ │ Sea time calculator               ✓       │   │
│ │ Profile · Shipped                         │   │
│ ├───────────────────────────────────────────┤   │
│ │ PDF resume snapshot               ✓       │   │
│ │ CV & Employment · Shipped                 │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Status badges: "Planned" (amber), "In Progress" (teal), "Shipped" (green check)
- Category tag on each card
- "Have an idea?" line with email link (no database, no voting — just email)
- BackButton to `/app/more`
- Add `SettingsRow` entry in More page linking to this page

### 5.2 — Why Static Over Dynamic

| Approach | Effort | Value at 20-50 users |
|----------|--------|---------------------|
| Static page (hardcoded) | 0.5 day | Sufficient — founding users email feedback directly |
| DB-backed with voting | 3-5 days | Overkill — voting is meaningful at 500+ users |
| Full roadmap (Sprint 11 plan) | 5-7 days | Way too much — 4 tables, 19 components |

The static page can be upgraded to DB-backed roadmap in a future junior sprint when user count justifies it.

---

## Part 6: Launch QA Checklist

This is a **human task**, not code. Run through each item manually across devices/browsers.

### 6.1 — Auth Flows

| Test | Browsers | Notes |
|------|----------|-------|
| Apple OAuth — signup, login, logout, re-login | Safari iOS, Chrome desktop | Verify callback URLs work on production domain |
| Google OAuth — signup, login, logout, re-login | Chrome mobile, Chrome desktop | |
| Email/password — signup with verification | All | Verify Resend sends from production, email lands, link works |
| Email/password — login, reset password | All | |
| Invite-only mode — unauthenticated user sees invite page | All | With `SIGNUP_MODE=invite` |
| Invite-only mode — `?invite` param bypasses | All | |

### 6.2 — Stripe / Payments

| Test | Notes |
|------|-------|
| Upgrade to Pro (monthly) | Verify Stripe checkout in production mode |
| Verify Pro access immediately after payment | |
| Stripe portal — manage subscription | |
| Cancel subscription — verify downgrade | |
| Upgrade to Pro (annual) | |
| Founding member pricing | Verify cap enforcement (100 slots) |
| Webhook fires on subscription events | Check Stripe dashboard for webhook delivery |

### 6.3 — Core Flows

| Test | Notes |
|------|-------|
| Onboarding — full flow (name → handle → dept → yacht → endorsement request → done) | |
| CV upload → parse → review → profile population | |
| Add yacht to profile (new yacht) | |
| Add yacht to profile (existing yacht via search) | |
| Endorsement request — send via email | Verify Resend delivery |
| Endorsement request — deep link works | `/r/[token]` loads correctly |
| Write endorsement from deep link | |
| Profile PDF export (free with watermark) | |
| Profile PDF export (Pro without watermark) | |

### 6.4 — Sprint 12 Features (Yacht Graph)

| Test | Notes |
|------|-------|
| Yacht detail page — crew list, current/alumni split | |
| Yacht detail page — crew card tap → profile | Every card must link |
| Yacht detail page — endorsement cross-references | |
| Colleague explorer — grouped by yacht, accordion | |
| Colleague explorer — endorse quick-action | |
| Sea time — summary card on profile | |
| Sea time — breakdown page | |
| Mutual colleagues — shows on public profile | |
| Mutual colleagues — expand to see people | |
| Graph hop 1: dev-qa profile → click a yacht | Loads yacht detail page |
| Graph hop 2: yacht page → click a crew member | Loads their public profile |
| Graph hop 3: their profile → click one of their yachts | Loads that yacht page |
| Graph hop 4: that yacht → click a different crew member | Reach a new person — no dead end |
| Graph hop 5: verify can return via browser back | History works |
| Colleague explorer with 0 colleagues | Shows empty state, not crash |
| Yacht detail page with 0 crew (edge case) | Shows empty state |
| Mutual colleagues for a deleted user | Shows "[Deleted User]" or hides gracefully |
| Yacht search — crew count in results | |
| Yacht search — duplicate detection dialog | |

### 6.5 — Cross-Browser / Device

| Test | Device |
|------|--------|
| Full signup → profile → public profile → share | Mobile Safari (iOS) |
| Same flow | Mobile Chrome (Android) |
| Same flow | Desktop Chrome |
| Same flow | Desktop Safari |
| 375px viewport — no overflow, no clipped text | |
| Desktop — max-w-2xl constraint, sidebar nav visible | |

### 6.6 — Data & Privacy

| Test | Notes |
|------|-------|
| Data export (GDPR) — download JSON | Verify all data included |
| Account deletion — full flow | Verify Stripe cancel, storage cleanup |
| Cookie banner — renders on first visit, persists choice | |

### 6.7 — Production Infrastructure

| Test | Notes |
|------|-------|
| All routes load without errors (smoke test) | |
| OG images generate for sample profiles | Share a link on WhatsApp, check preview |
| QR codes scan correctly | Point phone camera at QR on screen |
| Rate limiting works | Hit a limited endpoint 20+ times |
| Sentry catches and reports an intentional error | Trigger error boundary, check Sentry dashboard |
| PostHog receives events | Check PostHog dashboard after testing flows |
| Cron jobs fire on schedule | Check Vercel cron logs |
| Custom domain resolves with SSL | `https://yachtie.link` loads |
| Subdomain routing works | `https://dev-qa.yachtie.link` → dev profile |
| `www.yachtie.link` → marketing page (or redirect to apex) | |
| Rate limiting active | Hit a limited endpoint 20+ times in succession → 429 on excess |
| Rate limiter NOT silently failing open | Check Vercel logs — no "Redis unavailable" warnings |
| Landing page load time <3s on throttled 3G (Chrome DevTools) | Performance baseline |

---

## Part 7: Legal Sign-off

**This is a founder task, not engineering.**

- [ ] Review `/terms` content — currently comprehensive but needs business address (Section 11 of privacy policy)
- [ ] Review `/privacy` content — same business address TODO
- [ ] Confirm cookie banner text matches actual tracking (PostHog localStorage, Sentry errors, auth cookies)
- [ ] Decide on founding member pricing language
- [ ] Sign off: "these are ready for public launch"

**Blocker:** Legal pages must be signed off before switching `SIGNUP_MODE` from `invite` to `public`.

---

## Removed / Descoped

| Item | Reason |
|------|--------|
| Database-backed roadmap with voting (Sprint 11's build plan) | Overkill at 20-50 users. Static page sufficient. Can upgrade to DB-backed when user count justifies structured feedback (500+). |
| Feature request submissions | Same reason. Founding users email feedback directly. |
| Blog / help center | Not needed for soft launch. Help can be email-based. |
| PWA / native app | Out of scope for Phase 1B. |
| Dark mode | Sidelined in Sprint 10.3. Not for launch. |
| Welcome page redesign | Current `/welcome` page works. Marketing page at `/` handles the first impression. |

---

## Files to Create / Modify

### New files
```
app/(public)/marketing/page.tsx (or modify app/page.tsx)
app/(public)/layout.tsx (public header/footer — if not already handling this)
app/(protected)/app/more/roadmap/page.tsx
app/sitemap.ts
app/robots.ts
```

### Modified files
```
app/page.tsx                              — marketing page or redirect update
app/(protected)/app/more/page.tsx         — add SettingsRow for roadmap
components/CookieBanner.tsx               — update text to reflect PostHog/Sentry
CHANGELOG.md                              — update before commit
docs/modules/*.md                         — update affected modules
```

---

## Build Order

1. **Public layout** — header/footer for public pages (marketing, terms, privacy)
2. **Marketing landing page** — hero, how it works, value props, social proof, CTA, responsive
3. **SEO** — sitemap.ts, robots.ts, meta tags on landing page
4. **Static roadmap page** — hardcoded cards, SettingsRow entry in More page
5. **Cookie banner update** — text update to reflect actual tracking
6. **Production ops** — env vars, domain, Stripe production mode, cron verification (founder tasks)
7. **QA pass** — full manual QA checklist (human task)
8. **Legal sign-off** — founder reviews terms/privacy, signs off (blocker for public launch)
9. **CHANGELOG + module docs** — update before commit

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S13-01 | Static roadmap, not DB-backed | At 20-50 users, voting is meaningless. Founding users give feedback directly. Upgrade to DB-backed when user count justifies it (500+). |
| D-S13-02 | Marketing page at root `/`, not `/marketing` | The root URL is the first impression. Authenticated users auto-redirect to `/app/profile`. |
| D-S13-03 | Public layout with header/footer | Public pages (marketing, terms, privacy) need consistent navigation. Currently they have none. |
| D-S13-04 | Cookie banner bundles analytics consent | PostHog uses localStorage (not cookies). GDPR doesn't require separate consent for non-cookie localStorage analytics. Single "Got it" dismiss is sufficient with clear disclosure. |
| D-S13-05 | Legal sign-off is a blocker for `public` mode | Terms/privacy must be reviewed before opening signups to the public. Not a nice-to-have. |
| D-S13-06 | Soft launch at `invite` mode first | Start with 20-50 crew for 1-2 weeks. Fix critical issues. Then switch to `public` before Med season (June 2026). |
| D-S13-07 | Light mode only | Dark mode sidelined in Sprint 10.3. Not for launch. |
| D-S13-08 | No endorsement quotes on landing page | Real endorsements on a marketing page creates FTC compliance risk, privacy exposure, and conflicts with D-003 (never monetize trust). Use descriptive copy and crew count instead. |
| D-S13-09 | Auth check in middleware, not page component | Avoids Supabase round-trip on every unauthenticated landing page visit. Middleware runs at edge — faster. |
| D-S13-10 | Sitemap uses admin client | Anon key may not have RLS access to `users` table for handle enumeration. Service role key bypasses RLS for server-only sitemap generation. |
| D-S13-11 | Crew count shown only above threshold (>100) | At 20-50 users, "23 crew" looks weak. Hide count until it's impressive enough to be social proof. |

---

## PostHog Events

| Event | Properties | When |
|-------|-----------|------|
| `landing_page.viewed` | `{ referrer }` | Unauthenticated user views marketing page |
| `landing_page.cta_clicked` | `{ cta_location: 'hero' \| 'bottom' }` | User clicks signup CTA |
| `roadmap.viewed` | `{}` | User views roadmap page |

---

## Success Criteria

- [ ] Marketing landing page renders at `https://yachtie.link` for unauthenticated users
- [ ] Authenticated users visiting `/` redirect to `/app/profile`
- [ ] Landing page is responsive at 375px, 768px, 1280px — no overflow, sticky CTA on mobile
- [ ] Landing page scroll animations work (fadeUp, scrollReveal)
- [ ] Public header/footer visible on marketing page, terms, privacy
- [ ] "Sign up" and "Log in" buttons navigate to `/welcome`
- [ ] Sitemap at `/sitemap.xml` includes public profiles, terms, privacy
- [ ] `robots.txt` blocks `/app/`, `/api/`, allows public pages
- [ ] OG meta tags render correctly when landing page URL is shared
- [ ] Static roadmap page accessible from More tab
- [ ] Cookie banner text accurately reflects PostHog/Sentry usage
- [ ] All QA checklist items pass (auth, Stripe, core flows, Sprint 12 features, cross-browser)
- [ ] Graph browsing works end-to-end: 3+ hops without dead ends
- [ ] `SIGNUP_MODE=invite` correctly gates signup
- [ ] Production env vars all set in Vercel dashboard
- [ ] Custom domain resolves with SSL
- [ ] Cron jobs fire in production
- [ ] Legal pages signed off by founder
- [ ] PostHog events firing in production
- [ ] Sentry capturing errors in production
- [ ] CHANGELOG and module docs updated before commit

---

## Launch Sequence

After all success criteria pass:

1. **Deploy to production** on `main` branch via Vercel
2. **Wait 2 hours** — monitor Sentry for 500 errors, check Vercel logs for Redis/cron issues
3. **Smoke test in production:**
   - Visit `https://yachtie.link` — marketing page loads
   - Visit `https://yachtie.link/terms` — legal page loads
   - Visit `https://yachtie.link/u/dev-qa` — public profile loads with OG image
   - Visit `https://yachtie.link/sitemap.xml` — sitemap serves
   - Hit rate-limited endpoint 20+ times — 429 fires (proves Redis is connected)
   - Check Sentry dashboard — no unexpected errors
   - Check PostHog dashboard — events are arriving
4. **Set `SIGNUP_MODE=invite`** in production env
5. **Invite 20-50 crew** via `?invite` param links
6. **Monitor for 1-2 weeks:** Sentry errors, PostHog funnels, direct feedback
7. **Fix critical issues** via junior sprints
8. **Switch `SIGNUP_MODE=public`** when stable — before Med season ramp-up (June 2026)
9. **Announce:** Social media, crew WhatsApp groups, marina contacts

**Rollback plan:** If production deploy breaks a critical flow (login, payments, core navigation):
- `vercel rollback` → reverts to previous working deployment
- If only non-critical features are broken (landing page animation, roadmap page), deploy a fix via junior sprint — do NOT roll back
- **Never** roll back if users have already signed up — data created post-deploy must be preserved
