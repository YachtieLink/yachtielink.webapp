# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-03-29 (Sprint 12 QA'd, mobile audit complete, launch path defined.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-12) complete. Sprint 13 partially shipped. Rally 006 + Ghost Profiles + QA between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Rally 006 | — | 📋 Ready | Pre-launch bug sweep: 5 bugs, 3 analytics fixes, 6 UX fixes |
| Sprint 13 | 1B | 🔧 Partial (W0+1 merged) | Remaining: SEO, cookie banner, ops config, legal |

**Next action:** Execute Rally 006.

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

1. **Rally 006** — Safari links, subdomain cookies, onboarding CV skip, avatar framing, yacht matching, analytics wiring, 6 UX fixes
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

None. Main is clean.

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the canonical launch tracker — 66 checkboxes from here to launch. See `sprints/rallies/rally-006-prelaunch/README.md` for Rally 006 spec.
