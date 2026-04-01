# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-01 (4 sessions today: Rally 008 doc redesign, worktree infra overhaul, /yl-worktree skill + logger + bottleneck fixes, then 4-lane bugfix worktree closing Rally 006. PRs #135–138 merged.)

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
| Bugfix sweep + Rally 006 close | 2026-04-01 | 4 lanes: onboarding name trigger, colleague display names, country ISO resolution, DatePicker text+calendar + tick stagger (PRs #135–138). Rally 006 closed. |
| /yl-worktree skill + bottleneck fixes | 2026-04-01 | /yl-worktree orchestrator skill, logger role, worker self-validation, model/effort matrix, master bottleneck prevention |
| Worktree infra overhaul | 2026-04-01 | Docs-as-protocol, auto-bootstrap snippets, dual output, re-review mode, Codex W4, session location unified |
| Rally 008 — Doc & skill redesign | 2026-04-01 | 3-tier context loading, CHANGELOG index, 11 module docs consolidated (33→11 files), 5 new yl-skills, 7 archived. ~88% token savings at session start. |
| Sprint 13 launch polish | 2026-04-01 | Sitemap onboarding filter, robots.txt, cookie banner copy, login link fix, OG/Twitter fallback (PR #130, merged) |

---

## Up Next (ordered)

1. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
2. **Rally 007 — Launch QA** — full checklist
3. **Deploy** — invite mode, 20-50 crew, 24h monitoring
4. **Backlog P1** — `inner-page-header-component` (bumped to P1 this session)

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
| — | — | No open PRs | All lanes merged this session |

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the Rally 006 build spec (18 items — all complete).
