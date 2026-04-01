# Lane 3 — Rally 006 Close: Date Picker + Progress Tick Timing

## Objective
Complete the last 2 items of Rally 006: (1) mobile-friendly date picker with text input option, (2) staggered progress tick animations for natural feel.

## Background
- Rally 006 is 98% complete — these are the final 2 polish items
- DatePicker currently uses 3 dropdown selects (year/month/day) — works but clunky on mobile
- ProgressWheel has a static 500ms transition — all ticks animate simultaneously

## Tasks

### 1. Date Picker — Text + Calendar on Mobile

**File:** `components/ui/DatePicker.tsx` (286 lines)

**Current behavior:** Three `<select>` dropdowns (year, month, day). The `includeDay` prop controls whether day is shown.

**Required behavior:** Add a text input mode that lets mobile users type dates naturally:
- Add a text input field above or instead of the dropdowns on mobile
- Accept formats like "Mar 2020", "March 2020", "03/2020", "2020-03" (month+year)
- When `includeDay` is true, also accept "15 Mar 2020", "03/15/2020", "2020-03-15"
- Parse the text input and sync with the dropdown state
- On mobile (detect via media query or viewport width), default to text input with dropdowns as fallback
- On desktop, keep current dropdown behavior but add text input as alternative

**Implementation approach:**
- Add a `<input type="text" inputMode="numeric">` for mobile
- Use a simple parser function to extract year/month/day from common formats
- Toggle between text and dropdown modes with a small button/link
- Keep the existing dropdown code — this is additive

**Consumers to verify still work:**
- `components/cv/steps/StepExperience.tsx` (lines 125-143) — start/end dates
- `components/cv/steps/StepPersonal.tsx` — DOB
- `app/(protected)/app/profile/settings/page.tsx` (line 403) — DOB

### 2. Progress Tick Timing — Staggered Delays

**File:** `components/ui/ProgressWheel.tsx` (93 lines)

**Current:** Line 78: `className="transition-all duration-500 ease-in-out"` — single static transition.

**Required:** When the progress value changes, animate with a slight stagger so ticks feel organic rather than mechanical.

**Implementation:**
- Add a `staggerMs` prop (default: 0 for backward compat)
- When `staggerMs > 0`, apply a CSS `transition-delay` based on the component's index or a small random offset
- The delay should be subtle: 50-150ms range

**Also check EndorsementBanner:**
- **File:** `components/endorsement/EndorsementBanner.tsx` (lines 160-207)
- The progress bars here use `transition-all` — add similar stagger
- Each of the 3 progress tiers should animate in sequence, not simultaneously

## Allowed Files
- `components/ui/DatePicker.tsx`
- `components/ui/ProgressWheel.tsx`
- `components/endorsement/EndorsementBanner.tsx`

## Forbidden Files
- Any file not in the allowed list
- CHANGELOG.md, STATUS.md, session files
- CV step components (consumers — don't change them, just verify compatibility)

## Design Rules (MANDATORY — read `docs/design-system/patterns/page-layout.md`)
- Mobile-first: design for thumb zones
- Section color wayfinding: don't introduce new colors
- Same-page state transitions: the toggle between text/dropdown should be smooth, not jarring
- Keep existing label/error patterns from the DatePicker

## Edge Cases
- Text input: invalid/ambiguous dates should show inline error, not crash
- Text input: partial input (just year) should be accepted if `optionalMonth` is true
- ProgressWheel: `staggerMs` of 0 means no change from current behavior
- EndorsementBanner: the 3 tiers are sequential phases — stagger within each tier, not across tiers
