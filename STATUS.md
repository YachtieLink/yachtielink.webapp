# STATUS.md — Where Are We

Quick-glance project dashboard. Read this at session start to know what's happening right now. Updated every session by agents (and by the `/shipslog` Codex logging command).

**Last updated:** 2026-03-25

---

## Current Phase

**Phase 1A → 1B transition.** Phase 1A core features are built (profile, CV import, employment, yacht entities, endorsements, public profile, PDF). Remaining 1A cleanup is in Sprint 10.1 (draft). Active work has shifted to Phase 1B bugfixes and polish.

---

## Active Sprint

| Sprint | Phase | Status | Focus |
|--------|-------|--------|-------|
| [CV Parse Bugfix](./sprints/major/phase-1b/sprint-cv-parse-bugfix/README.md) | 1B | Planning | 37 QA bugs across 5 waves — data integrity, public profile, wizard UX, profile page, network tab |

**Next action:** D1-D8 resolved. Write Wave 1 build specs (data integrity dedup + CV consolidation).

---

## Recently Shipped

| What | When | Details |
|------|------|---------|
| Two-pass CV parse | 2026-03-23 | Fast personal extraction (~10s) + background full parse (~19s). Junior sprint, shipped and merged. |
| CV parse full build (Waves 1-7) | 2026-03-23 | 5-step import wizard, AI prompt, save function, PDF templates, CV preview, public CV view |
| StrictMode double-fire fix | 2026-03-24 | Was burning 2x OpenAI cost per upload — guarded with `hasFiredRef` |
| Rate limit 429 banner | 2026-03-24 | Friendly "3 free CV reads per day" instead of error screen |
| Drift guardrails + smoke discipline | 2026-03-25 | Added `npm run drift-check`, canonical-owner docs, critical-flow smoke checklist, and workflow/review updates to stop more SRP/DRY drift landing unnoticed |

---

## Up Next (ordered)

1. ~~Answer D1-D8 design decisions~~ — resolved 2026-03-25
2. **Wave 1: Data integrity** — cert/attachment dedup, overlap validation (P0, blocks everything)
3. **Wave 2: Public profile + CV view** — hero fields, CV 404 fix, responsive, share/download
4. **Wave 3: Import wizard UX** — languages, bio, phone formatting, date consistency, editable cards
5. **Wave 4: Profile page + skills** — personal details card, editability, skills chip UX
6. **Wave 5: Network tab** — yacht graph, endorsement/colleague grouping by yacht
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

| ID | Question | Recommendation | Sprint |
|----|----------|----------------|--------|
| D1 | Cert dedup threshold — how fuzzy? | Levenshtein <= 2 or normalized match >= 0.85 | CV Parse Bugfix |
| D2 | Date overlap tolerance? | Allow 1 month overlap, warn but don't block | CV Parse Bugfix |
| D3 | Nationality display — demonym or label? | Label change to "Nationality" with country name | CV Parse Bugfix |
| D4 | Phone formatting — library or custom? | `libphonenumber-js` | CV Parse Bugfix |
| D5 | Ensign images — source? | Maritime flag databases, static assets in `/public/ensigns/` | CV Parse Bugfix |
| D6 | CV view scaling approach? | `transform: scale()` preserving A4 layout | CV Parse Bugfix |
| D7 | Yacht graph scope? | List-based for now, graph viz in Phase 2 | CV Parse Bugfix |
| D8 | Attachment dedup match strategy? | Match on user_id + yacht_id + role, enrich if match found | CV Parse Bugfix |

---

## Uncommitted Code

- StrictMode double-fire fix (`hasFiredRef` guard) — feature-complete, awaiting git commit
- Rate limit 429 friendly banner — feature-complete, awaiting git commit
- `extract-text.ts` refactor (shared helper) — feature-complete, awaiting git commit
- `parse-personal` route (two-pass fast extraction) — feature-complete, awaiting git commit
- `scripts/drift-check.mjs` with baseline support (`.drift-baseline.json`) — feature-complete, awaiting git commit
- Canonical-owner docs (`docs/ops/canonical-owners/`) — feature-complete, awaiting git commit
- Critical-flow smoke checklist (`docs/ops/critical-flow-smoke-checklist.md`) — feature-complete, awaiting git commit
- Workflow and code-review doc updates for drift pass — feature-complete, awaiting git commit
- Rally 004 execution plan (`sprints/rallies/rally-004-execution-plan.md`) — report-only, awaiting git commit
- Rally 004 SRP/DRY audit (`sprints/rallies/rally-004-srp-dry-complexity-audit.md`) — report-only, awaiting git commit
- `CHANGELOG.md`, `STATUS.md`, session logs — doc updates, awaiting git commit

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
