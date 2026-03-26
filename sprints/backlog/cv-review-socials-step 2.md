# CV Review — Social Links Step Enhancement

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary
The CV review shows parsed social links (e.g. "Instagram: @test-seed-charlotte") which is great — the parser is pulling these from CVs. But the step needs an "Add more" affordance so users can add LinkedIn, website, WhatsApp, etc. right here during import rather than having to find the setting later.

## Current Behaviour
- Parser extracts social links found in the CV (Instagram, website)
- Review step (Step 4) shows them as read-only text at the bottom
- No way to add additional social links during this step
- No way to edit/correct the parsed ones inline

## Proposed UX
- Show parsed socials as editable fields (pre-filled, user can correct)
- "Add another" button below existing socials → dropdown or list of platform options (Instagram, LinkedIn, WhatsApp, Website, TikTok, Facebook)
- Each platform gets an icon + input field
- Pre-validate format (e.g. Instagram handle vs full URL, phone number for WhatsApp)
- This is high-value real estate — catch social links during import when the user is already in "fill out my profile" mode

## Why This Matters
- Social links drive off-platform engagement between crew
- Users are most motivated to add profile details during first import
- If they skip it here, many will never go back to settings to add LinkedIn/WhatsApp
- WhatsApp especially is critical in the yachting industry for crew communication

## Files Likely Affected
- `components/cv/steps/StepSkillsAndInterests.tsx` (or wherever the social section lives in the review flow)
- `lib/cv/types.ts` — social link types in parsed data
- Possibly: break socials into its own step or sub-section rather than being tacked onto Skills & Interests
