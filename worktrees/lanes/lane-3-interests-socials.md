# Lane 3 — Interests + Social Links UX

**Session:** sessions/2026-04-02-ghost-closeout-ux-polish.md
**Worktree:** yl-wt-3
**Branch:** fix/interests-socials
**Model:** Sonnet
**Status:** active

---

## Task

Fix the interests chips responsive bug on public profiles, add a social links "add more" prompt in profile settings, make parsed social links editable in the CV review step, and add visual preview thumbnails for the profile layout selector in settings.

## Scope

### 1. Interests Chips Responsive Bug
The "My Interests" chips on the public profile break at wider viewports — tall empty rectangles appear instead of compact chips. Likely a flex-wrap or width constraint issue.

**Files:**
- `components/public/bento/tiles/HobbiesTile.tsx` — flex-wrap gap-1.5 layout
- `components/public/PublicProfileContent.tsx` — parent container

### 2. Social Links "Add More" Prompt
Add an affordance in profile settings prompting users to add social links (LinkedIn, TikTok, Instagram, etc.) when they have fewer than 3. Show platform icons as suggestions.

**Files:**
- `components/profile/SocialLinksRow.tsx` — social links display/edit
- Possibly settings page if social links section needs restructuring

### 3. CV Review Socials Step
Make parsed social links editable in the CV review step. Currently they display but can't be corrected if the parser got them wrong.

**Files:**
- `components/cv/steps/StepReview.tsx` — review step with socials display
- `components/cv/steps/StepPersonal.tsx` — personal info step (may have socials)

### 4. Profile Layout Visual Preview
Add small visual thumbnails for each layout option (Profile / Portfolio / Rich Portfolio) in the settings layout selector. Currently just text buttons — thumbnails help users understand the difference.

**Files:**
- `app/(protected)/app/profile/settings/page.tsx` — layout selector section (~lines 425-456)

## Allowed Files

```
components/public/bento/tiles/HobbiesTile.tsx
components/public/PublicProfileContent.tsx
components/profile/SocialLinksRow.tsx
components/cv/steps/StepReview.tsx
components/cv/steps/StepPersonal.tsx
components/cv/steps/StepExtras.tsx
app/(protected)/app/profile/settings/page.tsx
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
docs/ops/
lib/queries/ (Lane 1 territory)
components/public/EndorsementCard.tsx (Lane 2 territory)
components/public/sections/EndorsementsSection.tsx (Lane 2 territory)
components/public/sections/ExperienceSection.tsx (Lane 2 territory)
components/network/ (Lane 2 territory)
components/yacht/ (Lane 2 territory)
```

## ⚠️ File Overlap Note

`app/(protected)/app/profile/settings/page.tsx` is shared with Lane 2 (visibility toggles).

**Lane 2** edits the ToggleRow components (~lines 408-415).
**Lane 3** edits the layout selector section (~lines 425-456).

These are different sections of the same file. Workers: do NOT touch the other lane's section. Reviewer will verify no overlap.

## Design Rules (from docs/design-system/)

- Section color wayfinding — Profile tab = teal accent
- Compact lists with expand-on-tap for 4+ items
- Same-page state transitions — pages evolve, don't jump
- Sell the feature, don't describe it

## Definition of Done

- [ ] Interests chips render correctly at all viewport widths
- [ ] Social links section shows "add more" prompt when < 3 links
- [ ] CV review socials are editable (edit/delete/add)
- [ ] Layout selector shows visual preview thumbnails
- [ ] Type check passes
- [ ] /yl-review passes (run by reviewer)
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._
