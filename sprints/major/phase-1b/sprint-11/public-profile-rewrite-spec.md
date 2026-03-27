# Public Profile Rewrite — Design Spec

**Source:** Founder + Claude grill-me session, 2026-03-28
**Sprint:** 11 (repurposed from CV Onboarding Rebuild — onboarding work already complete)
**Status:** Design approved, ready for build plan

---

## Vision

The public profile (`/u/{handle}`) becomes a portfolio-quality presentation of a yacht crew professional. Inspired by photography portfolio platforms (Cosmos.so, Glass.photo) and editorial design (Kinfolk magazine). Photo-forward, bento grid layout for Pro, clean editorial layout for free. Every profile looks premium at first glance.

**Design references:**
- Cosmos.so — bento grid mechanics, mixed photo + content tiles
- Glass.photo — framed photo treatment, premium feel, tasteful margins
- Kinfolk magazine — warm professional editorial tone
- Squarespace Paloma/Farro templates — asymmetric grid layouts
- Apple iOS widgets — bento tile sizing and information density

**Designers to study:** Tobias van Schneider (Semplice), Bethany Heck, Rasmus Andersson

---

## Three View Modes

| Mode | Who can select | Default for | Description |
|------|---------------|-------------|-------------|
| **Profile** | Everyone | — | CV-style layout. Current design with fixes (fonts, contact card, endorsement cap). Clean, scannable, document-like. |
| **Portfolio** | Everyone | Free users | Hero photo + polished single-column sections + mini bento gallery at bottom. No interstitial photos. |
| **Rich Portfolio** | Pro only | Pro users | Hero photo + bento grid layout mixing photo tiles and content tiles. Template-based. The beautiful scroll. |

- Owner picks their default in settings
- Viewer gets a **two-state toggle**: owner's default ↔ Profile mode
- Toggle sits in the hero area, scrolls away with it
- Pro users can choose Portfolio OR Rich Portfolio (not forced into rich)
- Hero looks identical across all modes — differentiation emerges on scroll

---

## Hero Block (Same Across All Modes)

- **Single hero photo**, framed with tasteful margin and rounded corners (not full-bleed)
- Name + nationality flag, role + department, sea time, location **overlaid** with gradient scrim
- User chooses **scrim preset** (Dark, Light, Teal, Warm, etc.) for readability
- User chooses **profile-wide accent colour** for personalisation
- **Sticky top bar:** back button + share button + save/bookmark button (logged-in viewers)
- No photo carousel in hero — one decisive photo

---

## Controls & Navigation

**Top bar (sticky):** ← Back | Share | Save
**Hero area (scrolls away):** View mode toggle (Profile | Portfolio or Profile | Rich Portfolio)
**Bottom (non-logged-in):** "Build your crew profile — it's free" CTA

---

## Utility Row

- **Contact:** Tappable icon row — 📧 email, 📱 phone, 💬 WhatsApp
- **"View my CV"** button → navigates to `/u/{handle}/cv`
  - Full-screen CV preview (generated PDF or uploaded CV)
  - Download, share, and back actions on that page
  - Always current — generated on demand, no manual regeneration
- In Rich Portfolio bento mode, contact and CV become **tiles in the grid**

---

## Content Section Order

```
1. About (bio — truncated at 3 lines in bento, full in Profile mode)
2. Experience (3 yachts shown, "See all" at 4+)
3. Certifications (all shown as chips, detailed view on sub-page)
4. Endorsements (3 shown, "See all" always)
5. Education (2 shown, "See all" at 3+)
6. Skills + Languages (all as chips, no sub-page)
7. Hobbies (all as chips, no sub-page)
```

### Section Typography
- Section labels: **DM Sans Medium, 14px, uppercase, letter-spaced** — editorial labels, not headings
- DM Serif Display reserved for hero name only
- Icon-led sections with section-specific accent colours (in Portfolio/Profile modes)

---

## Endorsement Display

- **3 endorsements shown** on the profile
- Each card: avatar (clickable → endorser's profile) + full name + role + yacht + endorsement text
- **Pro users:** pin 3 favourites on the `/u/{handle}/endorsements` page
- **Free users:** 3 most recent
- "See all endorsements" link always visible
- Back button from endorser's profile returns to original profile at same scroll position

---

## Portfolio Mode (Free)

- Hero + polished single-column content sections
- Section differentiation via icon-led headings with section-specific colours
- **Mini bento gallery at bottom** — 3 gallery photos in a compact asymmetric grid
- Gives a taste of the Rich Portfolio aesthetic without the full spread
- All photos tappable → lightbox

---

## Rich Portfolio Mode (Pro)

- Hero + **bento grid layout** mixing photo tiles and content tiles
- **Template-based:** ship with 2 templates, add more over time
- **Auto-switches density variant** based on content:
  - Full (6+ photos, all sections populated)
  - Medium (2-5 photos, most sections)
  - Minimal (1-2 photos, few sections)
- **Desktop:** 4-column grid within ~680px max-width, centred
- **Mobile:** 2-column grid (fallback to simplified if too cramped in practice)
- Photos interspersed generously — **unapologetically beautiful**
- Contact + CV become tiles in the grid
- Pro can choose Rich Portfolio or standard Portfolio

---

## Photo System

| | Free | Pro |
|---|---|---|
| Hero photo | 1 | 1 |
| Gallery photos | 3 | 15 |
| Reorder gallery | Yes | Yes |
| Focal point adjustment | Yes (hero + gallery) | Yes (hero + gallery) |
| Hero crop adjustment | Yes | Yes |
| Bento placement | Mini bento at bottom | Throughout the scroll |
| Rich Portfolio | No | Yes |

- All photos tappable → **full-screen lightbox** with swipe between photos, pinch to zoom, tap/swipe-down to dismiss
- Pro: photos fill bento slots in user-defined order, overflow goes to carousel at bottom
- Photo management: **extend existing `/app/profile/photos`** page
  - Hero photo section: upload/change, adjust crop & focal point, preview
  - Gallery section: upload (3 free / 15 Pro), drag to reorder, set focal point per photo, delete, preview tiles

---

## Sub-Pages (All Shareable, All with Back-to-Profile)

```
/u/{handle}                → profile / portfolio / rich portfolio
/u/{handle}/cv             → CV preview + download + share
/u/{handle}/endorsements   → all endorsements, owner can pin 3
/u/{handle}/experience     → full yacht history
/u/{handle}/certifications → detailed certs with expiry dates, issuers
/u/{handle}/gallery        → full photo gallery grid
```

---

## Desktop Layout

- **Single column, ~680px max-width, centred** — editorial/portfolio feel
- Same scroll experience as mobile, just more whitespace on sides
- No more side-by-side split layout (current 40% photo / 60% content)

---

## Presentation Controls (User Settings)

- **Display mode:** Profile / Portfolio / Rich Portfolio (Pro only)
- **Scrim preset:** Dark, Light, Teal, Warm (+ more over time)
- **Accent colour:** Profile-wide colour for icon tints, subtle touches
- **Rich Portfolio template:** Choose from 2+ templates (Pro only)
- Profile is **always light mode** — dark mode is for app chrome only, not user presentation

---

## Pro Upsell

- Rich Portfolio option greyed out with "Pro" badge in settings
- When owner views their own public profile, subtle prompt at bottom
- **Never visible to other viewers** — no "this is a free profile" signalling
- See `sprints/backlog/pro-upsell-consistency.md` for app-wide upsell standardisation

---

## What's NOT In Scope

- Bento drag-and-drop editor (templates only, not custom layouts)
- Dark mode for profiles (profile is owner's presentation layer)
- Profile templates beyond the initial 2
- Salty mascot
- Ghost profiles / claimable accounts
- Endorsement writing assist

---

## Open Questions for Build Plan

1. Exact bento template designs (need visual mockups)
2. Exact scrim presets and accent colour palette
3. How the density auto-switch logic works (thresholds)
4. Lightbox implementation (build or library?)
5. CV on-demand generation architecture (edge function? server action?)
6. Focal point storage (new columns on `user_photos` / `profile_photos` table?)
