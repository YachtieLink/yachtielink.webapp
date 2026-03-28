# Stock Gallery Placeholders for Pro Rich Portfolio

## Problem
Pro users who enable Rich Portfolio but haven't uploaded gallery photos see an empty bento with no visual impact. The whole point of Rich Portfolio is the visual experience — it should look good immediately.

## Proposed Solution
Provide a set of **landscape yacht-life stock photos** that auto-populate empty gallery slots in Rich Portfolio mode. As soon as the user uploads a real photo, it replaces the placeholder in that slot.

### Behaviour
- Only applies to **Pro users in Rich Portfolio mode**
- Placeholders fill empty gallery slots in the bento grid
- Each real photo the user uploads replaces a placeholder (first slot first)
- Once all slots have real photos, no placeholders remain
- Placeholders should NOT appear in the gallery modal/carousel — only in bento slots
- Placeholders should have a subtle indicator (e.g. slight overlay or watermark) so the user knows to replace them

### Stock Photo Requirements
- Landscape orientation (bento tiles crop to various aspect ratios)
- Generic yachting lifestyle: decks, sunsets, marinas, service setups, wheel/bridge, water
- No identifiable faces (avoid rights issues)
- High quality, warm tones consistent with YachtieLink brand
- 8-10 photos in the set (covers the full bento template)
- Stored in Supabase storage as a shared asset bucket

### Implementation
- Store stock photo URLs in a constant array (e.g. `lib/bento/stock-photos.ts`)
- In `RichPortfolioLayout`, if `galleryPhotos.length < photoSlots.length`, fill remaining slots with stock photos
- Mark stock photo tiles visually (subtle "Add your photo" overlay on hover)
- Track whether a tile shows a real photo or placeholder — lightbox should only show real photos

## Hero Stock Photos by Department

Separate from the gallery placeholders, users without a profile photo should get a **department-specific stock hero image** instead of a blank/gradient. Each department gets its own hero:

| Department | Stock Hero |
|-----------|-----------|
| Deck | Bow shot, lines/ropes, sea views from deck |
| Interior | Table setting, luxe salon, service detail |
| Engineering | Engine room, technical equipment |
| Galley | Kitchen prep, plating, galley workspace |
| Medical | First aid, medical bay |
| Childcare | Yacht family areas |
| Other | Generic yacht exterior, marina sunset |

- Keyed by `user.departments[0]` — first department determines the hero
- Replaced immediately when user uploads their own profile photo
- Stored in same shared asset bucket as gallery stock photos
- Subtle "Add your photo" overlay when the owner views their own profile

## Notes
- This is a low-effort, high-impact Pro feature — makes the upgrade feel immediately rewarding
- Could also apply to the gallery carousel (show stock photos with "Add your photos" CTA)
- Department hero stock applies to ALL users (free + Pro) — everyone deserves a good first impression
