# YachtieLink Rally Final Proposal

**Date:** 2026-03-16
**Source:** 6 independent research agents (3 R1 + 3 R2 challengers), full codebase audit
**Status:** Proposal only — no code changes made

---

## Executive Summary

Six agents independently audited YachtieLink from every angle: UX/UI, features/value/growth, and performance/architecture. Round 2 challengers then stress-tested all R1 findings, contradicted shallow recommendations, and surfaced deeper structural issues.

Three structural problems emerged across all reports:

1. **The app is mobile-only, not mobile-first.** Zero responsive breakpoints exist in application code. On desktop, every page stretches to full viewport width or renders as a narrow column floating in empty space. Recruiters and captains — the most important public profile viewers — will see a broken layout.

2. **The app has no animation system.** No Framer Motion, no transition library. Every page swap, bottom sheet open, wizard step, and QR toggle is an instant DOM swap. The app feels like a utility, not a product people love.

3. **Every page makes too many sequential network requests with no caching, no loading feedback, and no offline support.** On marina WiFi (150-300ms latency), the profile page triggers 7 sequential Supabase round trips — 1-2 seconds of blank screen before a single pixel renders.

This proposal synthesizes the best findings from all 6 reports into a prioritized action plan.

---

## Part 1: Critical Bugs — Fix Before Launch

These are confirmed bugs that will cause user-visible failures.

### 1.1 Broken Legal Links (Welcome Page)
- **File:** `app/(auth)/welcome/page.tsx`
- **Bug:** Links point to `/legal/terms` and `/legal/privacy` but routes are `/terms` and `/privacy`. Results in 404.
- **Fix:** Change href values to `/terms` and `/privacy`.

### 1.2 Theme localStorage Key Mismatch
- **Files:** `app/layout.tsx` (reads `yl-theme`), `app/(protected)/app/more/page.tsx` (writes `theme`)
- **Bug:** Dark mode preference won't persist across reloads because the read/write keys don't match.
- **Fix:** Standardize on one key (`yl-theme`) in both locations.

### 1.3 Dark Mode Teal Variable Bug
- **Files:** IdentityCard, WheelACard, FloatingCTA, MorePage, AudienceTabs, InsightsPage, UpgradeCTA, AboutSection, YachtsSection, CertsSection, EndorsementsSection
- **Bug:** Components using `var(--teal-500)`, `var(--teal-700)` directly are not dark-mode-aware. The `.dark` block overrides semantic variables but not the raw palette variables. These components render light-mode teal on dark backgrounds.
- **Fix:** Replace all `var(--teal-N)` with semantic equivalents (`var(--color-interactive)`, `var(--color-teal-N)`) that have dark-mode overrides, or add `.dark` overrides for the raw variables.

### 1.4 Copy Bugs in Onboarding Done Step
- **File:** `components/onboarding/Wizard.tsx`
- **Bugs:**
  - Line ~965: Shows `yachtielink.com/u/{handle}` — should be `yachtie.link/u/{handle}`
  - Line ~967: References "Audience tab" — should be "Network tab"
- **Fix:** Correct both strings.

### 1.5 "checkmark" Literal Text in DeepLinkFlow
- **File:** `components/endorsement/DeepLinkFlow.tsx` (~line 218)
- **Bug:** Already-endorsed state shows the word "checkmark" as literal text instead of a rendered icon.
- **Fix:** Replace with an SVG checkmark or emoji.

### 1.6 CookieBanner Overlaps BottomTabBar
- **File:** `components/CookieBanner.tsx`
- **Bug:** Both cookie banner and tab bar are `fixed bottom-0 z-50`. On first visit, the banner covers the tab bar.
- **Fix:** Position banner above tab bar: `bottom-[calc(var(--tab-bar-height)+var(--safe-area-bottom))]`.

### 1.7 Stripe Webhook Always Returns 200
- **File:** `app/api/stripe/webhook/route.ts`
- **Bug:** Returns 200 regardless of whether the database update succeeded. If DB update fails, the subscription change is silently lost and Stripe won't retry.
- **Fix:** Return 500 if critical DB update fails. Add idempotency check to prevent re-processing the same event ID.

---

## Part 2: Performance Improvements

### 2.1 P0-A: Fix Query Waterfalls (saves 400-800ms per page load)

**Profile Page — 7 Sequential Round Trips:**

The app layout fetches `getUser()` + `users.onboarding_complete`, then the profile page re-fetches `getUser()`, re-queries `users.*`, then sequentially queries attachments, certs, and endorsements. That is 7 serial Supabase round trips on 150-300ms WiFi = 1-2 seconds of waiting.

**Fix:**
1. Use the layout's `user.id` instead of re-fetching auth in child pages
2. Wrap attachments, certs, and endorsements queries in `Promise.all()`
3. Extract a shared `getFullProfile(userId)` helper to eliminate duplication across 4 files (profile page, CV page, public profile, PDF generation)
4. Wrap common queries in `React.cache()` for request-level deduplication

**Public Profile — Duplicate User Query:**

`generateMetadata` and the page function both query the user row. Supabase client calls are not deduplicated by Next.js.

**Fix:**
1. Wrap user-by-handle query in `React.cache()`
2. Run viewer auth check in parallel with main data fetches
3. Add `export const revalidate = 60` (ISR) — profile data changes rarely, and cached HTML drops TTFB from 500ms+ to <50ms
4. Move viewer-specific relationship data (colleague badges) to a client-side API call since it can't be cached

**Insights Page:**

Two sequential `Promise.all()` blocks that could be merged into one.

### 2.2 P0-B: Add Loading Architecture

**No `loading.tsx` files exist anywhere.** The `Skeleton` component exists in `ui/skeleton.tsx` but is imported by zero components. Tab navigation shows a blank screen.

**Required loading.tsx files:**
- `app/(protected)/app/profile/loading.tsx` — IdentityCard skeleton + WheelACard skeleton + section cards
- `app/(protected)/app/cv/loading.tsx` — Actions card + preview skeleton
- `app/(protected)/app/insights/loading.tsx` — Title + analytics card skeletons
- `app/(protected)/app/network/loading.tsx` — Tab bar + list skeleton
- `app/(protected)/app/more/loading.tsx` — Section rows skeleton

**Critical detail:** Skeletons must match the dimensions of real content exactly to prevent layout shift (CLS). Share the same wrapper CSS classes as the real components.

**Progressive enhancement:** Use Suspense boundaries to stream sections as they resolve. The IdentityCard can render immediately from cached layout data while attachments/certs/endorsements stream in.

### 2.3 P0-C: Add Middleware for Session Refresh

`lib/supabase/middleware.ts` exists with `createMiddlewareClient()` fully implemented, but no root `middleware.ts` imports it. JWT tokens are never proactively refreshed. On marina WiFi where tabs stay open for hours, this guarantees broken sessions.

**Fix:** Create root `middleware.ts` that calls `supabase.auth.getUser()` to trigger token refresh. Match all `/app/*` routes.

### 2.4 P1: Bundle Optimization

| Issue | Impact | Fix |
|-------|--------|-----|
| `Geist_Mono` font imported but never used | Dead weight on every page load | Remove import from root layout |
| `IdentityCard` uses `<Image unoptimized />` | Bypasses all Next.js image optimization | Remove `unoptimized` prop |
| `PublicProfileContent` uses raw `<img>` | No lazy loading, no WebP, no responsive sizing on the most-shared page | Replace with `next/image` |
| `react-qr-code` in main bundle | ~8KB loaded even when QR is hidden | Dynamic import: `dynamic(() => import('react-qr-code'), { ssr: false })` |
| `react-image-crop` in bundle | ~50KB for a rarely-used page | Dynamic import |
| PostHog loads on every page including welcome/auth | ~50KB on pages with no user to track | Lazy-load after authentication |
| DM Sans loads 4 weights (400/500/600/700) | 4 WOFF2 files block FCP | Drop weight 700 (use 600 for bold), consider dropping 400 |

### 2.5 P1: Public Profile ISR Caching

Add `export const revalidate = 60` to the public profile page. Profile data changes at most a few times per month. A 60-second cache means:
- First visitor triggers a build
- All subsequent visitors in 60s get instant cached HTML
- Supabase load drops dramatically
- TTFB drops from 500ms+ to <50ms

The viewer relationship (colleague badges) must move to a client-side fetch since it's viewer-specific.

### 2.6 P1: More Page Client Component Antipattern

`app/(protected)/app/more/page.tsx` is entirely `'use client'`, fetching subscription status in `useEffect`. Users see a flash of "Free" before real status loads.

**Fix:** Convert to server component. Extract theme toggle and sign-out as client component islands.

### 2.7 P2: Email HTML XSS Risk

Endorsement notification and request emails embed `endorserName`, `yachtName`, and `excerpt` into HTML via template literals without sanitization. `sanitizeHtml()` exists but is not used in email templates.

**Fix:** Pass all user-supplied strings through `sanitizeHtml()` before embedding in email templates.

---

## Part 3: UX/UI Improvements

### 3.1 Tier 0: Fix Before Anyone Sees This on Desktop

**The app has zero responsive breakpoints in application code.** Not one `sm:`, `md:`, `lg:`, or `xl:` class in any application component.

#### 3.1.1 Add Content Width Constraint to App Layout

```tsx
// Current:
<main className="flex-1 pb-tab-bar">{children}</main>

// Fix:
<main className="flex-1 pb-tab-bar md:pb-0 mx-auto max-w-2xl px-4">{children}</main>
```

Without this, every authenticated page renders at full viewport width on desktop. The IdentityCard stretches to 2560px on an ultrawide monitor.

#### 3.1.2 Widen Public Profile for Desktop

The current `max-w-[640px]` is too narrow for desktop — narrower than a single LinkedIn column. On a recruiter's 27" monitor, this looks like a mobile screenshot embedded in a webpage.

**Fix:** `max-w-3xl` (768px) at minimum. At `lg:` breakpoint, implement a two-column layout:
- Left column (40%): Photo, name, role, contact, certs
- Right column (60%): Employment history, endorsements

This mirrors how captains mentally evaluate candidates and is achievable with responsive Tailwind classes and no structural component changes.

#### 3.1.3 Responsive Tab Bar → Sidebar on Desktop

The bottom tab bar on a 27" monitor is wrong. Add a `hidden md:block` sidebar (64px icon-only rail mirroring the 5 tab items) and `md:hidden` the bottom tab bar. ~50 lines of code.

#### 3.1.4 BottomSheet → Modal on Desktop

On desktop, a panel sliding up from the bottom of a 27" screen is disorienting. The `BottomSheet` component should detect viewport width and render as a centered modal on md+ breakpoints.

### 3.2 Tier 1: Makes It Feel Like an App (Launch Week)

#### 3.2.1 PWA Manifest + Icons

**Currently missing entirely:**
- No `manifest.webmanifest`
- No service worker
- No `apple-touch-icon`
- No `viewport-fit=cover` in viewport meta (required for `env(safe-area-inset-*)` to work on iOS)
- No app-specific icons in `/public/` (only default Next.js boilerplate SVGs)

When a crew member adds the app to their iPhone home screen, they get a screenshot thumbnail instead of an icon. This is table stakes for a mobile-first app.

**Required:**
- `manifest.webmanifest` with `name`, `short_name`, `start_url: "/app/profile"`, `display: "standalone"`, `theme_color: "#0D7377"`, icons at 192px and 512px
- `<link rel="apple-touch-icon">` in root layout
- `viewport-fit=cover` added to viewport meta tag
- App icon designed and exported at required sizes

#### 3.2.2 Service Worker + Offline Support

**The critical scenario R1 missed:** A deckhand at a crew bar pulls out their phone to show a captain their profile. Marina WiFi drops. Currently the app shows a blank page. The hiring opportunity is lost.

**Service worker cache strategy:**

| Route | Strategy |
|-------|----------|
| Static assets (JS, CSS, fonts) | Cache-first, update in background |
| `/app/profile` (own profile) | Stale-while-revalidate |
| `/u/[handle]` (own public profile) | Cache-first — MUST work offline |
| `/app/insights`, `/app/network` | Network-first with cache fallback |
| API mutations | Queue in IndexedDB, sync when online |

Implementation: Use Serwist (next-pwa successor) with Workbox strategies.

#### 3.2.3 Safe Area Handling

- **Missing safe-area-inset-top:** Content collides with status bar / Dynamic Island on iPhones
- **Missing `viewport-fit=cover`:** Required for `env(safe-area-inset-*)` to resolve correctly
- **Fix:** Add `pt-[env(safe-area-inset-top)]` to root layout, add `viewport-fit=cover` to viewport meta

#### 3.2.4 Touch Feedback on Interactive Elements

No touch feedback exists on any interactive element. Add `active:scale-[0.98] transition-transform` to all buttons and interactive cards. Prevents the "did I tap that?" uncertainty on mobile.

#### 3.2.5 Onboarding Wizard Back Button

No way to return to a previous step. If a user enters their name wrong, they must complete onboarding and fix it from settings.

**Fix:** Add a back button to the progress bar area. Add swipe-left-to-go-back gesture support for mobile-native feel.

### 3.3 Tier 2: Animation System (Makes People Love It)

**Install `framer-motion` (or the lighter `motion` package, 18KB).** The app currently has zero entry/exit animations.

#### 3.3.1 Minimum Animation Set

| Animation | What it fixes | Spec |
|-----------|---------------|------|
| **Page transitions between tabs** | Blank flash during navigation | Enter: opacity 0→1, y: 8→0, 200ms. Exit: opacity 1→0, 100ms. Via `AnimatePresence`. |
| **Bottom sheet slide-up** | Most jarring instant-swap in the app | Enter: y: "100%"→0, 300ms spring. Exit: y→"100%", 200ms. Backdrop fade. |
| **Card stagger on profile page** | Static, lifeless home screen | Each card: opacity 0→1, y: 12→0. Stagger: 60ms. Duration: 300ms. |
| **Wizard step transitions** | Abrupt content swap | Forward: slide left + fade. Backward: slide right + fade. 250ms ease-out. |
| **QR code reveal** | Pops in from nothing | Height: 0→auto, opacity: 0→1, 250ms. |
| **Toast entrance/exit** | Toasts appear/disappear instantly | Enter: translateY(100%)→0, spring. Exit: opacity→0, scale 0.95. |

**Total effort:** ~2-3 hours using `framer-motion` wrappers.

#### 3.3.2 Profile Completion Celebration

When all 5 milestones complete, the app currently does nothing. This is the moment the profile becomes "ready to share" — the transition that drives all growth.

**Choreography:**
1. Progress wheel fills last segment with animated stroke
2. Wheel glows briefly (box-shadow pulse in teal), settles into filled state with white checkmark
3. Card text transitions from "1 step remaining" to "Profile complete" with fade
4. One-time confetti burst (`canvas-confetti`, 6KB)
5. Floating CTA animates from setup step to "Share your profile"

#### 3.3.3 Reduced Motion Support

Add `@media (prefers-reduced-motion: no-preference)` as a condition for decorative animations. Keep essential animations (loading spinners, progress indicators). Framer Motion respects this natively via `useReducedMotion()`.

### 3.4 Tier 3: Adorable Details

#### 3.4.1 Identity Card Premium Feel

Currently a flat `bg-[var(--card)] rounded-2xl p-5` div — identical to every other card. It IS the user's identity and should feel different.

**Proposal:** Subtle gradient background (teal-50→white light, teal-950/20→card dark), `rounded-3xl`, `shadow-md`. On desktop hover, subtle 2-degree 3D tilt (CSS perspective transform). Visual metaphor: a premium business card sitting on a desk.

#### 3.4.2 Larger, More Prominent Share Buttons

The share button is `text-xs, px-3 py-1.5` — tiny for the most important action in the app. The Share button should be the largest, most visually distinct button on the IdentityCard. Visual hierarchy: Share = primary teal filled, Copy = outlined, QR = icon-only.

#### 3.4.3 Full-Screen QR Code Mode

Current QR is a 160px toggle hidden behind a text button. At a crew event, the user has to: open app → scroll to identity card → tap "QR" → hold phone up. That's 4 steps with a small QR.

**Proposal:** One-tap full-screen QR accessible from the identity card (or long-press on profile tab icon). White background, maximum-width QR, name + handle below. Auto-brightness to max. This is the pattern from WhatsApp, WeChat, and every payment app. For a networking-driven industry, this is core functionality.

#### 3.4.4 Employment Timeline (Not Dots)

Current employment history uses `h-2 w-2` dots — a bullet list masquerading as a timeline. Replace with: vertical line connecting entries, line color transitioning from teal (recent) to gray (older), pulsing dot for current position (`ended_at === null`).

#### 3.4.5 Endorsement Cards with Oversized Quotes

Add an oversized, semi-transparent open-quote character (") positioned absolutely in top-left, teal-100 (light) or teal-900 (dark), ~36px, `opacity-30`. Classic editorial testimonial pattern.

#### 3.4.6 Scroll-Linked Sticky Header on Public Profile

When scrolling down, the hero section (photo + name) shrinks and sticks to top as a compact bar. Photo: 96px→32px, name moves right, role disappears. Persistent identity context while browsing endorsements/certs. Pattern from Apple Music, Twitter/X, LinkedIn.

#### 3.4.7 Handle Preview Card in Onboarding

When the user types a handle and it's available, show a live preview of what their WhatsApp link preview will look like — mini card with teal bar, name, role, URL. Gives instant gratification and teaches what others will see.

#### 3.4.8 Industry-Specific Empty State Copy

Current copy is generic ("Add your certifications to complete your profile"). Better: "STCW, ENG1, Yacht Master — captains check these first." Every empty state is a micro-conversion point. Use industry terms that communicate professional consequences.

---

## Part 4: Feature Improvements

### 4.1 Tier 1: Do Before Launch

#### 4.1.1 Display Endorser Role on EndorsementCard

**The single highest-ROI one-line fix in the codebase.**

The `endorser_role_label` field exists on endorsement data but is NOT displayed on the public profile's `EndorsementCard`. When a Chief Stewardess endorses a deckhand, the weight is dramatically different from a peer endorsement. Currently shows "Sarah" — should show "Sarah, Chief Stewardess on MY Serenity."

**Implementation:** Pass `endorser_role_label` through to `EndorsementCard` and display it below the endorser name.

#### 4.1.2 "Create Your Profile" CTA on Public Profiles

Every viewer of a public profile is a potential signup. Currently no CTA exists.

**But the CTA must be contextual, not generic:**

- **For non-logged-in viewers:** After the endorsements section: "[Name] has [N] endorsements from colleagues across [M] yachts. Build your own profile — it's free. [Get Started]"
- **For logged-in viewers with shared yachts who haven't endorsed:** "Endorse [Name]" button — this is the highest-value action and is currently impossible from the most obvious place.
- **For logged-in viewers already endorsed:** "You have [N] colleagues in common" — creates curiosity and engagement.
- **Brand footer for evaluators (captains/recruiters):** "YachtieLink — Verified employment history and peer endorsements for yacht crew." Positions as industry authority, not consumer product begging for signups.

#### 4.1.3 Dynamic OG Image for WhatsApp Previews

**Arguably the single highest-ROI feature not currently built.**

Current OG image is just the profile photo. The WhatsApp preview is bare.

**Proposed:** Generate a dynamic OG image (via `@vercel/og`) showing:
- Profile photo (left)
- Name and role (right)
- Stats bar: "8 endorsements | 5 yachts | All certs current"
- YachtieLink branding strip

Every profile share on WhatsApp becomes a branded business card in the chat. The stats create social proof before the recipient clicks. This multiplies conversion rate on every share.

#### 4.1.4 WhatsApp-Optimized Share Text

Current share text: "Check out [name]'s profile on YachtieLink."

**Better:** Dynamic text based on profile strength:
- No endorsements: "Check out my crew profile on YachtieLink: {url}"
- Has endorsements: "Check out my crew profile — {N} endorsements from colleagues: {url}"
- For captains: "Hi [Captain], here's my professional profile with endorsements and current cert status: {url}"

Social proof IN the share text increases click-through dramatically.

#### 4.1.5 Availability Status (Minimal Phase 1A Version)

A single boolean `available_for_work` + optional `available_from` date on the users table. Displayed as a green badge: "Available" or "Available from May 2026."

This is THE first question agencies ask. A YachtieLink profile showing availability becomes 10x more actionable than a static PDF. The schema is trivial, the UI is a conditional render on the public profile.

### 4.2 Tier 2: First Post-Launch Sprint (Growth Accelerators)

#### 4.2.1 Founding Member Badge on Public Profile

A small, elegant "Founding Member" badge in a gold-tinted pill next to the name on public profiles. Pure presentation — does not affect trust or endorsement eligibility. Creates visible Pro differentiation and FOMO when non-Pro crew see it on colleagues' profiles.

**Per the constitutional monetization rule:** "You can't pay to be more trusted. You can only pay to present yourself better." A cosmetic badge is explicitly allowed.

#### 4.2.2 Sea Time Auto-Calculator

Sum of `(ended_at - started_at)` across all attachments. For ongoing attachments, use today's date. Display "4 years, 7 months at sea" prominently on profile and PDF.

- Sea time is a regulatory concept (MCA/MLC requirements for certifications)
- Crew currently count days in spreadsheets
- YachtieLink already HAS the data — computing it is free
- For Pro: break down by yacht type (motor/sail) and size
- Free users get the total, Pro gets the breakdown — clean freemium split

#### 4.2.3 "Endorse Back" Prompt (Reciprocity Engine)

When someone endorses you:
1. Notification: "Sarah endorsed your work on MY Serenity. Read it." [View]
2. After viewing: "Write one back? It only takes 2 minutes." [Endorse Sarah on MY Serenity]

Button deep-links to a pre-filled WriteEndorsementForm with recipient, yacht, and attachment data. Zero friction. Reciprocity is the strongest social force in behavioral science. Every reciprocal endorsement deepens the graph.

#### 4.2.4 Profile View Digest Email

"Your profile was viewed X times this week. Upgrade to Pro to see who's looking."

The GAP between what free and Pro show is the upgrade trigger. Free knows about views; Pro sees WHO. This specific curiosity gap drives conversions.

#### 4.2.5 Notification Badges on Network Tab

No visual indicator for pending endorsement requests. When someone requests an endorsement, there's no badge on the Network tab. This is a major engagement miss — crew only check if they know something is waiting.

#### 4.2.6 Founding Member Pricing Deadline

Current scarcity: "100 spots." Missing: urgency. Add: "Founding member pricing closes April 15, 2026 or when 100 spots fill, whichever comes first." Urgency needs a time dimension, not just quantity.

### 4.3 Tier 3: Deepening Moats

#### 4.3.1 PDF Download from Public Profile

A "Download as PDF" button visible to ALL viewers (not just the profile owner). Uses free template with watermark. Pro users' profiles generate Pro-template PDFs. This bridges the digital-to-paper gap: every PDF emailed to an agency includes "View full profile at yachtie.link/u/handle" with a QR code — viral marketing on every download.

#### 4.3.2 Auto-Updating PDF Link (Pro)

`yachtie.link/u/handle/cv.pdf` always returns the latest version. Free users must manually regenerate. When a crew agent says "send me your CV," the answer becomes: "Here's my YachtieLink — always up to date."

#### 4.3.3 Cert Calendar Export (Pro)

One-tap export all cert expiry dates to iCal/Google Calendar. Trivial to build (iCal format), high perceived value. Makes Pro the source of truth for cert management.

#### 4.3.4 Languages Field

Specced in the feature registry but not yet built. Charter yachts make hiring decisions based on languages. French, Italian, Spanish are premium in the Med. Schema: JSONB array of `{ language, proficiency }`. UI: multi-select.

#### 4.3.5 Monthly Profile Report Email

"March: 45 profile views, 2 new endorsements, all certs current. Your profile is in the top 15% by endorsement count in your department." Creates a monthly touchpoint without requiring the app to be opened. Not gamification — stewardship.

#### 4.3.6 Print-Optimized CSS for Public Profiles

`@media print` stylesheet that renders the public profile cleanly on A4. Captains print things. A captain who prints a YachtieLink profile and puts it in a candidate folder becomes an evangelist.

#### 4.3.7 Contextual Pro Upgrade Nudges

Currently the UpgradeCTA lives only on the Insights page. Better: one-time contextual nudges at moments of maximum relevance:

1. After first profile view: "Someone viewed your profile. Upgrade to see who."
2. After generating free PDF: "See how the Classic Navy and Modern Minimal templates look."
3. After cert expiry warning: "Pro members get automated reminders at 90/60/30/7 days."
4. After 5th endorsement: "Pro members can pin their best endorsement to the top."

Each appears ONCE. Not nagging. Contextual.

---

## Part 5: Code Quality & Architecture

### 5.1 CSS Variable Naming Inconsistency

Three naming conventions coexist:
1. **Semantic:** `var(--color-surface)`, `var(--color-text-primary)` — newer components
2. **shadcn shorthand:** `var(--card)`, `var(--foreground)` — older components
3. **Raw palette:** `var(--teal-500)`, `var(--teal-700)` — scattered everywhere

This triple-system causes dark mode bugs and maintenance confusion. **Standardize on the semantic system.** Alias shadcn variables. Create lint rules to catch direct palette usage.

### 5.2 Profile Data Duplication

Profile fetching (user + attachments + certs + endorsements with identical select columns) is duplicated across 4 files:
1. `app/(protected)/app/profile/page.tsx`
2. `app/(protected)/app/cv/page.tsx`
3. `app/(public)/u/[handle]/page.tsx`
4. `app/api/cv/generate-pdf/route.ts`

**Fix:** Extract a shared `getFullProfile(userId)` helper.

### 5.3 Email Template Duplication

Three near-identical HTML email templates across endorsement routes. **Fix:** Shared template function.

### 5.4 Inconsistent Service Client Creation

Some API routes use `createServiceClient()` from `lib/supabase/admin.ts`, others create raw clients inline (`cv/parse`, `generate-pdf`, `download-pdf`). **Fix:** Use centralized admin helper everywhere.

### 5.5 Dead Code

- `handleApiError()` in `lib/api/errors.ts` — exists but never called by any API route. Error logging bypasses Sentry.
- `corsHeaders()` in `lib/cors.ts` — defined but never imported.
- Default Next.js SVGs in `/public/` — never used.
- `Geist_Mono` font — imported, never applied.

### 5.6 Missing Error Boundaries

Only root `error.tsx` exists. If the Insights page fails (Stripe API error), the entire app shows the root error page. Each major route should have its own `error.tsx` for graceful degradation within the tab bar.

### 5.7 Input Validation Gaps

| Route | Gap |
|-------|-----|
| `endorsement-requests/share-link` | No Zod validation on `yacht_id`, no rate limiting |
| `endorsement-requests/[id]` PUT | No Zod validation on body |
| `endorsements` GET | `user_id` query param not validated as UUID |
| `cv/download-pdf` | No rate limiting |
| `stripe/portal` | No rate limiting |

### 5.8 TypeScript `as any` Usage

24 occurrences across 9 files, primarily casting Supabase join results. Root cause: Supabase's `.select()` with joins returns deeply nested types that don't match component interfaces. **Fix:** Define shared types matching Supabase select shapes, or use `supabase gen types`.

---

## Part 6: The Psychology Layer — What Makes This Addictive Without Being Manipulative

### The Aha Moment

**"I have a professional page about me, with a clean URL, that I can send to anyone right now."**

Most yacht crew have never had a professional web presence. Their identity lives in a Word doc PDF passed around WhatsApp. The instant they see `yachtie.link/u/james-harrison` — that's the moment. Optimize time-to-first-share above all else.

### The Viral Engine

Two complementary loops:

**Supply-side (endorsement reciprocity):**
```
User A requests endorsement from User B
→ B signs up to write endorsement
→ B sees the platform, creates own profile
→ Post-endorsement CTA: "Want endorsements too? Request yours"
→ B requests from User C
→ Cycle repeats
```

**Demand-side (captain pull):**
```
Captain receives YachtieLink profile from Candidate A
→ Captain impressed by format
→ Captain asks Candidate B: "Do you have a YachtieLink?"
→ B signs up to meet captain's expectation
→ B requests endorsements from colleagues
→ Colleagues sign up and share with other captains
```

The demand-side loop cannot be built — it must be earned by making the public profile so clearly superior to a PDF that captains naturally prefer it. Every feature decision should be evaluated against: "Does this make the public profile more compelling to the person receiving it?"

### The Free-to-Evangelist Pipeline

| Stage | Event | What accelerates it |
|-------|-------|-------------------|
| 1. First share | User shares profile link | Prominent share buttons, pre-formatted WhatsApp messages |
| 2. First endorsement received | Social validation | Excellent notification with celebration, not a bare toast |
| 3. First profile view | "People are looking at me" | Profile view notification within 24h of first share |
| 4. First endorsement written | Invested emotional energy | "Endorse back" prompt after receiving |
| 5. First referral | "You should get on YachtieLink" | Monthly profile report + seasonal prompts |

### The Habit Model: Stewardship, Not Dopamine

YachtieLink is not TikTok. The right analogy is a bank account or credit score app. People check it because the NUMBER matters:
- Profile views (Pro): "Am I visible?"
- Endorsement count: "Is my social capital growing?"
- Cert status: "Am I compliant?"

The habit is stewardship of professional reputation, not dopamine-seeking. This aligns with the principle of "no engagement hacking."

---

## Part 7: Priority Matrix — What to Do When

### Phase A: Pre-Launch (Critical Path)

| # | Item | Category | Effort |
|---|------|----------|--------|
| 1 | Fix broken legal links | Bug | 5 min |
| 2 | Fix theme localStorage key mismatch | Bug | 5 min |
| 3 | Fix teal variable dark mode bug | Bug | 30 min |
| 4 | Fix copy bugs (domain, "Audience", "checkmark") | Bug | 15 min |
| 5 | Fix CookieBanner overlap | Bug | 15 min |
| 6 | Fix Stripe webhook error handling | Bug | 30 min |
| 7 | Parallelize profile page queries | Performance | 1 hour |
| 8 | Add `React.cache()` for query deduplication | Performance | 1 hour |
| 9 | Add `loading.tsx` with skeletons for all tabs | Performance | 3 hours |
| 10 | Add root `middleware.ts` for session refresh | Auth | 30 min |
| 11 | Add `max-w-2xl mx-auto` to app layout | Responsive | 15 min |
| 12 | Display endorser role on EndorsementCard | Feature | 15 min |

### Phase B: Launch Week

| # | Item | Category | Effort |
|---|------|----------|--------|
| 13 | PWA manifest + icons + apple-touch-icon | Mobile | 2 hours |
| 14 | Service worker with offline profile cache | Mobile | 4 hours |
| 15 | Safe-area-inset-top handling + viewport-fit=cover | Mobile | 30 min |
| 16 | Touch feedback (`active:scale-[0.98]`) on all buttons | UX | 30 min |
| 17 | Install framer-motion + bottom sheet animation | UX | 2 hours |
| 18 | Card stagger animation on profile page | UX | 1 hour |
| 19 | Wizard back button + slide transitions | UX | 2 hours |
| 20 | "Create your profile" contextual CTA on public profiles | Growth | 2 hours |
| 21 | Dynamic OG image for WhatsApp previews | Growth | 3 hours |
| 22 | WhatsApp-optimized share text | Growth | 1 hour |

### Phase C: First Post-Launch Sprint

| # | Item | Category | Effort |
|---|------|----------|--------|
| 23 | "Endorse [Name]" button on public profile (logged-in) | Growth | 3 hours |
| 24 | Public profile ISR caching (revalidate = 60) | Performance | 2 hours |
| 25 | Bundle optimization (dead fonts, lazy imports, PostHog) | Performance | 2 hours |
| 26 | Responsive sidebar nav on desktop (md+) | Responsive | 3 hours |
| 27 | Widen public profile + two-column desktop layout | Responsive | 4 hours |
| 28 | Profile completion celebration animation | Delight | 2 hours |
| 29 | Full-screen QR code mode | Feature | 2 hours |
| 30 | Availability status field | Feature | 2 hours |
| 31 | Founding Member badge on public profile | Growth | 1 hour |
| 32 | Sea time auto-calculator | Feature | 2 hours |
| 33 | "Endorse back" prompt | Growth | 3 hours |
| 34 | Notification badge on Network tab | UX | 1 hour |
| 35 | Industry-specific empty state copy | UX | 1 hour |

### Phase D: Ongoing

| # | Item | Category |
|---|------|----------|
| 36 | Sanitize email templates (XSS fix) | Security |
| 37 | Extract `getFullProfile()` helper | Architecture |
| 38 | Standardize CSS variable naming | Architecture |
| 39 | Remove dead code (handleApiError, corsHeaders, etc.) | Cleanup |
| 40 | Fix TypeScript `as any` casts | TypeScript |
| 41 | Add route-level error boundaries | Reliability |
| 42 | Input validation gaps (missing Zod schemas) | Security |
| 43 | More page → server component refactor | Performance |
| 44 | BottomSheet → Modal on desktop | Responsive |
| 45 | Scroll-linked sticky header on public profile | Delight |
| 46 | Employment timeline redesign | Delight |
| 47 | Toast entrance/exit animations | Delight |
| 48 | Page transitions between tabs | Delight |
| 49 | Pull-to-refresh on profile/network | UX |
| 50 | PDF download from public profile | Feature |
| 51 | Auto-updating PDF link (Pro) | Feature |
| 52 | Cert calendar export (Pro) | Feature |
| 53 | Languages field | Feature |
| 54 | Monthly profile report email | Growth |
| 55 | Print-optimized CSS | Feature |
| 56 | Contextual Pro upgrade nudges | Growth |
| 57 | Founding member pricing deadline | Growth |

---

## Closing Thought

YachtieLink's competition is not another platform. It is the WhatsApp group chat where someone says "anyone know a good Chief Stew?" and 5 people forward PDF CVs. The way to win is to make the public profile so obviously superior to a PDF that forwarding a YachtieLink link becomes the natural response.

Every feature decision should be evaluated against one question: **"Does this make the public profile more compelling to the person receiving it?"** If yes, prioritize. If no, defer.

---

*Synthesized from 6 independent research agents. R1: UX/UI (Agent 1), Features/Value (Agent 2), Performance/Tech (Agent 3). R2 Challengers: UX Challenger (Agent 4), Features Challenger (Agent 5), Tech Challenger (Agent 6). Full individual reports available in `notes/rally_r1_*.md` and `notes/rally_r2_*.md`.*
