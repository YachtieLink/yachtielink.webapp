# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now.

**Last updated:** 2026-04-02 (Skill hardening: /yl-review zero-tolerance + two-step, /yl-tester created, file ownership rules, cwd conventions. Code PRs #148-150 pushed + rebased.)

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

1. **Merge PRs #148 → #149 → #150** — founder merges in order, rebase between each
2. **Regenerate Supabase types** — migration `20260402000002` already applied
4. **Wire SavedProfileCard** — `seaTimeDays`/`yachtCount` props need wiring from `SavedProfilesClient.tsx`
5. **Sprint 13 ops/legal** — Vercel env vars, Stripe webhook, business address, legal sign-off (all founder)
6. **Rally 007 — Launch QA** — full checklist
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
| #148 | fix/ghost-closeout | Ready to merge | Ghost join gap + ghost flow fixes (page-load check, auto-claim, phone dedup) + migration |
| #149 | fix/display-polish | Ready to merge | Endorsement context, yacht prefix, toggle sublabels, prefixedYachtName guard |
| #150 | fix/interests-socials | Ready to merge | Interests chips fix, social links in settings, CV review socials, layout thumbnails |

---

## Comprehensive Close-Out Spec

See `sprints/PHASE1-CLOSEOUT.md` for the launch tracker. See `sprints/rallies/rally-006-prelaunch/BUILD-SPEC.md` for the Rally 006 build spec (18 items — all complete).
