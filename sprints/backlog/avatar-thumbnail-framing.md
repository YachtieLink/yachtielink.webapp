# Avatar Thumbnail Framing — Head Cut Off

**Status: PARTIALLY RESOLVED** — Most avatars fixed with object-top. SavedProfileCard still needs fix (folded into Rally 009 Session 1 Lane 2).

**Status:** proposed
**Priority guess:** P2 (visible UX bug)
**Date captured:** 2026-03-27

## Problem
Circular avatar thumbnails on SavedProfileCard (and likely other card contexts) use `object-cover` with default `object-center` positioning. For photos where the subject is standing or the framing is full-body/half-body, this centers on the torso and cuts off the head.

## How to Reproduce
1. Log in as any test user (e.g. `test-seed-dev-qa@yachtie.link`)
2. Save Charlotte Beaumont's profile (`/u/test-seed-charlotte`)
3. Go to `/app/network/saved`
4. Charlotte's circular avatar shows her body from shoulders down — head is cut off at the top of the circle

## Root Cause
The avatar `<img>` uses `object-cover` (correct for aspect ratio) but `object-position: center` (default). For profile photos where the face is in the upper portion of the image, the crop misses the head entirely.

## Fix Direction
Apply `object-top` to all circular avatar thumbnails, matching the fix already applied to `PhotoGallery.tsx` hero photos in Wave 3. This anchors the crop to the top of the image, prioritising the face/head.

## Affected Components (audit needed)
- `components/network/SavedProfileCard.tsx` — confirmed broken
- `components/audience/AudienceTabs.tsx` — colleague cards may have same issue
- `components/public/EndorsementsSection.tsx` — endorser avatars
- Any other circular avatar render (search for `rounded-full` + `object-cover`)

## Notes
- This is the same class of bug fixed in Wave 3 for hero photos (`object-center` → `object-top` on PhotoGallery.tsx)
- A proper long-term fix would be user-adjustable crop position (already in backlog as "Profile Photo Reposition")
- `object-top` is a good default because faces are almost always in the upper third of a photo
