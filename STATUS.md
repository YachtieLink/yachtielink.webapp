# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-27 (Sprint restructure merged, ready for Sprint 10.1)

---

## Current Phase

**Phase 1A → 1B transition.** Phase 1A core features are built (profile, CV import, employment, yacht entities, endorsements, public profile, PDF). Remaining 1A cleanup is in Sprint 10.1 (draft). Active work has shifted to Phase 1B bugfixes and polish.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [Sprint 10.1](./sprints/major/phase-1a/sprint-10.1/README.md) | 1A | 📋 Ready | Phase 1A closeout — dark mode, animations, public layout infrastructure, missing pages (4–5 days) |

**Next action:** Begin Sprint 10.1. Focus: public layout infrastructure (blocker for Sprint 13), dark mode components, animation wiring.

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Two-pass CV parse | 2026-03-23 | Fast personal extraction (~10s) + background full parse (~19s). Junior sprint, shipped and merged. |
| CV parse full build (Waves 1-7) | 2026-03-23 | 5-step import wizard, AI prompt, save function, PDF templates, CV preview, public CV view |
| StrictMode double-fire fix | 2026-03-24 | Was burning 2x OpenAI cost per upload — guarded with `hasFiredRef` |
| Rate limit 429 banner | 2026-03-24 | Friendly "3 free CV reads per day" instead of error screen |
| Phase 1 Wave 1: CV consolidation | 2026-03-25 | Collapsed dual save path, cert/attachment dedup, date overlap validation, deleted 301 LOC dead code (PR #89) |
| Phase 1 Wave 2: Public profile refactor | 2026-03-25 | Shared query helpers, typed props (eliminated any[]), 5 section components, hero age+sea time, CV 404 fix |
| Wave 3: Import wizard UX + onboarding | 2026-03-25 | Phone formatting (libphonenumber-js), bio editing, date display consistency, add-language inline, editable review cards with edit-from-review navigation, ConfirmedImportData factory extraction |
| Drift guardrails + smoke discipline | 2026-03-25 | Added `npm run drift-check`, canonical-owner docs, critical-flow smoke checklist, and workflow/review updates to stop more SRP/DRY drift landing unnoticed |
| Test backlog process | 2026-03-25 | `docs/ops/test-backlog.md` — canonical pre-commit requirement for tracking untested changes |
| Profile + CV save fixes | 2026-03-26 | Photo `object-top` framing, experience summary `yacht_id` bug, name text-shadow for light photos, CV save robustness logging, gallery seed script (29 photos across 7 test users) |
| Wave 4: Profile page + skills | 2026-03-26 | PersonalDetailsCard, skills/hobbies chip previews in grid, useProfileSettings hook extraction |
| Wave 5: Network tab + endorsements | 2026-03-26 | Yacht-grouped colleagues, sendEndorsementRequest helper, RequestEndorsementClient slimmed |
| Pro subdomain routing | 2026-03-26 | Middleware rewrite for `*.yachtie.link`, reserved landing page, handle blocklist, Pro link in hero card, cookie refresh fix, billing placeholder |
| Sprint restructure + validation pass | 2026-03-27 | Rewrote all upcoming sprints (10.1, bugfix, 11, 12, 13) to reflect Wave 1-5 evolution. Validation pass found & corrected 5 scope mismatches. |

---

## Up Next (ordered)

1. ✅ Waves 1-5 shipped and merged to main
2. ✅ Sprint restructure completed and merged (PR #100)
3. **Sprint 10.1 — Phase 1A Closeout** (4–5 days) — dark mode, animations, public layout infrastructure, missing pages
4. **Sprint CV-Parse-Bugfix** (5–7 days) — fix 37 QA bugs across 5 waves
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

None. All work committed and pushed to main or active PRs.

---

## Draft Sprints (queued but not started)

| Sprint | Phase | Focus |
|--------|-------|-------|
| [Sprint 10.1](./sprints/major/phase-1a/sprint-10.1/README.md) | 1A | Close Phase 1A — education edit, saved profiles, animation, QA |
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
