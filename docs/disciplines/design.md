# Discipline: Design (UI + UX)

Quick reference for styling, layout, animation, responsive design, and interaction patterns.

**For deeper context** — philosophy, inspirations, full style guide, component patterns, user flows, and design decisions — see `docs/design-system/README.md`. That is the complete design reference. This file is a concise cheat sheet for mid-session use.

---

## Design Philosophy

Mobile-first. Photo-forward. Progressive disclosure. Empty = invisible. Crew-first trust model. See `docs/design-system/philosophy.md` for the full version.

Brand direction: energetic and warm with 25% maritime feel. Fun without being silly, professional without being corporate, nautical without being cheesy. Inspired by Notion's visual energy.

**Do:** colour-coded sections, purposeful animation, personality through illustrations, bento grids, vary card sizes, generous whitespace, serif headlines for warmth.

**Don't:** anchor icons, compass roses, rope textures, wave backgrounds, "yacht club" navy-and-gold, gratuitous maritime clip art, animate everything, mix 3+ accent colours in one section.

## Colour System

CSS custom properties in `globals.css`. Semantic tokens that auto-switch for dark mode:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-surface` | `#ffffff` | `#0f172a` | Page backgrounds |
| `--color-surface-raised` | `#f8fafc` | `#1e293b` | Card backgrounds |
| `--color-border` | `#e2e8f0` | `#334155` | Borders, dividers |
| `--color-text-primary` | `#1a1a2e` | `#f8fafc` | Body text |
| `--color-text-secondary` | `#64748b` | `#cbd5e1` | Captions, hints |
| `--color-interactive` | `#0D7377` | `#11BABB` | CTAs, links |

**Brand palette:** teal (primary), sand (warm accent — 25% max), coral/navy/amber (section accents).

**Usage in components:**
```tsx
className="bg-[var(--color-surface)] text-[var(--color-text-primary)]"
```

Always use semantic tokens, not raw palette values. Raw `var(--teal-500)` won't switch for dark mode.

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| Hero headline | DM Serif Display | 36–48px | 400 |
| Page title | DM Sans | 28px | 700 |
| Section heading | DM Sans | 18px | 600 |
| Card title | DM Sans | 14px | 600 |
| Body | DM Sans | 14px | 400 |
| Caption | DM Sans | 12px | 400 |

```tsx
// Serif for impact
className="font-serif text-4xl"
// Standard heading
className="text-xl font-semibold"
```

## Component Styling

Always compose with `cn()` from `lib/utils.ts`:
```tsx
cn(
  "flex items-center gap-4",
  "bg-[var(--color-surface)] rounded-2xl p-4 shadow-sm",
  interactive && "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
  className
)
```

**Corner radius hierarchy:**
- Buttons/Inputs: `rounded-xl`
- Cards/Sections: `rounded-2xl`
- Modals/BottomSheets: `rounded-t-2xl`
- Avatars/Badges: `rounded-full`

**Shadow hierarchy:**
- Cards: `shadow-sm` (default), `shadow-md` (hover)
- Modals: `shadow-xl`
- Toasts: `shadow-lg`

**Spacing:** `px-4` page padding, `p-4` card padding, `gap-4` or `gap-6` section gaps.

## Dark Mode

Class-based with localStorage persistence (`yl-theme` key). Inline script in root layout runs before paint to prevent flash.

CSS variables handle the switch — components don't need `dark:` prefixes when using semantic tokens. Toggle lives in More tab.

## Responsive Design

Mobile-first. Base styles target mobile, `md:` prefix (768px) for desktop enhancements.

```tsx
// Desktop-only element
className="hidden md:flex"
// Fluid height
style={{ height: 'clamp(320px, 65vh, 600px)' }}
```

Viewport config: `maximumScale: 1` (no zoom), `viewportFit: "cover"` (safe areas for notch).

**Public profile desktop layout:** Photo sticky left 40%, content scrolling right 60%.

## Animation System

Framer Motion presets in `lib/motion.ts`:

| Preset | Usage |
|--------|-------|
| `fadeUp` | Page/section entrance (opacity + y:20→0) |
| `fadeIn` | Simple fade |
| `staggerContainer` | Parent for sequential reveal (60ms stagger) |
| `cardHover` | Hover: y:-2, tap: scale:0.98 |
| `buttonTap` | Press: scale:0.97 |
| `scrollReveal` | Scroll-triggered entrance |
| `popIn` | Badge/count celebration (spring) |

**Springs:** `springSnappy` (stiffness:300, damping:24) for quick interactions. `springGentle` (stiffness:200, damping:20) for softer motion.

**Stagger pattern:**
```tsx
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item, i) => (
    <motion.div key={i} variants={fadeUp}>{item}</motion.div>
  ))}
</motion.div>
```

**Always respect reduced motion:**
```tsx
const prefersReducedMotion = useReducedMotion()
// Skip animation if true
```

**Rules:** Animate entrances, state changes, celebrations. Don't animate static content or block interactions.

## Key UX Patterns

**"Instant Good Profile"** — after CV parse, the profile should look polished immediately. Empty sections are hidden, not shown as skeletons. Profile Strength meter says "strength" not "completion" — 60% after CV parse = "Looking good", not a failing grade.

**Progressive disclosure** — collapsed accordion sections with smart summary lines. Expand for detail. `<ProfileAccordion>` with Framer Motion expand/collapse.

**Empty = invisible** — sections with no data don't render. `section_visibility` JSONB controls which sections the user wants shown.

**Save/bookmark** — optimistic toggle with rollback on failure. Tap = save, long-press = folder picker via BottomSheet.

## Salty (Mascot)

Simple geometric SVG, scalable 24px–200px. Friendly, knows the ropes. Used in: empty states, onboarding, errors, tips, celebrations. AI is invisible infrastructure, not branding — Salty guides without saying "AI."

SVG artwork needed before implementation — spec is in `notes/salty_mascot_spec.md`.
