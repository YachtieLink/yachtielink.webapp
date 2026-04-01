# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-02 (3-lane worktree: inner-page-header redesign, ghost profiles verify + GhostEndorserBadge, custom 404 + nationality flag. PRs #142–144 merged.)

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
| Inner-page-header redesign | 2026-04-02 | Sticky back bar + standalone title row, section-color border, onBack support, 3 double-px-4 fixes, BackButton deleted (PR #144) |
| Ghost Profiles verify + GhostEndorserBadge | 2026-04-02 | RLS public SELECT policy (critical fix), badge wired into all 6 endorsement display surfaces (PR #143) |
| Custom 404 + nationality flag | 2026-04-02 | Branded 404 page, SVG flag toggle on public profile hero + settings (PR #142) |
| Bugfix sweep + Rally 006 close | 2026-04-01 | 4 lanes: onboarding name trigger, colleague display names, country ISO resolution, DatePicker text+calendar + tick stagger (PRs #135–138). Rally 006 closed. |
| /yl-worktree skill + bottleneck fixes | 2026-04-01 | /yl-worktree orchestrator skill, logger role, worker self-validation, model/effort matrix, master bottleneck prevention |

---

## Up Next (ordered)

1. **Apply migrations** — `20260401000005_nationality_flag` + `20260402000001_ghost_profiles_public_read` (founder runs on Supabase)
2. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
3. **Rally 007 — Launch QA** — full checklist
4. **Deploy** — invite mode, 20-50 crew, 24h monitoring

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
| — | — | No open PRs | PRs #142–144 merged this session |

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the Rally 006 build spec (18 items — all complete).
