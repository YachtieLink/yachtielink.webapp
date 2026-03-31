# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-03-31 (Builder autocomplete built + reviewed + QA passed. CV parse onboarding flow needs end-to-end completion. Uncommitted code awaiting founder approval.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-12) complete. Sprint 13 partially shipped. Rally 006 in progress (builder autocomplete done, CV parse onboarding incomplete). Ghost Profiles + QA between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Rally 006 | 1B | 🔧 In Progress | Builder autocomplete done. CV parse onboarding end-to-end still needed. |
| Sprint 13 | 1B | 🔧 Partial (W0+1 merged) | Remaining: SEO, cookie banner, ops config, legal |

**Next action:** Founder approves builder autocomplete commit. Then CV parse onboarding end-to-end.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Rally 006 — CV import + platform polish | 2026-03-30 | CV import redesign, yacht matching, plan page, analytics, endorsement banner, PageHeader audit, design system docs (PRs #122–124) |
| Sprint 12 QA + mobile fixes | 2026-03-29 | Unicode fixes, colleague card layout, nested link fix (PR #120) |
| Phase 1 closeout consolidation | 2026-03-29 | Single canonical launch tracker, Rally 006 spec (PR #121) |
| Stale auth cookie cleanup | 2026-03-29 | Middleware + client-side zombie session clearing (PR #119) |
| Sprint 12 wiring | 2026-03-29 | Yacht graph navigation, Network yachts tab, mutual colleagues (PR #118) |
| Sprint 13 public infra | 2026-03-29 | PublicHeader + PublicFooter, cookie banner (PR #116) |

---

## Up Next (ordered)

1. **Commit + push builder autocomplete** — awaiting founder go-ahead
2. **CV parse onboarding — end-to-end** — finish full flow beyond yacht parsing (certs, education, personal details)
3. **Merge PR #125** — iCloud duplicate cleanup (founder)
4. **Date picker + progress tick timing** — remaining Rally 006 items
5. **Sprint 13 completion** — SEO/sitemap fix, cookie banner text, ops config (founder), legal sign-off (founder)
6. **Ghost Profiles sprint** — claimable accounts, viral loop (design complete, 24 decisions resolved)
7. **Rally 007 — Launch QA** — full checklist
8. **Deploy** — invite mode, 20-50 crew, 24h monitoring

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

**Builder autocomplete** — 14 modified + 6 new files on `chore/remove-icloud-duplicates`. 4 migrations, BuilderInput component, resolveOrCreateBuilder helper, all query consumers updated. Reviewed + QA passed. Awaiting founder approval to commit.

**PR #125** — iCloud duplicate cleanup. Awaiting merge.

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the approved Rally 006 build spec (18 items, full decision rationale).
