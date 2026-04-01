# Lane 2 — BUG-03: Colleague Display Names

## Objective
Show full names (first + last) in colleague lists instead of just first names. When `display_name` differs from first name (nickname), show both. Investigate and fix duplicate colleague entries.

## Background
- Colleague lists show "James, Captain" with no last name — ambiguous when multiple James exist
- `display_name` is the nickname field, `full_name` is the legal name
- The `get_colleagues` RPC returns `colleague_id` and `shared_yachts` — profile data is fetched separately
- Profile fetches already include `full_name` and `display_name`

## Tasks

### 1. Update colleague name rendering in ColleagueExplorer
**File:** `components/network/ColleagueExplorer.tsx`

Current (line ~158): `name: profile.display_name || profile.full_name`

Change name building logic:
- If `display_name` exists and differs from first name of `full_name`: show `"Charlotte 'Charlie' Beaumont"` pattern
- If no `display_name` or it matches first name: show `full_name` directly (e.g. "James Whitfield")
- Extract first name from `full_name` using `full_name.split(' ')[0]`

### 2. Update colleague name rendering in colleagues page
**File:** `app/(protected)/app/network/colleagues/page.tsx`

Same pattern — wherever colleague names are built (around line 156-168), use full names.

### 3. Update endorsement request colleague list
**File:** `app/(protected)/app/endorsement/request/page.tsx`

Around line 166-196, update colleague display to use full names with same pattern.

### 4. Investigate duplicate colleagues
Check the `get_colleagues` RPC in `supabase/migrations/20260313000004_functions.sql` (line ~165-190):
- Does it properly deduplicate when two users share multiple yachts?
- Could the `test-onboard-james` test user be causing a phantom duplicate?
- If dedup is needed, fix the RPC with a new migration OR handle client-side

### 5. Consider a shared helper
If the name formatting logic is used in 3+ places, extract a small helper:
```typescript
// lib/format-crew-name.ts
export function formatCrewName(fullName: string, displayName?: string | null): string
```

Keep it simple — no component, just a string formatter.

## Allowed Files
- `components/network/ColleagueExplorer.tsx`
- `app/(protected)/app/network/colleagues/page.tsx`
- `app/(protected)/app/endorsement/request/page.tsx`
- `lib/format-crew-name.ts` (NEW, only if needed in 3+ places)
- `supabase/migrations/20260401000005_fix_colleague_dedup.sql` (NEW, only if RPC fix needed)
- `sprints/backlog/colleague-display-names.md`

## Forbidden Files
- Any file not in the allowed list
- CHANGELOG.md, STATUS.md, session files
- Any other endorsement display components (out of scope)

## Patterns to Follow
- Read `components/network/ColleagueExplorer.tsx` fully before changing — understand the data flow
- The page uses section color wayfinding (Network = navy) — don't change colors
- Compact list pattern with expand-on-tap — preserve existing UX

## Edge Cases
- `full_name` could be null for very old users — fall back to `display_name` then "Crew"
- `display_name` identical to first name of `full_name` — don't show redundant nickname
- Very long names — must truncate gracefully (existing `truncate` class)
