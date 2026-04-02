# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-02 (Rally 009 Session 1 complete: 3 lanes shipped — mobile UX, P2 bugs, tech debt sweep. /grill-me done: all sessions unblocked. Branches ready to push.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-13) and Rally 006 complete. Ghost Profiles merged. QA rally + deploy between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Sprint 13 | 1B | 🔧 Code Complete | SEO/sitemap/OG/cookie/robots merged (PR #130). Ops + legal blocked on founder. |

**Next action:** Rally 007 — Launch QA full checklist, then deploy in invite mode.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Rally 009 Session 1 — mobile UX + P2 bugs + tech debt | 2026-04-02 | Tab-bar padding, CV preview canonical query, saved sea time, yacht prefix null guard, PDF home-country toggle, social icons dedup, formatSeaTime canonical, EndorsementsSection cleanup |
| Skill hardening — review, tester, file ownership | 2026-04-02 | /yl-review zero-tolerance + two-step, /yl-tester agent, file ownership rules, cwd conventions, 7 chain gaps fixed |
| Ghost join fix + ghost flow fixes | 2026-04-02 | ghost_endorser join, page-load check, auto-claim, phone dedup, migration (PR #148) |
| Display polish — endorsement context + yacht prefix | 2026-04-02 | Endorser role+yacht on cards, M/Y S/Y prefix, toggle sublabels (PR #149) |
| Social links + interests + layout thumbnails | 2026-04-02 | Social links in settings, CV review socials, interests chip fix, layout thumbnails (PR #150) |
| Inner-page-header redesign | 2026-04-02 | Sticky back bar + standalone title row, section-color border, onBack support, 3 double-px-4 fixes, BackButton deleted (PR #144) |
| Ghost Profiles verify + GhostEndorserBadge | 2026-04-02 | RLS public SELECT policy (critical fix), badge wired into all 6 endorsement display surfaces (PR #143) |
| Custom 404 + nationality flag | 2026-04-02 | Branded 404 page, SVG flag toggle on public profile hero + settings (PR #142) |
| Bugfix sweep + Rally 006 close | 2026-04-01 | 4 lanes: onboarding name trigger, colleague display names, country ISO resolution, DatePicker text+calendar + tick stagger (PRs #135–138). Rally 006 closed. |
| /yl-worktree skill + bottleneck fixes | 2026-04-01 | /yl-worktree orchestrator skill, logger role, worker self-validation, model/effort matrix, master bottleneck prevention |

---

## Up Next (ordered)

1. **Commit + push Rally 009 Session 1** — 3 branches ready (`fix/mobile-ux-fixes`, `fix/p2-bug-fixes`, `chore/tech-debt-sweep`). No merge order constraint.
2. **Rally 009 Session 2** — CV restore data integrity (trackOverwrite, education dedup, etc.). After Session 1 merged.
3. **Rally 009 Sessions 3-4** — Now unblocked by /grill-me decisions. See `rally-009-premvp-polish/grill-me-decisions-2026-04-02.md`.
3. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
4. **Rally 007 — Launch QA** — full checklist (after Rally 009 completes)
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

| PR | Branch | Status | Notes |
|----|--------|--------|-------|
| pending | fix/mobile-ux-fixes | ready to push | Lane 1: tab-bar padding + CV preview canonical query |
| pending | fix/p2-bug-fixes | ready to push | Lane 2: saved sea time, yacht prefix null guard, PDF home-country toggle |
| pending | chore/tech-debt-sweep | ready to push | Lane 3: social icons dedup, formatSeaTime, EndorsementsSection cleanup |

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the Rally 006 build spec (18 items — all complete).
