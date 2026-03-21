# Sprint 13 — Launch Polish + Marketing

> **DRAFT** — This sprint plan is a draft outline. Scope, deliverables, and build plan are subject to change before work begins.

**Phase:** 1B
**Status:** 📋 Draft
**Started:** —
**Completed:** —

## Goal

Ship YachtieLink to the world. Marketing landing page, production environment fully configured, manual QA signed off, and a public feature roadmap for community engagement. After this sprint, the product is live.

## Scope

In:
- Marketing landing page at `/` (value prop, how it works, social proof, CTA)
- Vercel production environment setup (env vars, KV, Sentry, PostHog, domain)
- Manual QA pass (OAuth, Stripe, endorsement emails, mobile Safari)
- Feature roadmap page (lighter version of old Sprint 11 plan)
- Legal page final review
- Launch checklist sign-off

Out:
- Recruiter features (Phase 2)
- AI enhancements — endorsement writing assistant, cert OCR, profile suggestions (post-launch)
- Multilingual support (post-launch)
- NLP search (future phase)
- Native app / PWA

## Dependencies

- Sprint 10.1, Sprint 11, Sprint 12 all complete
- Domain configured (yachtie.link or yachtielink.com)
- Stripe account in production mode
- Legal review of `/terms` and `/privacy` completed
- PostHog and Sentry projects created with credentials

## Key Deliverables

### Marketing Landing Page — `/`
- ⬜ Hero section: headline, sub-headline, CTA to sign up, hero image/animation
- ⬜ "How it works" section: 3-step visual (build profile → attach yachts → get endorsed)
- ⬜ Value props: portable identity, colleague graph, trusted endorsements, CV export
- ⬜ Social proof section: sample profile preview, endorsement quotes, crew count
- ⬜ Section-coloured visual rhythm (coral, navy, amber sections — matching profile colours)
- ⬜ DM Serif Display for hero headlines
- ⬜ Responsive: mobile-first, scroll animations, sticky CTA on mobile
- ⬜ Footer: links to terms, privacy, roadmap, social links
- ⬜ Salty cameo (subtle, onbrand)

### Production Environment
- ⬜ Vercel project linked and configured
- ⬜ Environment variables set:
  - `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
  - `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
  - `KV_REST_API_URL`, `KV_REST_API_TOKEN`
  - `CRON_SECRET`
  - `SIGNUP_MODE` (start with `invite` → switch to `public` at launch)
  - Stripe keys (production mode)
  - Supabase keys (production)
  - Resend API key
  - OpenAI API key
- ⬜ Vercel KV database created (`yachtielink-ratelimit`)
- ⬜ Custom domain configured with SSL
- ⬜ CORS configured for production domain
- ⬜ Cron jobs verified (cert expiry, analytics nudges)

### Manual QA Pass
- ⬜ Apple OAuth — signup, login, logout, re-login
- ⬜ Google OAuth — signup, login, logout, re-login
- ⬜ Email/password — signup with verification, login, reset password
- ⬜ Stripe — upgrade to Pro (monthly), verify access, cancel, downgrade
- ⬜ Stripe — upgrade to Pro (annual), portal access
- ⬜ Endorsement request email — send, receive, click deep link, write endorsement
- ⬜ Cert expiry email — trigger cron, verify email sent
- ⬜ Mobile Safari — full flow (signup → onboarding → profile → public profile → share)
- ⬜ Mobile Chrome — same flow
- ⬜ Desktop Chrome — same flow
- ⬜ CV upload → parse → review → profile population
- ⬜ Profile PDF export (free with watermark, Pro without)
- ⬜ Data export (GDPR)
- ⬜ Account deletion flow
- ⬜ Cookie banner renders and persists choice

### Feature Roadmap (Lightweight)
- ⬜ `/app/more/roadmap` — read-only roadmap page showing planned features
- ⬜ Simple card layout: feature name, status (planned/in-progress/shipped), description
- ⬜ Pro users: upvote button on planned features
- ⬜ Feature request submission (Pro only, simple text form)
- ⬜ Data: `roadmap_items` and `roadmap_votes` tables (from original Sprint 11 build plan)
- ⬜ Admin manages items via Supabase dashboard (no admin UI needed at launch)

### Legal
- ⬜ Final review of `/terms` content (currently flagged [LEGAL REVIEW NEEDED])
- ⬜ Final review of `/privacy` content (currently flagged [LEGAL REVIEW NEEDED])
- ⬜ Verify cookie banner covers actual tracking (PostHog, Sentry)

### Launch Checklist
- ⬜ All routes load without errors (smoke test)
- ⬜ OG images generate for sample profiles
- ⬜ QR codes scan correctly
- ⬜ Rate limiting works (test from multiple IPs)
- ⬜ Error boundaries catch and report to Sentry
- ⬜ PostHog events firing in production
- ⬜ Invite-only mode works (test `SIGNUP_MODE=invite`)
- ⬜ Switch to public mode when ready

## Exit Criteria

- Marketing page live at root domain
- Production environment fully operational
- All manual QA items pass
- Feature roadmap accessible from More tab
- Legal pages reviewed and approved
- Invite-only mode tested and ready for soft launch
- Launch checklist 100% green

## Estimated Effort

5–7 days

## Notes

> **Feature roadmap is a lighter version of the original Sprint 11.** The full build plan (with feature_requests, feature_request_votes tables, complex voting logic) is in `sprints/major/sprint-11/build_plan.md`. For launch, we're doing a simpler version — roadmap_items + roadmap_votes only, admin via Supabase dashboard.

**Launch strategy:** Start with `SIGNUP_MODE=invite` for a controlled soft launch to 20-50 crew. Gather feedback for 1-2 weeks. Fix critical issues. Then switch to `public` mode before Med season hiring ramps up (June 2026).

**Legal:** The terms and privacy pages have content but are flagged for legal review. This must happen before public launch — it's a blocker, not a nice-to-have. Budget time for revisions.

**Post-launch priorities (not in this sprint):**
- AI features: endorsement writing assistant, cert OCR, profile suggestions, multilingual requests
- Recruiter profiles + search
- Availability broadcast
- Messaging / contacts
- Posts / timeline
