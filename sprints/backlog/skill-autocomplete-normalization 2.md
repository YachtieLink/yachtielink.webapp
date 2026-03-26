---
slug: skill-autocomplete-normalization
status: idea
priority: P2
source: founder QA (2026-03-26)
modules: [skills, hobbies, profile]
---

# Skill & Hobby Autocomplete + Normalization

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary

Free-text fields (skills, hobbies) have no cross-user autocomplete or input normalization. Users can enter "Welding", "welding", or "weding" — all stored as separate values. We need a growing lookup table that suggests existing terms as users type, allows new entries, and normalizes formatting.

## Current State

- **Skills**: hardcoded suggestion chips per category, client-side case-insensitive dedup (same user only), no DB autocomplete
- **Hobbies**: no suggestions at all (only emoji matching), no dedup
- **Certifications**: already has `certification_types` reference table with hierarchical picker — this is the pattern to follow

## What Needs to Be Built

1. **Lookup tables** — `skill_types` and `hobby_types` (or a single `tag_types` with a `category` column) seeded from existing `user_skills` / `user_hobbies` data
2. **DB-powered autocomplete** — as user types, query the lookup table for fuzzy/prefix matches and show suggestions
3. **Auto-grow** — when a user enters a term that doesn't exist, insert it into the lookup table (normalized) so future users see it
4. **Input normalization** — title case on save, trim whitespace, possibly fuzzy matching to catch near-duplicates ("weding" → "did you mean Welding?")
5. **Migration** — deduplicate and normalize existing free-text entries against the new lookup table

## CV Import Integration

Same match-against-DB pattern as yachts and certs — the CV review steps for skills and hobbies should:

- **Fuzzy match** parsed skill/hobby names against the lookup tables
- **Matched:** show the normalised DB name (not the raw parsed text), with a count — "42 crew list this skill"
- **Ambiguous:** "Did you mean X?" when the parser pulls something close but not exact (e.g. "silver serv" → "Silver Service")
- **Unmatched:** "Add to database?" — user confirms, new entry gets created for future users
- **Chip UI:** show matched skills as green chips, unmatched as amber, let user tap to correct or remove

This means the CV import builds the skill/hobby database the same way it builds the yacht and cert databases — every import makes the suggestions better for the next user.

### CV Review Step Copy
- "We found 8 skills on your CV — 6 match our database"
- Matched chips shown with ✓, unmatched shown with "Add?" prompt
- "Add all new skills to database" bulk action

## Chip UX Redesign

The current chip interaction is broken — tap-to-delete with no visual indicator. Needs a full rethink:

- **✕ button on each chip** — clear affordance for removal, no ambiguity
- **Add via autocomplete input** — type, see suggestions, tap to add (not a hidden text field)
- **Chip states:** default (gray), matched from CV (green with ✓), new/unmatched (amber with "?"), removing (red flash then gone)
- **Long-press or swipe for mobile** — secondary delete gesture, but ✕ button is primary
- **Empty state:** "Start typing to add skills" with example suggestions below
- **Reorder?** — probably not needed for skills/hobbies, but keep the door open

This shared `<AutocompleteChipInput>` component gets used everywhere: CV import review, profile settings edit, onboarding flow.

## What Doesn't Need to Be Built Yet

- Admin UI for managing the lookup table (can be done via Supabase dashboard initially)
- Synonym merging (e.g. "SCUBA" and "Scuba Diving" → same concept)
- Skill endorsement / validation by colleagues

## Files Likely Affected

- `app/(protected)/app/skills/edit/page.tsx` — replace hardcoded chips with DB-powered autocomplete
- `app/(protected)/app/hobbies/edit/page.tsx` — add autocomplete + suggestions
- `components/cv/steps/StepSkills.tsx` — match UI during CV import
- `components/cv/steps/StepHobbies.tsx` — match UI during CV import (or combined step)
- `lib/validation/schemas.ts` — add title case normalization to skill/hobby schemas
- New: `search_skills` / `search_hobbies` RPCs (trigram search)
- New: migration to create `skill_types` / `hobby_types` tables
- New: migration to seed lookup tables from existing data + deduplicate
- New: shared `<AutocompleteChipInput>` component

## Notes

- Certifications already prove the reference-table pattern works in this codebase
- The shared `<AutocompleteChipInput>` component should be reusable across CV import review, profile edit, and onboarding
- Fuzzy matching could use Postgres `pg_trgm` extension for typo tolerance
- This is part of a consistent pattern across the whole CV import: yachts → certs → skills/hobbies all use match → confirm → crowdsource
