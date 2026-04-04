# Pro: 3 profile photo slots (Avatar, Hero, CV)

**Status:** Idea
**Priority:** P2 — Pro feature, photo management
**Source:** Walkthrough QA (Rally 010, 2026-04-04)

## Current State

- 1 profile photo slot for all users (photos[0])
- Gallery photos are separate (work photos, not profile)
- Context Assignment toggles (is_avatar, is_hero, is_cv) exist in the DB but UI only shows them on the single profile photo — effectively useless since all 3 point to the same image
- Free users: 3 total photos (1 profile + 2 gallery)
- Pro users: 15 total photos but still only 1 profile photo slot

## Desired State

- **Free:** 1 profile photo → used for all 3 contexts (avatar, hero, CV)
- **Pro:** Up to 3 profile photos. User chooses which photo goes where:
  - Upload up to 3 photos
  - Assign any photo to any context (Avatar, Hero, CV) via toggle buttons
  - One photo can serve multiple contexts, or each context can have a different photo
  - Contexts: Avatar (circular, nav/cards), Hero (16:9, public profile banner), CV (square, generated PDF)

Each **context** gets its own focal point — even if the same photo is used for all 3. A center focal on a circle avatar crop behaves differently than the same point on a 16:9 hero. So focal points are per-context, not per-photo.

### Schema implication

Current: `focal_x`, `focal_y` on `user_photos` (per-photo).
Needed: `focal_x_avatar`, `focal_y_avatar`, `focal_x_hero`, `focal_y_hero`, `focal_x_cv`, `focal_y_cv` — or a separate `photo_focal_points` table keyed on (photo_id, context). The focal point picker in the UI would have a context selector (Avatar / Hero / CV) so the user sets the crop center for each format independently.

## Implementation Notes

- The `is_avatar`, `is_hero`, `is_cv` flags on `user_photos` already exist — wire them up
- Profile photo section on `/app/profile/photos` needs to show 3 upload slots for Pro (with labels + crop previews)
- Free users see 1 slot with a Pro upsell for "context-specific photos"
- All consuming components need to query the correct photo by context flag, falling back to photos[0]
- Focal point per context: each context photo gets its own `focal_x`/`focal_y` — already supported since each is a separate photo row

## Consuming Components to Update

- `ProfileHeroCard` — hero photo
- Avatar displays (nav, endorsement cards, network list, public profile)
- CV PDF generation — square photo
- Public profile page — hero + avatar
