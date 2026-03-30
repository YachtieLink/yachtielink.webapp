# Non-Yachting Experience

**Created:** 2026-03-30
**Priority:** HIGH — Pre-launch blocker (founder confirmed: will block some users from completing onboarding)
**Scope:** All users
**Effort:** Medium

## Problem

Many yacht crew have relevant land-based experience — hospitality management, culinary training, marine engineering, event coordination, nursing, dive instruction. This experience is valuable context for employers but has nowhere to live on the profile. The CV parser already extracts `employment_land` data but it's silently discarded.

## Current State

### Already working
- `lib/cv/prompt.ts` — parser extracts `employment_land` array: `{ company, role, start_date, end_date, description }`
- `lib/cv/types.ts` — `ParsedLandJob` interface exists
- Parser returns the data, it's just never saved

### Missing
- No DB table or column for land-based experience
- `save-parsed-cv-data.ts` ignores `employment_land`
- No CV review wizard step for land experience
- No profile display section
- No public profile rendering

## Proposed Solution

### Schema
- New `land_experience` table: `id`, `user_id`, `company`, `role`, `start_date`, `end_date`, `description`, `industry` (optional — hospitality, medical, engineering, etc.), `created_at`, `sort_order`
- RLS: owner read/write, public read for visible profiles

### CV Import
- Add a step in the wizard between Experience (yachts) and Certifications
- Show parsed land jobs with confirm/edit/skip per item
- Reuse the card pattern from yacht experience step (simpler — no matching needed, just confirm details)

### Profile Display
- New section on profile page: "Other Experience" or "Shore-side Experience"
- Rendered below yacht experience, above education
- Each entry: company, role, dates, description
- Edit page follows existing pattern (list + add/edit/delete)

### Public Profile
- Display in the experience accordion, visually distinct from yacht entries
- Different icon or subtle label to differentiate from yacht roles

## Dependencies
- Migration for new table
- Wizard step component

## Notes
- The industry field is optional but useful for search/filtering later
- Copy matters — "Other Experience" feels dismissive. "Shore-side Experience" or "Additional Experience" or just integrating it into the main experience timeline with a different badge might be better
- The founder should decide on the display hierarchy — is land experience shown alongside yacht experience chronologically, or in a separate section?
