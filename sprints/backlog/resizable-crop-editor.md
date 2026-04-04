# Resizable Crop Editor

**Status:** Idea
**Priority:** P3 — Photo management
**Source:** Walkthrough QA (Rally 010, 2026-04-04)

## Current State

The focal point picker sets a center point, and CSS `object-cover` handles the crop. A fixed-ratio crop overlay now shows what area will be visible per context. But the user can't control zoom level — the crop region size is determined by the container's dimensions.

## Desired

A proper crop editor where the user can:
1. Drag to reposition the crop area (done — focal point)
2. **Resize/zoom** the crop region — show more or less of the image within the fixed aspect ratio
3. Pinch-to-zoom on mobile

## Implementation Requirements

### Schema
- Add `crop_scale` (or `zoom`) per context — a float representing zoom level (1.0 = fill, 2.0 = 50% visible)
- Or store crop regions as `{ x, y, width, height }` per context (percentages of the original image)

### Rendering
- Replace `object-cover` + `object-position` with `transform: scale()` + `translate()` for precise crop control
- Or use canvas-based cropping to generate actual cropped images on save

### UI
- Pinch-to-zoom + drag gesture handling in the picker
- Zoom slider as fallback for desktop / accessibility
- Preview updates in real-time

## Notes

- This is a significant feature — consider using an existing crop library (react-image-crop, react-easy-crop)
- The current focal point system works well for most cases — this is a power-user refinement
- Could be gated to Pro since free users have 1 photo with a single focal point
