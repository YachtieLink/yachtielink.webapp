# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-27 (Sprint restructure complete — ordering clarified, all rewrites done)

---

## Current Phase

**Phase 1A → 1B transition: Execution sequence locked.** Phase 1A core features are built. Next: close Phase 1A cleanly (Sprint 10.1), fix Phase 1B bugs (CV Parse Bugfix), rebuild onboarding (Sprint 11), build yacht graph (Sprint 12), ship to production (Sprint 13).

---

## Active Sprint (Next to Execute)

| Sprint | Phase | Status | Est. | Focus |
|--------|-------|--------|------|-------|
| [Sprint 10.1](./sprints/major/phase-1a/sprint-10.1/README.md) | 1A | Ready | 5-7d | Close Phase 1A — dark mode, animations, missing pages, API hardening |

**Immediate next action:** Merge PRs #96 (wave4) and #97 (wave5) to main. Then begin Sprint 10.1.

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

---

## Up Next (ordered execution plan)

**Immediate (next 1-2 sessions):**
1. Merge PRs #96 (Wave 4) + #97 (Wave 5) to main
2. Quick follow-ups: subdomain consolidation, custom 404, media/CRUD standardization (junior sprints)

**Major sprint sequence (3-4 weeks):**
3. **Sprint 10.1** (5-7 days) — Phase 1A closeout: dark mode, animations, missing pages, API hardening
4. **Sprint CV-Parse-Bugfix** (5-7 days) — Fix 37 QA bugs: data integrity (Wave 1), public profile (Wave 2), wizard UX (Wave 3), profile page (Wave 4), network tab (Wave 5)
5. **Sprint 11** (5-7 days) — CV onboarding rebuild: CV drop path + manual path fork, section colours, OG/QR polish
6. **Sprint 12** (6-8 days) — Yacht graph foundation: yacht detail, colleague explorer, sea time, transfer flow
7. **Sprint 13** (5-7 days) — Launch polish: marketing page, production ops, manual QA, go-live

**Post-launch (after Sprint 13 soft-launch):**
8. Ghost Profiles + Claimable Accounts (design spec ready, ~2-3 days)
9. Endorsement Writing Assist (quick junior sprint, ~1-2 days)

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

- **Stashed CTA fix** (stash@{2} on `fix/phase1-wave5-network-endorsement`): duplicate mobile CTAs on logged-out public profile — needs unstashing + commit after PR merge

---

## Major Sprints (rewritten 2026-03-27, execution order locked)

| Order | Sprint | Phase | Status | Est. | Focus |
|-------|--------|-------|--------|------|-------|
| 1 | [Sprint 10.1](./sprints/major/phase-1a/sprint-10.1/README.md) | 1A | Ready | 5-7d | Phase 1A closeout: dark mode, animations, API hardening, missing pages (education edit, saved profiles page) |
| 2 | [CV Parse Bugfix](./sprints/major/phase-1b/sprint-cv-parse-bugfix/README.md) | 1B | Ready | 5-7d | Fix 37 QA bugs across 5 waves: data integrity, public profile hero, CV view, import wizard UX, profile page, network grouping |
| 3 | [Sprint 11](./sprints/major/phase-1b/sprint-11/README.md) | 1B | Ready | 5-7d | CV onboarding rebuild: one-drop CV path + manual path, section colours, motion polish, OG/QR enhancement |
| 4 | [Sprint 12](./sprints/major/phase-1b/sprint-12/README.md) | 1B | Ready | 6-8d | Yacht graph foundation: yacht detail, colleague explorer, sea time, attachment transfer, yacht search UX |
| 5 | [Sprint 13](./sprints/major/phase-1b/sprint-13/README.md) | 1B | Ready | 5-7d | Launch polish: marketing page, production setup, manual QA, legal sign-off, soft-launch |

---

## Active Junior Sprints

| Type | Slug | Status |
|------|------|--------|
| debug | debug-cv-parse-extraction | In Progress |
| debug | debug-photo-upload-limit | In Progress |
| debug | debug-cv-regenerate-date | In Progress |
| ui-ux | ui-public-profile-button-margin | In Progress |
| feature | feature-pro-subdomain-link | Live (DNS + code deployed) |
| feature | feature-cv-sharing-rework | Planned |
| feature | feature-saved-profiles-rework | Planned |

---

## Backlog Highlights

- **Ghost Profiles & Claimable Accounts** — full design spec done (24 decisions), ready for sprint promotion
- **Endorsement Writing Assist** — full design spec done (12 decisions), no schema changes
- **CV Actions Card Redesign** — unified card layout, relative timestamps, multi-page viewer
- **CV Import Graph-Building Vision** — 5 new proposals: yacht matching UX, cert fuzzy matching, skill/hobby autocomplete + chip redesign, education autocomplete, social links step
- **Profile Photo Reposition** — crop/zoom/reposition for hero framing (idea)
