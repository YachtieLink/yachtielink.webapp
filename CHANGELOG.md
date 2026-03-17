# CHANGELOG.md — Cross-Agent Handover Log

All coding agents (Claude Code, Codex, etc.) must read this file at session start and update it throughout the session.

**Format:** Reverse chronological. One entry per session. Heading: `## YYYY-MM-DD — Agent Name`. Two sessions on the same day get separate entries with the same date. Sections: Done / Context / Next / Flags.

**Reading rules:**
- Read the last 3 sessions before doing any work
- Read older sessions only if the current task needs deeper historical context

**Writing rules:**
- This is a running log — update it as work happens, not just at session end
- Update after any meaningful decision, significant file change, or flag raised to the founder
- Confirm it's current before committing and pushing
- Confirm it's complete at session end
- Be concise but specific — the next agent needs to understand what happened and what's next

---

## 2026-03-18 — Claude Code (Opus 4.6) — Phase 1A Profile Robustness implementation

### Done
- **DB migration** `supabase/migrations/20260317000021_profile_robustness.sql` — 7 new tables (user_photos, user_gallery, profile_folders, saved_profiles, user_hobbies, user_education, user_skills), 4 new columns on users (ai_summary, ai_summary_edited, section_visibility jsonb, social_links jsonb), RLS policies for all tables, get_sea_time() helper function, storage bucket policies for user-photos and user-gallery
- **Zod schemas** — 12 new schemas in lib/validation/schemas.ts (photos, gallery, saved profiles, folders, hobbies, education, skills, social links, section visibility, AI summary)
- **Profile queries** extended — getUserById/getUserByHandle now include new columns; new: getExtendedProfileSections(), getSavedStatus(), getSavedProfiles(), getProfileFolders(), getEndorserRoleOnYacht()
- **lib/profile-summaries.ts** — server-side summary line helpers: formatSeaTime, experienceSummary, endorsementsSummary, certificationsSummary, educationSummary, hobbiesSummary, skillsSummary, gallerySummary, computeProfileStrength
- **6 new core components**: ProfileAccordion (collapsible with AnimatePresence), PhotoGallery (swipeable hero 65vh, touch events, desktop arrows, dot indicators), SocialLinksRow (platform icons with hover colors), ProfileStrength (donut SVG, 4 strength labels), SaveProfileButton (save/unsave with optimistic toggle), SectionManager (toggle switches with optimistic PATCH calls)
- **14 new API routes**: /api/user-photos (GET/POST/PUT), /api/user-photos/[id] (DELETE), /api/user-gallery (GET/POST/PUT), /api/user-gallery/[id] (PUT/DELETE), /api/saved-profiles (GET/POST/DELETE), /api/profile-folders (GET/POST), /api/profile-folders/[id] (PUT/DELETE), /api/user-hobbies (GET/PUT), /api/user-education (GET/POST), /api/user-education/[id] (PUT/DELETE), /api/user-skills (GET/PUT), /api/profile/social-links (GET/PATCH), /api/profile/section-visibility (PATCH), /api/profile/ai-summary (POST/PATCH)
- **Public profile /u/[handle]** — full rewrite: Bumble-style split layout (photo left 40% sticky on desktop, content right), accordion sections with smart summaries, save button for logged-in viewers, sectionVisibility respected (empty + hidden = don't render), social links row, extended data sections (hobbies, education, skills, gallery)
- **Own profile /app/profile** — full rewrite: PhotoGallery editable with add button, ProfileStrength meter (replaces WheelACard), SectionManager card, SocialLinksRow, all sections as ProfileAccordion with edit links, empty-state prompts with add links
- **6 new edit pages**: /app/profile/photos (upload/delete, 3-col grid), /app/profile/gallery (upload/delete), /app/hobbies/edit (pill input, emoji, max 10), /app/skills/edit (pill input, category selector, max 20), /app/education/new (form with dates), /app/social-links/edit (one field per platform, 7 platforms)

### Context
- Sprint 10 = Phase 1A Profile Robustness Sprint from approved plan file (zany-squishing-crystal.md)
- WheelACard component is still in place but no longer used by profile page — can be deleted in cleanup
- Education [id]/edit page not yet created (only new; delete is via API)
- Storage buckets (user-photos, user-gallery) must be created manually in Supabase dashboard before photos work
- Migration must be applied via Supabase dashboard or `supabase db push` before testing
- AI summary endpoint requires OPENAI_API_KEY env var (already exists from CV parse)
- supabase.storage.from('user-photos') CDN URLs are used for photo_url — ensure bucket is public

### Next
- Apply DB migration via Supabase dashboard
- Create user-photos and user-gallery storage buckets (public read)
- Test photo upload flow end-to-end
- Build /app/education/[id]/edit page (edit existing education entries)
- Build saved profiles page (/app/network/saved) + folder UI
- Add animation pass (all new components should use lib/motion.ts presets)
- Add Salty empty state illustrations to the new sections
- QA dark mode on all new components

### Flags
- None critical — all code is new additions, no breaking changes to existing functionality

## 2026-03-17 — Claude Code (Sonnet 4.6) — Feature Roadmap build plan

### Done
- Created `notes/feature_roadmap_build_plan.md` — full detailed build plan for the community feature roadmap feature
- Feature lives in the More tab; Pro users can vote + submit requests, free users read-only
- Plan covers: DB migration (`20260318000001_feature_roadmap.sql`) with 4 tables + RLS + vote-count triggers + seed data, TypeScript types, 5 API routes, 12 components, rate limiting config, admin workflow, decision log (D-031–D-038), and 17 success criteria

### Context
- Inspired by BuddyBoss roadmap: 3-tab layout (Roadmap / Community Ideas / Released), card-based layout, thumbs-up toggle voting, status badges
- ~75% of roadmap items will target Pro users, ~25% target all users (editorial guideline, not enforced by code)
- Roadmap items are admin-managed via Supabase dashboard; community requests require admin approval before going public
- Reuses existing `UpgradeCTA`, `getProStatus()`, `SettingsRow`, Zod validation, and rate-limiting patterns

### Next
- Implement the feature roadmap: apply migration → types → API routes → components → route page → More page entry
- Seed initial roadmap items in Supabase after migration

### Flags
- None

---

## 2026-03-17 — Claude Code (Opus 4.6) — UI/UX refresh Phase 1 + Salty mascot spec

### Done
- Expanded colour palette: added coral (#E8634A), navy (#2B4C7E), and amber (#E5A832) token families (50/100/200/500/700 each) to `globals.css`
- Added DM Serif Display font to `layout.tsx` as display/headline font alongside DM Sans
- Created `lib/motion.ts` — shared Framer Motion animation presets (fadeUp, fadeIn, staggerContainer, cardHover, buttonTap, scrollReveal, popIn, spring configs)
- Updated `Card.tsx` — `shadow-sm` default + interactive hover lift + press animation
- Updated `Button.tsx` — refined press animation to `scale-[0.97]` with `transition-all duration-150`
- Updated chart colours to multi-colour palette (teal, coral, navy, amber) for light and dark modes
- Rewrote `yl_style_guide.md` to v2.0 — expanded colours, DM Serif Display typography, motion guidelines, Salty section, bento layouts, updated brand voice
- Created `notes/salty_mascot_spec.md` — full mascot spec: ethereal wind/water spirit, 8 moods, 5 sizes, voice guide, feature integration map, animation spec, component architecture, rollout plan

### Context
- Inspired by Notion.com's design energy — colour-coded sections, mascot character, purposeful animation, bento layouts
- Key decisions: DM Serif Display font, Salty mascot (AI-powered but brand never says "AI"), Phase 1 quick wins first
- Salty needs SVG artwork before implementation — spec is ready, visuals are not

### Next
- Phase 2: bento layout for profile page, empty-state illustrations, staggered list animations
- Phase 3: marketing landing page with bento feature grid, scroll reveals, serif hero
- Salty SVG artwork needed before Phase 4 mascot implementation

---

## 2026-03-17 — Claude Code (Opus 4.6) — Nav perf + public profile CTA improvements

### Done
- `staleTimes.dynamic: 300` in next.config.ts — 5 min client-side RSC cache, show stale + refresh in background
- BottomTabBar + SidebarNav: prefetch all 5 tab routes on mount via `router.prefetch()`
- Moved network badge from server layout → client-side hook (`useNetworkBadge`) — app shell renders instantly
- New `/api/badge-count` endpoint + `lib/hooks/useNetworkBadge.ts` — polls every 60s client-side
- Public profile CTA rework:
  - Not logged in: dual CTAs — "Build your own profile" (signup) + "Sign in to see how you know [Name]" (login)
  - Logged in, own profile: "Back to dashboard" button
  - Logged in, someone else: "Back to my profile" button
- Cleaned up 64 iCloud sync conflict duplicate files
- Reconciled diverged local/remote main via rebase, pushed Phase 1A as PR #41

### Context
- Phase 1A cleanup complete and deployed via PR #41
- PR #42 open for nav perf + CTA changes

### Next
- Sprint 9: availability + search + endorsement signals (see notes/sprint9_build_plan.md)
- Feature roadmap page (saved to memory for future sprint)

---

## 2026-03-17 — Claude Code (Sonnet 4.6) — Pre-merge audit + launch env finalised

### Done
- Completed all Phase 1A launch env setup: PostHog (EU), Sentry (EU), SIGNUP_MODE=public, REDIS_URL live
- Created `memory/service_accounts.md` — table of all third-party accounts + Vercel env var status
- Improved `app/(public)/privacy/page.tsx`: added GDPR legal bases (Art 6(1)(b)/(f)), technical data disclosure, Sentry SCCs note, objection/restriction rights, complaint rights, billing retention justification
- Full codebase audit before merging `feat/sprint-8` → `main`:
  - No critical conflicts — `@vercel/kv` fully removed, `ioredis` properly in place, no duplicate implementations
  - 10 `console.error` calls found (all safe, non-sensitive)
- Fixed `app/api/cv/generate-pdf/route.ts` line 102: `isPro: false` → `isPro: profile?.subscription_status === 'pro'`; added `subscription_status` to profile select
- Privacy page `app/(public)/privacy/page.tsx`: TODO comment for business address left in place — founder must supply registered address before launch

### Context
- `app/(protected)/app/audience/page.tsx` is an untracked legitimate feature page (audience/network management); audit confirmed safe — include in this commit
- Privacy page business address (`section 11`) is still a TODO placeholder — legal requirement, founder must add before going public
- PDF `isPro` was hardcoded `false` since Sprint 8 build — all users got the free PDF tier regardless of plan

### Next
- Commit all outstanding changes and merge `feat/sprint-8` → `main` to trigger Vercel production deployment
- Replace placeholder PWA icons with real YachtieLink brand assets
- Manual QA: OAuth flows, Stripe checkout/cancel, endorsement emails, mobile Safari
- Legal review of `/terms` and `/privacy` (add business address to privacy page first)

### Flags
- Privacy page section 11 missing registered business address — required for GDPR compliance before launch

---

## 2026-03-17 — Claude Code (Opus 4.6) — Nav perf + public profile CTA improvements

### Done
- `staleTimes.dynamic: 300` in next.config.ts — 5 min client-side RSC cache, show stale + refresh in background
- BottomTabBar + SidebarNav: prefetch all 5 tab routes on mount via `router.prefetch()`
- Moved network badge from server layout → client-side hook (`useNetworkBadge`) — app shell renders instantly
- New `/api/badge-count` endpoint + `lib/hooks/useNetworkBadge.ts` — polls every 60s client-side
- Public profile CTA rework:
  - Not logged in: dual CTAs — "Build your own profile" (signup) + "Sign in to see how you know [Name]" (login)
  - Logged in, own profile: "Back to dashboard" button
  - Logged in, someone else: "Back to my profile" button
- Cleaned up 64 iCloud sync conflict duplicate files
- Reconciled diverged local/remote main via rebase, pushed Phase 1A as PR #41

### Context
- Phase 1A cleanup complete and deployed via PR #41
- PR #42 open for nav perf + CTA changes

### Next
- Sprint 9: availability + search + endorsement signals (see notes/sprint9_build_plan.md)
- Feature roadmap page (saved to memory for future sprint)

---

## 2026-03-17 — Claude Code (Sonnet 4.6) — Redis swap + launch env setup

### Done
- Switched rate limiter from `@vercel/kv` → `ioredis` using `REDIS_URL`
  - Vercel Storage created a Redis Labs database (not Vercel KV) — `@vercel/kv` needs REST API, `ioredis` uses Redis protocol directly
  - Removed `@vercel/kv`, installed `ioredis`; `REDIS_URL` auto-injected into all envs by Vercel
  - Singleton client, fail-open when `REDIS_URL` absent, try/catch for runtime failures
- `npm audit fix` → 0 vulnerabilities
- Restored `DEV_TEST_EMAIL` / `DEV_TEST_PASSWORD` to `.env.local` after `vercel env pull` wiped them
- Vercel KV (Redis Labs) connected to project — `REDIS_URL` live in all environments

### Context
- `vercel env pull` overwrites `.env.local` entirely — local-only vars (dev credentials etc.) get wiped. Re-add after every pull.
- Redis endpoint: `redis-10245.crce218.eu-central-1-1.ec2.cloud.redislabs.com:10245` (EU Central, free 30 MB tier)

### Next
- PostHog setup (step 2), Sentry (step 3), SIGNUP_MODE + remaining env vars (step 4), manual QA (step 5), legal review (step 6), merge to main (step 7)

### Flags
- None

---

## 2026-03-17 — Claude Code (Opus 4.6 + Sonnet subagents) — Phase 1A Cleanup: Polish, Performance & Growth

### Done

**Spec 01 — Critical Bugs (Wave 1)**
- Fixed legal page links: `/legal/terms` → `/terms`, `/legal/privacy` → `/privacy` in welcome page
- Fixed theme storage key: `localStorage.getItem('theme')` → `'yl-theme'` across more/settings
- Replaced all stale CSS vars (`--teal-500`, `--card`, `--muted-foreground`, etc.) → design system tokens across 18+ files
- Fixed Wizard.tsx: `yachtielink.com` → `yachtie.link`, `Audience tab` → `Network tab`
- Fixed DeepLinkFlow: literal "checkmark" text → `✓` icon
- Fixed CookieBanner positioning: now clears tab bar with `bottom-[calc(var(--tab-bar-height)+safe-area)]`
- Fixed Stripe webhook: captures `.update()` errors and returns 500 on failure (was always 200)

**Spec 02 — Performance Queries (Wave 2)**
- Created `lib/queries/profile.ts` with `getUserById` and `getUserByHandle` using `React.cache()` for dedup between `generateMetadata` + page
- Profile page: replaced 7 sequential queries with `Promise.all([getUserById, getProfileSections])`
- Public profile: cached `getUserByHandle` between metadata + page, parallel section fetches
- Insights page: merged two sequential `Promise.all` calls into one 4-way

**Spec 03 — Loading Architecture (Wave 2)**
- Loading skeletons already existed for profile, cv, insights, network, more routes

**Spec 04 — Middleware Auth (Wave 1)**
- No changes needed — `proxy.ts` already handles session refresh correctly for Next.js 16

**Spec 05 — PWA (Wave 4)**
- Created `public/manifest.webmanifest` with app name, theme color, icons
- Created placeholder PWA icons: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
- Added manifest, apple icons, appleWebApp, viewportFit: "cover" to root layout
- Deleted unused Next.js boilerplate SVGs (file.svg, globe.svg, next.svg, vercel.svg, window.svg)

**Spec 06 — Responsive Layout (Wave 3)**
- Created `components/nav/icons.tsx` — shared icon SVGs extracted from BottomTabBar
- Created `components/nav/SidebarNav.tsx` — desktop sidebar (`hidden md:flex`, fixed left, 64px, 5 tabs + YL logo)
- BottomTabBar: icons imported from shared file, added `md:hidden` for mobile-only
- App layout: added `<SidebarNav />`, main gets `md:pb-0 md:pl-16`, children wrapped in `max-w-2xl`
- Public profile: container widened `max-w-[640px] lg:max-w-4xl`, two-column grid at `lg:` breakpoint

**Spec 07 — Animation System (Wave 3)**
- Added `framer-motion` dependency
- Created `components/ui/AnimatedCard.tsx` — reusable stagger-in wrapper with `motion.div`
- Created `components/profile/ProfileCardList.tsx` — client wrapper mapping children through AnimatedCard
- Profile page cards wrapped in `<ProfileCardList>`
- BottomSheet: rewrote with AnimatePresence + spring slide-up animation
- IdentityCard: QR panel with AnimatePresence height animation
- Toast: spring entrance/exit animations
- Button: added `active:scale-[0.98] transition-transform` touch feedback

**Spec 08 — Public Profile Enhancements (Wave 4)**
- Created `app/api/og/route.tsx` — dynamic OG image generation (edge runtime, teal gradient, photo + name + role)
- OG images now use `/api/og?handle=` instead of raw profile photo URLs
- EndorsementCard: added `endorserRole` prop showing role below name
- Public profile: added signup CTA section for non-logged-in viewers with endorsement stats
- Public profile: added branding footer linking to /welcome
- `isLoggedIn` prop threaded through from page to component

**Spec 09 — Bundle Optimization (Wave 1)**
- Removed `Geist_Mono` font import from root layout
- Replaced `var(--font-geist-mono)` with system monospace stack in globals.css
- PostHogProvider: lazy-loads `posthog-js` via dynamic import, only on `/app/*` paths

**Spec 10 — Growth Features (Wave 4)**
- Created `lib/queries/notifications.ts` with `getPendingRequestCount` (React.cache)
- BottomTabBar: added `networkBadge` prop with red dot indicator on Network tab
- App layout: fetches pending endorsement request count and passes to BottomTabBar
- Public profile: added founding member badge (amber), available-for-work status (green pulse), sea time stats
- `founding_member` and `subscription_status` fields now fetched in public profile query

**Spec 11 — Code Quality (Wave 2)**
- Added `sanitizeHtml()` on user-supplied values in email template API routes
- Deleted dead `lib/cors.ts`
- Route-level error boundary (`app/(protected)/app/error.tsx`) with Sentry capture
- CV API routes: replaced inline Supabase client with `createServiceClient()`
- Share-link route: added Zod validation for `yacht_id`
- CV download route: added rate limiting
- API routes wired up `handleApiError()` in catch blocks

**Cross-cutting**
- Comprehensive CSS var migration: all remaining `--foreground`, `--muted`, `--card`, `--destructive`, `--primary`, `--background`, `--border` replaced with design system tokens across entire codebase (18+ additional files beyond Spec 01)

### Context
- Sprint executed overnight via Opus orchestrator + 12 Sonnet subagents in 4 dependency waves using git worktrees for isolation
- Wave 1: Specs 01, 04, 09 (no dependencies)
- Wave 2: Specs 02, 03, 11 (depend on Wave 1 file fixes)
- Wave 3: Specs 06, 07 (UI components, depend on CSS var fixes)
- Wave 4: Specs 05, 08, 10 (depend on layout/profile changes)
- Each wave's worktree branched from `3e82f1a` (merge commit on main), requiring CSS var re-application after each merge
- Key overlaps resolved: IdentityCard.tsx (3 specs), BottomTabBar.tsx (2 specs), PublicProfileContent.tsx (2 specs), app layout (2 specs)
- `tsc --noEmit` passes clean after all merges

### Next
- Founder: review all changes before committing (nothing committed per request)
- Run `npm run build` for full production build verification
- Visual QA of key flows: profile page animations, sidebar nav on desktop, public profile enhancements, PWA install
- Replace placeholder PWA icons with real YachtieLink logo assets
- Test OG image generation at `/api/og?handle=dev-qa`
- Verify framer-motion animations feel right on mobile (spring physics tuning)

### Flags
- PWA icons are teal placeholders — need real brand assets before launch
- `lib/cors.ts` deleted — was dead code, not imported anywhere
- Spec 04 (middleware auth) was a no-op: `proxy.ts` already handles everything the spec described

---

## 2026-03-16 — Claude Code (Sonnet 4.6) — Post-Sprint 8: QA pass + dev account

### Done
- Created dev/QA Supabase account: `dev@yachtie.link` (auth user `ef5dec27-...`)
  - Profile row seeded: handle `dev-qa`, role First Officer, subscription_plan `monthly`, subscription_status `pro`, founding_member true
  - Credentials stored in `.env.local` as `DEV_TEST_EMAIL` / `DEV_TEST_PASSWORD` — never commit
- Fixed rate limiter (`lib/rate-limit/limiter.ts`): fails open gracefully when `KV_REST_API_URL` is placeholder or missing, so local dev and unlinked deploys don't 500
- Ran automated QA against all Sprint 8 pages and flows:
  - ✅ /terms, /privacy, /invite-only, /app/more/delete-account — all render correctly
  - ✅ Public profile /u/dev-qa — renders correctly
  - ✅ Auth guard: unauthenticated /app/* → /welcome?returnTo=...
  - ✅ Data export: GET /api/account/export → 200 + attachment header
  - ✅ Cookie banner: shows on first visit, dismisses and persists in localStorage
  - ✅ More tab: PRIVACY links (Download data, Delete account) + LEGAL links (Terms, Privacy Policy)
  - ✅ Dark mode: More page screenshot verified
  - ✅ Migration 20260315000020 already applied to production (confirmed via `supabase migration list`)
- Updated `notes/launch_qa_checklist.md` with automated pass/fail results

### Context
- Rate limiter was crashing with ENOTFOUND on placeholder KV URL — all protected API routes were 500ing in dev
- Dev account is a real Supabase user going through normal auth — no code bypasses
- Vercel KV, PostHog, and Sentry still need real keys before launch (see sprint status)

### Next
- Founder: set up Vercel KV, PostHog, Sentry and add env vars to Vercel dashboard
- Founder: run manual QA items (OAuth flows, Stripe, endorsement emails, mobile Safari)
- Founder: legal review of /terms and /privacy before going public
- When ready: merge feat/sprint-8 → main and deploy

### Flags
- None

---

## 2026-03-15 — Claude Code (Sonnet 4.6) — Post-Sprint 8: proxy.ts migration

### Done
- Renamed `middleware.ts` → `proxy.ts`, export renamed `middleware` → `proxy` (Next.js 16 deprecation fix)
- Verified all Sprint 8 pages render correctly: `/invite-only`, `/terms`, `/privacy`, cookie banner

### Context
- Next.js 16 deprecated the `middleware` file convention in favour of `proxy`
- No logic changes — pure rename

### Next
- See Sprint 8 entry below for launch checklist

---

## 2026-03-15 — Claude Code (Sonnet 4.6) — Sprint 8: Launch Prep + Content Moderation

### Done
- **Branch:** `feat/sprint-8` created from `feat/sprint-7`
- **Packages installed:** `zod`, `posthog-js`, `posthog-node`, `@sentry/nextjs`, `@vercel/kv`
- **Task 1 — Instrumentation:**
  - `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` created
  - `components/providers/PostHogProvider.tsx` — PostHog init, `autocapture: false`, `replaysSessionSampleRate: 0`
  - `lib/analytics/events.ts` — `trackEvent`, `identifyUser`, `resetAnalytics` (client-side)
  - `lib/analytics/server.ts` — `trackServerEvent`, `getPostHogServer` (server-side)
  - `app/layout.tsx` updated: PostHogProvider + CookieBanner wrapping children
  - `components/CookieBanner.tsx` — minimal cookie consent banner
- **Task 2 — Zod validation:**
  - `lib/validation/schemas.ts` — all schemas (endorsements, requests, CV, PDF, Stripe, account delete, handle)
  - `lib/validation/validate.ts` — `validateBody()` helper (Zod v4 uses `issues` not `errors`)
  - `lib/validation/sanitize.ts` — `sanitizeHtml()` for non-JSX contexts
  - Applied to: `api/endorsements/route.ts`, `api/endorsements/[id]/route.ts`, `api/endorsement-requests/route.ts`, `api/cv/parse/route.ts`, `api/cv/generate-pdf/route.ts`, `api/stripe/checkout/route.ts` — old manual checks removed
- **Task 3 — Rate limiting:**
  - `lib/rate-limit/limiter.ts` — Vercel KV sliding window counter
  - `lib/rate-limit/helpers.ts` — `applyRateLimit()`, `RATE_LIMITS` config, `getClientIP()`
  - Applied to all 6 API routes above. Stripe webhook intentionally excluded (Sentry signature is the guard)
- **Task 4 — Security headers + CORS:**
  - `lib/cors.ts` — `corsHeaders()`, `handleCorsPreFlight()`. Stripe webhook excluded
  - `next.config.ts` updated: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy + `withSentryConfig` wrapper
- **Task 5 — Growth controls:**
  - `app/(public)/invite-only/page.tsx` — static invite-only landing page
  - `middleware.ts` updated: `SIGNUP_MODE=invite` gates `/welcome` and `/signup`
- **Task 6 — GDPR:**
  - `app/api/account/export/route.ts` — full data export (users, attachments, certs, endorsements, analytics) as JSON download
  - `app/api/account/delete/route.ts` — soft-delete (anonymise user, cancel Stripe, delete files, delete auth user). Endorsements written remain on recipient profiles attributed to "[Deleted User]"
  - `app/(protected)/app/more/delete-account/page.tsx` — confirmation UI requiring exact phrase "DELETE MY ACCOUNT"
  - `app/(protected)/app/more/page.tsx` updated: Download data + Delete account links in Privacy section; live Terms/Privacy links in Legal section
- **Task 7 — Legal pages:**
  - `app/(public)/terms/page.tsx` — Terms of Service (placeholder text, marked `[LEGAL REVIEW NEEDED]` where needed)
  - `app/(public)/privacy/page.tsx` — Privacy Policy (GDPR rights, cookie policy, data storage)
- **Task 8 — Performance + QA:**
  - `app/error.tsx` — Sentry-integrated error boundary
  - `app/not-found.tsx` — 404 page
  - `lib/api/errors.ts` — `apiError()`, `handleApiError()` with Sentry capture
  - No raw `<img>` tags found — codebase was already clean
  - `notes/launch_qa_checklist.md` — manual QA checklist for founder
  - `supabase/migrations/20260315000020_sprint8_launch_prep.sql` — `deleted_at` on users + 7 performance indexes
- **Task 9 — AI-01 Content Moderation:**
  - `lib/ai/moderation.ts` — `moderateText()` using `omni-moderation-latest` (FREE). Non-blocking on API failure
  - Applied to `POST /api/endorsements` and `PUT /api/endorsements/[id]`
- **PostHog events wired (11 total):**
  - `endorsement.created` — on successful endorsement insert
  - `endorsement.deleted` — on soft-delete
  - `endorsement.requested` — on endorsement request creation
  - `cv.parsed` — on successful CV parse
  - `cv.parse_failed` — on timeout or parse error (with `reason` property)
  - `pro.subscribed` — on `customer.subscription.created` webhook (with plan + founding_member)
  - `pro.cancelled` — on `customer.subscription.deleted` webhook
  - `moderation.flagged` — when content moderation blocks a submission
  - Client events (`profile.created`, `profile.shared`, `attachment.created`) to be wired in UI components
- **Build:** passes clean (`npm run build`)

### Context
- Zod v4 uses `issues` not `errors` on ZodError — fixed in `validate.ts`
- `@sentry/nextjs` v10 dropped `hideSourceMaps` and `disableLogger` options — removed from `withSentryConfig`
- Rate limiting requires Vercel KV — founder must create `yachtielink-ratelimit` KV database in Vercel dashboard and set `KV_REST_API_URL` + `KV_REST_API_TOKEN`
- Sentry requires `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` env vars — set after Sentry account setup
- PostHog requires `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` env vars
- `SIGNUP_MODE=public` to launch open, `SIGNUP_MODE=invite` to gate signups
- New migration `20260315000020_sprint8_launch_prep.sql` needs applying to production

### Next
- Founder: set new env vars in Vercel (PostHog, Sentry, KV, CRON_SECRET, SIGNUP_MODE)
- Founder: create Vercel KV database (`yachtielink-ratelimit`)
- Founder: create Sentry project and add DSN + auth token
- Founder: create PostHog project and add key
- Founder: apply migration `20260315000020` to production
- Founder: run QA checklist (`notes/launch_qa_checklist.md`)
- Merge `feat/sprint-8` → main → SHIP Phase 1A
- Sprint 8.1: Languages on Profile + AI-04/AI-02/AI-17

### Flags
- Legal pages marked `[LEGAL REVIEW NEEDED]` — lawyer review required before public launch
- `profile.created`, `profile.shared`, `attachment.created` PostHog events are stubs — need wiring in respective client components (onboarding done page, share button, yacht attachment save)

---

## 2026-03-15 — Claude Code (Opus 4.6) — Build plan update: Sprint 8 + 8.1 + 8.2

### Done
- **Phase 1A gap analysis:** identified Sprint 8 (Launch Prep), Languages on Profile, and AI-01 Content Moderation as remaining gaps
- **Features doc status updates:** updated 18 Phase 1A features from `specced` to `shipped`, changed CV Import model ref from Claude Sonnet to OpenAI GPT-4o-mini
- **Sprint 8 updated in `docs/yl_build_plan.md`:** added AI-01 Content Moderation (OpenAI moderation API, free) to Sprint 8 scope, added `moderation.flagged` to PostHog events
- **Sprint 8.1 founder's notes created (`notes/sprint8_1_founder_notes.md`):** Languages on Profile, AI-04 Endorsement Writing Assistant, AI-02 Cert OCR, AI-17 Smart Profile Suggestions — detailed specs for Sonnet to build
- **Sprint 8.2 founder's notes created (`notes/sprint8_2_founder_notes.md`):** AI-03 Multilingual Endorsement Requests, AI-12 Yacht History Gap Analyzer — detailed specs for Sonnet to build
- **Build plan dependency chain and summary table updated** to reflect 8 → SHIP → 8.1 → 8.2 → Phase 1B flow

### Context
- GPT-5 Nano, GPT-5 Mini are available models (March 2026) — AI feature specs referencing them are correct
- Sprint 8.1/8.2 are post-launch sprints shipping immediately after Phase 1A, before Phase 1B proper
- AI-01 is free (OpenAI moderation API costs nothing), so it belongs in Sprint 8 with launch prep
- Languages on Profile in 8.1 is a prerequisite for AI-03 multilingual requests in 8.2

### Next
- Build Sprint 8 (start with existing `notes/sprint8_build_plan.md` + add AI-01)
- After Sprint 8 ships → Sprint 8.1 → Sprint 8.2

### Flags
- None

---

## 2026-03-15 — Claude Code (Sonnet 4.6) — Sprint 7: Stripe testing, webhook fix, founding annual price

### Done
- **End-to-end Stripe test (sandbox):** confirmed checkout → webhook → Supabase Pro upgrade flow works
- **Webhook fix:** `app/api/stripe/webhook/route.ts` — `current_period_end` moved from top-level subscription to `items.data[0]` in Stripe API `2026-02-25.clover`; added fallback to handle both locations
- **Founding annual price (€49.99/yr):**
  - `app/api/stripe/checkout/route.ts` — extracted `getFoundingMemberCount()` shared helper; added `resolveAnnualPriceId()` mirroring monthly logic; annual plan now gets founding price when slots remain; `isFoundingPrice` flag set correctly for annual; new env var `STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID`
  - Founder created €49.99/yr price in both Stripe sandbox and live; added `STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID` to Vercel
- **UpgradeCTA pricing display overhaul:**
  - Shows correct savings vs full €8.99/mo rate: monthly founding save 44%, annual founding save 53%, standard annual save 35%
  - Shows "full price €8.99/mo" / "full price €69.99/yr" on plan buttons (not "then €X" which implied a trial)
  - Tagline: "Lock in €4.99/mo or €49.99/yr forever. After N spots fill, new members pay €8.99/mo."
- **Vercel env vars** swapped back to live Stripe keys + live price IDs after testing

### Context
- The founding cap (100) is shared across both monthly and annual founding plans — `getFoundingMemberCount()` counts all `founding_member = true` Pro users regardless of interval
- Sandbox test confirmed: subscription_status, subscription_plan, subscription_ends_at all stamped correctly by webhook; founding_member was false on the annual test (expected — founding annual logic wasn't in code at that point; now fixed)

### Next
- Redeploy Vercel (env vars updated)
- Merge PR #35 to main → Vercel auto-deploys Sprint 7 to production
- Sprint 8 planning

### Flags
- None

---

## 2026-03-15 — Claude Code (Opus 4.6) — Sprint 7: Endorsement virality + fixes

### Done
- **Endorsement virality — full implementation:**
  - `supabase/migrations/20260315000019_endorsement_virality.sql` — `is_shareable` column, updated `has_recipient` constraint (allows phone/shareable), phone index, extended `link_pending_requests_to_new_user()` trigger for phone/WhatsApp matching, UPDATE trigger on users table, unique index for shareable links
  - `app/api/endorsement-requests/share-link/route.ts` — new POST endpoint for reusable shareable links (idempotent, one per requester+yacht)
  - `app/api/endorsement-requests/route.ts` — added `recipient_user_id` for direct colleague requests, phone-based user lookup, email notification fallback when only user_id provided
  - `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` — complete rewrite: share section (WhatsApp, Copy Link, native Share) at top, colleague cards with one-tap Request buttons, email/phone input with auto-detect, contact chips, rate limit display
  - `app/(protected)/app/endorsement/request/page.tsx` — yacht picker when no `yacht_id`, fetches colleague emails, improved request status matching
  - `components/endorsement/DeepLinkFlow.tsx` — added `mini-onboard` step for new/incomplete users (name, role, yacht dates), auto-prefill dates from requester's attachment, post-endorsement redirect to `/onboarding` for incomplete users
  - `components/endorsement/WriteEndorsementForm.tsx` — post-endorsement upsell CTA ("Want endorsements too? Request yours →")
  - `components/audience/AudienceTabs.tsx` — replaced BottomSheet indirection with prominent teal CTA card linking to `/app/endorsement/request`, progress bar embedded
  - `app/(protected)/app/profile/page.tsx` — floating CTA tiered logic: (1) next milestone, (2) "Request endorsements" when <5 endorsements, (3) "Share profile" fallback
- **Fixes:**
  - `next.config.ts` — added Supabase storage remote pattern for Next/Image
  - `components/ui/Input.tsx` — replaced `Math.random()` ID with `useId()` to fix hydration mismatch
  - `supabase/migrations/20260315000018_sprint7_payments.sql` — fixed `expiry_date` → `expires_at` column reference in certifications index
- **Migrations applied** to remote database: both `20260315000018` and `20260315000019`
- **PR #35** created on `feat/sprint-7`

### Context
- Endorsement virality is the primary growth lever — WhatsApp is the #1 comms channel for yacht crew
- Shareable links are reusable (one per requester+yacht), so sharing via WhatsApp/social doesn't create duplicate DB rows
- Phone matching uses DB triggers (INSERT + UPDATE on users table) so endorsement requests auto-link when someone signs up with a matching phone/WhatsApp/email
- Mini-onboarding for endorsers: just name, role, and yacht dates — full onboarding deferred to after they write the endorsement

### Next
- Merge PR #35 to main
- Test end-to-end: share link via WhatsApp → recipient opens → mini-onboard → write endorsement → auto-link
- Sprint 8 planning

### Flags
- None

---

## 2026-03-15 — Claude Code (Sonnet 4.6) — Sprint 7 addendum: Founding member pricing + Stripe go-live

### Done
- **Founding member pricing (€4.99/mo locked forever, first 100 subs):**
  - `app/api/stripe/checkout/route.ts` — `resolveMonthlyPriceId()` checks `users.founding_member` count; if < 100 and `STRIPE_PRO_FOUNDING_PRICE_ID` is set, uses founding price; otherwise standard €8.99 price
  - `app/api/stripe/webhook/route.ts` — stamps `founding_member = true` on the user when `subscription.metadata.founding_member === 'true'`
  - `components/insights/UpgradeCTA.tsx` — accepts `foundingSlotsLeft` prop; shows "X founding spots left" badge + "locked in forever" copy + correct price label (€4.99) when slots remain; auto-selects Annual when slots exhausted
  - `app/(protected)/app/insights/page.tsx` — fetches founding count server-side, passes `foundingSlotsLeft` to UpgradeCTA
  - `supabase/migrations/20260315000018_sprint7_payments.sql` — added `users.founding_member boolean DEFAULT false`
- Pricing env var added: `STRIPE_PRO_FOUNDING_PRICE_ID` (optional — feature degrades gracefully if unset)
- **Stripe product configured by founder:** one product "Crew Pro", 3 prices — €4.99/mo (founding), €8.99/mo (standard), €69.99/yr
- **Stripe webhook configured:** `https://yachtie.link/api/stripe/webhook` — 4 events subscribed
- **Vercel env vars added:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_PRO_FOUNDING_PRICE_ID`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`
- **Migration applied** via `npx supabase db push` — `20260315000018` confirmed in sync
- Branch `feat/sprint-7` committed and pushed — ready to merge to main
- Build: passes ✓

### Context
- Founding price is a normal Stripe price at €4.99 — no coupon needed; cap logic lives in the checkout route
- Existing founding subscribers are never automatically migrated off the €4.99 price by Stripe
- All 19 migrations in sync between local and remote

### Next
- Merge `feat/sprint-7` PR to main → Vercel auto-deploys
- Test end-to-end checkout flow in production (use Stripe test mode first if needed)
- Sprint 8 planning

### Flags
- None — all env vars set, migration applied, webhook live

---

## 2026-03-15 — Claude Code (Sonnet 4.6) — Sprint 7: Payments + Pro

### Done
- Created `feat/sprint-7` branch from `feat/sprint-6`
- **Task 1 — Stripe SDK + helpers:**
  - Installed `stripe` npm package
  - `lib/stripe/client.ts` — lazy Stripe singleton (proxy pattern to avoid build-time env throw)
  - `lib/stripe/pro.ts` — `getProStatus()` helper checking both status flag and expiry date
  - `lib/supabase/admin.ts` — service role Supabase client for webhook + cron routes
- **Task 2 — Checkout + Portal API routes:**
  - `app/api/stripe/checkout/route.ts` — POST: creates/reuses Stripe Customer, creates Checkout Session, returns redirect URL
  - `app/api/stripe/portal/route.ts` — POST: creates Customer Portal session, returns redirect URL
- **Task 3 — Stripe webhook handler:**
  - `app/api/stripe/webhook/route.ts` — handles `subscription.created/updated/deleted`, `invoice.payment_failed`
  - On create/update: sets `subscription_status`, `subscription_plan`, `subscription_ends_at`, `show_watermark`
  - On delete: revokes `custom_subdomain`, resets `template_id`, sets `show_watermark = true`
  - On payment_failed: logs + sends email, does NOT downgrade (Stripe retries)
  - Sends welcome email on `subscription.created`
- **Task 4 — Insights tab (full rewrite):**
  - `app/(protected)/app/insights/page.tsx` — server component, branches on Pro status
  - Free: 5 teaser cards (locked), profile completeness gate (Wheel A < 5/5 shows "finish setup first"), UpgradeCTA
  - Pro: time-range toggle (7d/30d/all-time), 3 analytics cards with bar charts, cert expiry card, plan management
  - `components/insights/AnalyticsChart.tsx` — pure CSS bar chart (no external library)
  - `components/insights/UpgradeCTA.tsx` — monthly/annual plan toggle, calls Checkout API
  - `components/insights/InsightsUpgradedToast.tsx` — post-checkout success/pending toast, auto-refreshes if webhook hasn't fired
  - `components/insights/ManagePortalButton.tsx` — calls Portal API, redirects to Stripe
  - `app/(public)/u/[handle]/page.tsx` — added `record_profile_event('profile_view')` fire-and-forget call
- **Task 5 — Pro PDF templates:**
  - `components/pdf/ProfilePdfDocument.tsx` — added `PdfTemplate` type, `template` prop, dispatches to Classic Navy / Modern Minimal sub-components
  - Classic Navy: navy header band (#1B3A5C), gold accents (#C5A55A), Times-Roman serif font, gold dividers
  - Modern Minimal: teal hero band (#0D9488), Helvetica, generous whitespace
  - Both use built-in @react-pdf/renderer fonts only
  - `components/cv/CvActions.tsx` — template selector now interactive: free users click Pro templates → redirected to `/app/insights`; Pro users can switch and regenerate; `selectedTemplate` state wired to `generate-pdf` API call
- **Task 6 — Cert Document Manager:**
  - `app/(protected)/app/certs/page.tsx` — server component, fetches certs + Pro status, shows upgrade nudge for free users
  - `components/certs/CertsClient.tsx` — client component: expiry alert (Pro), filter tabs (All/Valid/Expiring/Expired), cert rows with status badges, document view/upload links
  - `lib/email/cert-expiry.ts` — cert expiry reminder email
  - `app/api/cron/cert-expiry/route.ts` — daily cron: finds Pro users' certs expiring ≤60 days, sends 60d + 30d reminders, marks flags
- **Task 7 — Custom subdomain routing:**
  - `middleware.ts` — detects `*.yachtie.link` (excluding `yachtie.link` + `www`), rewrites to `/u/{subdomain}`; runs before auth checks
- **Task 8 — Billing UI + emails + crons:**
  - `app/(protected)/app/more/page.tsx` — billing section: free users see upgrade link; Pro users see plan, renewal date, Manage Subscription button (Stripe Portal)
  - `lib/email/subscription-welcome.ts` — welcome email listing Pro features
  - `lib/email/payment-failed.ts` — payment failed email with portal link
  - `lib/email/analytics-nudge.ts` — one-time nudge email for free users with above-avg views
  - `app/api/cron/analytics-nudge/route.ts` — weekly Monday cron: finds free users with 2x avg views, sends one-time nudge, sets `analytics_nudge_sent = true`
  - `vercel.json` — cron schedule: cert-expiry at 09:00 UTC daily, analytics-nudge at 10:00 UTC Mondays
- **Task 9 — Migration `20260315000018_sprint7_payments.sql`:**
  - `users.analytics_nudge_sent` (boolean)
  - `certifications.expiry_reminder_60d_sent` + `expiry_reminder_30d_sent` (boolean)
  - `record_profile_event()`, `get_analytics_summary()`, `get_analytics_timeseries()`, `get_endorsement_request_limit()` RPCs
  - Index on `profile_analytics(user_id, event_type, occurred_at DESC)`
  - Index on `certifications(expires_at)` where not null
- **Build:** passes clean ✓ (all 45 routes)
- Note: Stripe API version auto-detected as `2026-02-25.clover` (matches installed SDK)

### Context
- Stripe client uses lazy proxy pattern to avoid module-level env throw at build time
- Endorsement request limit (20 Pro / 10 free) was already implemented in Sprint 5 API route
- Custom subdomain routing: middleware rewrites universally; only the displayed URL (Pro badge in UI) is gated
- Vercel wildcard DNS (`*.yachtie.link → CNAME cname.vercel-dns.com`) must be set up manually by founder
- All Pro email templates use `sendNotifyEmail` from existing `lib/email/notify.ts` (Resend, `notifications@mail.yachtie.link`)

### Next
- Founder: configure Stripe (product, prices, webhook) and add env vars to Vercel + `.env.local`
- Founder: set up `*.yachtie.link` wildcard DNS in Vercel + DNS provider
- Apply migration `20260315000018` to production
- Sprint 8 planning

### Flags
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `NEXT_PUBLIC_SITE_URL` must be added to Vercel env and `.env.local` before Stripe features work
- `CRON_SECRET` should be set in Vercel env for cron route security
- Stripe webhook must point to `https://yachtie.link/api/stripe/webhook` and subscribe to: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## 2026-03-15 — Claude Code (Opus 4.6) — Brand Palette, Style Guide & shadcn/ui

### Done
- Created **`/yl_style_guide.md`** (project root, above webapp) — full brand style guide documenting colour palette, typography, component styling, spacing, dark mode, and brand voice rules
- Replaced entire colour palette: navy/ocean/gold → **teal** (primary, #0D7377 at 700) + **sand** (accent, #E8DCC8) across all 29 files
- Swapped typography from Geist (Next.js default) to **DM Sans** via `next/font/google` — warmer personality, still clean
- Updated `globals.css` with new design tokens: teal-50→950, sand-100→400, updated semantic colours (interactive, info now teal-700)
- Updated dark mode overrides: interactive colour now teal-500 in dark mode for visibility
- Updated all UI components (Button, Toast) and 26 page/component files — zero remaining references to old palette
- **Installed shadcn/ui** (v4, base-nova style) with teal-themed CSS variables:
  - `--primary` → teal-700, `--secondary` → teal-50, `--accent` → sand-100, `--destructive` → #DC2626
  - Dark mode: `--primary` → teal-500 for visibility, surfaces from Slate palette
  - Charts themed in teal progression
  - `--radius: 0.75rem` (matches our rounded-xl convention)
- Added shadcn components: Dialog, Badge, Separator, Avatar, Tabs, Tooltip, Sheet, Skeleton, DropdownMenu
- Preserved custom YachtieLink components (Button with `loading` prop, Card, Input, Toast, BottomSheet, ProgressWheel) — shadcn components coexist alongside via barrel export
- Fixed shadcn's Button conflict: Dialog and Sheet close buttons inlined instead of depending on shadcn's Button (macOS case-insensitive FS conflict with our Button.tsx)
- Added `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge) — custom Button now uses it
- Updated barrel export in `components/ui/index.ts` — all custom + shadcn components available
- Build passes clean

### Context
- Design direction: "Clean & light with 25% maritime feel" — professional without being corporate, nautical without being cheesy
- Primary brand colour: teal-700 (`#0D7377`) — deep ocean feel, not generic corporate navy
- Sand accent for warmth (teak deck reference) — used sparingly on badges, Pro features, highlights
- No anchors, compass roses, wave backgrounds, or yacht-club aesthetics
- **shadcn/ui approach**: custom YachtieLink components (Button, Card, Input, Toast, BottomSheet, ProgressWheel) remain as-is for existing pages. New shadcn components (Dialog, Badge, Avatar, Tabs, etc.) available for new features. All share the same teal-themed CSS variables.
- **Button conflict**: shadcn wants to own `button.tsx` (lowercase) but macOS FS is case-insensitive. Our `Button.tsx` takes precedence. When adding new shadcn components that depend on button, answer "n" to overwrite prompt. Dialog and Sheet already patched to not import button.

### Next
- Logo/wordmark design needed (currently text-only)
- Clean up template assets in `/public` (vercel.svg, next.svg, etc.)
- Can add more shadcn components on demand: `npx shadcn add [component]` (answer "n" to button overwrite)

### Flags
- When running `npx shadcn add`, always decline the button.tsx overwrite prompt — our custom Button.tsx must be preserved

---

## 2026-03-15 — Claude Code (Opus 4.6) — AI Feature Registry + Priority Ratings

### Done
- Added **Languages** section to the Profile feature — multi-select with proficiency levels (Native/Fluent/Conversational/Basic), always visible, extracted from CV import. Updated profile section order to include Languages at position 2
- Added **Native Profile Sharing** as a new Phase 1A feature — Web Share API for native share sheet on mobile (WhatsApp, Telegram, iMessage, email, etc.), desktop fallback with deep links, prominent placement on public profile page
- Founder decision: work preferences (charter/private, yacht size, region) not added — not standard on CVs, and if someone is viewing a profile the candidate has already expressed interest
- Researched OpenAI API features comprehensively (models, vision, image gen, TTS/STT, embeddings, fine-tuning, Responses API, function calling, structured outputs, moderation, Realtime API, Agents SDK, pricing)
- Added 21 AI features (AI-01 through AI-21) to `docs/yl_features.md` in full feature registry format with What/Why/Tier/Cost/Phase/Status/Priority/Details
- Features span Free tier (moderation, endorsement helper, multilingual translation, yacht auto-complete, profile suggestions) and Pro tier (cert OCR, cert intelligence, season readiness, CV vision upgrade, endorsement advisor, gap analyzer, smart requests, profile insights, photo coach, cover letter, interview prep, job market pulse) plus Recruiter tier (NLP crew search, sentiment analysis) and one-time (voice onboarding)
- Enhanced **QR Code** feature with Pro-tier customisation — foreground/background colour pickers, transparent background toggle, SVG export, live preview, contrast validation, and global application (customised QR persists on profile page, generated PDFs, and downloads). Free tier gets two preset styles: black-on-white (default) and white-on-black (inverted)
- Added **Priority** field to ALL existing features in the registry (Phase 1A, 1B, 1C, 2+) — not just AI features
- Priority scale: "Must have" / "Nice to have" / "Only if we have lots of time"
- Bumped feature registry version from 2.0 to 3.0, date to 2026-03-15
- All AI features respect canonical monetisation law: AI improves presentation/convenience, never creates/suppresses/alters trust

### Context
- API strategy: single vendor (OpenAI), cheapest viable model per feature
- Free-tier AI cost target: <EUR 0.01/user/month; Pro-tier: <EUR 0.10/user/month
- Content moderation (AI-01) is completely free via OpenAI's moderation API — recommended to ship with launch
- Phase assignment: 3 AI features in 1A, 10 in 1B, 2 in 1C, 6 in 2+
- Key models: GPT-5 Nano for cheap text tasks, GPT-4o Mini for vision, text-embedding-3-small for semantic search, GPT-5/GPT-5 Mini for complex generation, Realtime API for voice

### Next
- Sprint 7 planning (Stripe integration)
- Consider adding AI-01 (content moderation) to Sprint 8 launch prep scope

### Flags
- None

---

## 2026-03-15 — Claude Code (Opus 4.6) — Sprint 6: Public Profile + CV

### Done
- Created `feat/sprint-6` branch from updated `main`
- **Task 1 — Dependencies + Migration:**
  - Installed: `openai`, `pdf-parse`, `mammoth`, `@react-pdf/renderer`, `qrcode`, `@types/pdf-parse`, `@types/qrcode`
  - Migration `20260315000017_sprint6_cv_storage.sql`: `cv-uploads` + `pdf-exports` buckets, owner-only RLS, user columns (`cv_storage_path`, `cv_parsed_at`, `cv_parse_count_today/reset_at`, `latest_pdf_path/generated_at`), `check_cv_parse_limit` RPC (3/day)
  - Added `uploadCV` + `getPdfExportUrl` to `lib/storage/upload.ts`
  - Updated `docs/yl_storage_plan.md` — moved `cv-uploads` and `pdf-exports` from future to active
  - `lib/cv/prompt.ts` — extraction prompt constant (shared across providers)
  - Added `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` placeholders to `.env.local`
- **Task 2 — Public Profile Page:**
  - `app/(public)/u/[handle]/page.tsx` — full rewrite: server-rendered, parallel data fetch, all sections (hero, about, contact with visibility, employment history, certs with expiry status, endorsements, QR code)
  - `generateMetadata` with OG + Twitter card tags
  - `components/public/PublicProfileContent.tsx` — shared component used by both `/u/:handle` and `/app/cv`
  - `components/public/EndorsementCard.tsx` — collapsible endorsement with 150-char truncation
- **Task 3 — CV Tab:**
  - `app/(protected)/app/cv/page.tsx` — full rewrite: profile preview + actions
  - `components/cv/CvActions.tsx` — share link, PDF generate/download/regenerate, CV upload link, QR code toggle/download, template selector (Standard free, 2 Pro locked)
- **Task 4 — CV Upload + AI Parsing:**
  - `app/(protected)/app/cv/upload/page.tsx` + `components/cv/CvUploadClient.tsx` — drag-and-drop upload, client-side validation, upload to Supabase Storage, call parse API, navigate to review
  - `app/api/cv/parse/route.ts` — auth, rate limit via `check_cv_parse_limit` RPC, download file via service role, extract text (pdf-parse for PDF, mammoth for DOCX), call OpenAI GPT-4o-mini with JSON mode, graceful error handling (timeout, malformed, rate limit)
  - `app/(protected)/app/cv/review/page.tsx` + `components/cv/CvReviewClient.tsx` — review parsed data, editable profile fields (respects existing data), yacht dedup via `search_yachts` RPC, cert type matching, save to profile
- **Task 5 — PDF Generation:**
  - `app/api/cv/generate-pdf/route.ts` — auth, Pro check for non-standard templates, parallel data fetch, QR via `qrcode` (Node.js), render via `@react-pdf/renderer`, upload to `pdf-exports`, signed URL return
  - `app/api/cv/download-pdf/route.ts` — auth, fetch `latest_pdf_path`, generate signed URL
  - `components/pdf/ProfilePdfDocument.tsx` — `@react-pdf/renderer` layout: header with photo, about, contact, employment, certs, top 3 endorsements (truncated 200 chars), QR code, watermark for free tier
- **Task 6 — Share/Actions wired up** in CvActions component
- **Task 7 — Docs updated** (storage plan)
- Build passes clean with all new routes

### Context
- **Switched from Anthropic to OpenAI** — founder decision: one vendor, one bill, more optionality (Whisper, vision, embeddings for future). CV parsing now uses `gpt-4o-mini` with `response_format: { type: 'json_object' }` for guaranteed valid JSON. Cost: ~$0.005/parse.
- Migration `20260315000017` **needs applying to production** before CV features work
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` need real values in `.env.local` and Vercel
- PDF generation uses service role Supabase client (bypasses RLS for storage operations)
- CV parse rate limit: 3/day per user via DB function
- pdf-parse v2 uses `PDFParse` class (not default export) — `new PDFParse({ data: Uint8Array })`
- `AGENTS.md` updated: pre-commit changelog update is now a CRITICAL blocking requirement

### Next
- Apply migration 017 to production
- Set real API keys (OpenAI + Supabase service role) in `.env.local` and Vercel
- End-to-end testing of all flows
- Sprint 7 planning

### Flags
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must be set before CV parsing / PDF generation will work
- Email confirmation still disabled in Supabase — re-enable before go-live

---

## 2026-03-14 — Claude Code (Sonnet 4.6) — Sprint 5 polish

### Done
- Migration 016 applied to production: (a) updated `get_endorsement_request_by_token` RPC to include `requester_attachment` (role, start/end dates) for prefill; (b) partial unique index `endorsement_requests_no_duplicate_pending` prevents requester sending duplicate active requests
- `app/api/endorsement-requests/[id]/route.ts`: added `decline` action for recipients — sets status to cancelled, checked against `recipient_user_id` not `requester_id`
- `app/(public)/r/[token]/page.tsx`: passes `requesterAttachment` to DeepLinkFlow; prefer `full_name` over `display_name` (username) throughout
- `components/endorsement/DeepLinkFlow.tsx`: (a) added `already-endorsed` state — checks DB before showing form, shows clear message if duplicate; (b) passes `prefillRecipientRole` from requester attachment to write form; (c) seeds add-yacht date fields from requester attachment dates; (d) prefer `full_name` for all name display
- `components/audience/AudienceTabs.tsx`: extracted `ReceivedRequestCard` — adds Decline button on pending received requests (calls decline action, removes card optimistically); prefer `full_name` for requester name display

### Next
- PR #28 open: all hotfixes → `main` — merge when Vercel is green
- Sprint 6: to be planned

### Flags
- Email confirmation still disabled in Supabase. Re-enable before go-live.

---

## 2026-03-14 — Claude Code (Sonnet 4.6) — Sprint 5: Endorsement Loop (Tasks 1-3)

### Done
- Created `feat/sprint-5` branch from `feat/sprint-4`
- Migration `20260314000012_sprint5_endorsements.sql`: `cancelled_at` + `recipient_phone` on `endorsement_requests`; `endorsement_requests_today(uuid)` rate-limit RPC; 3 performance indexes — **needs applying to production**
- `app/api/endorsement-requests/[id]/route.ts`: merged GET (lookup by token, no auth) + PUT (cancel/resend by UUID, auth required) into single route — fixes Next.js ambiguous route error
- `app/api/endorsements/route.ts`: POST (create with coworker check, 403/409/400 guards, request-token acceptance, notify email) + GET (list by user_id)
- `app/api/endorsements/[id]/route.ts`: PUT (edit own) + DELETE (soft-delete own)
- Updated `app/api/endorsement-requests/route.ts`: rate limiting, `recipient_phone`, returns `token` + `deep_link`
- `components/endorsement/WriteEndorsementForm.tsx`: reusable create/edit form — char counter, collapsible optional details, success state, explicit 409/403 error handling
- `components/endorsement/DeepLinkFlow.tsx`: 3-step state machine — checks attachment → add-yacht step → WriteEndorsementForm. Correctly maps `requester_id` → `recipient_id`.
- `app/(public)/r/[token]/page.tsx`: server component rewrite — 404/expired/cancelled/unauthed/authed states; unauthed shows request context + sign-in/sign-up CTAs with `returnTo`
- `middleware.ts`: `returnTo` preservation when bouncing unauthenticated users; respects `returnTo` on auth-only route redirect
- `app/(auth)/login/page.tsx`: `returnTo` redirect post-login, passed through to signup link
- `app/(auth)/signup/page.tsx`: `returnTo` passed as `next` param in email callback URL
- Build passes clean. Committed and pushed to `feat/sprint-5`.

### Context
- CRITICAL naming (must hold for Tasks 4-6): `endorsement_requests.requester_id` = person who WANTS endorsement = `endorsements.recipient_id`. Person clicking `/r/:token` = endorser = `endorsements.endorser_id`.
- GET `/api/endorsement-requests/:token` — the `[id]` route handles this. URL param is raw token hex string for GET, UUID for PUT.
- `returnTo` flow: `/r/:token` → unauthed → `/login?returnTo=%2Fr%2F{token}` → login → back to `/r/:token`.
- Migration 012 **not yet applied to production**. All rate-limited routes will 500 until it is.

### Also done (same session, Tasks 4-6)
- `app/(protected)/app/endorsement/request/page.tsx` + `RequestEndorsementClient.tsx`: request UI — parallel data fetch (yacht, colleagues, existing requests, rate limit), manual email chips, rate-limit display, shareable link section after first send
- `components/audience/AudienceTabs.tsx`: client tab component — Wheel B progress card (endorsements/5) with BottomSheet CTA, segment toggle (Endorsements | Colleagues), requests-received list with "Write endorsement" CTA, endorsements-received list, requests-sent list with status pills
- `components/audience/RequestActions.tsx`: cancel/resend buttons — calls PUT /api/endorsement-requests/:id, router.refresh() on success
- `app/(protected)/app/audience/page.tsx`: full rewrite — parallel fetch of all 5 data sets, passes to AudienceTabs
- `app/(protected)/app/endorsement/[id]/edit/page.tsx` + `EditEndorsementClient.tsx`: ownership-checked edit page, WriteEndorsementForm in edit mode, delete with BottomSheet confirmation → DELETE /api/endorsements/:id
- `components/profile/EndorsementsSection.tsx`: added `endorser_id` + `currentUserId?` prop — shows "Edit" link for own endorsements
- Migration 012 applied to production ✓
- Build passes clean. All Sprint 5 tasks complete.

### Also done (same session — bug fixes)
- `app/(public)/r/[token]/page.tsx`: replaced HTTP self-fetch with direct Supabase query. Old code fetched `NEXT_PUBLIC_APP_URL/api/endorsement-requests/:token` server-side; on preview deployments this resolved to production (`https://yachtie.link`) which didn't have the Sprint 5 routes yet → 404 on every deep link click. Fix queries the DB directly — simpler, no env var dependency, works on all deployments.
- Same file: fixed TypeScript build errors — Supabase infers joined columns as arrays so casts must go through `unknown` first. Build now passes clean.
- PR #27 opened and merged: `feat/sprint-5` → `main` (covers Sprints 3–5)
- **Root cause of persistent 404 found**: `endorsement_requests` RLS has no public-read policy — anon key cannot read the table even with a valid token. The original design noted this as "handled in API route" (implying service role) but the API route also used the anon key. Fixed with migration 013.
- `supabase/migrations/20260314000013_endorsement_token_lookup.sql`: `SECURITY DEFINER` RPC `get_endorsement_request_by_token(p_token text)` — bypasses RLS, returns exactly the one matching row with joined requester + yacht data. Granted to `anon` and `authenticated`. **Needs applying to production.**
- `app/(public)/r/[token]/page.tsx`: updated to use the new RPC instead of direct table query.

- **Pending requests not appearing in Audience tab** — two root causes:
  1. RLS had no policy for `auth.email() = recipient_email` so rows were blocked even when the audience query filtered by email
  2. `recipient_user_id` was never set at insert time, so the existing `recipient_user_id` policy never matched
- `supabase/migrations/20260314000014_link_requests_to_recipients.sql`: idempotent — (a) RLS policy `endorsement_requests: recipient email read`; (b) trigger `on_user_created_link_endorsements`. Applied to production ✓ via `npx supabase db push`
- `supabase/migrations/20260314000015_backfill_recipient_user_ids.sql`: one-off backfill — links all historical requests to existing user accounts. Applied to production ✓
- `app/api/endorsement-requests/route.ts`: at insert time, look up existing user by email and set `recipient_user_id` immediately
- `components/audience/AudienceTabs.tsx`: copy tweak — "Collecting up to 5" → "Collecting 5 or more"
- Supabase CLI (`supabase` npm package) installed and linked to prod — future migrations use `npx supabase db push` instead of copy-pasting SQL
- `app/api/endorsements/route.ts`: fixed wrong RPC parameter names on `are_coworkers_on_yacht` — was `p_user_a`/`p_user_b`/`p_yacht_id`, function expects `user_a`/`user_b`/`yacht`. Caused every endorsement submission to 403.

### Next
- PR #28 open: all hotfixes → `main` — merge once Vercel is green
- Sprint 6: to be planned

### Flags
- Email confirmation still disabled in Supabase. Re-enable before go-live.
- Migration 013 must be applied before deep links work on production.


## 2026-03-14 — Claude Code (Sonnet 4.6) — Sprint 4: Yacht Graph

### Done
- Created `feat/sprint-4` branch from `feat/sprint-3`
- Migration `20260314000011_yacht_sprint4.sql`: `cover_photo_url` on `yachts`, `yacht_near_miss_log` table, `search_yachts` fuzzy RPC (trigram), `yacht-photos` storage bucket (public, 5MB, crew-attachment-gated RLS) — applied to production
- Created `lib/storage/yacht.ts`: `uploadYachtCoverPhoto`, `sizeFromLength`, `FLAG_STATES`
- Built `components/yacht/YachtPicker.tsx`: reusable search+create with duplicate detection — fuzzy match on create; similarity ≥ 0.45 shows BottomSheet with candidates; logs near-miss to `yacht_near_miss_log`
- Built `app/attachment/new`: 3-step flow — YachtPicker → role picker (dept filter + search + custom fallback) → dates
- Built `app/attachment/[id]/edit`: pre-filled edit of role/dates, soft-delete with double-confirm
- Built `app/yacht/[id]`: yacht detail — cover photo (attachment-gated upload CTA), metadata, crew count, crew list with avatars
- Built `app/yacht/[id]/photo`: cover photo upload (upsert to `yacht-photos`, saves CDN URL to `yachts.cover_photo_url`)
- Replaced `app/audience` placeholder: `get_colleagues` RPC → profile + yacht lookup → colleague cards with shared yacht label and "Endorse" shortcut
- Fixed `YachtsSection`: `/u/:yacht_id` → `/app/yacht/:yacht_id`
- Added `.obsidian/` to `.gitignore`
- Build passes clean: zero TypeScript errors. Committed and pushed to `feat/sprint-4`.

### Context
- `search_yachts` uses pg_trgm (0.45 threshold for dupe detection). Near-misses logged for Phase 2 merge tooling.
- `yacht-photos` RLS: extracts `yacht_id` from path `(string_to_array(name, '/'))[1]::uuid`, checks `attachments` table.
- Colleague graph derived on access via `get_colleagues` — not stored.

### Next
- Merge `feat/sprint-4` → `main`
- Sprint 5: Endorsements — request flow, `/r/:token` deep link, write endorsement, email + WhatsApp share, Audience tab inbox

### Flags
- Email confirmation still disabled in Supabase. Re-enable before go-live.
- Supabase redirect URLs: confirm `https://yachtie.link/**` and Vercel preview URLs are in allowed list.

## 2026-03-14 — Claude Code (Sonnet 4.6) — Sprint 3 close + Sprint 4 pre-planning

### Done
- Diagnosed and fixed production env var issue: Vercel had staging Supabase keys — updated to production `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Added missing Vercel env vars: `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL=https://yachtie.link`
- Diagnosed onboarding handle step bug: `handle_available` and all other public RPC functions were missing `GRANT EXECUTE` to `anon`/`authenticated` roles — silently returning null, keeping Continue button permanently disabled
- Created and applied migration `20260314000010_grant_rpc_execute.sql`: grants `EXECUTE` on all public RPC functions to `anon` and `authenticated` — no redeploy needed, database-only fix
- Sprint 4 pre-planning discussion with founder: agreed yacht graph is pure infrastructure in Phase 1A (not visual, not discovery)
- Decided yacht merging stays deferred to Phase 2 — invest in creation-time duplicate prevention instead
- Decided: duplicate detection prompt on yacht creation (fuzzy match → confirmation if close match found). Near-miss events logged.
- Decided: single cover photo per yacht in Sprint 4 (attachment-gated). Full multi-photo gallery deferred to Phase 1B Sprint 11.
- Updated `docs/yl_build_plan.md`: Sprint 4 scope + Phase 1B Sprint 11 gallery
- Updated `docs/yl_features.md`: Yacht Entities section with dupe prompt, cover photo, gallery
- Updated `docs/yl_storage_plan.md`: `yacht-photos` bucket moved from Phase 1B+ to Sprint 4
- Updated `docs/yl_decisions.json`: added D-037, D-038, D-039
- All changes committed and pushed to `feat/sprint-3`

### Context
- Supabase domain for production: `xnslbbgfuuijgdfdtres.supabase.co`
- Sprint 3 was already merged to `main` as PR #20 before this session. The `feat/sprint-3` branch still open for the hotfix migration and pre-planning docs.
- The handle availability fix (migration 000010) is live in production — no redeploy needed
- Vercel is connected to GitHub — every push to any branch gets a preview URL, `main` deploys to `yachtie.link`

### Next
- Merge `feat/sprint-3` to `main` (or open as a new PR for the hotfix + planning docs)
- Create `feat/sprint-4` branch
- Sprint 4: Yacht Graph — yacht entities, attachment management, colleague graph, duplicate detection prompt, cover photo upload

### Flags
- Email confirmation still disabled in Supabase (turned off during development). Re-enable before go-live: Supabase → Authentication → Providers → Email → Confirm email ON
- Supabase redirect URLs: ensure `https://yachtie.link/**` and both Vercel preview URLs are in the allowed list

---

## 2026-03-14 — Claude Code (Sonnet 4.6) — Sprint 3: Profile

### Done
- Created `feat/sprint-3` branch from `main`
- Installed `react-image-crop` and `react-qr-code` npm packages
- Migration `20260314000009_storage_buckets.sql`: created `profile-photos` (public, 5 MB, JPEG/PNG/WebP) and `cert-documents` (private, 10 MB, PDF/JPEG/PNG) buckets with full RLS policies — applied to production
- Created `docs/yl_storage_plan.md`: canonical reference for all storage buckets, path conventions, signed URL pattern, future bucket plan, security notes
- Created `lib/storage/upload.ts`: client-side helpers — `uploadProfilePhoto` (validates, resizes to 800px, converts to WebP, uploads to `profile-photos`), `uploadCertDocument` (validates, uploads to `cert-documents`, returns storage path not URL), `getCertDocumentUrl` (generates 1-hour signed URL at render time)
- Built `components/profile/IdentityCard.tsx`: photo (tap → `/app/profile/photo`), display name, role, departments, profile link + copy, QR code toggle + SVG download
- Built `components/profile/WheelACard.tsx`: 5-milestone progress wheel, taps to BottomSheet checklist with deep links to each missing milestone
- Built `components/profile/AboutSection.tsx`: bio display with Edit/Add CTA
- Built `components/profile/YachtsSection.tsx`: reverse-chronological list, expand to view yacht / request endorsements / edit attachment
- Built `components/profile/CertsSection.tsx`: cert list with valid/expiring-soon/expired/no-expiry status pills, edit links
- Built `components/profile/EndorsementsSection.tsx`: endorsed list with excerpt, endorser name, yacht, date
- Rewrote `app/(protected)/app/profile/page.tsx`: server component, fetches profile + attachments + certs + endorsements in parallel, computes Wheel A milestones, floating "Complete next step" / "Share profile" CTA
- Created `app/(protected)/app/profile/photo/page.tsx`: `react-image-crop` circular crop UI, canvas resize to 800×800, WebP conversion, uploads via `uploadProfilePhoto`, saves CDN URL to `users.profile_photo_url`
- Created `app/(protected)/app/about/edit/page.tsx`: full-screen textarea, 500 char limit with live counter, saves to `users.bio`
- Created `app/(protected)/app/profile/settings/page.tsx`: phone, WhatsApp, email, location (country dropdown + city), per-field visibility toggles
- Created `app/(protected)/app/certification/new/page.tsx`: 3-step flow — category picker → cert picker → details (issued/expiry dates, no-expiry checkbox, optional document upload). "Other" free-text fallback at both levels, logs `other_cert_entries`
- Created `app/(protected)/app/certification/[id]/edit/page.tsx`: edit issued/expiry dates, replace document, delete certification
- Rewrote `app/(protected)/app/more/page.tsx`: theme switcher (system/light/dark), account settings, contact info link, billing placeholder, help/feedback, legal placeholders, sign out
- Created `app/(protected)/app/more/account/page.tsx`: edit full name, display name, handle (live availability check + debounce), department multi-select, role picker with custom fallback

### Context
- All DB fields for Sprint 3 already existed in the Sprint 1 schema — no data migrations needed
- `cert-documents` is private by design; call `getCertDocumentUrl(storagePath)` at render time to generate a 1-hour signed URL — never store signed URLs in the DB
- `profile-photos` is public; CDN URL stored in `users.profile_photo_url` with `?t={timestamp}` cache-bust suffix
- Build passes cleanly: 22 routes, zero TypeScript errors

### Next
- Sprint 4: Yacht Graph (yacht detail view, attachment management, colleague derivation)

### Flags
- None

---

## 2026-03-13 — Claude Code (Sonnet 4.6) — Sprint 2 close: endorsement request emails

### Done
- Created `app/api/endorsement-requests/route.ts` — POST endpoint that:
  - Authenticates the caller via Supabase session cookie
  - Inserts to `endorsement_requests` and reads back the auto-generated token
  - Fetches the requester's display name from `users`
  - Sends the notification email via `sendNotifyEmail` (non-fatal if email fails — token already saved)
  - Handles duplicate requests gracefully (unique constraint → 200 `skipped: true`)
- Updated `StepEndorsements` in `Wizard.tsx` to call the API route instead of direct DB inserts — recipients now actually receive an email
- Added `NEXT_PUBLIC_APP_URL=https://yachtie.link` to `.env.local`
- Sprint 2 deliverable now complete: new user can sign up, complete onboarding, have a profile with one yacht attached, and send endorsement requests that reach their colleagues

### Context
- Email is non-fatal by design — if Resend fails, the request token is already in DB and can be resurfaced later (Sprint 5 resend UI)
- Deep link format: `https://yachtie.link/r/{token}` — `/r/[token]` route is a stub until Sprint 5
- Welcome email is still unimplemented (lower priority, deferred to Sprint 3 or 8)

### Next
- Sprint 3: Profile (photo, about, certs, contact info, settings)

### Flags
- None

---

## 2026-03-13 — Claude Code (Sonnet 4.6) — Onboarding role step UX + email fix

### Done
- Migration `20260313000008_add_crossdept_roles.sql`: added `Deck/Stew` (Deck dept, sort_order 110) and `Stew/Deck` (Interior dept, sort_order 209) — applied to production
- `StepRole` in `components/onboarding/Wizard.tsx` — full rewrite:
  - Department selection is now **single-select** (was multi)
  - Specialist roles (Nanny, Dive Instructor, etc.) moved behind a collapsible "Other" toggle — no longer mixed into the main list
  - Multi-department grouped view removed (no longer needed)
- Fixed `reply_to` → `replyTo` typo in `lib/email/notify.ts` (was causing a TypeScript error)

### Context
- Cross-department dual roles (Deck/Stew, Stew/Deck) are an explicit DB entry rather than a multi-select UI approach — cleaner and less common in practice now
- Single-select department keeps onboarding fast; profile editing can expose more flexibility later if needed

### Next
- Wire first real notification email when endorsement feature ships (Sprint 5)

### Flags
- None

---

## 2026-03-13 — Claude Code (Sonnet 4.6) — Email infrastructure

### Done
- Installed `resend` npm package
- Created `lib/email/` two-pipeline architecture:
  - `client.ts` — shared Resend singleton, fails fast if `RESEND_API_KEY` not set
  - `auth.ts` — auth pipeline, sender: `login@mail.yachtie.link` (magic links, password reset, verification, invitations)
  - `notify.ts` — notification pipeline, sender: `notifications@mail.yachtie.link` (endorsements, profile views, alerts)
  - `index.ts` — barrel export, only intended import point for app code
- Added `RESEND_API_KEY` to `.env.local` (key active)
- Created `docs/yl_email_setup.md` — full setup checklist covering DNS, Supabase SMTP config, Vercel env vars, code usage, and Postmark migration path
- Updated `docs/yl_tech_stack.md` — Transactional Email row now reflects two-pipeline architecture and sending domain
- DNS: `mail.yachtie.link` verified on Cloudflare with Resend SPF/DKIM records — domain ready to send

### Context
- Supabase auth emails (magic link, password reset, email confirmation) route through Resend SMTP — configured in Supabase dashboard, not in app code
- `sendAuthEmail` in code is for auth emails sent directly from the app (e.g. invitations)
- `RESEND_API_KEY` still needs to be added to Vercel env vars before production sends work
- Supabase SMTP setting (dashboard: Auth → SMTP) still needs to be configured pointing at `smtp.resend.com` with the API key
- Postmark is the documented upgrade path — only `lib/email/client.ts` would change

### Next
- Configure Supabase SMTP in dashboard (Auth → SMTP Settings → smtp.resend.com, port 465, user: resend, pass: API key, from: login@mail.yachtie.link)
- Add `RESEND_API_KEY` to Vercel environment variables
- Wire first real notification email when endorsement feature ships (Sprint 5)

### Flags
- None

---

## 2026-03-13 — Claude Code (Sonnet 4.6) — Sprint 1

### Done
- Created `feat/sprint-1` branch from main
- Installed Supabase CLI v2.78.1 (via direct binary download to `~/bin/supabase`) + ran `supabase init`
- Wrote 7 database migrations to `supabase/migrations/` and applied all to production (`xnslbbgfuuijgdfdtres`):
  - `000001_extensions.sql` — pg_trgm, unaccent, pgcrypto, uuid-ossp, internal schema
  - `000002_reference_tables.sql` — departments, roles, certification_types, templates, other_role_entries, other_cert_entries
  - `000003_core_tables.sql` — users (handle, onboarding_complete, departments[], subscription fields), yachts (yacht_type: 'Motor Yacht'/'Sailing Yacht'), attachments (role_label for "Other" entries), endorsements, endorsement_requests (token + 30-day expiry), certifications (custom_cert_name fallback), profile_analytics, internal.flags. Fixed: schema-qualified `extensions.gen_random_bytes()` (Supabase puts pgcrypto in extensions schema, not public)
  - `000004_functions.sql` — handle_new_user trigger, set_updated_at triggers, are_coworkers, are_coworkers_on_yacht, yacht_crew_count, get_yacht_crew_threshold, check_yacht_established, get_colleagues, handle_available, suggest_handles
  - `000005_rls.sql` — RLS on every table (reference tables: public read; users: public read + own update; yachts: public read + authenticated create; attachments/endorsements/endorsement_requests/certifications: owner-scoped writes; analytics: own read + public insert; internal.flags: no user access)
  - `000006_seed_reference.sql` — 7 departments, 56 roles across 8 departments (Other entries tracked separately), 57 cert types across 8 categories, 3 templates. Note: "Purser" removed from Interior seed (kept in Admin/Purser only) pending constraint fix in 000007
  - `000007_fix_roles_constraint.sql` — dropped unique constraint on `roles.name`, added unique on `(name, department)`, re-inserted Interior Purser (sort_order 205)
- Updated `app/globals.css` — brand token system (navy, ocean, gold palettes), semantic CSS vars with dark overrides, dark mode via `.dark` class variant, tab bar helpers
- Updated `app/layout.tsx` — YachtieLink metadata, viewport config, inline dark mode init script (reads localStorage, falls back to system preference, no FOUC)
- Built app shell:
  - `app/page.tsx` — root redirect (auth check → /app/profile or /welcome)
  - `app/(protected)/app/layout.tsx` — authenticated layout with auth gate + BottomTabBar
  - `app/(protected)/app/{profile,cv,insights,audience,more}/page.tsx` — placeholder pages
  - `app/(auth)/layout.tsx` — auth layout (redirects signed-in users to /app/profile)
  - `app/(auth)/welcome/page.tsx` — landing/auth method selection (email only; Google/Apple commented as placeholders)
  - `app/(auth)/login/page.tsx` — email/password sign-in form
  - `app/(auth)/signup/page.tsx` — email/password signup with email verification confirmation screen
  - `app/(auth)/reset-password/page.tsx` — sends Supabase reset email with redirectTo `/auth/callback?next=/update-password`
  - `app/(auth)/update-password/page.tsx` — new password form, calls `supabase.auth.updateUser({ password })`, redirects to /app/profile on success
- Built auth infrastructure:
  - `lib/supabase/middleware.ts` — middleware Supabase client
  - `middleware.ts` — route protection (PROTECTED_PREFIXES → /welcome; AUTH_ONLY_PREFIXES → /app/profile)
  - `app/auth/callback/route.ts` — PKCE code exchange, handles error params, safe redirect
- Built base component library in `components/ui/`:
  - `Button.tsx` — 4 variants (primary/secondary/ghost/destructive), 3 sizes, loading spinner
  - `Card.tsx` — Card, CardHeader, CardTitle, CardBody; interactive prop for tappable cards
  - `Input.tsx` — label, hint, error, suffix; accessible with aria-describedby/aria-invalid
  - `Toast.tsx` — ToastProvider + useToast hook; 3 types; 4-second auto-dismiss
  - `BottomSheet.tsx` — fixed bottom drawer with backdrop, drag handle, Escape key, body scroll lock
  - `ProgressWheel.tsx` — SVG ring for profile completion (Wheel A) and endorsements (Wheel B)
  - `index.ts` — barrel export
- Built `components/nav/BottomTabBar.tsx` — 5 tabs (Profile, CV, Insights, Audience, More), active state, outline/filled icon pairs, safe-area aware
- Built public route shells: `/u/[handle]` (public profile, Sprint 6) and `/r/[token]` (endorsement deep link, Sprint 5)
- Build passes cleanly. All routes correct: `/app/profile`, `/app/cv`, etc.
- PR merged to main ✓

### Context
- OAuth (Google, Apple) deliberately excluded — founder decision: email/password only until paying users justify the setup cost. OAuth is commented in `welcome/page.tsx` for easy re-activation
- Production Supabase project ref: `xnslbbgfuuijgdfdtres`. Staging: `zsxmlcksbxlvbptnxiok`. Both in `.env.local` (production active, staging commented)
- Reset password redirect requires the app URL to be whitelisted in Supabase dashboard → Authentication → URL Configuration → Redirect URLs. Add: `http://localhost:3000/**` for local dev, production URL when deployed
- `yl_schema.md` is out of date (v1.1, 2026-01-28) — migrations are the source of truth
- Key schema decisions: `yacht_type` = 'Motor Yacht'/'Sailing Yacht'; `departments[]` array on users; `role_label` on attachments; `endorsement_requests` table added; `handle` field with format constraint; subscription fields on users (ready for Sprint 7); `other_role_entries`/`other_cert_entries` for "Other" tracking

### Next
- Start Sprint 2: onboarding flow (name → handle → department/role → yacht → endorsement requests → done)
- Add production URL to Supabase redirect URLs whitelist once deployed (needed for reset password email link to work end-to-end)

### Flags
- `yl_schema.md` is now out of date — low priority, migrations are source of truth
- `~/bin/supabase` is not on PATH — use full path or add `~/bin` to PATH
- Reset password flow UI is complete but email link will 404 until the app is deployed and the redirect URL is whitelisted in Supabase dashboard

---

## 2026-03-13 — Claude Code (Opus 4.6)

### Done
- Comprehensive feature clarification session with founder — 33 questions answered covering auth, onboarding, profile, yachts, endorsements, CV/PDF, payments, notifications, and UX
- Rewrote `docs/yl_features.md` (v1.1 → v2.0) — all Phase 1A features now have detailed implementation specs including:
  - Email verification required for email/password accounts
  - Department multi-select (7 departments including Medical, Admin/Purser, Land-based)
  - Full seeded role list by department with "Other" tracking mechanism
  - Full seeded certification type list with hierarchical tree UI for selection
  - Certifications: document upload for all users, document manager + expiry alerts for Pro
  - Yacht type limited to Motor Yacht / Sailing Yacht, length in exact metres, flag state dropdown, year built optional
  - Endorsement request expiry: 30 days
  - Endorsement signals moved to Phase 1B
  - Contacts import deferred to native app
  - Pro pricing: EUR 12/month or EUR 9/month annual (no free trial — free tier is the trial)
  - Custom subdomain is alias (both URLs active)
  - Profile analytics as time-series (7d/30d/all time)
  - PDF includes top 3 endorsements + QR code
  - Dark mode from launch
  - Notification strategy: email only for webapp, in-app deferred to native
- Added Reference Data section to `yl_features.md` — departments, roles, cert types, yacht types, flag states
- Rewrote `docs/yl_build_plan.md` (v1.0 → v2.0) — all sprints updated to reflect clarified features
- Rewrote `docs/yl_mobile_first_ux_spec_for_pm_v1.md` (v1.0 → v2.0) — stripped deferred features (Timeline, Contacts, IRL), updated all screens with new details, added deferred section at bottom
- Cleaned up parent folder: moved redundant `Project Files/`, `Config/`, `files/`, `files.zip` into `Archived/pre_webapp_cleanup_2026-03-13/`
- Archived `yachtielink.webapp 2` (confirmed identical older snapshot of webapp)

### Context
- All three core docs (features, build plan, UX spec) are now at v2.0 and aligned with each other
- Feature registry is now the definitive "what and why" — build plan is "how and when" — UX spec is "exact screens and flows"
- Founder will provide PDF template reference sample during Sprint 6

### Next
- Start Sprint 1: database migrations (with full reference data seeding), RLS policies, auth setup (with email verification), app shell, dark mode, base components
- Apple Developer Account setup still needed for Apple OAuth
- Sonnet is sufficient for Sprint 1 (mechanical work). Reserve Opus for Sprint 5 (endorsement deep links), Sprint 6 (CV parsing prompts), Sprint 7 (Stripe webhooks)

### Flags
- Cert type seed list is large but non-exhaustive — "Other" tracking mechanism needed from day 1 to capture edge cases
- Role seed list same — track "Other" entries for periodic promotion into seed list
- Contacts import documented for future native app implementation

---

## 2026-03-10 — Claude Code (Codex GUI session)

### Done
- Created `docs/yl_features.md` — feature registry covering all 25 features across Phase 1A/1B/1C/2+ with what, why, phase assignment, and crew-first notes. New canonical reference doc.
- Restructured `AGENTS.md` — now the primary instruction set for all coding agents (Claude Code, Cursor, Codex, Copilot). Includes persona, workflow, code standards, and decision principles.
- Restructured `CLAUDE.md` — now a thin Claude Code-specific wrapper that defers to `AGENTS.md`.
- Softened language across all agent-facing docs — replaced hard prohibitions ("never", "irreversible", "constitutional", "rejected/never-build") with crew-first principles and flag-and-ask behaviour. Agents surface concerns to founder rather than blocking unilaterally.
- Updated `yl_phase1_execution.md` — "Hard Constraints" → "Guiding Principles", language softened throughout.
- Updated `yl_system_state.json` — `phase_invariants` softened.
- Created `notes/delta_canonical_vs_root_2026-03-09.md` — full diff of docs/canonical/ (from PR #9) vs root-level docs. Documents all meaningful differences for founder review before any content is merged.
- Added `.claude/worktrees/` to `.gitignore`.
- Discovered and resolved branch staleness — our branch was behind by 4 PRs. Merged origin/main, no manual conflicts.
- Switched GitHub remote from SSH to HTTPS — SSH keys weren't configured, GitHub CLI now handles auth.
- Opened PR #11 — all session work pushed to `feat/project-setup`.
- Clarified changelog format: one entry per session (not per day, not per alteration), reading rule is "last 3 sessions", updated both `AGENTS.md` and `CHANGELOG.md` header to reflect this.

### Context
- `docs/canonical/` (from PR #9) is a historical baseline from 2026-02-11. Root-level `docs/` is the working set. Do not overwrite root docs with canonical versions without founder review.
- The delta notes doc flags specific conflicts to resolve — notably D-016 (paid verified status path exists in canonical, removed in root as crew-first violation), recruiter pricing detail, and bootstrapping plan missing from root.
- `yl_features.md` was built from the root docs. Some Phase 1C details (recruiter pricing, full Crew Pro feature list) are more complete in `docs/canonical/` — pending founder review of delta notes before incorporating.

### Next
- Founder to review `notes/delta_canonical_vs_root_2026-03-09.md` and decide what to adopt
- Merge PR #11 once reviewed
- Set up git global user.name and user.email (commits currently attributed to ari@MacBookAir.net)
- Begin Sprint 1: database migrations, RLS policies, app shell, base components

### Flags
- `yl_features.md` is a good working doc but Phase 1C descriptions (recruiter access, Crew Pro full feature list) should be reconciled against `docs/canonical/yl_phase_scope.json` once delta review is done
- The 2026-03-08 warning about constitutional principles being non-negotiable has been intentionally softened — principles are now guidelines with flag-and-ask behaviour, founder makes final calls

---

## 2026-03-09 — Claude Code

### Done
- Created 5-year revenue strategy doc (`notes/5yr_plan_10m_arr.md`) — brainstorming, non-canonical
- Created `notes/` directory with README explaining it's non-critical brainstorming
- Created `docs/yl_build_plan.md` — canonical sprint-by-sprint build plan for Phase 1A (8 sprints, ~16 weeks), Phase 1B (3 sprints), and Phase 1C (4 sprints)
- Added `yl_build_plan.md` to canonical docs in `CLAUDE.md` and `AGENTS.md` startup sequences
- Updated `yl_system_state.json` status from "Pre-build" to "Building" with build plan reference
- Added build plan cross-reference in `yl_phase1_execution.md`
- Added `notes/` to repository map in `CLAUDE.md`

### Context
- Founder confirmed Phase 1A target: ship by end of June 2026 for Med season
- Build plan breaks 1A into 8 sequential sprints with clear dependencies and deliverables
- Sprints 3 (Profile) and 4 (Yacht Graph) can overlap if a second developer joins
- Revenue strategy explores path to €10M ARR via verification API + enterprise contracts (Years 3–5), but this is brainstorming only — current build is crew-side only

### Next
- Start Sprint 1: database migrations, RLS policies, Supabase Auth config, app shell, base components
- Apple Developer Account setup needed early (blocks Apple OAuth)
- Commit existing uncommitted work (Supabase client, health check) before starting Sprint 1

### Warnings
- `notes/` folder is explicitly non-canonical — do not treat strategy sketches as build requirements
- `docs/yl_build_plan.md` IS canonical — treat it as the execution sequence for current work
- The build plan references the UX spec (`yl_mobile_first_ux_spec_for_pm_v1.md`) as design source of truth — some screens in that spec (timeline, IRL interactions, messaging) are deferred and should not be built

---

## 2026-03-08 — Codex

### Done
- Rewrote the planning set around the yacht graph wedge: profile, yacht entities, attachments, colleague graph, endorsement requests, endorsements, and paid presentation upgrades
- Split the roadmap into Phase 1A / 1B / 1C and deferred recruiter access, hiring, timeline, messaging, and IRL interactions out of the current build target
- Removed the paid path to verified status and tightened monetisation language to forbid payment-based moderation power
- Added `AGENTS.md` at repo root to force a consistent Codex startup flow
- Rewrote `CLAUDE.md` into a compact operating manual that points to the canonical Phase 1A docs
- Changed startup guidance so agents read only the latest 3 `CHANGELOG.md` entries by default instead of the entire file

### Next
- Review the narrowed scope with the founder and confirm whether recruiter access stays fully deferred to Phase 1C
- Align any remaining secondary docs that still describe recruiter or timeline features as active near-term scope
- If build work starts next session, treat `docs/yl_system_state.json` and `docs/yl_phase1_execution.md` as the implementation source of truth

### Warnings
- The decision log still contains future-state recruiter and timeline decisions for later phases; treat the rewritten canonical docs as the source of truth for the current build target
- If recruiter access is reintroduced earlier, preserve the boundary that payment may buy efficiency, never trust creation, moderation power, or credibility outcomes
- `AGENTS.md` now instructs agents to read `CLAUDE.md`, the latest 3 `CHANGELOG.md` entries, `docs/yl_system_state.json`, and `docs/yl_phase1_execution.md` before substantive work

## 2026-03-08 — Claude Code

### Done
- Consolidated project structure: planning docs moved from separate `Project Files/` directory into `docs/` within the webapp repo
- Archived superseded `ops/STACK.md`, `ops/TODO.md`, `ops/test.md` to `ops/archived/`
- Created `CLAUDE.md` at repo root — operating manual for all coding agents
- Created `CHANGELOG.md` (this file) — centralized cross-agent handover log
- Replaced boilerplate `README.md` with project-specific version
- Previously: promoted vNext files (relationship model update, timeline system), archived pre-vNext originals

### Context
- Founder confirmed Phase 1 focus: presentation layer (shareable digital profile and CV for crew). This is the validated entry point — useful with zero network effects.
- Graph, endorsements, recruiter search come later as organic consequences of adoption.
- Timeline/posts/interactions system is designed (in docs) but parked — not Phase 1 launch scope.
- NLP search, conversational onboarding, multilingual support also parked.
- Prior to this session: Phases A (DNS/identity) and B (code/deployment) complete. Phase C (backend/auth) partially done — Supabase projects created, auth enabled, RLS and env var connection still pending.

### Next
- No production features built yet. Next session should focus on whatever the founder prioritizes for build start.
- Existing uncommitted changes in repo: Supabase client setup (`lib/supabase/`), API health check (`app/api/health/`), package.json updates. These should be reviewed and committed.

### Warnings
- Do not build parked features (timeline, NLP search, conversational onboarding) without explicit founder approval
- The relationship taxonomy changed: "connection" is now split into colleague (graph edge), IRL connection (graph edge), and contact (messaging only). Use current terminology.
- Constitutional principles are non-negotiable. Read `docs/yl_principles.md` before touching anything trust-related.
- `.env.local` exists with Supabase credentials — never commit this file.

## Backlog notes (post Sprint 2 review)

### Onboarding — Role step UX
- **Cross-department roles**: When a user selects multiple departments (e.g. Deck + Interior), the role list should only show roles that *span* those departments (e.g. "Deck/Stew"). Currently shows all roles from all selected departments. Requires schema change — `roles.department` is a single text field; cross-department roles need either `departments text[]` or a separate join model.
- **Role list too long**: Many secondary/specialist roles (Dive Instructor, Kitesurf Instructor, etc.) should be hidden behind an "Advanced / Show more" toggle or moved to a later profile-edit screen. The onboarding list should be trimmed to ~10–15 most common roles per department.
