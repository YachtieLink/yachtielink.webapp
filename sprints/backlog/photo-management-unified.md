# Unified Photo Management — One Photo, Used Everywhere

**Status:** fleshed-out
**Priority guess:** P1 (user has no control over where their photos appear — confusing and frustrating)
**Date captured:** 2026-04-01

## Problem
Photos are fragmented across 3 separate pages with no clear relationship. Users upload photos and have no idea where they end up, why they should bother, or how to make them look good.

### Current state (broken)
| Page | URL | What it does | Editing |
|------|-----|-------------|---------|
| Avatar upload | `/app/profile/photo` | Circle crop, 800px | Crop circle only |
| Gallery photos | `/app/profile/photos` | Multi-photo, drag reorder | Focal point picker (hidden, non-obvious) |
| Work Gallery | `/app/profile/gallery` | Separate upload, separate limits | Nothing |

### Where photos appear (user has no idea)
| Context | Source | User control |
|---------|--------|-------------|
| Avatar circle (in-app) | `profile_photo_url` from `/photo` page | Can crop circle |
| Public profile hero | First gallery photo from `/photos`, fallback to avatar | Can set focal point (if they find it) |
| CV PDF | Avatar (`profile_photo_url`) | None — no choice, no focal point |
| Work Gallery on public profile | Separate `/gallery` upload | None |

### What's missing
- **No explanation of WHY** — why should I upload a photo? What difference does it make?
- **No guidance on HOW** — what makes a good crew profile photo? What works for the hero vs avatar?
- **No control over WHERE** — user doesn't know which photo goes where
- **No unified editing** — crop exists on avatar, focal point exists on gallery, nothing on work gallery
- **Confusing naming** — `/photo` vs `/photos` vs `/gallery` are three pages that sound identical

## Proposed Model

### Two concepts, clearly separated
**Profile Photo = your face.** One photo that represents you everywhere your identity appears.
**Work Gallery = your environment.** Photos of your work — table settings, engine rooms, deck shots — that showcase your skills visually on your public profile.

These are two different things and should feel like it. Profile photo is about trust and recognition. Gallery is about showing off your craft.

### Where your profile photo appears (user should understand this)
| Context | Format | Notes |
|---------|--------|-------|
| Avatar circle (in-app, everywhere) | Circle crop | Nav bar, profile page, colleague lists, search results |
| Public profile hero | 16:9 wide crop | The big banner on your public page |
| CV PDF | Square crop | Header of your generated CV document |
| Endorsement request emails | Square thumbnail | When you ask someone to endorse you — your face in their inbox |
| Search results | Circle thumbnail | When captains/agents browse crew — first impression |
| Colleague cards on yacht pages | Circle thumbnail | Crew listed on yacht detail pages |
| OG/share card | Square crop | Social preview when someone shares your profile link |
| Notification emails | Circle thumbnail | "Someone viewed your profile" with your photo as branding |

All of these use the **same profile photo** — user uploads once, sets the focal point, we handle cropping per format. They don't manage 8 contexts. They manage one photo.

### Free tier: One photo, used everywhere
1. User uploads **one photo**
2. That photo is used for **everything** listed above
3. We show them previews of the key formats during upload (circle, 16:9, square) so they can set the focal point correctly
4. **Crop + focal point editing** — user adjusts once, we render correctly in every context
5. Smart auto-crop per format based on focal point:
   - Avatar: circle crop centered on focal point
   - Hero: 16:9 wide crop centered on focal point
   - CV: square crop centered on focal point

### Pro tier: Up to 3 photos + AI enhance
1. Pro users can upload **3 photos** (not 15 — keep it simple)
2. They can assign a **different photo** for each context:
   - One for avatar
   - One for hero
   - One for CV
3. Each photo gets its own focal point / crop per format
4. Default: all three contexts use the same photo (same as Free behavior). Pro just unlocks the ability to differentiate.
5. **One-tap AI enhance** — Pro-only feature:
   - "Enhance" button on any uploaded photo
   - Calls an external API (AILab Tools, Claid.ai, or Let's Enhance — evaluate during build)
   - Skin smoothing, lighting correction, blemish removal, upscale — one shot
   - Shows before/after comparison so the user can pick
   - Enhanced version downloadable (useful outside YachtieLink too — tangible Pro value)
   - Free users see the button greyed out: "Upgrade to Pro for AI photo enhancement"
   - This is a high-visibility upsell moment — user literally sees the improvement they'd get

### Work Gallery — tied to portfolio view on public profile
Work Gallery photos feed directly into the public profile's portfolio/bento view layout. Currently:
- Photos appear as bento tiles **between** sections (Experience, Endorsements, Education) on the public profile
- Also appear in the "MY GALLERY" horizontal scroll at the bottom
- User has **zero visibility** into this during editing — no preview of where photos land
- No reorder UI for bento tile placement — `sort_order` exists in DB but gallery edit page has no drag-to-reorder
- User can't control which photos appear in the premium bento positions vs the bottom scroll

**Proposed:**
- Work Gallery upload page shows a **live mini-preview** of the public profile layout: "Here's where your work photos appear"
- Drag-to-reorder with visual feedback: "Photo 1 appears here, Photo 2 appears here"
- Explain what the gallery is: "Show off your work environment — table settings, engine rooms, deck shots. These photos appear throughout your public profile."
- Free: 3 work photos. Pro: 15 work photos + control over bento tile placement.
- The gallery page should feel separate from profile photos (it IS a different concept — your face vs your work) but with the same quality of UX: sell it, explain it, preview it.

Decision needed in /grill-me: should work gallery be a separate page or a tab within unified photo management?

## The Upload Experience

### Sell the feature (empty state)
Current: tiny dashed box, "0/15 photos visible"
Proposed:
- **Headline:** "Get noticed first" (or similar — sell the benefit)
- **Subtext:** "Captains and agents look at your photo before anything else. Crew with photos get 3x more profile views."
- **Large upload zone** — centered in thumb zone, teal-tinted border
- **Show what good looks like** — example of a professional crew photo, tips ("Natural light, uniform or smart casual, face clearly visible")

### After upload — preview all formats
Once a photo is uploaded, show the user **three preview cards** side by side:

```
┌──────────┐  ┌────────────────┐  ┌──────────┐
│  (avatar) │  │    (hero)       │  │  (CV)    │
│   ○ crop  │  │  16:9 crop     │  │  □ crop  │
│  64×64    │  │  full width    │  │  square  │
└──────────┘  └────────────────┘  └──────────┘
     ↑ Your profile pic    ↑ Your public page    ↑ Your CV
```

- User can adjust focal point — all three previews update live
- They can see exactly what each format looks like before saving
- Pro: "Use a different photo for each" toggle → unlocks separate uploads per context

### Editing capabilities
- **Focal point picker** (already exists, but needs to be more prominent and explained)
- **Crop per format** — show the crop boundaries for circle/16:9/square overlaid on the image
- **Basic adjustments** — brightness/contrast? Or keep it simple and just do crop + focal point. Decision needed in /grill-me.

## Migration Path
- Merge `/photo`, `/photos`, `/gallery` into one page: `/app/profile/photos`
- Existing avatar → becomes the user's single photo (Free) or their avatar photo (Pro)
- Existing gallery photos → migrate to unified library
- `user_photos` table gains a `role` column: `avatar`, `hero`, `cv`, `work`
- Default all existing photos to role `avatar` + `hero` + `cv` (same photo everywhere)

## Scope
- **Phase 1:** Unified upload page with 3-format preview, focal point editing, one photo used everywhere (Free). Merge the 3 pages.
- **Phase 2:** Pro differentiation — 3 photos, assign different photo per context. Work Gallery rethink.

## Files Likely Affected
- `app/(protected)/app/profile/photo/page.tsx` — remove (redirect to photos)
- `app/(protected)/app/profile/photos/page.tsx` — becomes unified photo management
- `app/(protected)/app/profile/gallery/page.tsx` — remove or merge
- `components/profile/FocalPointPicker.tsx` — enhance with multi-format preview
- `components/profile/ProfileAvatar.tsx` — use focal point for circle crop
- `components/pdf/ProfilePdfDocument.tsx` — use focal point for CV crop
- `components/public/HeroSection.tsx` — already uses focal point, keep
- `lib/storage/upload.ts` — unify upload logic
- `supabase/migrations/` — `role` column on `user_photos`

## Education & Guidance (missing entirely today)
The upload experience needs to teach the user:

### Why upload photos
- "Captains and agents look at your photo before anything else"
- "Crew with profile photos get noticed first"
- Social proof: how many views/clicks profiles with photos get vs without

### How to take a good photo
- Tips on the upload page: "Natural light, uniform or smart casual, face clearly visible"
- Show example of what a good crew profile photo looks like
- Different guidance for profile photo vs work gallery ("Show your face" vs "Show your environment")

### Where photos end up
- **Profile photo:** Show the 3-format preview (avatar, hero, CV) so they understand exactly where it appears
- **Work gallery:** Show a mini-preview of the public profile portfolio layout with numbered positions: "Photo 1 appears here, Photo 2 here"
- After upload, link to "Preview your public profile" so they can see the result immediately

### How to make them look right
- Focal point picker needs to be **prominent and explained** — currently it's hidden behind a tap with no context
- Show crop boundaries for each format overlaid on the image
- "Drag the crosshair to keep your face in frame across all views"

## Related Issues
- `interests-chips-responsive-bug.md` — MY INTERESTS chips broken at wider viewports (seen on Charlotte's profile)
- `profile-page-redesign.md` — profile page toggle grid has separate Photos and Work Gallery sections that should merge
- `app-tab-section-flow.md` — broader tab layout quality pass

## Notes
- **Needs /grill-me before building** — work gallery decision, editing scope, Pro limits, copy/messaging, bento tile control
- The "why upload a photo" copy is important — this is a trust/engagement moment. Sell it.
- Keep it dead simple for Free users. One photo, works everywhere. Don't overwhelm.
- Charlotte Beaumont (test-seed-charlotte) is the best test profile for this — 12 gallery photos, rich portfolio view, shows all the layout issues
