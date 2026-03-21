---
module: design-system
updated: 2026-03-21
status: shipped
phase: 1A
---

# Design System

One-line: Brand token system (teal/sand/coral/navy/amber), custom + shadcn component library, DM Sans/DM Serif Display typography, Framer Motion animation presets, full dark mode, and section colour mapping.

## Current State

- CSS custom properties for all brand colours (teal 10-stop, sand 4-stop, coral/navy/amber 5-stop each): working
- Light mode and dark mode tokens with full `.dark` class overrides: working
- shadcn/ui v4 (base-nova style) installed and themed to teal + sand palette: working
- Custom YachtieLink components (Button, Card, Input, Toast, BottomSheet, ProgressWheel) alongside shadcn: working
- Sprint 10.2 additions (Textarea, Select, FormField, IconButton, DatePicker, SectionBadge, ProfileAvatar, BackButton, EmptyState): working
- Barrel export from `components/ui/index.ts`: working
- DM Sans (body) + DM Serif Display (hero headlines) loaded via Next.js font system: working
- Framer Motion preset library (`lib/motion.ts`): working — springSnappy, springGentle, easeFast, fadeUp, fadeIn, staggerContainer, cardHover, buttonTap, scrollReveal, popIn, easeGentle
- Section colour system (`lib/section-colors.ts`): working — each tab area gets a unique accent colour
- `card-soft` glass-morphism utility class: working
- Tab bar height + safe area bottom CSS variables: working
- Profile strength arc colours: working
- Chart palette (5 colours, light + dark variants): working
- Tailwind v4 configured via `@theme inline` in globals.css (no tailwind.config file): working
- Known issues: none identified

## Key Files

| What | Where |
|------|-------|
| Design tokens (all CSS variables) | `app/globals.css` |
| Font loading | `app/layout.tsx` |
| Animation presets | `lib/motion.ts` |
| Section colour mapping | `lib/section-colors.ts` |
| Custom components | `components/ui/*.tsx` |
| Component barrel export | `components/ui/index.ts` |
| shadcn config | `components.json` |
| Utility helpers (cn) | `lib/utils.ts` |
| Design philosophy | `docs/design-system/philosophy.md` |
| Style guide | `docs/design-system/style-guide.md` |
| Pattern library | `docs/design-system/patterns/` |
| Flow diagrams | `docs/design-system/flows/` |
| Design decisions | `docs/design-system/decisions/` |

## Colour Palette

| Family | Primary use | CSS variable prefix |
|--------|------------|---------------------|
| Teal | Brand primary — buttons, CTAs, links, focus rings | `--color-teal-*` |
| Sand | Warm accent — Pro badges, highlights, 25% seasoning | `--color-sand-*` |
| Coral | Section accent — endorsements, insights | `--color-coral-*` |
| Navy | Section accent — network, colleagues | `--color-navy-*` |
| Amber | Section accent — CV, certifications | `--color-amber-*` |

### Section Colour Assignments

| Section | Colour |
|---------|--------|
| Profile | teal |
| Network / Colleagues | navy |
| Endorsements | coral |
| CV / Certifications | amber |
| Insights | coral |
| Pro / More | sand |
| Education / Gallery | teal |

Rule: every main tab must have a unique colour. No two tabs share a colour.

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero headline | DM Serif Display | 36-48px | 400 |
| Page title | DM Sans | 28px | 700 |
| Section heading | DM Sans | 18px | 600 |
| Card title | DM Sans | 14px | 600 |
| Body text | DM Sans | 14px | 400 |
| Caption/hint | DM Sans | 12px | 400 |
| Button label | DM Sans | 14px | 600 |

DM Serif Display is reserved for landing page headlines, onboarding welcome, and empty state titles. Never used for in-app page titles.

## Animation Presets (`lib/motion.ts`)

| Preset | Type | Use |
|--------|------|-----|
| `springSnappy` | Transition | Buttons, card hovers — stiff: 300, damping: 24 |
| `springGentle` | Transition | Bottom sheets — stiff: 200, damping: 20 |
| `easeFast` | Transition | Quick state changes — 200ms easeOut |
| `easeGentle` | Transition | Accordions — 250ms easeOut (no spring overshoot) |
| `fadeUp` | Variants | Page/section entrance — opacity 0 + y:20 to visible |
| `fadeIn` | Variants | Simple fade — 300ms |
| `staggerContainer` | Variants | Parent for staggered children — 60ms gap |
| `cardHover` | Props | whileHover: y:-2, whileTap: scale 0.98 |
| `buttonTap` | Props | whileTap: scale 0.97 |
| `scrollReveal` | Variants | Marketing sections — fade + slide on viewport |
| `popIn` | Variants | Badges, counts — scale from 0.8, spring stiff: 400 |

## Component Inventory

### Custom YachtieLink Components

| Component | File | Key features |
|-----------|------|-------------|
| Button | `Button.tsx` | `loading` prop, variants (primary/secondary/ghost/destructive/outline/link), sizes (sm/md/lg), press animation |
| Card | `Card.tsx` | CardHeader, CardTitle, CardBody, `interactive` prop with hover lift |
| Input | `Input.tsx` | label, hint, error, suffix, accessible |
| Textarea | `Textarea.tsx` | Same pattern as Input, multiline |
| Select | `Select.tsx` | Styled native select |
| FormField | `FormField.tsx` | Label + error wrapper |
| Toast | `Toast.tsx` | ToastProvider + useToast hook, success/error/info |
| BottomSheet | `BottomSheet.tsx` | Mobile drawer with backdrop |
| ProgressWheel | `ProgressWheel.tsx` | SVG ring for profile strength |
| DatePicker | `DatePicker.tsx` | Date selection component |
| IconButton | `IconButton.tsx` | Icon-only button |
| SectionBadge | `SectionBadge.tsx` | Coloured section label |
| ProfileAvatar | `ProfileAvatar.tsx` | Photo with initials fallback |
| BackButton | `BackButton.tsx` | Navigation back arrow |
| EmptyState | `EmptyState.tsx` | Icon + title + description + optional action |
| AnimatedCard | `AnimatedCard.tsx` | Motion wrapper for cards |
| PageTransition | `PageTransition.tsx` | fadeUp wrapper for page content |
| ScrollReveal | `ScrollReveal.tsx` | Viewport-triggered animation |

### shadcn/ui Components (themed)

Dialog, Badge, Separator, Avatar, Tabs, Tooltip, Sheet, Skeleton, DropdownMenu

## Corner Radius System

| Element | Radius |
|---------|--------|
| Buttons | `rounded-xl` (12px) |
| Cards | `rounded-2xl` (16px) |
| Inputs | `rounded-xl` (12px) |
| Modals/Sheets | `rounded-t-2xl` (16px top) |
| Avatars | `rounded-full` |
| Badges/chips | `rounded-full` |

## Dark Mode

- Trigger: class-based (`.dark` on `<html>`)
- Source: user toggle in More tab, stored in `localStorage` (`yl-theme`), falls back to system preference
- Section colours use 200-level shades in dark mode for softer appearance
- All semantic tokens have dark overrides in globals.css

## Decisions That Bind This Module

- **D-003 / D-007**: Monetisation colour rule — teal for trust, sand for Pro presentation. Pro features never make users look "more trusted."
- **D-013**: No auto-summary language — UI never labels endorsement density

## Next Steps

- [ ] Build Salty mascot SVG illustration set for empty states
- [ ] Audit all components for consistent dark mode support
- [ ] Consider extracting section colour assignments to a config file if more sections are added
- [ ] Document responsive breakpoint strategy (mobile-first, responsive up)
