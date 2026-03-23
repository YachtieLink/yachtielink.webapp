# 2026-03-23 — CV Parse Sprint Spec Session

**Agent:** Claude Code (Opus 4.6)
**Sprint:** CV-Parse (Phase 1B gate)
**Goal:** Write complete build specs for the CV Parse sprint — wave by wave, implementation-ready

---

## What Happened

### 1. Reorientation + Sprint Prioritization

- Reviewed Sprint 12 (Yacht Graph) and Sprint 13 (Launch Polish) status
- Founder decided to prioritize attachment transfer and CV upload modes from backlog as critical Phase 1 work
- Recovered lost transcript context from previous session (ghost profiles, CV parse wizard vision, upload modes)
- Decision: CV Parse is the priority sprint, Sprint 13 (polish) can wait

### 2. CV Field Analysis

- Analyzed 9 real yachtie CVs to map every extractable field
- Compared against current schema — found ~75% of CV fields have no DB column
- Identified 14 new columns needed across users/yachts/attachments tables
- Key additions: DOB, nationality, smoker, tattoo, visa, license, languages (JSONB), employment_type, yacht_program, description, cruising_area, builder

### 3. Build Spec Writing (7 Waves + Merge UX)

Wrote implementation-ready specs to `sprints/major/phase-1b/sprint-cv-parse/specs/`:

| Spec | What it covers |
|------|---------------|
| `merge-ux.md` | ConfirmCard, ConflictInput, ChipSelect — the field-level merge pattern |
| `wave-1-migration.md` | 14 new columns, column-level REVOKE on DOB |
| `wave-2-edit-pages.md` | Settings page, attachment edit, languages edit + API, cert issuing body, ProfileHeroCard, countryToFlag helper |
| `wave-3-ai-prompt.md` | Pre-flight text validation, retry logic, prompt rewrite 6→40 fields, shared types file, parse route hardening |
| `wave-4-import-wizard.md` | 5-step wizard (not 7 — consolidated), ConfirmCard pattern, yacht matching pipeline, celebration screen |
| `wave-5-save-function.md` | Batch save with insert/update split, deduplication, profile completion %, partial failure resilience |
| `wave-6-pdf-preview.md` | PDF template update, CvPreview component (owner + viewer), public CV viewer route |
| `wave-7-verification.md` | Pre-flight validation tests, 9 CV tests, wizard UX tests, merge UX tests, two-phase review |

### 4. Key Design Decisions (Founder-Driven)

- **Wizard is a review flow, not a form.** Show → Confirm → Done. "Looks good?" not "Please fill in."
- **Never make them type.** Empty fields aren't shown on confirm cards. Available under "Add more details" in edit view.
- **Progressive loading.** Parse runs in background while user confirms Step 1 (personal details). By Step 2, all matching is done.
- **Two upload paths:** "Build my profile from this CV" (wizard) vs "Just upload, don't change my profile" (store only)
- **CV preview serves two audiences:** owner previews at `/app/cv/preview`, viewer reads at `/u/[handle]/cv`
- **Users can present their own uploaded CV** — if they chose "uploaded" as source, the viewer shows their PDF, not the generated one
- **Celebration screen** with completion % and next steps — the payoff moment

### 5. Founder Edits to Specs

Founder directly edited 5 of the 7 spec files with refinements:
- Wave 3: Added pre-flight validation, retry logic, shared types file, `response_format: json_object`
- Wave 4: Major rewrite — consolidated from 7 steps to 5, ConfirmCard pattern, yacht matching pipeline detail, celebration screen
- Wave 5: Added yacht creation step, deduplication logic, profile completion %, error resilience
- Wave 7: Added pre-flight validation tests, wizard UX tests, speed target (<60s), state persistence test
- Wave 2: Added certification issuing body edit, countryToFlag helper spec

## Files Created/Modified

- `sprints/major/phase-1b/sprint-cv-parse/specs/merge-ux.md` — NEW
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-1-migration.md` — NEW
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-2-edit-pages.md` — NEW (founder edited)
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-3-ai-prompt.md` — NEW (founder edited)
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-4-import-wizard.md` — NEW (founder edited)
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-5-save-function.md` — NEW (founder edited)
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-6-pdf-preview.md` — NEW
- `sprints/major/phase-1b/sprint-cv-parse/specs/wave-7-verification.md` — NEW (founder edited)

### 6. Spec Review & UX Overhaul (Second Pass)

Founder reviewed the initial specs and drove major UX refinements:

**Merge UX rewrite:** Field-by-field radio buttons → batch ConfirmCards. "Show the merged result. Ask 'Does this look right?' Edit only if it doesn't." Auto-merge picks best value per field (CV wins for conflicts since it's newer).

**"Never make them type" principle:** If the CV didn't find a field and the profile doesn't have it, don't show an empty input. Just skip it. "You can add it later." The wizard is for confirming, not filling out forms.

**Wizard is a fast-track:** Get to 80% as fast as possible, then the profile completer helps close the gap. Every tap should feel like progress, never like homework.

**Yacht matching is the craft moment:** 4 card states (matched/needs-pick/new/already-on-profile) with scoring pipeline. All yachts shown as scrollable list, not one-at-a-time pagination. Former yacht name handling. "Confirm all" button works even if "needs pick" cards haven't been resolved (uses pre-selected best match).

**Updated files during review pass:**
- `merge-ux.md` — complete rewrite (batch confirm pattern)
- `wave-3-ai-prompt.md` — added validation, retry, max_tokens 8000, shared types
- `wave-4-import-wizard.md` — complete rewrite (5-step fast-track, yacht matching detail)
- `wave-5-save-function.md` — aligned with new wizard, yacht creation, dedup, completion %
- `wave-7-verification.md` — aligned with 5-step wizard, added pre-flight tests, speed target
- `wave-2-edit-pages.md` — added cert issuing_body edit, countryToFlag
- `build_plan.md` — Parts 5, 8, 9 updated
- `README.md` (sprint) — exit criteria rewritten
- `CHANGELOG.md` — new session entry
- `sessions/2026-03-23-cv-parse-spec.md` — this file

## Next

- Begin Wave 1 build (migration already written, needs `supabase db push`)
- Wave 2 can start in parallel (edit pages use existing patterns)
- Wave 3 before Wave 4 (types + prompt needed before wizard)
- Founder to provide real CVs for Wave 7 validation
- Ghost profiles sprint needs planning as separate sprint (foundational to endorsement growth loop)
