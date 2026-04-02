---
lane: 2
branch: feat/profile-redesign
session: 3
model: opus
effort: high
---

# Lane 2: Profile Page Redesign

**Objective:** Tap-to-edit hero, compact 4-group section list, teal wayfinding, positive empty states.

## Scope
- Tap-to-edit hero card (name + role inline edit)
- Profile Strength ring inside hero card
- Replace 2-column grid with 4-group compact list (About Me, Personal Details, Career, Media)
- CV Details relocation from CV tab to Profile
- Positive empty states on all sections
- Teal section color wayfinding throughout
- Remove "Edit Profile" from More tab

## Allowed Files
- `app/(protected)/app/profile/page.tsx`
- `components/profile/ProfileSectionGrid.tsx` (replace with ProfileSectionList.tsx)
- `components/profile/ProfileSectionGroup.tsx` (new)
- `components/profile/ProfileSectionList.tsx` (new)
- `components/profile/ProfileStrength.tsx`
- `components/profile/ProfileHeroCard.tsx`
- `components/profile/*Section.tsx`
- `app/(protected)/app/more/page.tsx` (remove "Edit profile" row)
- CV tab page (remove CV Details or add "Edit on Profile" link)

## Forbidden Files
- `supabase/migrations/*`
- `components/public/*`
- `app/api/*`
