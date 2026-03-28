# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-29 (Sprint 11 merged. Production incident resolved. Rally 005 auth resilience shipped.)

---

## Current Phase

**Phase 1B active.** Sprint 11 (Public Profile Rewrite) shipped and merged (PR #107). Rally 005 (Auth Resilience) shipped and merged (PR #112). Sprint 11d next (18 remaining profile items).

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [Sprint 11a/b/c](./sprints/major/phase-1b/sprint-11/) | 1B | ✅ Merged (PR #107) | Public Profile Rewrite — 3 view modes, bento grid, section modals |
| [Rally 005](./sprints/rallies/rally-005-auth-resilience/) | — | ✅ Merged (PR #112) | Auth resilience — 12 fixes after production incident |
| [Sprint 11d](./sprints/major/phase-1b/sprint-11/build_plan_11d.md) | 1B | 📋 Ready | Remaining profile items — settings UI, sub-pages, endorsement pinning |

**Next action:** Sprint 11d execution

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Rally 005 Auth Resilience | 2026-03-29 | 12 fixes: middleware try-catch, needsAuth simplification, /api/ excluded from matcher, secure cookies, polling jitter, AuthStateListener, env guard (PR #112) |
| Sprint 11 merged | 2026-03-28 | Public Profile Rewrite: 3 view modes (Profile/Portfolio/Rich Portfolio), bento grid, section modals, ~60 QA fixes (PR #107) |
| Sprint 10.1 polish | 2026-03-27 | Typography, education links, nav badge, saved profile cardHover (PR #103) |
| Sprint CV-Parse-Bugfix | 2026-03-27 | 8 bugs fixed (PR #104) |
| Skill ecosystem | 2026-03-27 | test-yl, sprint-start-yl, sprint-build-yl + auto-chain |
| Pro subdomain routing | 2026-03-26 | Middleware rewrite for `*.yachtie.link` |

---

## Up Next (ordered)

1. **Verify production login** — test Rally 005 fixes in production
2. **Sprint 11d** — 18 remaining items: settings UI, sub-pages, endorsement pinning, CV rework
4. **Sprint 12 — Yacht Graph Foundation** (6–8 days) — yacht detail pages, colleagues explorer, sea time display
5. **Sprint 13 — Launch Polish** (6–7 days) — public layout, marketing page, ops config, legal sign-off, go-live
6. **Media/CRUD standardization** (junior sprint after Phase 1B — photo/gallery dedup, shared Pro gating)
7. **Ghost Profiles & Claimable Accounts** (phase 2, 24 decisions)

---

## Blocked

| Blocker | Impact | Resolution |
|---------|--------|------------|
| ~~Vercel Hobby tier 10s function limit~~ | ~~Resolved 2026-03-25~~ | Upgraded to Vercel Pro ($20/mo) on YachtieLink credit card. Account: ari@yachtie.link. |
| ~~8 design decisions (D1-D8)~~ | ~~Resolved 2026-03-25~~ | All 8 answered — see sprint README. D5 (ensign flags) deferred to post-launch. |
| ~~Legal business address~~ | ~~Deferred~~ | Using ari@yachtie.link as GDPR contact until physical desk secured. Not blocking launch. |

---

## Pending Decisions

All D1-D8 resolved 2026-03-25. See `sprints/PHASE1-CLOSEOUT.md` Blockers section for final answers. D1 (cert dedup), D2 (date overlap), D8 (attachment dedup) implemented in Wave 1. D4 (libphonenumber-js) shipped in Wave 3. D5 (ensign flags) deferred post-launch. D6 (transform:scale) deferred from Wave 2. D7 (list-based yacht graph) queued for Wave 5.

---

## Uncommitted Code

Sprint 11c full build (~30 files) on branch `sprint-11c/rich-portfolio` — ready to commit. Sprint 11a committed (`30f89ca`), Sprint 11b committed (`f116427`). Backlog items (untracked).

---

## Draft Sprints (queued but not started)

| Sprint | Phase | Focus |
|--------|-------|-------|
| [Sprint 11](./sprints/major/phase-1b/sprint-11/README.md) | 1B | Public Profile Rewrite — 3 view modes, bento grid, photo system (split into 11a/b/c) |
| [Sprint 12](./sprints/major/phase-1b/sprint-12/README.md) | 1B | Yacht graph, colleague network, sea time |
| [Sprint 13](./sprints/major/phase-1b/sprint-13/README.md) | 1B | Launch polish, marketing page, production env, QA |

---

## Active Junior Sprints

| Type | Slug | Status |
|------|------|--------|
| debug | debug-cv-parse-extraction | In Progress |
| debug | debug-photo-upload-limit | In Progress |
| ~~debug~~ | ~~debug-cv-regenerate-date~~ | ~~Obsolete — CV regeneration replaced by on-demand generation in Sprint 11a (2026-03-28)~~ |
| ui-ux | ui-public-profile-button-margin | In Progress |
| feature | feature-pro-subdomain-link | ✅ Complete (2026-03-27) |
| feature | feature-cv-sharing-rework | Planned |
| feature | feature-saved-profiles-rework | Planned |

---

## Backlog Highlights

- **Pro Upsell Consistency** — app-wide standardisation needed (filed 2026-03-28)
- **Ghost Profiles & Claimable Accounts** — full design spec done (24 decisions), ready for sprint promotion
- **Endorsement Writing Assist** — full design spec done (12 decisions), no schema changes
- **CV Actions Card Redesign** — unified card layout, relative timestamps, multi-page viewer
- **CV Import Graph-Building Vision** — 5 new proposals: yacht matching UX, cert fuzzy matching, skill/hobby autocomplete + chip redesign, education autocomplete, social links step
- **Profile Photo Reposition** — promoted to Sprint 11 (focal point + crop adjustment)
- ~~Safari Public Profile Links~~ — resolved (was subdomain link issue)
- ~~Nationality Flag~~ — resolved (already implemented)
