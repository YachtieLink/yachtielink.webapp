# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-03 (Sessions 2-5 complete on chain/rally-009. LLM defense + endorsement flow done. Ready for push + PR.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-13) and Rally 006 complete. Ghost Profiles merged. QA rally + deploy between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Rally 009 | 1B | 🔧 Sessions 2-5 complete (chain) | Pre-MVP polish — 7 sessions. Sessions 2-5 on chain/rally-009. Ready for PR. |
| Sprint 13 | 1B | 🔧 Code Complete | SEO/sitemap/OG/cookie/robots merged (PR #130). Ops + legal blocked on founder. |

**Next action:** Push chain/rally-009 + create PR. Founder reviews + merges.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Rally 009 Sessions 3-5 (chain) | 2026-04-03 | Network tab, Profile redesign, Insights dashboard, Unified photos, CV output-only, Settings IA, LLM defense, Endorsement flow — all on chain/rally-009 |
| Rally 009 Session 2 — land experience + sea time overlap | 2026-04-03 | Land experience end-to-end (DB + wizard + profile + public), sea time union-based calc + overlap detection, 19 review fixes, 3 QA fixes |
| Rally 009 Session 1 — mobile UX + P2 bugs + tech debt | 2026-04-02 | Tab-bar padding, CV preview canonical query, saved sea time, yacht prefix null guard, PDF home-country toggle, social icons dedup, formatSeaTime canonical, EndorsementsSection cleanup |
| Skill hardening — review, tester, file ownership | 2026-04-02 | /yl-review zero-tolerance + two-step, /yl-tester agent, file ownership rules, cwd conventions, 7 chain gaps fixed |
| Ghost join fix + ghost flow fixes | 2026-04-02 | ghost_endorser join, page-load check, auto-claim, phone dedup, migration (PR #148) |
| Display polish — endorsement context + yacht prefix | 2026-04-02 | Endorser role+yacht on cards, M/Y S/Y prefix, toggle sublabels (PR #149) |
| Social links + interests + layout thumbnails | 2026-04-02 | Social links in settings, CV review socials, interests chip fix, layout thumbnails (PR #150) |
| Inner-page-header redesign | 2026-04-02 | Sticky back bar + standalone title row, section-color border, onBack support, 3 double-px-4 fixes, BackButton deleted (PR #144) |

---

## Up Next (ordered)

1. **Rally 009 Session 2** — Push + PR (Lane 2 first, Lane 1 second). Migration: `20260403000001_land_experience.sql`.
2. **Rally 009 Sessions 3-7** — All specs restructured with grill-me decisions. Ready to build sequentially.
4. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
5. **Rally 010 — Frontend UX & Guidance** — Product tour (Onborda), cold states, StickyBottomBar, tooltips, coaching nudges. After Rally 009 completes.
6. **Rally 007 — Launch QA** — full checklist (after Rally 009 + 010 complete)
7. **Deploy** — invite mode, 20-50 crew, 24h monitoring

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

| PR | Branch | Status | Notes |
|----|--------|--------|-------|
| #152 | chore/rally009-session1-context | ✅ Merged | Session 1 context |
| #153 | fix/mobile-ux-fixes | ✅ Merged | Tab-bar padding + CV preview query |
| #154 | fix/p2-bug-fixes | ✅ Merged | Saved sea time, yacht prefix null, home country |
| #155 | chore/tech-debt-sweep | ✅ Merged | Social dedup, formatSeaTime, EndorsementsSection |

---

## Draft Rallies

| Rally | Status | Scope |
|-------|--------|-------|
| [Rally 010 — Frontend UX & Guidance](sprints/rallies/rally-010-frontend-ux-guidance/) | 📋 Spec Complete | 4 sessions: tooling + StickyBottomBar, cold states, Onborda product tour, tooltips + coaching. Runs after Rally 009. |

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the Rally 006 build spec (18 items — all complete).
