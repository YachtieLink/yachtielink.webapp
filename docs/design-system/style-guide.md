# YachtieLink Style Guide

**Version:** 2.0
**Last updated:** 2026-03-17
**Design direction:** Energetic & warm with 25% maritime feel — fun without being silly, professional without being corporate, nautical without being cheesy. Inspired by Notion's visual energy: bold colour sections, purposeful animation, personality through illustrations.

---

## Colour Palette

### Primary — Teal (Deep Ocean)

The signature YachtieLink colour. Used for primary buttons, links, focus rings, and interactive elements.

| Scale | Hex       | Usage                                      |
|-------|-----------|--------------------------------------------|
| 50    | `#F0FDFC` | Subtle tinted backgrounds                  |
| 100   | `#CBFCF7` | Hover states on light backgrounds          |
| 200   | `#97F8F0` | Light highlights, selected row bg           |
| 300   | `#5BEDE7` | Badges, tags (light)                       |
| 400   | `#2AD7D5` | —                                          |
| 500   | `#11BABB` | Secondary interactive, links on dark bg     |
| 600   | `#0B9296` | —                                          |
| **700** | **`#0D7377`** | **Primary brand colour** — buttons, CTAs, focus rings |
| 800   | `#105B5F` | Hover state for primary buttons             |
| 900   | `#124C4F` | Dark mode primary, pressed states           |
| 950   | `#032C30` | Dark mode backgrounds, high contrast text   |

### Accent — Sand (Warm Teak)

Adds warmth and subtle nautical feel. Used sparingly for highlights, badges, Pro features, and warm accents.

| Shade   | Hex       | Usage                              |
|---------|-----------|------------------------------------|
| Light   | `#F5F0E8` | Subtle warm background tint        |
| Default | `#E8DCC8` | Badge backgrounds, card highlights |
| Medium  | `#D4C4A8` | Borders on accent elements         |
| Dark    | `#B8A080` | Accent text on light backgrounds   |

### Section Colours — Coral, Navy, Amber

Used to create visual rhythm across sections and feature areas. Each section/feature gets one accent colour. Never combine all three in one component.

#### Coral (Sunset Over Water)

| Scale | Hex       | Usage                                    |
|-------|-----------|--------------------------------------------|
| 50    | `#FEF2F0` | Section background tint                    |
| 100   | `#FCCFC7` | Light card backgrounds                     |
| 200   | `#F9A99C` | Badges, soft highlights                    |
| 500   | `#E8634A` | Icons, accents, chart colour               |
| 700   | `#C24832` | Dark text on coral backgrounds             |

#### Navy (Night Sky at Sea)

| Scale | Hex       | Usage                                    |
|-------|-----------|--------------------------------------------|
| 50    | `#EEF2F7` | Section background tint                    |
| 100   | `#D0DAE8` | Light card backgrounds                     |
| 200   | `#A8BAD3` | Badges, soft highlights                    |
| 500   | `#2B4C7E` | Icons, accents, chart colour               |
| 700   | `#1A3358` | Dark text on navy backgrounds              |

#### Amber (Brass Fittings, Golden Hour)

| Scale | Hex       | Usage                                    |
|-------|-----------|--------------------------------------------|
| 50    | `#FEF7E8` | Section background tint                    |
| 100   | `#FDE9B8` | Light card backgrounds                     |
| 200   | `#FBD97D` | Badges, soft highlights                    |
| 500   | `#E5A832` | Icons, accents, chart colour               |
| 700   | `#B8841F` | Dark text on amber backgrounds             |

### Colour Usage Rules

- **In-app:** Teal stays primary for all buttons/CTAs. Coral, navy, amber appear as section backgrounds, card accents, badge colours, chart colours, and empty-state illustration fills
- **Marketing/landing:** Each feature section gets its own colour — e.g., "CV Builder" in navy, "Endorsements" in coral, "Network" in amber
- **Rule:** Never use all accent colours simultaneously in one component — pick one per section
- **Tints:** Use 50-100 shades for backgrounds, 500 for icons and small accents

### Neutrals

| Role             | Light mode | Dark mode  |
|------------------|------------|------------|
| Background       | `#FFFFFF`  | `#0F172A`  |
| Surface (raised) | `#F8FAFC`  | `#1E293B`  |
| Surface (overlay)| `#F1F5F9`  | `#334155`  |
| Border           | `#E2E8F0`  | `#334155`  |
| Border (subtle)  | `#F1F5F9`  | `#1E293B`  |

### Text

| Role      | Light mode | Dark mode  |
|-----------|------------|------------|
| Primary   | `#1A1A2E`  | `#F8FAFC`  |
| Secondary | `#64748B`  | `#CBD5E1`  |
| Tertiary  | `#94A3B8`  | `#64748B`  |
| Inverse   | `#FFFFFF`  | `#FFFFFF`  |

### Status Colours

| Status  | Hex       | Usage                         |
|---------|-----------|-------------------------------|
| Success | `#059669` | Verified, active, endorsements|
| Warning | `#D97706` | Expiring certs, cautions      |
| Error   | `#DC2626` | Errors, expired, destructive  |
| Info    | `#0D7377` | Informational (uses primary)  |

---

## Typography

### Font Family

- **Display:** DM Serif Display (Google Fonts) — high-contrast serif for hero headlines and impact moments. Pairs with DM Sans from the same family.
- **Primary:** DM Sans (Google Fonts) — clean, modern, slightly warmer personality than Inter
- **Monospace:** Geist Mono — code snippets, technical data
- **Fallback stack:** DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Scale & Weights

| Element         | Font             | Size     | Weight | Letter spacing | Usage |
|-----------------|------------------|----------|--------|----------------|-------|
| Hero headline   | DM Serif Display | 36-48px  | 400    | -0.02em        | Landing page hero, onboarding welcome, empty states |
| Page title      | DM Sans          | 28px     | 700    | -0.02em        | In-app page headers |
| Section heading | DM Sans          | 18px     | 600    | -0.01em        | Card group titles, section labels |
| Card title      | DM Sans          | 14px     | 600    | normal         | Within cards |
| Body text       | DM Sans          | 14px     | 400    | normal         | Default |
| Caption/hint    | DM Sans          | 12px     | 400    | normal         | Helper text |
| Button label    | DM Sans          | 14px     | 600    | normal         | Buttons |

### Using the serif display font

```jsx
<h1 className="font-serif text-4xl">Your career, anchored.</h1>
```

Use `font-serif` class for DM Serif Display. Reserve for:
- Landing page headlines
- Onboarding welcome screens
- Empty state titles
- Marketing feature headers

Do NOT use for in-app page titles, card titles, or body text.

---

## Motion & Animation

Animations use Framer Motion with shared presets from `lib/motion.ts`. Animation is purposeful — it communicates state changes, guides attention, and adds delight.

### Micro-interactions (Level 1)

| Element | Effect | Details |
|---------|--------|---------|
| Button press | Scale down | `active:scale-[0.97]`, 150ms transition |
| Card hover | Lift + shadow | `-translate-y-0.5` + `shadow-md`, 200ms |
| Card press | Scale down | `active:scale-[0.98]` |
| Toast entrance | Slide up + fade | Framer Motion `fadeUp` |
| Badge count | Pop | Framer Motion `popIn` |

### Page transitions (Level 2)

| Transition | Effect | Details |
|------------|--------|---------|
| Page enter | Fade up | Content fades up from 20px below, 400ms |
| Staggered list | Sequential reveal | Cards appear 60ms apart |
| Bottom sheet | Spring physics | `springGentle` transition |
| Skeleton → content | Crossfade | Smooth swap, not instant |

### Scroll & delight (Level 3 — marketing + key moments)

| Effect | Where | Details |
|--------|-------|---------|
| Scroll reveal | Marketing sections | Fade + slide in on viewport enter |
| Success celebration | Profile complete, first endorsement | Confetti or ripple |
| Progress wheel | Profile page | Animated fill on mount |

### Using motion presets

```tsx
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  <motion.div variants={fadeUp}>Card 1</motion.div>
  <motion.div variants={fadeUp}>Card 2</motion.div>
</motion.div>
```

### Animation rules

- **Do** animate entrances, state changes, and celebrations
- **Don't** animate everything — static is fine for content that's already visible
- **Don't** use animations that block interaction or slow down perceived performance
- **Do** use `will-change` sparingly and only on elements that actually animate

---

## Component Styling

### Corners

- **Buttons:** `rounded-xl` (12px)
- **Cards:** `rounded-2xl` (16px)
- **Inputs:** `rounded-xl` (12px)
- **Modals/Sheets:** `rounded-t-2xl` (16px top)
- **Avatars:** `rounded-full`
- **Badges/chips:** `rounded-full`

### Shadows

- **Cards:** `shadow-sm` default, `shadow-md` on hover (interactive cards)
- **Modals:** `shadow-xl`
- **Toasts:** `shadow-lg`
- **Dropdowns:** `shadow-md`

### Spacing

- **Page padding:** `px-4` (16px horizontal)
- **Card padding:** `p-4` (16px all sides)
- **Section gaps:** `gap-4` or `gap-6`
- **Tab bar height:** 4rem (64px) + safe area

---

## Layout

### Bento grids

Use mixed card sizes to create visual rhythm instead of uniform stacks.

- **Profile page:** Photo card (large, 2-col span), stat cards (small, side by side), endorsements (full width)
- **Insights page:** One big chart card, 2-3 small stat cards beside it
- **Marketing page:** 2×2 feature grid with one wide card, each a different background colour

### Cards

| Property | Style |
|----------|-------|
| Background | White with coloured left border OR coloured tint background |
| Border | `border border-border` with `shadow-sm` |
| Shadow hover | `shadow-md` + `-translate-y-0.5` (interactive cards) |
| Radius | `rounded-2xl` |
| Press | `active:scale-[0.98]` |

---

## Salty — Mascot & AI Personality

**Name:** Salty
**Role:** A helpful little character that appears in empty states, onboarding, errors, tips, and celebrations.

### Personality
- Friendly, knows the ropes, subtly guides without being pushy
- Powered by AI but we **never say that** — Salty just *helps*
- "Salty noticed your STCW expires in 30 days" NOT "Our AI detected..."

### Design direction
- Simple, geometric, minimal — like Notion's "Nosey"
- Must work at 24px (inline hints) up to 200px (empty states)
- SVG illustrations, potentially with Lottie animations for key moments

### Philosophy
> YachtieLink has deep AI features but the brand never leads with "AI." Salty is the friendly face of smart features — the AI is invisible infrastructure, not branding.

---

## Profile Patterns (Phase 1A)

### Photo Gallery (Hero)
- Full-width, 65vh on mobile, `object-cover`
- Horizontal swipe between photos (Bumble-style), dot indicators at bottom
- First photo = `profile_photo_url`, additional from `user_photos` table
- Single photo: no dots, no swipe
- Desktop: photo left 40% sticky, content right 60% scrolling
- Limits: Free = 6, Pro = 9 profile photos

### Collapsible Accordion Sections — `<ProfileAccordion>`
Each profile section (About, Experience, Endorsements, Certs, Education, Hobbies, Skills, Gallery) is a collapsible accordion row.

**Collapsed (default):** Section title (DM Sans 16px/600) + chevron right, summary line below (14px, text-secondary), `rounded-2xl bg-surface p-4 shadow-sm`, entire row tappable.

**Expanded:** Chevron rotates 90° (200ms spring), content slides down via `AnimatePresence` + height auto.

**Summary lines:**
| Section | Format |
|---------|--------|
| About | First ~80 chars of AI summary or bio + "…" |
| Experience | "{years}y {months}m sea time on {count} yachts" |
| Endorsements | "{count} endorsements · {mutual} from people you know" |
| Certifications | "{count} certs · {expiring} expiring soon" |
| Education | Most recent qualification + institution |
| Hobbies | First 3 hobby names, comma-separated |
| Skills | First 3 skill names, comma-separated |
| Gallery | "{count} photos" |

### Hidden-by-Default Rule
If a section has no data AND user hasn't explicitly toggled it visible → don't render on public profile. Controlled by `users.section_visibility` JSONB + data check. Empty = invisible.

### Save/Bookmark
- Heart/bookmark icon in profile top bar (next to share)
- Tap: filled icon + haptic + toast "Profile saved"
- Long-press: folder picker bottom sheet
- Folders: user-created with optional emoji, "All Saved" is default (null folder_id)

### Social Links
Row of platform icons below location on profile. Only filled links show. Icons 20px, spaced 12px, monochrome → brand colour on hover.

Supported: Instagram, LinkedIn, TikTok, YouTube, X/Twitter, Facebook, Personal website (Globe icon).

Stored as JSONB on users table: `[{ "platform": "instagram", "url": "..." }, ...]`

### AI Summary
- Auto-generated from bio + experience + endorsements via GPT-4o-mini
- 2-3 sentences, professional tone, no AI language
- Shown in About accordion collapsed state
- User can edit → `ai_summary_edited = true` stops auto-regen
- Regenerates on bio/endorsement changes (if not manually edited)

### Profile Strength Meter
Replaces "completion %" with "strength" framing:
- 0-30%: "Getting started"
- 31-60%: "Looking good"
- 61-85%: "Standing out"
- 86-100%: "All squared away"

### Work Gallery (Portfolio)
Separate from profile photos. Showcases professional work (engine rooms, table settings, yacht interiors).
- 3-column masonry grid in accordion section
- Tap → lightbox with swipe, caption, yacht name
- Captions (300 chars) + optional yacht link
- Limits: Free = 12, Pro = 30

### Section Visibility Controls (Own Profile)
`SectionManager` card with checkboxes per section. Toggling updates `section_visibility` JSONB. Sections with no data default to off. Changes are instant (optimistic update).

### Uplift Prompts (Post-CV Parse)
Single floating card with Salty (curious, 48px) + one CTA. Shows one at a time, most impactful first, dismissible. Framing: "make your profile incredible" not "finish your profile."

---

## Dark Mode

- **Trigger:** Class-based (`.dark` on `<html>`)
- **Source:** User toggle in More tab, stored in localStorage (`yl-theme`), falls back to system preference
- **Strategy:** Dark surfaces from Slate palette, same teal primary works on both modes, text colours invert
- **Section colours:** Use 200-level shades of coral/navy/amber in dark mode for softer appearance

---

## Brand Voice (Visual)

### Do
- Use **colour to create sections** — each feature area gets its own accent
- **Animate with purpose** — entrance, feedback, celebration
- Mix **serif headlines with sans-serif body** for warmth
- Use **illustrations for empty/blank states** — never leave a user staring at plain text
- **Vary card sizes** — bento grids over uniform stacks
- Use **shadows for depth** — layered, not flat
- Keep **whitespace generous** — even more important with added colour
- Teal as the hero colour on primary actions
- Sand accent used sparingly (badges, Pro highlights, warm touches)
- Subtle rounded corners — feels approachable

### Don't
- No anchor icons, compass roses, or rope textures
- No wave backgrounds or water pattern fills
- No navy-and-gold "yacht club" aesthetic
- No gratuitous use of maritime clip art
- Don't animate everything — be selective and purposeful
- Don't use more than 2 accent colours in any single section
- Don't let illustration style drift — maintain one consistent style
- Don't overuse the sand accent — it's a 25% seasoning, not the main course

---

## Monetisation Colour Rule

> "You can't pay to be more trusted. You can only pay to present yourself better."

- **Free tier:** Full access to teal primary palette
- **Pro tier:** Sand accent may appear on Pro-exclusive features (e.g., custom QR colours, advanced CV themes)
- **Trust signals** (endorsements, verifications) always use the same colours regardless of tier

---

## Component Library — shadcn/ui

shadcn/ui (v4, base-nova style) is installed and themed with the teal + sand palette. All shadcn CSS variables (`--primary`, `--secondary`, `--accent`, etc.) map to our brand colours.

### Custom YachtieLink components (existing)

These were built before shadcn and are used across all existing pages:

| Component | File | Notes |
|-----------|------|-------|
| Button | `Button.tsx` | `loading` prop, variants: primary/secondary/ghost/destructive, sizes: sm/md/lg, press animation |
| Card | `Card.tsx` | Card, CardHeader, CardTitle, CardBody — `interactive` prop with hover lift + shadow |
| Input | `Input.tsx` | label, hint, error, suffix — accessible |
| Toast | `Toast.tsx` | ToastProvider + useToast hook — success/error/info |
| BottomSheet | `BottomSheet.tsx` | Mobile bottom drawer with backdrop |
| ProgressWheel | `ProgressWheel.tsx` | SVG ring for profile completion |

### shadcn/ui components (available)

These are themed and ready to use for new features:

| Component | Use for |
|-----------|---------|
| Dialog | Confirmation modals, info popups |
| Sheet | Side/bottom drawers (alternative to BottomSheet for new pages) |
| Badge | Status pills, tier labels, cert status |
| Avatar | Profile photos (with fallback initials) |
| Tabs | Content switching (alternative to custom segment toggles) |
| Tooltip | Hover hints on icons/actions |
| Separator | Section dividers |
| Skeleton | Loading states |
| DropdownMenu | Action menus, overflow menus |

### Adding new shadcn components

```bash
npx shadcn add [component-name]
# IMPORTANT: Always answer "n" when asked to overwrite button.tsx
```

### shadcn/ui CSS Variable Mapping

| shadcn variable | Light mode | Dark mode | Maps to |
|-----------------|------------|-----------|---------|
| `--primary` | `#0D7377` (teal-700) | `#11BABB` (teal-500) | Buttons, links, focus rings |
| `--primary-foreground` | `#ffffff` | `#032C30` (teal-950) | Text on primary bg |
| `--secondary` | `#F0FDFC` (teal-50) | `#124C4F` (teal-900) | Secondary buttons, selected states |
| `--accent` | `#F5F0E8` (sand-100) | `#1e293b` | Warm highlights |
| `--destructive` | `#DC2626` | `#ef4444` | Error, delete actions |
| `--ring` | `#0D7377` (teal-700) | `#11BABB` (teal-500) | Focus rings |
| `--muted` | `#f1f5f9` | `#334155` | Disabled, subtle bg |

---

## File References

| File | Purpose |
|------|---------|
| `app/globals.css` | Design tokens, CSS variables, shadcn theme, dark mode overrides |
| `app/layout.tsx` | Font imports (DM Sans + DM Serif Display), theme script, metadata |
| `lib/motion.ts` | Shared Framer Motion animation presets |
| `components/ui/` | Custom YachtieLink + shadcn/ui components |
| `components/ui/index.ts` | Barrel export for all components |
| `components.json` | shadcn/ui configuration |
| `lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| Tailwind v4 | Configured via `@theme inline` in globals.css (no tailwind.config file) |
