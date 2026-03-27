# Sprint 13 — Launch Polish + Production Ready

**Phase:** 1B (Final)
**Priority:** P0 — ship YachtieLink to the world
**Status:** 📋 Ready for execution (with public layout blocker noted)
**Runs after:** Sprint 12 complete (yacht graph done)
**Runs before:** Go-live
**Estimated effort:** 6–7 days (revised up by 1 day for public layout creation)
**Type:** Feature + ops sprint — public layout infrastructure, marketing page, production setup, QA sign-off

---

## Why This Sprint Exists

After Sprints 10.1, CV-Parse-Bugfix, 11, and 12, the product is feature-complete for a soft launch. This sprint builds the public-facing infrastructure, configures production ops, and runs final QA. After this sprint, YachtieLink is live for invited crew (20-50 users).

---

## Scope

### In — Code

**A. Public Layout Infrastructure** (BLOCKER — must build first)

**Note:** `app/(public)/layout.tsx` does not exist (verified in validation pass). This infrastructure is required for all public pages.

- ⬜ Create `app/(public)/layout.tsx` — wrapper for public pages (marketing, legal, roadmap)
- ⬜ Create `components/public/PublicHeader.tsx` — logo (left), sign up / log in (right), responsive menu
- ⬜ Create `components/public/PublicFooter.tsx` — links (terms, privacy, roadmap), copyright, social
- ⬜ Apply layout to all public routes:
  - `/` (marketing landing)
  - `/privacy` (legal page)
  - `/terms` (legal page)
  - `/roadmap` (static feature roadmap)
- ⬜ Verify responsive at 375px (mobile-first)

**B. Marketing Landing Page** (`/`)

**Note:** `/app/page.tsx` already exists and is fully implemented with ISR revalidation every 5 minutes. This sprint verifies and updates content as needed.

- ✅ Root route already serves marketing page for unauthenticated users; redirects authenticated users to `/app/profile`
- ⬜ Verify: Hero section (headline, sub-headline, CTA)
- ⬜ Verify: Profile preview/illustration renders correctly
- ⬜ Verify: "How it works" 3-step section (profile → yachts → endorsements)
- ⬜ Verify: Value props (portable identity, yacht graph, trusted endorsements, sea time)
- ⬜ Verify: Social proof section (live crew count API call works, endorsement quote snippet)
- ⬜ Verify: Section colours, scroll animations work
- ⬜ Verify: DM Serif Display headlines render correctly
- ⬜ Verify: Responsive layout at mobile-first, sticky CTA on mobile
- ⬜ Verify: Salty cameo placement (if included)
- ⬜ Update ISR revalidation time if needed (currently 5 minutes)

**C. SEO & Meta**

**Note:** `app/sitemap.ts` and `app/robots.ts` already exist. Verify they're correct for public launch.

- ✅ `sitemap.ts` exists — verify it includes public profiles dynamically
- ✅ `robots.ts` exists — verify it blocks `/app/`, `/api/`, allows public pages
- ⬜ Landing page OG meta tags + Twitter card — verify rendering (test on Twitter, LinkedIn, Slack)

**D. Static Feature Roadmap** (`/app/more/roadmap`)

- ⬜ Create `/app/(protected)/app/more/roadmap/page.tsx`
- ⬜ Hardcoded card array: [Planned/Shipped items]
- ⬜ Badge styling (shipped: green, planned: blue)
- ⬜ Footer text: "Have an idea? Email us → yachtie.link"
- ⬜ Link from More tab's settings row

**E. Cookie Banner Update**

**Note:** Cookie banner component exists (`components/CookieBanner.tsx`, not `CookieConsent.tsx` as originally referenced). Update text only.

- ⬜ Update text in `components/CookieBanner.tsx`:
  - "We use analytics (PostHog, localStorage) to understand how you use YachtieLink"
  - "We use error tracking (Sentry) to fix bugs"
  - "Learn more → /privacy"

**F. Privacy & Terms Pages**

**Note:** Both pages fully implemented (last updated 16 March 2026). Verify they're production-ready.

- ✅ `/app/(public)/privacy/page.tsx` exists — full implementation with 8+ policy sections
- ✅ `/app/(public)/terms/page.tsx` exists — full implementation with 8+ sections
- ⬜ Verify: Business address is present (placeholder may need update)
- ⬜ Verify: GDPR contact email correct (ari@yachtie.link)
- ⬜ Founder review and sign-off required before public mode
- **BLOCKER:** Must complete legal review before switching to `SIGNUP_MODE=public`

### In — Ops (Founder Tasks)

**G. Production Environment**
- ⬜ Set in Vercel dashboard: PostHog, Sentry, Stripe prod, Supabase prod, Redis, Resend, OpenAI, CRON_SECRET
- ⬜ Custom domain + SSL: `yachtie.link` (already purchased, DNS on Vercel, auto-provisioned)
- ⬜ Stripe production mode + webhook endpoint at `/api/stripe/webhooks`
- ⬜ Cron jobs verified in production (`/api/cron/analytics-nudge`, `/api/cron/cert-expiry`)

**H. Manual QA Checklist** (Founder)
- ⬜ Auth flows (Apple, Google, email/password)
- ⬜ Stripe (upgrade, cancel, portal, founding member pricing)
- ⬜ Core flows (onboarding CV path, manual path, endorsement, PDF export)
- ⬜ Sprint 12 yacht graph (browsing, sea time, colleagues, multi-hop navigation)
- ⬜ Cross-browser (Mobile Safari, Mobile Chrome, Desktop Chrome, Desktop Safari)
- ⬜ GDPR (export, deletion)
- ⬜ Cookie banner + invite-only mode

**I. Legal Sign-off** (BLOCKER)
- ⬜ Business address added to terms/privacy
- ⬜ Founder review and sign-off
- ⬜ **Must complete before switching to `SIGNUP_MODE=public`**

### Out — Deferred

- Database-backed roadmap with voting (overcomplicated for 20-50 users)
- Blog / help center (not needed for soft launch)
- Dark mode (sidelined, force light mode)
- PWA / native app
- Recruiter features, AI enhancements, multilingual support (future phases)

---

## What Already Exists (No Build Needed, Just Verify)

- ✅ PostHog integration + analytics events
- ✅ Sentry error tracking + error boundaries
- ✅ Rate limiting (429 banner, CV parse limits)
- ✅ GDPR export/deletion flows
- ✅ OG images + QR codes (built in Sprint 11)
- ✅ Invite-only mode (`SIGNUP_MODE=invite`)
- ✅ Cron jobs (analytics nudge, cert expiry)
- ✅ Security headers (Vercel standard)
- ✅ Stripe integration (works, needs production mode)
- ✅ Custom subdomains (`*.yachtie.link` live, DNS on Vercel)
- ✅ Landing page (`app/page.tsx` fully implemented)
- ✅ Privacy/Terms pages (fully implemented)
- ✅ Sitemap + robots.ts (already exist)

---

## Dependencies

- **Sprint 12 complete** (yacht graph done)
- **Domain purchased:** `yachtie.link` (DNS on Vercel)
- **Stripe account:** production mode ready (founder task)
- **PostHog + Sentry:** projects created with credentials (founder task)
- **Legal review:** business address + sign-off (BLOCKER)
- **Public layout created:** must exist before public pages work (Wave 0 task)

---

## Build Order (Sequential)

```
Wave 0 — Public Layout Infrastructure (~1 day, BLOCKER)
  ├─ Create app/(public)/layout.tsx
  ├─ Create PublicHeader + PublicFooter components
  ├─ Apply layout to public routes
  └─ Result: all public pages now have header/footer

Wave 1 — Public Pages & SEO (~1 day)
  ├─ Verify marketing landing page (content + performance)
  ├─ Verify SEO (sitemap, robots, OG tags)
  ├─ Create static roadmap page
  ├─ Update cookie banner text
  └─ Result: public surface complete

Wave 2 — Ops + Legal + QA (~3-4 days, founder)
  ├─ Configure Vercel env vars
  ├─ Verify cron jobs in production
  ├─ Run full QA checklist
  ├─ Legal review + sign-off (BLOCKER)
  └─ Result: ops ready, legal approved

Wave 3 — Final Deploy (~1 day)
  ├─ Code review + merge to main
  ├─ Tag v1.0-launch
  ├─ Verify production deployment
  ├─ Monitor first 24h (Sentry errors)
  └─ Result: live and stable
```

---

## Exit Criteria — All Required

- [ ] Public layout exists and applied to all public routes
- [ ] Public header/footer render correctly at 375px
- [ ] Marketing landing page verified (all sections render, ISR works)
- [ ] Sitemap includes public profiles, renders at `/sitemap.xml`
- [ ] Robots.txt blocks `/app/`, `/api/`, allows public
- [ ] Landing page OG image + Twitter card render correctly
- [ ] Static roadmap page accessible, displays shipped/planned items
- [ ] Cookie banner shows accurate text (PostHog, Sentry), privacy link works
- [ ] Privacy/Terms pages have business address, founder sign-off (BLOCKER)
- [ ] All QA checklist items pass (auth, Stripe, flows, graph, cross-browser, GDPR, ops)
- [ ] No errors in Sentry production logs (first 24h)
- [ ] Analytics firing (PostHog events visible in dashboard)
- [ ] Cron jobs running on schedule (check logs)
- [ ] `SIGNUP_MODE=invite` set for soft launch
- [ ] Branch merged to main, tagged `v1.0-launch`
- [ ] Ready for soft launch to 20-50 crew

---

## Estimated Effort (Revised)

- **Wave 0 (Public layout):** 1 day (new infrastructure, not in original plan)
- **Wave 1 (Pages/SEO):** 1 day (most already exists, verification + updates)
- **Wave 2 (Ops/QA/Legal):** 3-4 days (founder, parallel to code work)
- **Wave 3 (Deploy):** 1 day
- **Total:** 6–7 days (revised up from 5–7; added public layout creation)

---

## Notes

**Public layout is a critical blocker.** `app/(public)/layout.tsx` does not exist. All public pages (marketing, legal, roadmap) depend on it. Build this in Wave 0 immediately.

**Most infrastructure already built.** PostHog, Sentry, rate limiting, GDPR, OG images, invite mode, cron jobs, Stripe — all production-ready. This sprint is mostly verification + public layout + ops config + QA.

**Legal is a blocker.** Terms and privacy pages have content, but business address needs to be verified/updated. Must be complete and founder-approved before switching to `SIGNUP_MODE=public`.

**Static roadmap is deliberate.** A full feature-voting system would be 5-7 days. For 20-50 soft launch users, hardcoded page is honest and fast. Upgrade to DB-backed later.

**Soft launch strategy:** Start with `SIGNUP_MODE=invite`. Invite 20-50 crew via `?invite` param links. Gather feedback 1-2 weeks. Fix critical issues via junior sprints. Switch to `SIGNUP_MODE=public` before Med season hiring ramps up (June 2026).

**Post-launch:** After soft launch stabilizes (1-2 weeks):
1. Ghost Profiles + Claimable Accounts (2-3 days)
2. Endorsement Writing Assist (quick junior sprint)
3. Phase 2+ work (recruiter features, graph visualization, etc.)

**This is the close of Phase 1B.** After this sprint ships, the core product is live. All future work is feature expansion and polish.
