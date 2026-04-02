---
lane: 1
branch: fix/mobile-ux-fixes
worktree: yl-wt-1
model: Sonnet
effort: high
---

## Objective

Fix three mobile UX issues: tab bar content overlap, interests chips responsiveness, and CV preview ghost join query.

## Tasks

### 1. Tab bar padding
Add `pb-24 md:pb-0` to the app layout shell so ALL pages clear the bottom nav bar.
- **File:** `app/(protected)/app/layout.tsx`
- One-line fix — add padding-bottom that matches the tab bar height on mobile, remove on desktop.

### 2. Interests chips responsive
Verify PR #150 fix. If chips still break at wider viewports, fix the chip layout to match the MY SKILLS pattern (flex-wrap with proper spacing).
- **File:** Likely in `components/profile/` — search for interests chip rendering.
- Compare with skills chips implementation for the correct pattern.

### 3. CV preview ghost join
Verify PR #148 fix. If `app/(protected)/app/cv/preview/page.tsx` line ~21 still has an inline stale query, replace with `getCvSections()`.
- **File:** `app/(protected)/app/cv/preview/page.tsx`
- The canonical query helper is `getCvSections()` from the CV queries module.

## Allowed Files
- `app/(protected)/app/layout.tsx`
- `app/(protected)/app/cv/preview/page.tsx`
- Any component file rendering interests chips
- Related CSS/layout files if needed

## Forbidden Files
- Anything in `lib/` (Lane 3 territory)
- `components/endorsements/` (Lane 2/3 territory)
- `components/saved/` (Lane 2 territory)
- Any migration files

## Patterns to Follow
- Check `docs/design-system/patterns/page-layout.md` for mobile-first layout conventions
- MY SKILLS chips pattern for the interests fix
