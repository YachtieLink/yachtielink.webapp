# Wave 2b: Profile Settings Page

## Scope

Add new user fields to the existing settings page. Fields reference `field-registry.md` codenames UF1-UF9.

## Files

| File | Action |
|------|--------|
| `app/(protected)/app/profile/settings/page.tsx` | MODIFY |

## Existing Pattern

- `'use client'` with useState object + `set(key, value)` helper
- Loads via direct supabase select, saves via direct supabase update
- Uses Input, SearchableSelect, ToggleRow components
- Reuses ALL_COUNTRIES / PINNED_COUNTRIES from lib/constants/countries

## Changes

### 1. Extend interface

Add to ContactSettings: UF1 (string), UF2 (string), UF3 (string), UF4 (string), UF5 (string[]), UF6 (string), UF8 (boolean), UF9 (boolean)

### 2. Extend select query

Add UF1-UF6, UF8, UF9 column names to the `.select()` call.

### 3. Extend update object

Add all 8 fields to the `.update()` call. UF1 saves as-is (date string). UF5 saves as the array directly. Text fields trim + fallback to null.

### 4. New UI sections

**After location fields, before save button:**

Section: "Personal Details"
- DatePicker with includeDay for UF1 (maxYear = currentYear - 16, minYear = 1940)
- SearchableSelect for UF2 (reuse existing countries)
- Select for UF3 (3 enum options from registry)
- Select for UF4 (4 enum options from registry)
- Input for UF6 (free text)

Section: "Visa / Travel Documents"
- Checkbox grid for UF5. Common values as checkboxes toggling in/out of the array.
- Pattern: `toggleVisa(v)` adds/removes from array
- Free-text "Other" input to add unlisted values

Section: "Visibility" (extend existing)
- ToggleRow for UF8 ("Show age on profile")
- ToggleRow for UF9 ("Show home country on profile")

### 5. Select option labels

UF3 options: see `field-registry.md` for enum values. Labels: humanize the snake_case values.

UF4 options: see `field-registry.md` for enum values. Labels: humanize the snake_case values.

Common UF5 values: B1/B2, Schengen, EU Citizen, Seaman's Book

## Verification

- [ ] All new fields render on the page
- [ ] DatePicker works with day precision
- [ ] Country select reuses existing SearchableSelect
- [ ] Enum selects show correct options
- [ ] Checkbox toggles add/remove from array
- [ ] All fields save and reload correctly
- [ ] Mobile layout at 375px
- [ ] Build passes
