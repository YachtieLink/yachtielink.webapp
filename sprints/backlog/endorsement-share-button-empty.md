# Empty Share Button on Endorsement Request Page

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-03-29

## Summary
The endorsement request page (`/app/endorsement/request`) has three share buttons: WhatsApp, Copy Link, and a third button with `aria-label="Share via..."` that renders as an empty gray circle with no icon or text. It's clickable but visually broken.

## Reproduction
1. Log in as any user
2. Navigate to Network → Colleagues → tap Endorse on any colleague
3. Look at the share buttons row — third button is an empty circle

## Fix
Either add the missing icon (likely the native share API icon) or remove the button if it's not functional.

## Files
- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` — share buttons section
