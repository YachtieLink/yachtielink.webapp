# Separate focal points for desktop vs mobile

**Status:** Idea
**Priority:** P3 — Photo management
**Source:** Walkthrough QA (Rally 010, 2026-04-04)

## Problem

A single focal point doesn't always work for both desktop (landscape hero) and mobile (portrait avatar/hero). An image cropped well for a mobile avatar might crop poorly in a desktop hero banner, and vice versa.

## Proposal

Allow users to set separate focal points for:
- **Mobile** — portrait crops (avatar, mobile hero)
- **Desktop** — landscape crops (desktop hero, CV header)

### Schema Change

Add `focal_x_desktop`, `focal_y_desktop` to `user_photos` (nullable — falls back to main focal point when not set).

### UI Change

In the FocalPointPicker modal, add a toggle: "Mobile" / "Desktop" that switches which focal point you're editing. Show a preview for each format at the active breakpoint.

### Consumption

Components that render photos check the current viewport and use the appropriate focal point, falling back to the main one.

## Notes

- Most users won't need this — the single focal point works for most photos
- Could be a Pro feature since it's a power-user need
- Consider auto-detecting face position as a smarter default before adding manual breakpoint controls
