# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-26 (Waves 1-4 complete)

---

## Current Phase

**Phase 1A → 1B transition.** Phase 1A core features are built (profile, CV import, employment, yacht entities, endorsements, public profile, PDF). Remaining 1A cleanup is in Sprint 10.1 (draft). Active work has shifted to Phase 1B bugfixes and polish.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [CV Parse Bugfix](./sprints/major/phase-1b/sprint-cv-parse-bugfix/README.md) | 1B | Planning | 37 QA bugs across 5 waves — data integrity, public profile, wizard UX, profile page, network tab |

**Next action:** Waves 1-4 complete. Next: Wave 5 (network tab + endorsement cleanup).

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

---

## Up Next (ordered)

1. ~~Answer D1-D8 design decisions~~ — resolved 2026-03-25
2. ~~**Wave 1: Data integrity**~~ — shipped 2026-03-25
3. ~~**Wave 2: Public profile + CV view**~~ — shipped 2026-03-25
4. ~~**Wave 3: Import wizard UX**~~ — shipped 2026-03-25
5. ~~**Wave 4: Profile page + skills**~~ — shipped 2026-03-26
6. **Wave 5: Network tab** — yacht graph (D7: list-based), endorsement/colleague grouping by yacht
7. **Media/CRUD standardization** (follow-up junior sprint after bugfix waves — photo/gallery dedup, shared Pro gating)
8. **Promote Ghost Profiles to sprint** (major sprint, ~2-3 days, when bugfixes are done)
9. **Endorsement Writing Assist** (quick junior sprint, no schema changes)

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

- **Wave 5 branch** (`fix/phase1-wave5-network-endorsement`): stashed CTA fix for duplicate mobile CTAs on logged-out public profile — needs unstashing + commit

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
