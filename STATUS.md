# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-03-30 (Rally 006 build complete — 63 files, 7 agents. CV import redesign. LLM swap to gpt-5.4-mini. Uncommitted, awaiting founder approval.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-12) complete. Sprint 13 partially shipped. Rally 006 + Ghost Profiles + QA between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Rally 006 | — | 🔧 Built (uncommitted) | 63 files, 7 agents. CV import redesign, yacht matching, plan page, analytics, endorsement banner, PageHeader audit. Needs re-test + commit. |
| Sprint 13 | 1B | 🔧 Partial (W0+1 merged) | Remaining: SEO, cookie banner, ops config, legal |

**Next action:** Re-test CV import flow, then commit + push Rally 006.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Sprint 12 QA + mobile fixes | 2026-03-29 | Unicode fixes, colleague card layout, nested link fix (PR #120) |
| Phase 1 closeout consolidation | 2026-03-29 | Single canonical launch tracker, Rally 006 spec (PR #121) |
| Stale auth cookie cleanup | 2026-03-29 | Middleware + client-side zombie session clearing (PR #119) |
| Sprint 12 wiring | 2026-03-29 | Yacht graph navigation, Network yachts tab, mutual colleagues (PR #118) |
| Sprint 13 public infra | 2026-03-29 | PublicHeader + PublicFooter, cookie banner (PR #116) |
| Pre-launch bug sweep | 2026-03-29 | Optimistic rollback, viewerIsPro, subdomain parity (PR #115) |
| Settings IA rework | 2026-03-29 | contact_email, CV-only fields, auth separation (PR #114) |

---

## Up Next (ordered)

1. **Rally 006 commit** — code built, needs final CV import re-test then commit + push + PR
2. **Sprint 13 completion** — SEO/sitemap fix, cookie banner text, ops config (founder), legal sign-off (founder)
3. **Ghost Profiles sprint** — claimable accounts, viral loop (design complete, 24 decisions resolved)
4. **Rally 007 — Launch QA** — full checklist (auth, payments, yacht graph, security, GDPR, mobile, metrics, abuse protocol)
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

## Uncommitted Code

**Rally 006** — 63 files on `docs/shipslog-sprint12-qa` branch. CV import redesign, yacht matching, plan page, analytics, endorsement banner, PageHeader audit, LLM swap to gpt-5.4-mini, 5 DB migrations pushed. Awaiting founder approval to commit + push.

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the approved Rally 006 build spec (18 items, full decision rationale).
