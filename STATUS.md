# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-27 (Sprint 10.1 ✅ + CV-Parse-Bugfix ✅, ready for Sprint 11)

---

## Current Phase

**Phase 1A → 1B transition.** Phase 1A core features are built (profile, CV import, employment, yacht entities, endorsements, public profile, PDF). Remaining 1A cleanup is in Sprint 10.1 (draft). Active work has shifted to Phase 1B bugfixes and polish.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [Sprint 11](./sprints/major/phase-1b/sprint-11/README.md) | 1B | 📋 Ready | CV onboarding rebuild — one-drop vs manual fork, section colours, OG/QR polish |

**Next action:** Begin Sprint 11. Sprint 10.1 and CV-Parse-Bugfix both complete.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Wave 4: Profile page + skills | 2026-03-26 | PersonalDetailsCard, skills/hobbies chip previews in grid, useProfileSettings hook extraction |
| Wave 5: Network tab + endorsements | 2026-03-26 | Yacht-grouped colleagues, sendEndorsementRequest helper, RequestEndorsementClient slimmed |
| Pro subdomain routing | 2026-03-26 | Middleware rewrite for `*.yachtie.link`, reserved landing page, handle blocklist, Pro link in hero card, cookie refresh fix, billing placeholder |
| Sprint 10.1 polish | 2026-03-27 | Typography (font-serif on 6 h1s), education per-item links, nav badge popIn, saved profile cardHover, network tab count badges (PR #103) |
| Sprint CV-Parse-Bugfix | 2026-03-27 | 8 bugs: CV view 404 fix, country flag in hero, CV mobile scroll, share/download buttons, cert/education wizard editing, visibility link, ParseProgress fix (PR #104) |
| Skill ecosystem | 2026-03-27 | 3 new skills (test-yl, sprint-start-yl, sprint-build-yl) + auto-chain wiring + overnight mode |

---

## Up Next (ordered)

1. ✅ Waves 1-5 shipped and merged to main
2. ✅ Sprint restructure completed and merged (PR #100)
3. ✅ **Sprint 10.1 — Phase 1A Closeout** — complete (PR #103)
4. ✅ **Sprint CV-Parse-Bugfix** — complete (PR #104, 8 bugs fixed, 7 deferred to Sprint 12)
5. **Sprint 11 — CV Onboarding Rebuild** (5–7 days) — one-drop vs manual fork, motion polish, OG/QR
6. **Sprint 12 — Yacht Graph Foundation** (6–8 days) — yacht detail pages, colleagues explorer, sea time display
7. **Sprint 13 — Launch Polish** (6–7 days) — public layout, marketing page, ops config, legal sign-off, go-live
8. **Media/CRUD standardization** (junior sprint after Phase 1B — photo/gallery dedup, shared Pro gating)
9. **Ghost Profiles & Claimable Accounts** (phase 2, 24 decisions)

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

Shipslog updates from CV-Parse-Bugfix session (CHANGELOG, STATUS, feedback, session log, module activity, backlog items). Will be committed as follow-up.

---

## Draft Sprints (queued but not started)

| Sprint | Phase | Focus |
|--------|-------|-------|
| [Sprint 11](./sprints/major/phase-1b/sprint-11/README.md) | 1B | Crew landing pages, Salty, section colours, OG images |
| [Sprint 12](./sprints/major/phase-1b/sprint-12/README.md) | 1B | Yacht graph, colleague network, sea time |
| [Sprint 13](./sprints/major/phase-1b/sprint-13/README.md) | 1B | Launch polish, marketing page, production env, QA |

---

## Active Junior Sprints

| Type | Slug | Status |
|------|------|--------|
| debug | debug-cv-parse-extraction | In Progress |
| debug | debug-photo-upload-limit | In Progress |
| debug | debug-cv-regenerate-date | In Progress |
| ui-ux | ui-public-profile-button-margin | In Progress |
| feature | feature-pro-subdomain-link | Planned |
| feature | feature-cv-sharing-rework | Planned |
| feature | feature-saved-profiles-rework | Planned |

---

## Backlog Highlights

- **Ghost Profiles & Claimable Accounts** — full design spec done (24 decisions), ready for sprint promotion
- **Endorsement Writing Assist** — full design spec done (12 decisions), no schema changes
- **CV Actions Card Redesign** — unified card layout, relative timestamps, multi-page viewer
- **CV Import Graph-Building Vision** — 5 new proposals: yacht matching UX, cert fuzzy matching, skill/hobby autocomplete + chip redesign, education autocomplete, social links step
- **Profile Photo Reposition** — crop/zoom/reposition for hero framing (idea)
