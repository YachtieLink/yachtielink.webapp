# Session 2 — Data Integrity Features

**Rally:** 009 Pre-MVP Polish
**Status:** Ready after Session 1 merges
**Estimated time:** ~6 hours across 2-3 workers
**Dependencies:** Session 1 (formatSeaTime canonical location established in Lane 3)

---

## Lane 1: Non-Yachting Experience (Opus, high)

**Branch:** `feat/land-experience`
**Objective:** Users with shore-side employment can see and manage that data. CV parser already extracts it — we just need to save, display, and let users edit it.

**This is the only lane in Rally 009 with a schema change.** Only one lane may have migrations.

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

### Task 4: Profile Display

Add "Shore-side Experience" section to the profile page and public profile.

**Profile page:**
- New section in the section list, grouped under "Career" with yacht experience
- Compact list: company, role, date range per row
- Edit link → inline editing or link to CV wizard

**Public profile:**
- New bento tile or section showing land experience
- Chronological integration with yacht experience, distinguished by a subtle "shore" icon/badge (no yacht icon)

**Files:**
- `app/(protected)/app/profile/page.tsx` — add section
- `components/profile/` — new `LandExperienceSection.tsx`
- `components/public/` — new tile or section component
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
- `components/profile/LandExperienceSection.tsx` (new)
- `components/public/` — new land experience display
- `lib/queries/profile.ts` — extend queries
- `lib/database.types.ts` — regenerate

**Forbidden files:**
- Any yacht experience components (separate concern)
- `middleware.ts`, `app/api/stripe/*`

---

## Lane 2: Overlapping Yacht Dates (Sonnet, high)

**Branch:** `fix/sea-time-overlap`
**Objective:** Fix sea time calculation to not double-count overlapping stints. Add import-time validation.

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
export function mergeOverlappingRanges(ranges: DateRange[]): DateRange[] {
  // Sort by start date, merge overlapping/adjacent ranges
}

/**
 * Calculate total days from a set of potentially overlapping date ranges.
 * Uses union-based calculation (no double-counting).
 */
export function calculateSeaTimeDays(ranges: DateRange[]): number {
  const merged = mergeOverlappingRanges(ranges);
  return merged.reduce((sum, r) => sum + daysBetween(r.start, r.end), 0);
}

/**
 * Detect overlaps between date ranges.
 * Returns pairs of overlapping ranges with overlap duration.
 */
export function detectOverlaps(ranges: DateRange[]): Array<{
  rangeA: DateRange;
  rangeB: DateRange;
  overlapDays: number;
}> {
  // Pairwise comparison
}
```

### Task 2: Fix Sea Time Calculation

Find all places where sea time is currently calculated as a naive sum of durations and replace with `calculateSeaTimeDays()`.

**Search for:** `seaTime`, `sea_time`, `totalDays`, `formatSeaTime` usage — trace back to where the raw number is computed.

**Likely locations:**
- `components/profile/SeaTimeSummary.tsx`
- `lib/sea-time.ts` (existing calculation)
- `lib/queries/profile.ts` (if computed in query)
- `components/cv/CvPreview.tsx`
- Profile summary generation

**Important:** Don't change the display format, only the calculation input. The `formatSeaTime` function (canonicalized in Session 1) stays as-is — it just receives a more accurate number.

### Task 3: CV Import Overlap Validation

In `StepExperience.tsx`, after the user confirms their yacht experience entries, run `detectOverlaps()` on the date ranges.

**Behavior:**
- **Short overlap (<28 days):** Info note below the two entries: "These roles overlap by {N} days. This is common for handover periods."
- **Long overlap (>=28 days):** Amber warning: "These roles overlap by {N} days. Your sea time will be calculated based on the actual calendar days, not summed separately." Highlight both entries with amber border.
- **No overlaps:** No message shown.
- **Neither blocks import.** User can always proceed.

**Files:**
- `components/cv/steps/StepExperience.tsx` — add overlap detection + UI

### Task 4: Display Note on Profile (Optional)

If sea time was recalculated and is different from what was previously stored, show a one-time info note on the profile page: "Your sea time has been recalculated to account for overlapping periods."

**Skip this task if it adds complexity.** The correct number showing up is enough for MVP.

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

## Lane 3: More Tab IA Prep (Sonnet, medium) — Optional

**Branch:** `chore/more-tab-ia`
**Objective:** Reorganize the More/Settings tab into proper groupings. Prep for receiving Cert Manager + Subscription from Insights (Session 4).

### Task 1: Reorganize Sections

Current More page (`app/(protected)/app/more/page.tsx`, 235 lines) has flat sections: Appearance, Profile, Saved, Account, Billing, Help, Legal, Sign Out.

**Reorganize into:**

```
YOUR ACCOUNT
  Login & Security          → /more/account
  Data Export               → /more/account (existing)
  Delete Account            → /more/delete-account (existing)

YOUR PROFILE
  Edit Profile & Contact    → /app/profile/settings
  Display Settings          → (existing link)
  Visibility                → (existing toggles)

SAVED
  Saved Profiles            → /app/network/saved
  [Saved Yachts]            → placeholder, future feature

APP
  Appearance                → Dark mode (coming soon)
  [Notifications]           → placeholder, future feature
  Feature Roadmap           → /more/roadmap

LEGAL
  Terms of Service          → /terms
  Privacy Policy            → /privacy

[SIGN OUT]                  → destructive button at bottom
```

### Task 2: Apply Sand Section Color

- Background: `var(--color-sand-50)` on page
- Section headers: `var(--color-sand-400)` text
- Group cards: `var(--color-surface)` with `rounded-2xl`

### Task 3: Prep Empty Slots

Add commented placeholders where Cert Manager and Subscription card will land (under YOUR ACCOUNT or a new SUBSCRIPTION group). Don't build these — Session 4 will move them from Insights.

```tsx
{/* Rally 009 Session 4: Cert Document Manager moves here from Insights */}
{/* Rally 009 Session 4: Subscription Management moves here from Insights */}
```

**Allowed files:**
- `app/(protected)/app/more/page.tsx`

**Forbidden files:** Everything else.

---

## Exit Criteria

- Users with shore-side employment see their land experience in CV wizard, profile, and public profile
- Sea time calculation accurately handles overlapping date ranges (no double-counting)
- CV import shows clear warnings for overlapping yacht stints
- More tab is cleanly organized into logical groups with sand wayfinding
- Migration applies cleanly via `supabase db push`
- All new components follow existing design system patterns
