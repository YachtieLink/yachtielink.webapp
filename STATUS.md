# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-28 (Sprint 11c QA + interactive polish with founder. ~40 fixes. Branch pushed. Profile tab next.)

---

## Current Phase

**Phase 1B active.** Phase 1A complete (Sprint 10.1 ✅). Sprint 11 (Public Profile Rewrite): 11a committed, 11b committed, 11c built + reviewed (pending commit). Full public profile rewrite across 3 sub-sprints — all code complete, awaiting founder review + merge.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [Sprint 11a](./sprints/major/phase-1b/sprint-11/build_plan_11a.md) | 1B | ✅ Committed (`30f89ca`) | Public Profile Rewrite — Profile mode fixes + schema foundation |
| [Sprint 11b](./sprints/major/phase-1b/sprint-11/build_plan_11b.md) | 1B | ✅ Committed (`f116427`) | Public Profile Rewrite — Portfolio mode |
| [Sprint 11c](./sprints/major/phase-1b/sprint-11/build_plan_11c.md) | 1B | ✅ Built (pending commit) | Public Profile Rewrite — Rich Portfolio bento |

**Next action:** Apply portfolio design lessons to Profile tab → merge PRs

**Post-build flags:**
- ⚠️ 2 migrations need `supabase db push`: endorsement pin policy (11b) + profile_template column (11c)
- ⚠️ Visual QA needed for all 3 sprints — overnight tests were code-path analysis only (no preview tools)
- ⚠️ Photo limit bumped 9→15 (Pro) — magic numbers not shared between client/server (low risk, noted for cleanup)

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Sprint 11c QA + Polish | 2026-03-28 | ~40 interactive fixes: hero overhaul, gallery data fix, section modals, endorsement carousel, conversational stats, brand colour tiles, first person headings |
| Sprint 11c build | 2026-03-28 | Rich Portfolio (Pro): bento grid engine, 2 templates (Classic/Bold), 12 tile components, focal point picker, photo limit 9→15, Pro gating |
| Sprint 11b build | 2026-03-28 | Portfolio mode: view mode toggle, card-based layout, mini bento gallery, lightbox, endorsement pinning, scrim/accent rendering |
| Sprint 11a build | 2026-03-28 | Public profile rewrite: editorial layout, schema migration (accent_color, focal_x/y), CV on-demand, display settings foundation, validation hardening |
| Sprint 10.1 polish | 2026-03-27 | Typography (font-serif on 6 h1s), education per-item links, nav badge popIn, saved profile cardHover, network tab count badges (PR #103) |
| Sprint CV-Parse-Bugfix | 2026-03-27 | 8 bugs: CV view 404 fix, country flag in hero, CV mobile scroll, share/download buttons, cert/education wizard editing, visibility link, ParseProgress fix (PR #104) |
| Skill ecosystem | 2026-03-27 | 3 new skills (test-yl, sprint-start-yl, sprint-build-yl) + auto-chain wiring + overnight mode |
| Build plans 11b + 11c | 2026-03-28 | Planning only — both plans reviewed (2-phase) and founder-flagged. Ready for execution. |
| Pro subdomain routing | 2026-03-26 | Middleware rewrite for `*.yachtie.link`, reserved landing page, handle blocklist, Pro link in hero card |

---

## Up Next (ordered)

1. **Apply portfolio lessons to Profile tab** — first person headings, modals, brand colours, endorsement carousel
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
