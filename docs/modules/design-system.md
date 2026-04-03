---
module: design-system
updated: 2026-04-04
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
- Sprint 10.2 additions (Textarea, Select, FormField, IconButton, DatePicker, SectionBadge, ProfileAvatar, EmptyState): working
- `BackButton.tsx`: **DELETED** — orphaned, no importers. Navigation handled by `PageHeader` sticky back bar.
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
| CountryFlag | `CountryFlag.tsx` | On-demand SVG flag from flagcdn.com, `onError` hides on CDN failure |
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

## Next Steps

- [ ] Build Salty mascot SVG illustration set for empty states
- [ ] Audit all components for consistent dark mode support
- [ ] Consider extracting section colour assignments to a config file if more sections are added
- [ ] Document responsive breakpoint strategy (mobile-first, responsive up)

## Decisions

**2026-03-17** — Dark mode via CSS variables, not Tailwind dark: prefix. Semantic CSS custom properties (`--color-surface`, `--color-text-primary`) that swap values in `.dark` class. Fewer classes, less duplication, easier to maintain — components just work without per-element dark mode logic.
**2026-03-17** — Split layout on desktop public profile. Photo sticky left (40%), content scrolling right (60%). Recruiters and captains view on desktop; the photo should be prominent and persistent.
**2026-03-17** — Salty mascot personality: knows the ropes, not AI-branded. AI is invisible infrastructure, never mentioned in branding. "AI told you to do this" undermines crew trust.
**2026-03-17** — Empty sections hidden, not shown as skeletons. A profile with 3 filled sections and 4 empty placeholders looks broken. A profile with 3 filled sections and nothing else looks complete. Own-profile page shows CTAs; public profile never does.
**2026-03-17** — Profile Strength not Profile Completion. Labels: "Getting started" (0–30%), "Looking good" (31–60%), "Standing out" (61–85%), "All squared away" (86–100%). "60% complete" feels like a failing grade; "Looking good" at 60% changes user motivation.
**2026-03-17** — Coral (#E8634A), navy (#2B4C7E), amber (#E5A832) as section accent colours alongside teal primary. Single-colour palette felt flat. Notion-style colour coding gives sections visual identity; teal remains primary.
**2026-03-17** — Framer Motion for all animation, with shared presets in `lib/motion.ts`. CSS transitions too limited for coordinated entrance animations. Framer Motion integrates cleanly with React, supports AnimatePresence, and tree-shakes well.
**2026-03-17** — DM Serif Display for headlines alongside DM Sans. DM Sans alone felt too utilitarian. Serif headlines add warmth — "professional without being corporate." Used sparingly: hero text, page titles.
**2026-03-16** — Two-pass rally pattern (R1 + challengers) for design reviews. Single-pass analysis is too shallow; challenger agents find structural issues that first-pass rationalises away.

## Recent Activity

**2026-04-04** — Rally 009 Session 7, Lane 1 (fix/desktop-responsiveness): `BottomSheet.tsx` — desktop floating card treatment: `md:left-[calc(50%_-_248px)] md:w-[560px] md:rounded-2xl md:bottom-4 md:right-auto`, `pb-6` replaces `pb-tab-bar` (which collapsed to 0 at md). `UpgradeCTA.tsx` — `pointer-events-none` on outer wrapper, `pointer-events-auto` on inner div, `md:max-w-2xl md:mx-auto md:rounded-t-2xl md:border-x md:shadow-lg`. `globals.css` — `--tab-bar-height: 0rem` at md breakpoint. BottomSheet exit animation on desktop still slides down (mobile feel) — deferred to Rally 010. Discovered: no systematic sidebar-aware positioning pattern for fixed elements; captured in backlog (`sidebar-fixed-positioning`).

**2026-04-02** — Inner-page-header (PR #144): `PageHeader` full rewrite — two-part layout: sticky back bar (section-color 2px bottom border, 44px touch target, auto-derived from `backHref` using canonical `lib/section-colors.ts`) + standalone title row (scrolls with content, optional count/subtitle/actions). `onBack` callback for multi-step flows. `BackButton.tsx` deleted (orphaned). New `CountryFlag` component added (`components/ui/CountryFlag.tsx`) — loads individual SVG flags from flagcdn.com on demand, zero bundle impact.

**2026-04-01** — Lane 3 (PR #138): DatePicker gains text+calendar hybrid mode — `parseTextDate()` handles 7 format patterns (ISO, US, natural), defaults to text on mobile, inline error with format hints, mode toggle. ProgressWheel gains `staggerMs` prop (default 0, backward compat) for organic tick animations. EndorsementBanner progress bars get 100ms/200ms stagger delays.
**2026-04-01** — CV wizard Steps 4-5: ChipSelect hierarchy rework (headings > chips), chip sizing downsized to text-xs/py-1, CV chips tinted not solid, hobby chips amber-tinted for distinction; StepReview overhaul with serif title, amber wayfinding borders, tinted skill/hobby chips, M/Y/S/Y prefixes.
**2026-03-31** — CV wizard walkthrough: DatePicker selector reorder to Day-Month-Year; WCAG contrast fix (amber labels → text-secondary on white backgrounds); decision logged: no left border accent stripes on cards.
**2026-03-21** — Sprint 10.3: Typography standardized — 28px bold tracking-tight titles, section headers unified; `card-soft` glass treatment on tinted background pages; spacing fixes, toast position uses CSS vars.
**2026-03-21** — Sprint 10.3: Dark mode sidelined — force light mode, theme toggle replaced with "coming soon" placeholder; desktop layout deferred to Phase 1B.
**2026-03-21** — Sprint 10.2: New components — Button variants (outline/link/icon), Input, Select, Textarea, FormField, IconButton, SectionBadge, ProfileAvatar; section color system (teal/amber/coral/navy/sand unique tab colors).
**2026-03-21** — Sprint 10.2: Token migration — all hardcoded colors → CSS custom properties; dark mode tokens: 20+ variable overrides in globals.css; full-bleed backgrounds on CV, Insights, Network pages.
**2026-03-21** — Sprint 10.1 Wave 1 C: Animation pass — `easeGentle` + `scrollRevealViewport` added to `lib/motion.ts`; `ProfileAccordion`, `IdentityCard`, `Toast`, `BottomSheet` wired to shared presets; `PageTransition` and `ScrollReveal` wrapper components created.
**2026-03-21** — Sprint 10.1 Wave 1 D: DM Serif Display applied to profile names, section headings, page titles, auth pages (weight 400, no synthetic bold).
**2026-03-21** — Sprint 10.1 Wave 1 B: Dark mode — ProfileStrength arc colours use `--color-strength-*` CSS vars; Insights chart colours use `--chart-*` vars; SidebarNav badge uses `--color-error`.
**2026-03-18** — Project structure: Created `docs/design-system/` — `philosophy.md`, `style-guide.md`, `flows/` (5 user journey maps), `patterns/` (5 component pattern docs), `decisions/` (9 seeded design decisions), `reference/salty_mascot_spec.md`.
**2026-03-17** — UI/UX refresh + Salty: Expanded colour palette — added coral, navy, amber token families (50/100/200/500/700 each) to globals.css; added DM Serif Display font; created `lib/motion.ts` with shared Framer Motion presets.
**2026-03-17** — Phase 1A Cleanup Spec 07: Installed framer-motion; `AnimatedCard.tsx` and `ProfileCardList.tsx`; BottomSheet rewritten with AnimatePresence + spring slide-up; IdentityCard QR panel with height animation; Toast spring entrance/exit.
**2026-03-17** — Phase 1A Cleanup Spec 01: Comprehensive CSS var migration — all remaining shadcn semantic vars replaced with design system tokens across 18+ files.
**2026-03-15** — Brand Palette: Full brand palette swap → teal (#0D7377) + sand (#E8DCC8); DM Sans replacing Geist; shadcn/ui v4 installed with teal-themed CSS variables; `lib/utils.ts` with `cn()` helper.
**2026-03-13** — Sprint 1: Established design token system in `globals.css` — navy, ocean, gold palettes, semantic CSS vars with dark overrides, dark mode via `.dark` class; inline dark mode init script (no FOUC).
