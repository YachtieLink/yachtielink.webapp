---
lane: 3
branch: chore/tech-debt-sweep
worktree: yl-wt-3
model: Sonnet
effort: medium
---

## Objective

Clean up four tech debt items: consolidate duplicate social platform configs, deduplicate social icons, resolve formatSeaTime collision, and clean EndorsementsSection dead code.

## Tasks

### 1. Social platform config dedup
Consolidate `SOCIAL_PLATFORM_CONFIG` (used in settings) and `PLATFORM_CONFIG` (used in `SocialLinksRow`) into a single config in `lib/social-platforms.ts`. Parameterize icon size so both consumers can use the same config.
- **Files:** `lib/social-platforms.ts` (create or update), settings component that uses `SOCIAL_PLATFORM_CONFIG`, `SocialLinksRow` component that uses `PLATFORM_CONFIG`
- Search for both config names to find all consumers and update imports.

### 2. Social icons dedup
Extract `TikTokIcon` + `XIcon` to `components/ui/social-icons.tsx` (file may already exist from PR #150). Verify and consolidate any remaining duplicates.
- **Files:** `components/ui/social-icons.tsx`, any files with inline TikTok/X icon definitions
- Search for `TikTokIcon` and `XIcon` across the codebase to find all definitions.

### 3. formatSeaTime collision
Pick canonical location (`lib/sea-time.ts`), remove the duplicate from `lib/profile-summaries.ts`, update all imports.
- **Files:** `lib/sea-time.ts`, `lib/profile-summaries.ts`, all files importing formatSeaTime
- Search for `formatSeaTime` across the codebase to find all import sites.

### 4. EndorsementsSection dead code
Fix nullable types (`yacht_id: string | null`), remove dead `isOwn` check, clean up unused `endorser_id`.
- **Files:** `components/endorsements/EndorsementsSection.tsx` (or similar)
- Grep for `isOwn` and `endorser_id` in endorsement components to find dead references.

## Allowed Files
- `lib/social-platforms.ts`
- `lib/sea-time.ts`
- `lib/profile-summaries.ts`
- `components/ui/social-icons.tsx`
- `components/endorsements/EndorsementsSection.tsx`
- Any file that imports from the above (to update import paths)
- Settings social link components
- `SocialLinksRow` component

## Forbidden Files
- `app/(protected)/app/layout.tsx` (Lane 1)
- `app/(protected)/app/cv/preview/page.tsx` (Lane 1)
- `components/saved/` (Lane 2)
- `lib/yacht-prefix.ts` (Lane 2)
- `components/endorsements/EndorsementCard.tsx` (Lane 2)
- `components/cv/CvPreview.tsx` (Lane 2)
- Any migration files

## Patterns to Follow
- When consolidating, keep the canonical version in `lib/` and have components import from there
- Don't change any public API — just move implementations and update imports
