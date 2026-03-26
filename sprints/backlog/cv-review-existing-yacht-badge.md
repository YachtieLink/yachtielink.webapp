# CV Review — Yacht Matching UX Improvements

**Status:** fleshed-out
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary
The CV review experience step (Step 2 of 5) needs a smarter yacht-matching flow. Currently it shows every parsed yacht as "new" with no awareness of what's already in the database. The user has no confidence the right yacht was matched, no social proof, and no way to correct a bad match.

## Current Behaviour
- `StepExperience` always sets `status: 'new'` for every parsed yacht
- The `'matched'` status type exists in the `YachtCardState` interface but is never assigned
- Save function (`saveConfirmedImport`) correctly deduplicates at save time (matches by yacht_id + role via `search_yachts` RPC, does enrich-only update) — so no data integrity issue, but the user doesn't know this
- No crew count shown on yacht cards
- No way to pick an alternative yacht from search results
- "Edit" button only edits parsed fields (role, dates, etc.), not which yacht entity it resolves to
- Header copy is generic: "We found 2 yachts on your CV"

## Proposed UX

### Card States

**Matched (green badge)** — yacht name fuzzy-matched a DB yacht via `search_yachts` RPC
- Badge: `matched` (green)
- Shows: yacht name, specs from DB (not parsed), crew count ("12 crew on YachtieLink")
- Shows: user's parsed role + dates below
- Action: "Not this yacht?" link → opens yacht picker
- Action: "Edit" → edit role, dates, employment type, cruising area
- Action: "Skip" → exclude from import

**Unmatched (amber badge)** — no DB match above similarity threshold
- Badge: `new` (amber/blue)
- Shows: yacht name + parsed specs
- Copy: "We didn't find this yacht in our database. Would you like to create it?"
- Action: "Search database" → opens yacht picker (maybe it's there under a different name)
- Action: "Create new yacht" → default behaviour, creates on save
- Action: "Edit" / "Skip" as above

**Already on your profile (subtle badge)** — user already has an attachment to this yacht+role
- Badge: `already added` (gray/subtle)
- Copy: "This yacht is already on your profile. We'll update any missing details."
- Action: "Skip" / "Edit" as above

### Header Copy
- Mixed: "We found 2 yachts on your CV" (keep as-is, the cards tell the story)
- All matched: "We found 2 yachts in our database that match your CV"
- None matched: "We didn't find these yachts in our database — you can create them or search manually"

### Yacht Picker (modal or inline expand)
- Text search input → calls `search_yachts` RPC
- Shows top 5 results with name, length, builder, flag, crew count
- User taps one → card updates to matched state with DB yacht info
- "None of these — create new" option at bottom

### Crew Count Query
- After matching, batch-fetch crew counts: `SELECT yacht_id, COUNT(*) FROM attachments WHERE yacht_id IN (...) AND deleted_at IS NULL GROUP BY yacht_id`
- Display as "12 crew on YachtieLink" or "Be the first crew member" if 0

## Data Flow
1. CV parsed → `ParsedYachtEmployment[]` available
2. **New step:** Client calls a new API route or server action that runs `search_yachts` for each parsed yacht name and returns `{ parsedIndex, matchedYachtId, similarity, crewCount, dbYachtSpecs }[]`
3. `StepExperience` receives match results and sets initial card states accordingly
4. User reviews, overrides if needed, confirms
5. Save proceeds as today — `saveConfirmedImport` does its own matching, but now the user's intent is aligned

## Edge Cases
- Parser extracts "MY Lady S" but DB has "M/Y Lady S" → fuzzy match should catch this (already handled by `search_yachts` trigram similarity)
- Two DB yachts with same name (common: "Serenity") → show both in picker with disambiguating specs (length, builder)
- Yacht name changed (former name on CV) → `search_yachts` already searches `former_names` column
- User on re-import already has this yacht → show "already added" state, save does enrich-only update

## Scope
- Run `search_yachts` RPC at review time (not just save time) to pre-match
- Three card states: matched / unmatched / already-on-profile
- Crew count social proof per matched yacht
- Yacht picker (search + select) for overriding matches
- Keep "Edit" for field-level corrections (role, dates, etc.)
- Keep "Skip" for excluding yachts

## Files Likely Affected
- `app/(protected)/app/cv/review/page.tsx` — fetch existing attachments, pass to wizard
- `components/cv/CvImportWizard.tsx` — thread match results prop, add API call after parse
- `components/cv/steps/StepExperience.tsx` — card states, badge display, crew count, yacht picker
- `lib/cv/types.ts` — extend `YachtCardState` or add match result types
- New: `app/api/cv/match-yachts/route.ts` or server action — batch yacht matching endpoint

## Graph-Building Opportunities (same step)

### "Crew you may know" teaser
When a yacht is matched, check if any of its crew are on the platform. Show inline:
- "Charlotte, Sofia, and 2 others were on TS Eclipse Star"
- Tapping names could link to their profiles after import completes
- This is the first "aha" moment — the user sees their old colleagues before they've even finished onboarding
- Drives immediate post-import engagement (view profiles, send endorsements)

### Date overlap validation (visual)
The save function already detects overlapping yacht dates (>1 month) and logs a console warning. Surface this in the UI instead:
- If parsed dates for Yacht A overlap with Yacht B (or an existing attachment), show an amber inline warning: "These dates overlap with TS Driftwood — is that correct?"
- Don't block — just inform. Overlaps happen (transitional periods, dual roles)
- Gives the user a chance to fix dates before save rather than discovering bad data later

### Yacht specs enrichment (crowdsource)
If the DB yacht exists but is missing specs that the CV provides (builder, length, flag state), prompt the user to contribute:
- "We don't have the builder for TS Eclipse Star yet — add Oceanco?"
- Checkbox or one-tap confirm — low friction
- Crowdsources yacht data from every CV import, so the DB gets richer over time
- Only prompt for high-confidence fields (builder, length) not subjective ones

## Not In Scope (for now)
- Yacht photo/cover on the card (nice but not essential)
- Land job matching (the "non-yacht roles" note at the bottom of the step)
- Automatic crew connection suggestions at this step (save for post-import flow)
