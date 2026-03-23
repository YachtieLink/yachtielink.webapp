# CV Upload Modes

**Status:** Promoted → Sprint CV-Parse (Step 0 of the import wizard)
**Source:** Founder QA (2026-03-22)
**Priority:** Medium — affects user trust in data integrity

## Problem

Currently, uploading a CV always triggers AI parsing which overwrites profile fields (name, role, bio, experience, certifications). This is fine during onboarding when the profile is empty, but dangerous for established users who have carefully curated their profile.

Users who just want their CV available for download shouldn't have to risk overwriting their data.

## Proposed Solution

CV upload page offers two clear paths:

### Path 1: Upload & Populate Profile
- Parses CV with AI and populates profile fields
- **Warning when profile has existing data:** "This will update your profile with data from your CV. Fields you've already filled in may be overwritten. Continue?"
- Safe by default during onboarding (profile is empty)
- Shows review screen before applying (already exists via CvReviewClient)

### Path 2: Upload Only
- Stores the CV file in Supabase storage
- Updates `cv_storage_path` on the user record
- Does NOT trigger AI parsing
- CV becomes available for download from public profile (if cv_public is enabled)
- Much faster — no AI call, no review step

## UI

The upload page could show two buttons after file selection:
- **"Upload & update my profile"** (primary) — current flow with overwrite warning
- **"Just upload my CV"** (secondary) — stores file only, skips parsing

## Technical Notes

- The upload step (file → Supabase storage) is already separate from the parse step (storage path → AI → profile update)
- Path 2 just skips the parse API call and goes straight to updating `cv_storage_path`
- The overwrite warning needs to check if the user has any existing profile data (name, role, bio, experience)
- CvReviewClient already has field-level exclusion checkboxes — could leverage this for the warning

## Dependencies
- None — the upload and parse are already separate API calls
