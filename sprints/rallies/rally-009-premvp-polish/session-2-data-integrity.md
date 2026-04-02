# Session 2 — Data Integrity + CV Restore Gaps

**Rally:** 009 Pre-MVP Polish
**Status:** Ready after Session 1 merges
**Estimated time:** ~6 hours across 3 workers
**Dependencies:** Session 1 (formatSeaTime canonical location established in Lane 3)

**Grill-me decisions applied:** §1 (Q1.1–Q1.5), UX audit (UX6a–UX6d)

---

## Lane 1: Non-Yachting Experience (Opus, high)

**Branch:** `feat/land-experience`
**Objective:** Users with shore-side employment can see and manage that data. CV parser already extracts it — we just need to save, display, and let users edit it.

**This is the only lane in Rally 009 with a schema change.** Only one lane may have migrations.

### Grill-Me Decisions (locked)

- **Q1.1:** Integrated reverse-chronological timeline — shore-side jobs sit alongside yacht jobs sorted by date. Distinguished by icon (anchor vs briefcase), not a separate section.
- **Q1.2:** Moot — no separate section, no section label needed. Icon differentiates.
- **Q1.3:** Include industry if present, don't require it.

### Task 1: Migration

Create `supabase/migrations/YYYYMMDDHHMMSS_land_experience.sql`:

```sql
CREATE TABLE public.land_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  description TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE public.land_experience ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "land_experience: owner full access"
  ON public.land_experience
  FOR ALL
  USING (user_id = auth.uid());

-- Public read (for visible profiles)
CREATE POLICY "land_experience: public read"
  ON public.land_experience
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = land_experience.user_id
        AND u.onboarding_complete = true
    )
  );

-- Index
CREATE INDEX idx_land_experience_user_id ON public.land_experience(user_id);
```

**File:** `supabase/migrations/` — new file

### Task 2: Save Parsed CV Data

**Problem:** The CV parser extracts land employment into `employment_land` (using `ParsedLandJob` interface in `lib/cv/types.ts`), but `save-parsed-cv-data.ts` ignores this data.

**Fix:** In `save-parsed-cv-data.ts`, after saving yacht experience, insert `employment_land` entries into `land_experience` table. Map fields:
- `company` → `company`
- `role` / `position` → `role`
- `start_date`, `end_date` → `start_date`, `end_date`
- `description` → `description`
- `industry` → `industry` (if available)

**Files:**
- `lib/cv/save-parsed-cv-data.ts`
- `lib/cv/types.ts` (read only — verify ParsedLandJob interface)

### Task 3: CV Wizard Step

Add a "Shore-side Experience" step in the CV import wizard, placed between the yacht Experience step and Certifications step.

**Pattern:** Follow `StepExperience.tsx` card pattern but simplified:
- Card per land job showing: company, role, dates, description
- Edit inline (company name, role, dates, description fields)
- Delete button per card
- "Add shore-side role" button at bottom
- Empty state: "No shore-side experience found in your CV. You can add roles manually."

**Files:**
- Create `components/cv/steps/StepLandExperience.tsx`
- Update wizard step sequence in parent component (find where steps are ordered)
- Update step count/progress indicator

### Task 4: Profile + Public Profile Display

**Per grill-me Q1.1:** Integrated timeline, NOT a separate section.

**Profile page:**
- In the Career group, experience entries are a single reverse-chronological list
- Shore-side entries use a briefcase icon; yacht entries use an anchor icon
- No separate "Shore-side Experience" section header
- Compact list rows: icon + company/yacht + role + date range

**Public profile:**
- Same integrated timeline on public profile bento/sections
- Briefcase icon for shore-side, anchor for yacht
- Shore-side naturally falls to bottom since it's typically pre-yachting

**Files:**
- `app/(protected)/app/profile/page.tsx` — integrate into experience section
- `components/profile/` — update experience display to handle both types
- `components/public/` — update public profile experience display
- `lib/queries/profile.ts` — extend `getProfileSections()` to query `land_experience`

### Task 5: Supabase Types

After migration, regenerate types:
```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

**Allowed files:**
- `supabase/migrations/` — new migration only
- `lib/cv/save-parsed-cv-data.ts`
- `lib/cv/types.ts` (read only)
- `components/cv/steps/StepLandExperience.tsx` (new)
- CV wizard parent component (step ordering)
- `app/(protected)/app/profile/page.tsx`
- `components/profile/` — experience display
- `components/public/` — public profile experience display
- `lib/queries/profile.ts` — extend queries
- `lib/database.types.ts` — regenerate

**Forbidden files:**
- Any yacht experience components that don't need modification
- `middleware.ts`, `app/api/stripe/*`

---

## Lane 2: Overlapping Yacht Dates (Sonnet, high)

**Branch:** `fix/sea-time-overlap`
**Objective:** Fix sea time calculation to not double-count overlapping stints. Add import-time validation.

### Grill-Me Decisions (locked)

- **Q1.4:** 4-week threshold. Under 4w = info note, over 4w = amber warning.
- **Q1.5:** Recalculate on next profile view. No batch migration.

### Task 1: Date Range Merge Utility

Create a utility function for merging overlapping date ranges.

**File:** `lib/sea-time.ts` (extend — this is the canonical location after Session 1 Lane 3)

```typescript
interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Merge overlapping date ranges into a union set.
 * Input: [Jan-Jun, Mar-Sep, Nov-Dec]
 * Output: [Jan-Sep, Nov-Dec]
 */
export function mergeOverlappingRanges(ranges: DateRange[]): DateRange[]

/**
 * Calculate total days from a set of potentially overlapping date ranges.
 * Uses union-based calculation (no double-counting).
 */
export function calculateSeaTimeDays(ranges: DateRange[]): number

/**
 * Detect overlaps between date ranges.
 * Returns pairs of overlapping ranges with overlap duration.
 */
export function detectOverlaps(ranges: DateRange[]): Array<{
  rangeA: DateRange;
  rangeB: DateRange;
  overlapDays: number;
}>
```

### Task 2: Fix Sea Time Calculation

Find all places where sea time is currently calculated as a naive sum of durations and replace with `calculateSeaTimeDays()`.

**Search for:** `seaTime`, `sea_time`, `totalDays`, `formatSeaTime` usage — trace back to where the raw number is computed.

**Important:** Don't change the display format, only the calculation input. The `formatSeaTime` function (canonicalized in Session 1) stays as-is — it just receives a more accurate number.

### Task 3: CV Import Overlap Validation

In `StepExperience.tsx`, after the user confirms their yacht experience entries, run `detectOverlaps()` on the date ranges.

**Behavior:**
- **Short overlap (<28 days):** Info note below the two entries: "These roles overlap by {N} days. This is common for handover periods."
- **Long overlap (>=28 days):** Amber warning: "These roles overlap by {N} days. Your sea time will be calculated based on the actual calendar days, not summed separately." Highlight both entries with amber border.
- **Neither blocks import.** User can always proceed.

**Allowed files:**
- `lib/sea-time.ts`
- `components/cv/steps/StepExperience.tsx`
- `components/profile/SeaTimeSummary.tsx`
- `lib/queries/profile.ts` (if sea time is computed there)
- Any component that computes sea time from raw dates

**Forbidden files:**
- `supabase/migrations/*` — no schema changes in this lane
- Any non-sea-time components

---

## Lane 3: CV Restore Data Integrity (Sonnet, high) — NEW

**Branch:** `fix/cv-restore-gaps`
**Objective:** Fix 4 data integrity gaps in CV re-parse flow discovered in UX audit. Currently, re-parsing a CV silently overwrites 7 fields with no restore button, creates duplicate education entries, and replaces entire arrays.

### UX Audit Sources

- **UX6a:** 7 fields missing `trackOverwrite` — silently overwrite with no restore
- **UX6b:** Education entries duplicate on every re-parse
- **UX6c:** Languages array replaced entirely instead of merged
- **UX6d:** Travel docs array replaced entirely instead of merged

### Task 1: Add trackOverwrite to 7 Missing Fields (UX6a)

**Problem:** `save-parsed-cv-data.ts` uses `trackOverwrite()` for 6 fields (name, bio, etc.) but silently overwrites 7 others with no restore button.

**Missing fields:**
- `location_country`
- `location_city`
- `date_of_birth`
- `smoking_preference`
- `appearance_notes`
- Travel documents (handled differently — see Task 3)
- Languages (handled differently — see Task 3)

**Fix:** For each of these 5 scalar fields, wrap the update in `trackOverwrite()` so the user sees "Restore previous value" if the re-parse changes them.

**File:** `lib/cv/save-parsed-cv-data.ts`

### Task 2: Education Dedup on Re-Parse (UX6b)

**Problem:** Re-parsing a CV inserts education entries without checking for duplicates. Every re-parse creates duplicates.

**Fix:** Before inserting education entries, check for existing entries with matching `institution` + `qualification` (case-insensitive). If a match exists, update it instead of inserting a new row.

**File:** `lib/cv/save-parsed-cv-data.ts`

### Task 3: Languages — Merge Instead of Replace (UX6c)

**Problem:** Re-parsing replaces the entire languages array. User-added languages are lost.

**Fix:** Dedup by language name (case-insensitive). Append new languages from the parse, keep existing ones. Never remove a language the user already has.

**File:** `lib/cv/save-parsed-cv-data.ts`

### Task 4: Travel Docs — Merge Instead of Replace (UX6d)

**Problem:** Re-parsing replaces the entire travel docs array. User-added documents are lost.

**Fix:** Union of existing + parsed documents. Dedup by document type. Never remove a document the user already has.

**File:** `lib/cv/save-parsed-cv-data.ts`

**Allowed files:**
- `lib/cv/save-parsed-cv-data.ts` — primary target
- `lib/cv/types.ts` (read only)
- Any helper utilities needed for dedup/merge logic

**Forbidden files:**
- `supabase/migrations/*` — no schema changes
- UI components — this is backend logic only
- Any non-CV-import files

---

## Exit Criteria

- Users with shore-side employment see their land experience integrated chronologically with yacht experience (briefcase vs anchor icon)
- Sea time calculation accurately handles overlapping date ranges (no double-counting)
- CV import shows clear warnings for overlapping yacht stints (4-week threshold)
- CV re-parse no longer silently overwrites location, DOB, smoking, appearance fields (restore available)
- CV re-parse no longer creates duplicate education entries
- Languages and travel docs are merged on re-parse, not replaced
- More tab is cleanly organized into logical groups with sand wayfinding
- Migration applies cleanly via `supabase db push`
- All new components follow existing design system patterns
