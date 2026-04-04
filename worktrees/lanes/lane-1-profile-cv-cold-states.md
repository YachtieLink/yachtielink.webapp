# Lane 1 — Profile + CV Cold States

**Session:** Rally 010 Session 2
**Branch:** `feat/r010-s2-profile-cv-cold`
**Worktree:** `yl-wt-1`
**Effort:** Sonnet, high (~2h)

## Scope

Fix cold-state failures on Profile and CV tabs. New users should see helpful guidance, not empty/zero states.

## Tasks

### Profile Cold States

1. **Stat line zero treatment** — In ProfileHeroCard, when `seaTimeTotalDays === 0` AND yacht count is 0:
   - Already conditionally rendered (only shows if seaTimeTotalDays > 0)
   - Verify this is working correctly. If stat line still shows zeros, add explicit gating.

2. **Suppress [Preview]/[Share] when weak** — In ProfileHeroCard, when Profile Strength < 40%:
   - Hide [Preview] and [Share Profile] buttons
   - Show in their place: a gentle coaching message like "Complete your profile to unlock sharing"
   - Use `score` prop (already passed to ProfileHeroCard)

3. **Empty section row summaries** — In ProfileSectionList, ensure every section has an outcome-oriented empty prompt:
   - About/Bio: "Tell captains about yourself" 
   - Experience: "Add a yacht to start building your network"
   - Certifications: "Add certifications — captains search by certs first"
   - Skills: "Add skills that set you apart"
   - Education: "Add relevant training or education"
   - Hobbies: "Add hobbies — crews bond over shared interests"
   - Verify all empty prompts exist and are positive-framed

### CV Cold States

4. **CV empty state** — When no CV has been uploaded AND no generated PDF exists:
   - Replace the current page with a centered empty-state layout
   - Large illustration area or icon (amber-themed)
   - Headline: "Your CV starts with your profile"
   - Description: "Complete your profile and we'll generate a professional CV for you. Or upload an existing CV to get started faster."
   - Primary CTA: "Upload a CV" → `/app/cv/upload`
   - Secondary: "Go to Profile" → `/app/profile`
   - Keep the education card (explaining CV is built from profile)

5. **Demote "Update from new CV"** — When a CV has been parsed:
   - Move the "Update from new CV" action from its prominent card position to a text link at the bottom of the page
   - Style as secondary/tertiary link, not a card
   - Keep the confirmation dialog for destructive action

## Allowed Files

- `components/profile/ProfileHeroCard.tsx` (suppress buttons, zero treatment)
- `components/profile/ProfileSectionList.tsx` (empty prompts audit — only if changes needed)
- `app/(protected)/app/cv/page.tsx` (cold state layout)
- `components/cv/CvImportCard.tsx` (demote update action)
- `components/cv/CvColdState.tsx` (new — empty state component)

## Forbidden Files

- Network, Insights, Settings pages
- Tab bar, layout files
- API routes, migrations
- StickyBottomBar component (Session 1)

## Acceptance Criteria

- Profile with score < 40%: no Preview/Share buttons, coaching message shown
- Profile with zero experience: stat line hidden (or not rendered at all)
- Profile sections: every section has positive-framed empty prompt
- CV with no upload and no generated PDF: centered empty state with upload CTA
- CV "Update from new CV" demoted to text link at bottom
- `npx tsc --noEmit` passes
- No AI mentions in user-facing copy
