# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-29 (Overnight session: bug sweep PR #115, Sprint 13 public infra PR #116, 4 junior sprints closed.)

---

## Current Phase

**Phase 1B active.** Sprint 12 (Yacht Graph Foundation) in progress. Pre-launch bug sweep and Sprint 13 Wave 0+1 shipped as PRs.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [Sprint 12](./sprints/major/phase-1b/sprint-12/) | 1B | 🔧 In Progress | Yacht Graph Foundation — yacht detail, colleague explorer, sea time |
| Pre-launch bug sweep | — | 📬 PR #115 open | Optimistic rollback, viewerIsPro, subdomain parity, dead code cleanup |
| Sprint 13 Wave 0+1 | 1B | 📬 PR #116 open | Public header/footer, cookie banner, SEO verified |

**Next action:** Founder merges PR #115 + #116. Sprint 12 build continues.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Pre-launch bug sweep | 2026-03-29 | SavedProfiles rollback, viewerIsPro wiring, subdomain colleagueCount, hero button margin, dead route deletion (PR #115) |
| Sprint 13 public infra | 2026-03-29 | PublicHeader + PublicFooter components, cookie banner update, SEO verification (PR #116) |
| Settings IA rework | 2026-03-29 | Profile settings rewrite, contact_email column, CvDetailsCard (PR #114 merged) |
| Rally 005 Auth Resilience | 2026-03-29 | 12 fixes: middleware, cookies, polling, env guard (PR #112) |
| Sprint 11 merged | 2026-03-28 | Public Profile Rewrite: 3 view modes, bento grid, section modals (PR #107) |

---

## Up Next (ordered)

1. **Merge PR #115 + #116** — founder merges
2. **Finish Sprint 12** — yacht detail page, colleague explorer, sea time, attachment transfer
3. **Sprint 13 Wave 2-4** — ops config, QA, legal sign-off, deploy
4. **🚀 Soft launch** (invite mode, 20-50 crew, target June 2026)

---

## Blocked

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Business address in privacy/terms | Legal requirement for public launch | Founder must supply (virtual office OK) |

---

## Uncommitted Code

Sprint 12 WIP stashed on `junior/settings-information-architecture` branch (`stash@{1}: sprint12-wip-overnight-preserve`).

---

## Active Junior Sprints

| Type | Slug | Status |
|------|------|--------|
| feature | feature-cv-sharing-rework | Planned |
| feature | feature-saved-profiles-rework | Planned |

All debug and UI/UX junior sprints closed 2026-03-29 (verified fixed or shipped in PRs #114-#115).

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-FINAL-CLOSEOUT.md` for the complete Phase 1 close-out plan, backlog triage, launch day runbook, and agent handoff instructions.
