# Profile Photo — Crop, Zoom & Reposition

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary
Profile photos currently render with `object-cover object-top`, which is a sensible default but doesn't work for every photo. Users need the ability to crop, zoom, and reposition their profile photo so it frames them properly in the hero section.

## Current Behaviour
- Profile avatar upload (`/app/profile/photo`) has a square crop via `react-image-crop` — resized to 800px
- Gallery photos (`/app/profile/photos`) are uploaded as-is, no crop at all
- Public profile hero and photo carousel use `object-cover object-top` — fixed positioning
- No way to adjust how a photo is framed in the hero section

## Proposed UX
- On the photo manage screen, after upload, show a **reposition preview** that matches the hero layout
- User can **pinch to zoom** and **drag to reposition** (like Instagram profile photo editor)
- Save the crop/zoom/offset so the photo renders consistently across hero, cards, and thumbnails
- Default: `object-top` (face at top of frame — works for most headshots)
- Fallback: if no repositioning data saved, keep the `object-top` default

## Implementation Approach

### Lightweight (recommended first pass)
- Extend the existing `react-image-crop` flow to support the hero aspect ratio (roughly 3:4 portrait)
- Crop the image server-side or client-side before upload — store the final cropped version
- No need for focal point math — the stored image IS the crop
- Separate crops for avatar (square) and hero (portrait) from the same source image

### Full version (later)
- Store focal point (`focal_x`, `focal_y` percentages) on `user_photos`
- Apply as `object-position: {x}% {y}%` at render time
- No re-cropping needed — original image stored, focal point determines framing
- Works across different viewport sizes since the crop adapts

## Files Likely Affected
- `app/(protected)/app/profile/photos/page.tsx` — add reposition UI after upload
- `components/profile/PhotoGallery.tsx` — read focal point / use cropped version
- `components/public/HeroSection.tsx` — apply `object-position` from stored data
- `components/public/PublicProfileContent.tsx` — same for desktop hero
- `user_photos` table — potentially add `focal_x`, `focal_y` columns (full version)
- `lib/storage/upload.ts` — handle hero-crop variant upload

## Notes
- The existing `react-image-crop` library is already in the project — reuse it
- Gallery photos (`user_photos`) are separate from the single avatar (`profile_photo_url`)
- The hero shows gallery photos in a carousel, so each gallery photo might need its own positioning
- Consider: does the avatar square crop need to respect the same focal point? Probably yes for consistency
