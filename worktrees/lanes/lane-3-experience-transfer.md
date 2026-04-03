# Lane 3 — Experience Transfer + Endorsement Visibility

**Branch:** `feat/experience-transfer`
**Worktree:** `yl-wt-3`
**Model:** Opus | **Effort:** high
**Sprint ref:** Rally 009 Session 6, Lane 3

---

## Objective

Build yacht graph integrity tools: user-initiated experience transfer between yacht nodes, automatic endorsement dormancy when endorser/endorsee no longer share a yacht, and automatic colleague connection rebuild after transfer. Tables already exist in the database.

## Migration Note

**DO NOT create or modify any migration files.** The migration (`20260403100003_experience_transfers.sql`) is already applied and committed on main. Types are regenerated. Use `Database["public"]["Tables"]["experience_transfers"]` and note the new `is_dormant` column on `endorsements` from `lib/database.types.ts`.

## Tasks

### Task 1: Transfer Experience API

**File:** `app/api/transfer-experience/route.ts` (new)
- POST with auth
- Params: `employment_id`, `to_yacht_id`
- Validates user owns the employment record
- Moves the employment attachment from old yacht to new yacht (update the yacht_id on the employment record — dates, role, everything stays)
- Logs the transfer in `experience_transfers` for audit (from_yacht_id, to_yacht_id)
- Calls endorsement visibility recalculation (Task 2)
- Calls colleague connection rebuild (Task 3)
- Returns 200

**Important:** Find how employment records reference yachts — check the schema. Look at `user_employments` or equivalent table.

### Task 2: Endorsement Visibility Logic

**File:** `lib/endorsements/visibility.ts` (new)

After any experience transfer:
- For each endorsement involving the transferred user:
  - Check if BOTH endorser and endorsee are still attached to the same yacht node
  - If yes: set `is_dormant = false` (endorsement visible)
  - If no: set `is_dormant = true` (endorsement hidden but not deleted)
- No user confirmation needed — automatic based on graph state
- Foundational principle: an endorsement always means two people were on the same yacht at the same time. The shared yacht attachment IS the proof.

**Also:** Update all endorsement queries to filter `is_dormant = false` by default. Search for existing endorsement fetching queries and add the filter.

### Task 3: Colleague Connection Rebuild

**File:** `lib/network/colleague-rebuild.ts` (new)

After experience transfer:
- Recalculate colleague connections for the transferred user based on new shared yacht
- New colleagues (people on the destination yacht with overlapping dates) appear automatically
- Old colleagues from the source yacht are removed if no other shared yacht exists
- Find the existing colleague calculation logic and extend it

### Task 4: Transfer UI

**File:** `components/experience/TransferExperienceButton.tsx` (new)
- Available on employment records in profile/career section
- Opens modal with yacht search to select destination yacht
- Confirmation step: "Move your [role] experience from [Yacht A] to [Yacht B]? Dates and details will transfer. Endorsements will update automatically."
- Submit → API call → success toast
- Revalidate profile data after success

### Task 5: Wire Transfer Button

Add `TransferExperienceButton` to the career/experience section where individual employment entries are displayed. Find the right component — likely in `components/profile/` or the career timeline area.

## Allowed Files

- `app/api/transfer-experience/route.ts` — new
- `lib/endorsements/visibility.ts` — new
- `lib/network/colleague-rebuild.ts` — new
- `components/experience/TransferExperienceButton.tsx` — new
- Endorsement query files — add `is_dormant = false` filter
- Career/experience display components — wire transfer button
- Network/colleague query files — extend for rebuild

## Forbidden Files

- `supabase/migrations/*` — DO NOT TOUCH
- `lib/database.types.ts` — already regenerated
- CV wizard components (Lane 1)
- Report/bug report components (Lane 2)
- ProUpsellCard (Lane 4)
- Public profile page layout (Lane 2 wires ReportButton there)

## Patterns to Follow

- Read existing API routes for auth patterns
- Read `lib/sea-time.ts` for how employment/yacht relationships work
- Read `lib/queries/profile.ts` for how endorsements are fetched
- Read `components/profile/CareerTimeline.tsx` for where employment entries render
- Read `components/network/` for how colleague connections work
- Check the endorsement fetching pattern — likely in queries or lib files
