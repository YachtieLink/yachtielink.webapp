# Skills & Interests — Attached Notes

## Problem
Skills and hobbies are bare chips with no context. A captain sees "Silver service" but doesn't know what level, how many years, or any context. Interests like "Photography" give no sense of whether it's a casual hobby or a semi-professional skill.

## Proposed Solution
Allow users to attach a short note (50-100 chars) to each skill and hobby during onboarding or editing. The note appears when tapping the chip in the detail modal — like a tooltip or expandable detail.

### Onboarding Flow
- When adding a skill/hobby, optional "Add a note" text input below the chip
- e.g. Skill: "Silver service" → Note: "5 years formal training, WSET certified"
- e.g. Hobby: "Photography" → Note: "Shoot yacht lifestyle content, DSLR + drone"

### Display
- **Bento tile**: chips only, no notes (clean, compact)
- **Detail modal**: tapping a chip expands to show the note underneath, or the note shows as a subtitle below each chip
- **Profile mode (accordion)**: same chip + note treatment

### Data Model
- Add `note` column to `user_skills` table (`text, nullable, check char_length <= 100`)
- Add `note` column to `user_hobbies` table (`text, nullable, check char_length <= 100`)
- Update skill/hobby edit forms to include the note field

## Notes
- This adds depth without visual clutter — the bento stays clean, the detail view adds context
- Captains reviewing a profile get much more useful information from skilled crew
- Could also apply to certifications (notes like "expires March 2027")
