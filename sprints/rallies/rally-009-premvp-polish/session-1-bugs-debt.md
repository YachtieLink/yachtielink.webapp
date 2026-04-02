# Session 1 — Bugs + Tech Debt + Quick Wins

**Rally:** 009 Pre-MVP Polish
**Status:** Ready to launch (no dependencies)
**Estimated time:** ~4 hours across 3 Sonnet workers

---

## Lane 1: Mobile UX Fixes

**Branch:** `fix/mobile-ux-polish`
**Model:** Sonnet | **Effort:** high
**Objective:** Fix the three highest-visibility mobile UX bugs. Verify two items from recent PRs.

### Task 1: Tab Bar Padding (P1 — ALL app pages affected)

**Problem:** The bottom tab bar (`BottomTabBar.tsx`, 64px / `h-16`) is fixed at the bottom of the screen. The app layout shell does NOT add bottom padding, so the last ~64px of every page is hidden behind the tab bar. Users can't see or tap content at the bottom.

**Fix:** Add `pb-24 md:pb-0` to the content wrapper in the app layout.

**File:** `app/(protected)/app/layout.tsx`

Current (line ~50):
```tsx
<main className="flex-1 md:pl-16">
  <div className="mx-auto max-w-2xl px-4 md:px-6">
    {children}
  </div>
</main>
```

Change to:
```tsx
<main className="flex-1 md:pl-16">
  <div className="mx-auto max-w-2xl px-4 pb-24 md:px-6 md:pb-0">
    {children}
  </div>
</main>
```

**Then audit:** Some pages already add their own `pb-24` via `PageTransition`. After adding it to the layout, check for double-padding. Search for `pb-24` in all page files under `app/(protected)/app/`. Remove redundant instances from individual pages if the layout now handles it globally.

**Allowed files:**
- `app/(protected)/app/layout.tsx`
- Any page.tsx under `app/(protected)/app/` that has redundant `pb-24`

### Task 2: Interests Chips Responsive (Verify + Fix)

**Context:** PR #150 included an "interests chip fix." The backlog item (`interests-chips-responsive-bug.md`) reports that at wider viewports (~500px+), MY INTERESTS chips on public profiles render as tall pill shapes with an empty rectangle below. MY SKILLS chips above work correctly.

**Action:**
1. Find the interests rendering component on public profiles (likely in `components/public/` — search for "interests" or "hobbies").
2. Compare its CSS/layout with the skills chip rendering.
3. If the responsive bug is fixed, note "verified fixed in PR #150" and move on.
4. If still broken, fix the chip layout to match the skills chip pattern (compact pills that flex-wrap).

**Allowed files:**
- `components/public/bento/tiles/HobbiesTile.tsx`
- `components/public/sections/` — any interests/hobbies section
- Related CSS if applicable

### Task 3: CV Preview Ghost Join (Verify + Fix)

**Context:** PR #148 added `ghost_endorser` joins to `getProfileSections()` and `getCvSections()`. The backlog item (`cv-preview-ghost-join.md`) reports that the CV preview page at `app/(protected)/app/cv/preview/page.tsx` has its OWN inline endorsements query (line ~21) that's stale — missing the ghost_endorser join, so ghost endorsements show "Anonymous."

**Action:**
1. Read `app/(protected)/app/cv/preview/page.tsx`.
2. Check if it uses `getCvSections()` or has an inline query.
3. If inline query exists, replace it with `getCvSections()` call to stay in sync.
4. If already using `getCvSections()`, verify the ghost_endorser join is present and note "verified fixed."

**Allowed files:**
- `app/(protected)/app/cv/preview/page.tsx`
- `lib/queries/profile.ts` (read only — don't modify)

---

## Lane 2: P2 Bug Fixes

**Branch:** `fix/p2-bugs-sweep`
**Model:** Sonnet | **Effort:** medium
**Objective:** Fix 4 small bugs that users will notice on first use.

### Task 1: SavedProfileCard Prop Wiring

**Problem:** `SavedProfileCard` accepts `seaTimeDays` and `yachtCount` props but they're never passed from the parent. The detail line shows nothing where it should show sea time and yacht count.

**Files:**
- `components/network/SavedProfileCard.tsx` — verify props exist
- `app/(protected)/app/network/saved/page.tsx` — extend the saved profiles query to compute sea time (sum of attachment durations) and yacht count (count distinct yachts) per user. Pass to `SavedProfileCard`.

**Pattern:** Look at how `ColleagueExplorer.tsx` or `SeaTimeSummary.tsx` computes sea time for reference.

**Allowed files:**
- `components/network/SavedProfileCard.tsx`
- `app/(protected)/app/network/saved/page.tsx`
- `lib/queries/` — if a shared query helper is needed

### Task 2: Yacht Prefix Null Type

**Problem:** `prefixedYachtName()` in `lib/yacht-prefix.ts` defaults to "M/Y" when `yacht_type` is null/undefined, resulting in "M/Y Unknown yacht" for yachts without a type.

**Fix:** When `yacht_type` is null/undefined/empty, return the bare yacht name without any prefix.

**File:** `lib/yacht-prefix.ts`

**Verify:** Check all callers still work (search for `prefixedYachtName` usage). The function should gracefully handle: null type, undefined type, empty string type, and valid types (Motor Yacht, Sailing Yacht, etc.).

**Allowed files:**
- `lib/yacht-prefix.ts`

### Task 3: Ghost Endorser Card Layout

**Problem:** In `EndorsementCard.tsx`, non-ghost endorsers show the new format (role + yacht on separate line + date), but ghost endorsers still use the old "Yacht · Date" single-line format. Creates visual asymmetry.

**Fix:** Update the ghost endorser branch (around lines 91-103) to match the non-ghost layout.

**File:** `components/public/EndorsementCard.tsx`

**Allowed files:**
- `components/public/EndorsementCard.tsx`

### Task 4: Show Home Country on CV

**Problem:** The `show_home_country` toggle exists in profile settings but has no effect on the generated CV. When ON, the user's home country should appear in the CV personal details header.

**Files:**
- Find the CV generation/preview component (likely `components/cv/CvPreview.tsx` or `components/pdf/ProfilePdfDocument.tsx`)
- Add country display next to existing personal details when `show_home_country` is true
- Ensure the toggle value is available in the CV rendering context (check what props/data are passed)

**Allowed files:**
- `components/cv/CvPreview.tsx`
- `components/pdf/ProfilePdfDocument.tsx`
- `app/(protected)/app/cv/` — if query needs extending

---

## Lane 3: Tech Debt Sweep

**Branch:** `chore/tech-debt-dedup`
**Model:** Sonnet | **Effort:** medium
**Objective:** Consolidate 4 instances of duplicated code. Reduce maintenance surface.

### Task 1: Social Platform Config Dedup

**Problem:** `SOCIAL_PLATFORM_CONFIG` in `app/(protected)/app/profile/settings/page.tsx` duplicates `PLATFORM_CONFIG` in `components/profile/SocialLinksRow.tsx`. Only difference is icon size.

**Fix:**
1. Check if `lib/social-platforms.ts` already has a config (it was created in PR #150).
2. If so, make it the single source of truth. Add icon size as a parameter or let consumers set their own size.
3. Remove duplicate configs from settings page and SocialLinksRow.
4. Update imports.

**Allowed files:**
- `lib/social-platforms.ts`
- `app/(protected)/app/profile/settings/page.tsx`
- `components/profile/SocialLinksRow.tsx`
- `components/cv/steps/StepReview.tsx` (if it has a duplicate too)

### Task 2: Social Icons Dedup

**Problem:** `TikTokIcon` and `XIcon` are defined inline in multiple files. A shared `components/ui/social-icons.tsx` was created in PR #150.

**Fix:**
1. Read `components/ui/social-icons.tsx` — check what's already there.
2. Search for inline `TikTokIcon` and `XIcon` definitions across the codebase.
3. Replace all inline definitions with imports from the shared file.
4. If the shared file is missing either icon, add it.

**Allowed files:**
- `components/ui/social-icons.tsx`
- Any file that currently defines TikTokIcon or XIcon inline

### Task 3: formatSeaTime Collision

**Problem:** Both `lib/profile-summaries.ts` and `lib/sea-time.ts` export a function called `formatSeaTime` with different signatures.

**Fix:**
1. Read both implementations. Determine which is more complete/correct.
2. Keep the canonical version in `lib/sea-time.ts` (semantic home).
3. Remove the duplicate from `lib/profile-summaries.ts`. If that file still needs the function, import it from `lib/sea-time.ts`.
4. Update all imports across the codebase.

**Allowed files:**
- `lib/sea-time.ts`
- `lib/profile-summaries.ts`
- Any file that imports `formatSeaTime`

### Task 4: EndorsementsSection Dead Code

**Problem:** `components/profile/EndorsementsSection.tsx` has type issues and dead code:
- `endorser_id: string` should be nullable (it's an FK that can be null for ghost endorsements)
- `yacht_id` should be `string | null`
- `isOwn` check on line ~65 is dead code (component is never rendered in non-owner context)
- Component may have no active callers at all

**Fix:**
1. Check if the component has any active imports/callers. If zero callers, consider removing entirely (but check with caution — it might be used dynamically).
2. If it has callers: fix the interface types to match actual DB schema (nullable fields), remove the dead `isOwn` branch.
3. If no callers: mark with a `// TODO: unused — candidate for removal` comment. Don't delete outright in case it's planned for reuse.

**Allowed files:**
- `components/profile/EndorsementsSection.tsx`

---

## Forbidden Files (ALL lanes)

- `supabase/migrations/*` — no schema changes in this session
- `middleware.ts` — no auth changes
- `app/api/*` — no API changes
- `lib/queries/profile.ts` — Lane 1 may read, Lane 2 may extend saved profiles query only
- Any file not explicitly listed in Allowed files

## Exit Criteria

- All 5 main app tabs render with proper bottom padding on mobile (no content hidden behind tab bar)
- Interests chips render as compact pills at all viewport widths
- CV preview shows ghost endorser names (not "Anonymous")
- SavedProfileCard shows sea time and yacht count
- "M/Y Unknown yacht" no longer appears for null-type yachts
- Ghost and non-ghost endorsement cards have consistent layout
- Home country appears on CV when toggle is ON
- Zero duplicate social platform configs in codebase
- Zero duplicate TikTok/X icon definitions
- One canonical `formatSeaTime` export
- EndorsementsSection types match DB schema
