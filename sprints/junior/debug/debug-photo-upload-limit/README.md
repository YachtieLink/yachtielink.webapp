# Debug: Photo upload — wrong limit for free users

**Started:** 2026-03-22
**Status:** 🐛 In Progress
**Severity:** Medium

## Problem

The photo upload page doesn't fetch the user's Pro status, so it always uses the Pro limit (9) to calculate remaining slots. For a free user:

- The add button stays visible even after they hit the free limit (3)
- The "skipped files" toast shows the wrong remaining count
- Description text doesn't accurately reflect their actual limit

Multi-select itself works (the input has `multiple` and `handleMultiUpload` loops through files) — it's just the limit enforcement on the client that's wrong.

## Root Cause

`app/(protected)/app/profile/photos/page.tsx` hardcodes `MAX_PHOTOS_PRO` when calculating remaining:

```ts
const maxPhotos = MAX_PHOTOS_PRO // Use max possible; server enforces actual limit
const remaining = maxPhotos - photos.length
```

The page never fetches `subscription_status` from the users table, so it can't know the real limit. Server enforces the actual limit correctly (returns 403) — it's just the client UX that's misleading.

## Fix

On page load, fetch `subscription_status` alongside photos. Derive `maxPhotos` and `remaining` from that. Use `remaining > 0` to conditionally show the add button.

## Verification

- Free user at 0 photos: can select up to 3, add button hides after 3
- Free user at 2 photos: can select 1, toast says "1 more photo"
- Pro user at 0 photos: can select up to 9
- Server 403 still handled gracefully as fallback
