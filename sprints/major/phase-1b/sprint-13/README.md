# Sprint 13 — Launch Polish + Marketing

> **DRAFT** — Scope refined from initial outline. Build plan at `build_plan.md`. Subject to change before work begins.

**Phase:** 1B
**Status:** 📋 Draft
**Started:** —
**Completed:** —

## Goal

Ship YachtieLink to the world. Build the marketing landing page, configure the production environment, run manual QA, and sign off on launch readiness. After this sprint, the product is live for invited crew.

## Scope

**In — Code:**
- Marketing landing page at `/` (hero, value props, how it works, social proof, CTA)
- Public layout (header/footer for marketing + legal pages)
- Static feature roadmap page (hardcoded cards, no database)
- SEO: sitemap.ts, robots.ts, meta tags
- Cookie banner update (reflect PostHog/Sentry usage)

**In — Ops (founder tasks):**
- Vercel production env vars (PostHog, Sentry, Stripe, Supabase, Redis, Resend, OpenAI)
- Custom domain + SSL (yachtie.link)
- Stripe production mode + webhook endpoint
- Cron job verification in production

**In — Human tasks:**
- Manual QA pass (auth, Stripe, core flows, Sprint 12 yacht graph, cross-browser)
- Legal sign-off (terms/privacy business address, final review)

**Out:**
- Database-backed roadmap with voting/submissions (overkill at 20-50 users — static page sufficient)
- Blog / help center (not needed for soft launch)
- Dark mode (sidelined in Sprint 10.3)
- PWA / native app
- Recruiter features, AI enhancements, multilingual support (post-launch)

## Dependencies

- Sprint 10.1, Sprint 11, Sprint 12 all complete
- Domain purchased and DNS accessible (yachtie.link)
- Stripe account in production mode (founder task)
- PostHog + Sentry projects created with credentials (founder task)
- Legal review completed (founder task — blocker for public launch)

## What Already Exists (No Build Needed)

PostHog, Sentry, error boundaries, rate limiting, GDPR export/deletion, OG images, QR codes, invite-only mode, cron jobs, cookie banner, security headers, legal pages, Stripe integration, custom subdomains — all production-ready. Just need env vars configured.

## Key Deliverables

### Marketing Landing Page — `/`
- ⬜ Root route serves marketing page for unauthenticated users; redirects authenticated users to `/app/profile`
- ⬜ Hero section: headline, sub-headline, CTA, profile preview/illustration
- ⬜ "How it works" 3-step section (profile → yachts → endorsements)
- ⬜ Value props: portable identity, yacht graph, trusted endorsements, sea time
- ⬜ Social proof: live crew count, endorsement quote snippet
- ⬜ Section colours, scroll animations, DM Serif Display headlines
- ⬜ Responsive: mobile-first, sticky CTA on mobile
- ⬜ Public header (logo + sign up/log in) + footer (terms, privacy, roadmap)
- ⬜ Salty cameo (subtle)

### SEO & Meta
- ⬜ `sitemap.ts` — dynamic, includes public profiles
- ⬜ `robots.ts` — blocks `/app/`, `/api/`, allows public pages
- ⬜ Landing page OG meta tags + Twitter card

### Static Feature Roadmap
- ⬜ `/app/more/roadmap` — hardcoded cards, planned/shipped badges
- ⬜ "Have an idea? Email us" (no database, no voting)
- ⬜ SettingsRow entry in More page

### Cookie Banner Update
- ⬜ Text reflects PostHog (localStorage analytics) and Sentry (error tracking)
- ⬜ "Learn more" link to `/privacy`

### Production Environment (Ops)
- ⬜ All env vars set in Vercel (PostHog, Sentry, Stripe prod, Supabase prod, Redis, Resend, OpenAI, CRON_SECRET)
- ⬜ Custom domain + SSL configured
- ⬜ Stripe production webhook endpoint created
- ⬜ Cron jobs verified in production
- ⬜ `SIGNUP_MODE=invite` set for soft launch

### Manual QA Pass
- ⬜ Auth flows (Apple OAuth, Google OAuth, email/password)
- ⬜ Stripe (upgrade, cancel, portal, founding member pricing)
- ⬜ Core flows (onboarding, CV upload, endorsement request + deep link, PDF export)
- ⬜ Sprint 12 features (yacht graph browsing, colleague explorer, sea time, mutual colleagues)
- ⬜ **Graph browsing: 3+ hops without dead ends** (profile → yacht → crew → their yacht → crew)
- ⬜ Cross-browser (Mobile Safari, Mobile Chrome, Desktop Chrome, Desktop Safari)
- ⬜ Data export + account deletion (GDPR)
- ⬜ Cookie banner + invite-only mode

### Legal Sign-off
- ⬜ Business address added to terms/privacy
- ⬜ Founder review and sign-off
- ⬜ **Blocker:** must be complete before switching to `public` mode

## Exit Criteria

- Marketing page live at root domain, responsive, with scroll animations
- Public header/footer on all unauthenticated pages
- SEO: sitemap and robots.txt serving correctly
- Static roadmap accessible from More tab
- Cookie banner accurately reflects tracking
- All QA checklist items pass
- Production env fully operational (PostHog, Sentry, Stripe, crons)
- Legal pages signed off
- `SIGNUP_MODE=invite` tested and working
- Ready for soft launch to 20-50 crew

## Estimated Effort

**Code work:** ~4 days
**Ops + QA + legal:** ~2-3 days
**Total:** 5-7 days

## Notes

**Most infrastructure is already built.** The codebase exploration revealed that PostHog, Sentry, rate limiting, GDPR, OG images, QR codes, invite mode, cron jobs, and Stripe are all production-ready. Sprint 13 is mostly a marketing page build + ops configuration + QA.

**Static roadmap is a deliberate choice.** The full Sprint 11 roadmap plan (4 tables, 19 components, Pro voting, feature requests) is a 5-7 day sprint on its own. For 20-50 soft launch users, a hardcoded page is honest and fast. Upgrade to DB-backed when user count justifies structured feedback.

**Launch strategy:** Start with `SIGNUP_MODE=invite` for a controlled soft launch. Invite 20-50 crew via `?invite` param links. Gather feedback for 1-2 weeks. Fix critical issues via junior sprints. Then switch to `public` mode before Med season hiring ramps up (June 2026).

**Legal is a blocker.** The terms and privacy pages have content but the business address is a placeholder. This must be resolved before public launch — it's not a nice-to-have.

See `build_plan.md` for the full implementation specification.
