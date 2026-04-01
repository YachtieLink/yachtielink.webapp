# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-01 (Rally 008 doc & skill redesign complete. 3-tier context loading, module consolidation, 5 new skills. Sprint 13 polish merged. CV wizard Steps 2-3 + Ghost Profiles Wave 1 PRs awaiting merge.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-12) complete. Sprint 13 partially shipped. Rally 006 in progress (builder autocomplete done, CV wizard walkthrough partially done). Ghost Profiles + QA between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Rally 006 | 1B | 🔧 Nearly Done | CV wizard Steps 2-3 done (PR #132, unmerged). Steps 1, 4-5 done on `chore/remove-icloud-duplicates` (uncommitted). Date pickers + tick timing remain. |
| Sprint 13 | 1B | 🔧 Code Complete | SEO/sitemap/OG/cookie/robots merged (PR #130). Ops + legal blocked on founder. |
| Ghost Profiles W1 | 1B | 🔧 In Review | 3 migrations, non-auth endorsement flow, claim flow (PR #133). Reviewer pending. |

**Next action:** Merge PR #132 (CV Steps 2-3). Review and merge PR #133 (Ghost Profiles) after reviewer verdict. Close Rally 006 (date pickers + tick timing). Run migration `20260331000005`.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Rally 008 — Doc & skill redesign | 2026-04-01 | 3-tier context loading, CHANGELOG index, 11 module docs consolidated (33→11 files), 5 new yl-skills, 7 archived. ~88% token savings at session start. |
| Sprint 13 launch polish | 2026-04-01 | Sitemap onboarding filter, robots.txt, cookie banner copy, login link fix, OG/Twitter fallback (PR #130, merged) |
| Builder autocomplete from DB | 2026-03-31 | yacht_builders table, 4 migrations, BuilderInput component, all consumers updated |

---

## Up Next (ordered)

1. **Merge PR #132** — CV wizard Steps 2-3 (no blockers)
2. **Review + merge PR #133** — Ghost Profiles Wave 1 (reviewer verdict pending)
3. **Run migration** — `20260331000005_skills_interests_summary.sql` + 3 ghost profile migrations against production DB
4. **Close Rally 006** — date pickers (text+calendar on mobile) + progress tick timing
5. **Commit backlog triage** — consolidate duplicate save-yachts files
6. **Fix Country SearchableSelect data bug** — Monaco "MC" not populating
7. **Two small bugs** — BUG-01 onboarding name trigger (S), BUG-03 colleague dedup (S)
8. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
9. **Rally 007 — Launch QA** — full checklist
10. **Deploy** — invite mode, 20-50 crew, 24h monitoring

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
| #132 | feat/cv-wizard-steps-2-5 | Ready to merge | 2 files, UI only |
| #133 | feat/ghost-profiles | Reviewer pending | 17 files, 3 migrations, needs careful review |

**Still uncommitted on `chore/remove-icloud-duplicates`:** Builder autocomplete + CV wizard Steps 1, 4-5 + review fixes (3 prior sessions). Commit still needed — separate from worktree PRs.

**Untracked migration:** `20260331000005_skills_interests_summary.sql` — must be staged with that commit.

**Backlog triage doc** (`sprints/backlog/TRIAGE-2026-04-01.md`) — held, uncommitted, ready to commit next session.

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the approved Rally 006 build spec (18 items, full decision rationale).
