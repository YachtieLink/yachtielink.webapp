# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-04 (All code work merged through PR #170. Rally 009 + Rally 010 complete. Pre-launch founder tasks remain.)

---

## Current Phase

**Phase 1B — pre-launch.** All code work complete and merged. Rally 009 (7 sessions, PRs #152-169), Rally 010 (4 sessions, PR #170) all on main. What remains is founder-only: ops config, legal, QA testing, and deploy.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Sprint 13 | 1B | 🔧 Code Complete | SEO/sitemap/OG/cookie/robots merged (PR #130). Ops + legal blocked on founder. |

**Next action:** Ghost claim flow E2E test → Launch QA → Ops/legal config → Deploy.

---

## Recently Shipped

| What | When | PR(s) | Details |
|------|------|-------|---------|
| Rally 010 — Frontend UX & Guidance | 2026-04-04 | #170 | 4 sessions: cold states, product tour (Onborda), tooltips, coaching nudges, StickyBottomBar, FirstVisitCards, InfoTooltips. |
| Rally 009 Session 7 | 2026-04-04 | #166-169 | Desktop responsiveness, in-app roadmap + feature requests, visibility sublabels + back nav + loading skeletons. 22 review fixes. |
| Rally 009 Session 6 | 2026-04-03 | #160-165 | Cert matching registry, trust infra (report + bug report APIs), experience transfer + endorsement dormancy, ProUpsellCard. 26 review fixes. |
| Rally 009 Sessions 1-5 | 2026-04-02–03 | #152-159 | Land experience, Network tab, Profile redesign, Insights, Photos, CV, Settings, LLM defense, Endorsement flow. 30+ review fixes + 9 tester fixes. |
| Rally 006 + Ghost Profiles + Sprint 13 code | 2026-03-30–04-02 | #130-150 | Pre-launch polish (18 items), ghost profiles W1, SEO/OG/cookie, inner-page-header, social links, display polish. |

---

## Up Next (ordered) — All Founder Tasks

1. **Ghost Profile claim flow E2E test** — ⚠️ untested launch blocker (test plan in `worktrees/TESTER-BLOCKERS.md`)
2. **Visual QA** — test-backlog.md has ~100 unchecked items from PRs #89–170
3. **Rally 007 — Launch QA** — full checklist (⚠️ spec doesn't exist yet — needs creating). 23 items across auth, onboarding, core features, payments, yacht graph, security, GDPR, mobile, desktop, metrics.
4. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
5. **Deploy** — invite mode, 20-50 crew, 24h monitoring

---

## Blocked

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Business address in privacy/terms | Legal requirement for public launch | Founder must supply (virtual office OK) |
| Legal sign-off on terms + privacy | Cannot go public without | Founder arranges lawyer review |
| Stripe production webhook | Payments won't work in prod | Founder configures in Stripe dashboard |
| Vercel env vars | PostHog/Sentry/Stripe/Redis/etc. | Founder configures in Vercel dashboard |

---

## Open PRs

None — all PRs through #170 merged.

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the Rally 006 build spec (18 items — all complete).
