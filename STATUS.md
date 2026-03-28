# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-28 (Sprint 11a built + reviewed, ready to commit. 11b + 11c queued for overnight build.)

---

## Current Phase

**Phase 1B active.** Phase 1A complete (Sprint 10.1 ✅). Sprint 11 (Public Profile Rewrite) all 3 build plans complete (11a in progress, 11b + 11c reviewed and ready). Full public profile rewrite across 3 sub-sprints.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [Sprint 11a](./sprints/major/phase-1b/sprint-11/build_plan_11a.md) | 1B | ✅ Built (pending commit) | Public Profile Rewrite — Profile mode fixes + schema foundation |
| [Sprint 11b](./sprints/major/phase-1b/sprint-11/build_plan_11b.md) | 1B | ⏳ Queued (next) | Public Profile Rewrite — Portfolio mode |

**Next action:** Overnight build continues — 11b (Portfolio mode) → 11c (Rich Portfolio) → morning founder review

**Pre-build flags for 11b/11c (from review):**
- ⚠️ Verify whether `PublicProfileContent` is already a client component (if so, skip `PublicProfileShell` wrapper)
- ⚠️ Verify `sort_order = 0` convention for hero photo in `user_photos` data
- ⚠️ Photo limit discrepancy: codebase has `MAX_PHOTOS_PRO = 9`, plans say 15 — must update both client and API
- ⚠️ `user_photos` vs `user_gallery` — two photo tables. Bento uses `user_photos` only. Do not confuse them.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Sprint 11a build | 2026-03-28 | Public profile rewrite: editorial layout, schema migration (accent_color, focal_x/y), CV on-demand, display settings foundation, validation hardening |
| Sprint 10.1 polish | 2026-03-27 | Typography (font-serif on 6 h1s), education per-item links, nav badge popIn, saved profile cardHover, network tab count badges (PR #103) |
| Sprint CV-Parse-Bugfix | 2026-03-27 | 8 bugs: CV view 404 fix, country flag in hero, CV mobile scroll, share/download buttons, cert/education wizard editing, visibility link, ParseProgress fix (PR #104) |
| Skill ecosystem | 2026-03-27 | 3 new skills (test-yl, sprint-start-yl, sprint-build-yl) + auto-chain wiring + overnight mode |
| Build plans 11b + 11c | 2026-03-28 | Planning only — both plans reviewed (2-phase) and founder-flagged. Ready for execution. |
| Pro subdomain routing | 2026-03-26 | Middleware rewrite for `*.yachtie.link`, reserved landing page, handle blocklist, Pro link in hero card |

---

## Up Next (ordered)

1. **Sprint 11b — Public Profile Rewrite: Portfolio mode** — queued (overnight). View mode toggle, scrim/accent rendering, mini bento gallery, lightbox, endorsement pinning.
2. **Sprint 11c — Public Profile Rewrite: Rich Portfolio bento** — queued after 11b. Bento grid engine (grid-template-areas), 2 templates (Classic/Bold), 11 tile components, density auto-detection, photo management enhancements, Pro gating.
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

Sprint 11a full build (24 files) on branch `sprint-11a/profile-rewrite-foundation` — ready to commit. Shipslog updates from design interview + build plan sessions. Sprint 11 spec + build plans (untracked). Backlog items (untracked).

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
