# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-01 (CV wizard Steps 4-5 UX rework + two-phase code review complete. All changes uncommitted on `chore/remove-icloud-duplicates`. Three sessions accumulated — commit needed urgently.)

---

## Current Phase

**Phase 1B — final stretch.** All sprints (10-12) complete. Sprint 13 partially shipped. Rally 006 in progress (builder autocomplete done, CV wizard walkthrough partially done). Ghost Profiles + QA between here and launch.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| Rally 006 | 1B | 🔧 In Progress | Builder autocomplete done. CV wizard Steps 1, 4-5 reviewed. Steps 2-3 pending. |
| Sprint 13 | 1B | 🔧 Partial (W0+1 merged) | Remaining: SEO, cookie banner, ops config, legal |

**Next action:** Commit + push accumulated work (founder go-ahead needed). Run migration `20260331000005`. Then continue CV wizard walkthrough (Steps 2-3).

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| CV wizard Steps 4-5 UX + code review fixes | 2026-04-01 | Chip hierarchy, review overhaul, celebration screen fix, stale closure fix, rate limit split, Pro gate fix |
| CV wizard Step 1 UX rework | 2026-03-31 | StepPersonal review/edit states, DatePicker reorder, amber chrome, roles.ts, flag-outside-input |
| Builder autocomplete from DB | 2026-03-31 | yacht_builders table, 4 migrations, BuilderInput component, all consumers updated |
| Rally 006 — CV import + platform polish | 2026-03-30 | CV import redesign, yacht matching, plan page, analytics, endorsement banner (PRs #122–124) |
| Sprint 12 QA + mobile fixes | 2026-03-29 | Unicode fixes, colleague card layout, nested link fix (PR #120) |
| Phase 1 closeout consolidation | 2026-03-29 | Single canonical launch tracker, Rally 006 spec (PR #121) |

---

## Up Next (ordered)

1. **Commit + push** — three sessions of accumulated work (founder go-ahead needed)
2. **Run migration** — `20260331000005_skills_interests_summary.sql` against production DB
3. **CV wizard Steps 2-3 walkthrough** — Experience and Qualifications screens need UX pass
4. **Fix Country SearchableSelect data bug** — Monaco "MC" not populating
5. **Merge PR #125** — iCloud duplicate cleanup (founder)
6. **Onboarding wizard parity** — new users don't get 5-step data review like CV import users
7. **Sprint 13 completion** — SEO/sitemap fix, cookie banner text, ops config (founder), legal sign-off (founder)
8. **Ghost Profiles sprint** — claimable accounts, viral loop (design complete, 24 decisions resolved)
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

## Uncommitted Code

**Three sessions accumulated on `chore/remove-icloud-duplicates`:**

1. **Builder autocomplete** — 14 modified + 6 new files. 4 migrations, BuilderInput component, resolveOrCreateBuilder helper, all query consumers updated. Reviewed + QA passed.
2. **CV wizard Step 1 UX rework** — StepPersonal.tsx major rework, DatePicker.tsx reorder, amber chrome, roles.ts, Wizard.tsx + settings "preferred name" rename.
3. **CV wizard Steps 4-5 UX rework + review fixes** — ChipSelect hierarchy, StepExtras headings, StepReview overhaul, celebration screen fix, YachtMatchCard stale closure fix, rate limit bucket split, Pro gate fix, CvActions restructure.

**Untracked migration:** `20260331000005_skills_interests_summary.sql` — must be staged with commit.

**PR #125** — iCloud duplicate cleanup. Awaiting merge.

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the approved Rally 006 build spec (18 items, full decision rationale).
