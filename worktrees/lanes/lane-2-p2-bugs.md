---
lane: 2
branch: fix/p2-bug-fixes
worktree: yl-wt-2
model: Sonnet
effort: medium
---

## Objective

Fix four P2 bugs: SavedProfileCard missing data, yacht prefix null crash, ghost endorser card layout mismatch, and home country toggle not wired to CV.

## Tasks

### 1. SavedProfileCard wiring
Wire `seaTimeDays` + `yachtCount` props from `SavedProfilesClient.tsx`. Extend the saved profiles query to include these fields.
- **Files:** `components/saved/SavedProfileCard.tsx`, `components/saved/SavedProfilesClient.tsx`
- Check the query in SavedProfilesClient — add joins/selects for sea_time_days and yacht_count.

### 2. Yacht prefix null type
Fix `prefixedYachtName()` in `lib/yacht-prefix.ts` to skip prefix when `yacht_type` is null.
- **File:** `lib/yacht-prefix.ts`
- Guard: if `yacht_type` is null/undefined, return the name without prefix.

### 3. Ghost endorser card layout
Update the ghost branch in `EndorsementCard.tsx` to match the non-ghost layout — role + yacht on a separate line.
- **File:** `components/endorsements/EndorsementCard.tsx`
- Look at how the non-ghost endorser renders role + yacht info and replicate that structure in the ghost conditional branch.

### 4. Show home country on CV
Wire the `show_home_country` toggle to CV generation output in `CvPreview.tsx`.
- **File:** `components/cv/CvPreview.tsx` (or wherever CV rendering reads display settings)
- The toggle already exists in settings — make sure CV generation respects it.

## Allowed Files
- `components/saved/SavedProfileCard.tsx`
- `components/saved/SavedProfilesClient.tsx`
- `lib/yacht-prefix.ts`
- `components/endorsements/EndorsementCard.tsx`
- `components/cv/CvPreview.tsx`
- Related CV rendering files if needed

## Forbidden Files
- `app/(protected)/app/layout.tsx` (Lane 1)
- `app/(protected)/app/cv/preview/page.tsx` (Lane 1)
- `lib/social-platforms.ts` (Lane 3)
- `lib/sea-time.ts` (Lane 3)
- `lib/profile-summaries.ts` (Lane 3)
- Any migration files

## Patterns to Follow
- Existing EndorsementCard non-ghost layout for task 3
- Existing CV toggle patterns for task 4
