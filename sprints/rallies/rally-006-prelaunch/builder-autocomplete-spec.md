# Builder Autocomplete — Build Spec

**Parent:** Rally 006 — Pre-Launch Bug Sweep + Polish
**Status:** Spec complete, ready for build
**Effort:** 1-2 days
**Date:** 2026-03-31

---

## Goal

Create a canonical `yacht_builders` table that ties builders to yachts via FK. Grows with user input, seeded with top 100 known builders. Provides autocomplete in all builder input surfaces. Lays the foundation for a broader yacht intelligence dataset (MMSI, call signs, builder metadata later).

---

## Decisions (from grill-me session)

### Data Model

1. **Canonical table.** New `yacht_builders` table is the single source of truth for builder names. Not just an autocomplete list — it's the entity.

2. **FK relationship.** `yachts.builder` text column is replaced by `yachts.builder_id uuid references yacht_builders(id)`. Updating a builder name in one place updates every yacht instantly.

3. **Columns at launch:**

   | Column | Type | Notes |
   |--------|------|-------|
   | `id` | uuid PK | `gen_random_uuid()` |
   | `name` | text NOT NULL UNIQUE | Canonical display name |
   | `name_normalized` | text NOT NULL | Lowercase, accents stripped, for matching |
   | `created_at` | timestamptz | `now()` |
   | `created_by` | uuid FK → users | Nullable (null for seed data) |

4. **No metadata yet.** Country, founded year, logo, etc. are Phase 2 enrichment. Table is designed to accept new columns without breaking anything.

### Migration

5. **Clean slate.** No real users — drop existing `yachts.builder` text column, rebuild from scratch. No backfill needed.

6. **Single migration.** Creates table, adds FK to yachts, updates `search_yachts` RPC to join through `yacht_builders`. All in one migration to avoid broken intermediate states.

### Fuzzy Matching

7. **Prefix + trigram.** Primary: prefix match on `name_normalized`. Fallback: `pg_trgm` similarity at 0.3 threshold. Tune later from real usage.

8. **Accent/case insensitive.** `name_normalized` stores lowercase, accent-stripped version. "Lürssen" normalizes to "lurssen". User typing "lur" matches via prefix.

### Auto-Create Flow

9. **Create at save time.** When a user saves a yacht with a builder that doesn't match anything in `yacht_builders`, auto-create a new row. No orphan rows from abandoned forms.

10. **Auto-capitalize.** Title case as default. Preserve Mc/Mac patterns, lowercase particles (van der), accented characters. Edge cases fixed manually by founder. Quorum-based corrections planned for future.

11. **No friction.** User just types. Suggestions appear if matched, nothing appears if not. Builder gets created silently when yacht is saved. No "Add new builder" button or confirmation.

### CV Parsing Path

12. **Same resolution logic.** When a confirmed yacht is saved from CV review, the parsed builder string goes through the same fuzzy match → auto-create path. One code path, two entry points.

### UI

13. **Shared `BuilderInput` component.** Used in both YachtPicker create form and YachtMatchCard blue-state inline edit. Same logic, styled to fit each context.

14. **Max 5 suggestions.** Dropdown shows builder names only. No metadata, no icons. Clean list, tap to select.

### RPC Changes

15. **Same interface.** `search_yachts` RPC keeps `p_builder text` parameter and returns `builder text`. Internally joins through `yacht_builders` and matches against `name_normalized`. +0.2 sim boost logic unchanged. Callers (StepExperience, CV flow) don't change how they call it.

### RLS

16. **Read + Insert** for all authenticated users. **No Update/Delete** via client — founder-only operations directly in Supabase. Users grow the list but can't edit or remove entries.

### Seed Data

17. **Top 100 builders.** Every builder at 60m+ comprehensively, strong 40m+ representation, top popular 24m+ yards. Real names with correct spelling and accents.

---

## Surfaces to Update

| Surface | File | Change |
|---------|------|--------|
| YachtPicker create form | `components/yacht/YachtPicker.tsx` | Replace builder `<Input>` with `BuilderInput` |
| YachtMatchCard blue state | `components/yacht/YachtMatchCard.tsx` | Replace builder `<input>` with `BuilderInput` |
| YachtPicker `doCreate()` | `components/yacht/YachtPicker.tsx` | Resolve builder → `builder_id` at save |
| StepExperience confirm | `components/cv/steps/StepExperience.tsx` | Resolve builder → `builder_id` at confirm |
| `search_yachts` RPC | `supabase/migrations/` | Join through `yacht_builders` |
| Seed script | `scripts/seed/seed-test-data.mjs` | Create builder rows, reference by ID |
| CV types | `lib/cv/types.ts` | `ConfirmedYacht` may need `builder_id` |

---

## Build Order

1. Migration: create `yacht_builders` table + RLS + seed 100 builders
2. Migration: add `builder_id` FK to `yachts`, drop `builder` text column
3. Migration: update `search_yachts` RPC to join through `yacht_builders`
4. `BuilderInput` component: autocomplete with prefix + trigram query
5. Builder resolution helper: `resolveOrCreateBuilder(name, supabase, userId)`
6. Wire into YachtPicker create form
7. Wire into YachtMatchCard blue-state edit
8. Wire into StepExperience confirm flow
9. Update seed script
10. Update types

---

## Exit Criteria

- [ ] `yacht_builders` table exists with 100 seeded builders
- [ ] Typing in builder field shows autocomplete suggestions from DB
- [ ] Selecting a suggestion fills the field
- [ ] Saving a yacht with unknown builder auto-creates a `yacht_builders` row
- [ ] CV review confirm path resolves builder to `builder_id`
- [ ] `search_yachts` RPC returns builder name via join
- [ ] Type-check clean, build clean
- [ ] Verified on mobile (375px) in both YachtPicker and CV review
