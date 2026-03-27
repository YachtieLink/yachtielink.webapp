# Sprint 13 — Launch Polish + Production Ready

**Phase:** 1B (Final)
**Priority:** P0 — ship YachtieLink to the world
**Status:** 📋 Ready for execution
**Runs after:** Sprint 12 complete (yacht graph done)
**Runs before:** Go-live
**Estimated effort:** 5–7 days
**Type:** Feature + ops sprint — marketing page, production setup, QA sign-off

---

## Why This Sprint Exists

After Sprints 10.1, CV-Parse-Bugfix, 11, and 12, the product is feature-complete for a soft launch. This sprint builds the marketing surface, configures production ops, and runs final QA. After this sprint, YachtieLink is live for invited crew (20-50 users).

---

## Scope

### In — Code

**A. Marketing Landing Page** (`/`)
- Root route serves marketing page for unauthenticated users; authenticated users → `/app/profile`
- Hero section: headline, sub-headline, CTA, profile preview/illustration
- "How it works" 3-step section: profile → yachts → endorsements
- Value props: portable identity, yacht graph, trusted endorsements, sea time
- Social proof: live crew count (API call), endorsement quote snippet
- Section colours, scroll animations, DM Serif Display headlines
- Responsive, mobile-first, sticky CTA on mobile
- Public header (logo + sign up/log in) + footer (terms, privacy, roadmap)
- Salty cameo (subtle, topical)

**B. Public Layout**
- Header component: logo (left), sign up / log in (right), responsive menu
- Footer component: links (terms, privacy, roadmap), copyright, social
- Apply to all unauthenticated pages

**C. SEO & Meta**
- `sitemap.ts` — dynamic, includes public profiles
- `robots.ts` — blocks `/app/`, `/api/`, allows public pages
- Landing page OG meta tags + Twitter card

**D. Static Feature Roadmap** (`/app/more/roadmap`)
- Hardcoded cards: "Planned" and "Shipped" badges
- "Have an idea? Email us" (no database, no voting)
- Link from More tab settings row
- Honest and fast (static page, no complexity)

**E. Cookie Banner Update**
- Text reflects PostHog (localStorage analytics) and Sentry (error tracking)
- "Learn more" link to `/privacy`

### In — Ops (Founder Tasks)

**F. Production Environment**
- Vercel production env vars: PostHog, Sentry, Stripe, Supabase, Redis, Resend, OpenAI, CRON_SECRET
- Custom domain + SSL: `yachtie.link` (already purchased, DNS on Vercel)
- Stripe production mode + webhook endpoint
- Cron jobs verified in production (`/api/cron/analytics-nudge`, `/api/cron/cert-expiry`)

**G. Human QA Pass** (founder responsibility)
- Auth flows (Apple OAuth, Google OAuth, email/password)
- Stripe (upgrade, cancel, portal, founding member pricing)
- Core flows (onboarding CV path, onboarding manual path, endorsement request + deep link, PDF export, profile editing)
- Sprint 12 features (yacht browsing: 3+ hops without dead ends, colleague explorer, sea time)
- Cross-browser (Mobile Safari, Mobile Chrome, Desktop Chrome, Desktop Safari)
- GDPR (export, deletion)
- Cookie banner + invite-only mode

**H. Legal Sign-off** (blocker for public mode)
- Business address added to `/terms` and `/privacy`
- Founder review and sign-off
- **Blocker:** must complete before switching to `SIGNUP_MODE=public`

### Out — Deferred

- Database-backed roadmap with voting (overcomplicated for 20-50 users)
- Blog / help center (not needed for soft launch)
- Dark mode (sidelined, force light mode)
- PWA / native app (post-launch)
- Recruiter features, AI enhancements, multilingual support (future phases)

---

## What Already Exists (No Build Needed)

All infrastructure is production-ready per codebase exploration:
- PostHog integration + analytics events
- Sentry error tracking + error boundaries
- Rate limiting (429 banner, CV parse limits)
- GDPR export/deletion flows
- OG images + QR codes (built in Sprint 11)
- Invite-only mode (`SIGNUP_MODE=invite`)
- Cron jobs (analytics nudge, cert expiry)
- Cookie banner (needs text update)
- Security headers (Vercel standard)
- Legal pages (placeholders — need address)
- Stripe integration (works, needs production mode)
- Custom subdomains (`*.yachtie.link` live, DNS on Vercel)

---

## Dependencies

- **Sprint 12 complete** (yacht graph done)
- **Domain purchased:** `yachtie.link` (DNS on Vercel)
- **Stripe account:** production mode ready (founder task)
- **PostHog + Sentry:** projects created with credentials (founder task)
- **Legal review:** business address resolved (blocker)

---

## Key Deliverables

### A. Marketing Landing Page

- ⬜ `/app/page.tsx` — root route, server component, redirect logic
  - `if (user) redirect('/app/profile')`
  - `else render <MarketingPage />`
- ⬜ `components/marketing/MarketingPage.tsx` — full landing page component
- ⬜ Hero section:
  - Headline: "Your Maritime Identity" or "Portable Profile for Crew"
  - Sub-headline: "One profile. All your yachts. Trusted by captains."
  - CTA buttons: "Sign Up", "Learn More"
  - Background: gradient or hero image
- ⬜ How it works section:
  - Step 1: Upload CV → profile populates
  - Step 2: Join yachts → endorsements start flowing
  - Step 3: Share profile → captains verify your experience
- ⬜ Value props cards: (4 cards)
  - Portable identity (profile follows you, not the yacht)
  - Yacht graph (explore crew networks, find crew)
  - Trusted endorsements (peer-to-peer verification)
  - Sea time tracking (portable proof of experience)
- ⬜ Social proof section:
  - Live crew count (fetch via `/api/health` or dedicated endpoint)
  - Endorsement quote snippet (hardcoded quote from early crew)
- ⬜ CTA section: "Ready to join?" + sign up button
- ⬜ Section colours from design system
- ⬜ Scroll animations: `fadeUp`, `staggerContainer` on sections
- ⬜ DM Serif Display on headlines (font already loaded)
- ⬜ Mobile: sticky CTA bar at bottom (iOS-style safe area)

### B. Public Layout

- ⬜ `components/public/PublicHeader.tsx` — logo, sign up/login, responsive menu
- ⬜ `components/public/PublicFooter.tsx` — links, copyright
- ⬜ Apply to:
  - `/app/(public)/page.tsx` (marketing)
  - `/app/(public)/u/[handle]/page.tsx` (public profiles)
  - `/app/(public)/privacy/page.tsx` (legal)
  - `/app/(public)/terms/page.tsx` (legal)

### C. SEO & Meta

- ⬜ `app/sitemap.ts` — dynamic sitemap with:
  - Static routes: `/`, `/privacy`, `/terms`, `/roadmap`
  - Dynamic routes: `/u/[handle]` for all published profiles
  - Changefreq: profiles weekly, pages monthly
- ⬜ `app/robots.ts` — block: `/app/`, `/api/`, allow: public pages
- ⬜ Landing page metadata: OG title, description, image, Twitter card

### D. Static Roadmap

- ⬜ `/app/(protected)/app/more/roadmap/page.tsx` — page component
- ⬜ Hardcoded card array:
  ```
  [
    { name: "CV Import", status: "shipped" },
    { name: "Public Profiles", status: "shipped" },
    { name: "Yacht Graph", status: "shipped" },
    { name: "Ghost Profiles", status: "planned" },
    { name: "Endorsement Writing Assist", status: "planned" },
    ...
  ]
  ```
- ⬜ Badge styling (shipped: green, planned: blue)
- ⬜ Footer text: "Have an idea? Email us → yachtie.link"
- ⬜ Link from More tab's settings row

### E. Cookie Banner Update

- ⬜ Update copy in `components/CookieConsent.tsx`:
  - "We use analytics (PostHog, localStorage) to understand how you use YachtieLink"
  - "We use error tracking (Sentry) to fix bugs"
  - "Learn more → /privacy"

### F. Production Environment (Founder)

- ⬜ Set in Vercel dashboard:
  - `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project key
  - `SENTRY_AUTH_TOKEN` — Sentry auth for build
  - `STRIPE_SECRET_KEY` — Stripe prod secret
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` — prod database
  - `REDIS_URL` — prod Redis (if used)
  - `RESEND_API_KEY` — prod Resend (email)
  - `OPENAI_API_KEY` — prod OpenAI (CV parse)
  - `CRON_SECRET` — secret for cron endpoints (generate random string)
- ⬜ Domain: `yachtie.link` (already on Vercel nameservers, SSL auto-provisioned)
- ⬜ Stripe: switch to production mode, create webhook endpoint at `/api/stripe/webhooks`
- ⬜ Cron verification: manually trigger `/api/cron/analytics-nudge` and `/api/cron/cert-expiry`, verify they run in production logs

### G. QA Checklist (Founder)

#### Auth
- [ ] Apple OAuth sign up / sign in
- [ ] Google OAuth sign up / sign in
- [ ] Email/password sign up / sign in
- [ ] Email verification flow
- [ ] Password reset flow

#### Stripe
- [ ] Free tier: all features work
- [ ] Upgrade to Pro: button works, modal launches
- [ ] Cancel subscription: cancel button works, downgrade to free
- [ ] Portal: update payment method works
- [ ] Founding member pricing: first X users get lifetime 50% discount

#### Core Flows
- [ ] Onboarding CV path: drop CV → loading → auto-handle → profile populated
- [ ] Onboarding manual path: skip → name → handle → empty profile
- [ ] CV upload: standalone `/app/cv/upload` → review → save
- [ ] Endorsement request: create → deep link shareable
- [ ] Endorsement request deep link: unauthenticated user clicks link → sees "Endorse X on YachtieLink" → sign up prompted
- [ ] PDF export: profile → export button → PDF downloads
- [ ] Profile editing: all sections editable

#### Sprint 12: Yacht Graph
- [ ] Yacht detail: shows current/alumni crew, mutual connections
- [ ] Colleague explorer: grouped by yacht, search works
- [ ] Sea time: profile page shows it, breakdown page works, public profile shows stat
- [ ] Multi-hop navigation: profile → yacht → crew → yacht → crew (at least 3 hops, no dead ends)
- [ ] "Wrong yacht?" transfer: attachment edit → section present → flow works end-to-end

#### Cross-Browser
- [ ] Mobile Safari (iPhone): all auth, onboarding, core flows
- [ ] Mobile Chrome (Android): same
- [ ] Desktop Chrome (Mac/Windows): same
- [ ] Desktop Safari (Mac): same

#### Data Export & Deletion (GDPR)
- [ ] Profile → More → Account → Export: generates CSV, downloads
- [ ] Profile → More → Account → Delete: deletion flow works, confirms permanently
- [ ] After deletion: profile is gone, can't sign back in with same email (for 30 days grace period)

#### Ops
- [ ] Cookie banner shows, text is accurate, privacy link works
- [ ] Invite-only mode works: unauthenticated user → sign up blocked with "By invite only"
- [ ] Analytics events firing (PostHog) — check PostHog dashboard for page views, user signups, CV uploads
- [ ] Error tracking (Sentry) — manually trigger an error in dev, verify it posts to Sentry prod
- [ ] Cron jobs: check logs for `analytics-nudge` and `cert-expiry` runs

### H. Legal Sign-off

- ⬜ Update `/app/(public)/privacy/page.tsx`:
  - Add business address (founder decides)
  - Add GDPR contact email (ari@yachtie.link)
  - Review compliance language
- ⬜ Update `/app/(public)/terms/page.tsx`:
  - Add business address
  - Review liability clauses, acceptable use
- ⬜ Founder review and sign-off
- ⬜ After sign-off: ready to set `SIGNUP_MODE=public`

---

## Build Order (Sequential)

```
Wave 1 — Landing Page (~1.5 days)
  ├─ Create marketing page component
  ├─ Hero, how-it-works, value props sections
  ├─ Public layout (header, footer)
  ├─ Mobile responsive
  └─ Result: landing page renders, looks good

Wave 2 — SEO + Roadmap (~1 day)
  ├─ Sitemap + robots
  ├─ OG meta tags
  ├─ Static roadmap page
  ├─ Cookie banner text update
  └─ Result: SEO in place, discovery ready

Wave 3 — Production Ops (~1 day, founder)
  ├─ Vercel env vars configured
  ├─ Domain + SSL verified
  ├─ Stripe production mode
  ├─ Cron jobs tested
  └─ Result: infrastructure live

Wave 4 — Manual QA + Legal (~2-3 days, founder)
  ├─ Run QA checklist (auth, Stripe, core flows, graph, cross-browser)
  ├─ GDPR export/deletion tested
  ├─ PostHog + Sentry verified working
  ├─ Legal review + address added
  └─ Result: product ready for soft launch

Wave 5 — Final Deploy (~1 day)
  ├─ Code review + merge to main
  ├─ Tag `v1.0-launch`
  ├─ Verify production deployment
  ├─ Monitor first 24h for errors (Sentry)
  └─ Result: live and stable
```

---

## Exit Criteria — All Required

- [ ] Marketing landing page live at root domain, responsive, animations smooth
- [ ] Public header/footer on all unauthenticated pages
- [ ] Sitemap includes public profiles, renders at `/sitemap.xml`
- [ ] Robots.txt blocks `/app/`, `/api/`, allows public
- [ ] Landing page OG image + Twitter card render correctly (test on Twitter, LinkedIn, Slack)
- [ ] Static roadmap page accessible, displays shipped/planned items
- [ ] Cookie banner shows accurate text (PostHog, Sentry), privacy link works
- [ ] All QA checklist items pass (auth, Stripe, flows, graph, cross-browser, GDPR, ops)
- [ ] No errors in Sentry production logs (first 24h)
- [ ] Analytics firing (PostHog events visible in dashboard)
- [ ] Cron jobs running on schedule (check logs)
- [ ] Legal pages have business address, founder sign-off
- [ ] `SIGNUP_MODE=invite` set for soft launch
- [ ] Branch merged to main, tagged `v1.0-launch`
- [ ] Ready for soft launch to 20-50 crew

---

## Estimated Effort

- **Code work (Waves 1–2):** 2–2.5 days (landing page, SEO, roadmap)
- **Ops setup (Wave 3):** 1 day (founder)
- **QA + Legal (Wave 4):** 2–3 days (founder)
- **Final deploy (Wave 5):** 1 day
- **Total:** 5–7 days

---

## Notes

**Most infrastructure already built.** PostHog, Sentry, rate limiting, GDPR, OG images, QR codes, invite mode, cron jobs, Stripe — all production-ready. This sprint is mostly marketing page + ops config + QA.

**Static roadmap is deliberate.** A full feature-voting system (4 tables, 19 components, auth, Pro gating) is a 5-7 day sprint on its own. For 20-50 soft launch users, a hardcoded page is honest and fast. Upgrade to DB-backed when user count justifies.

**Soft launch strategy.** Start with `SIGNUP_MODE=invite`. Invite 20-50 crew via `?invite` param links. Gather feedback for 1-2 weeks. Fix critical issues via junior sprints. Then switch to `SIGNUP_MODE=public` before Med season hiring ramps up (June 2026).

**Legal is a blocker.** Terms and privacy have content, but business address is a placeholder. This MUST be resolved before public mode — it's not optional.

**Post-launch:** After soft launch stabilizes (1-2 weeks), the next sprints are:
1. Ghost Profiles + Claimable Accounts (2-3 days, unblocks crew without profiles)
2. Endorsement Writing Assist (quick junior sprint, AI-assisted drafts)
3. Phase 2 work (recruit features, graph visualization, etc.)

**This is the close of Phase 1B.** After this sprint ships, the core product (profiles, CV import, yacht graph, endorsements) is live. All future work is feature expansion and polish.
