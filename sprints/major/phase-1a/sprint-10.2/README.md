# Sprint 10.2 — UXUI & Frontend Rewrite

**Phase:** 1A (final)
**Status:** 📋 Planned
**Started:** —
**Completed:** —

## Why This Exists

The 2026-03-21 five-agent audit found the app looks like a tutorial project, not a product. The design system docs are excellent — they describe a warm, colorful, photo-forward experience inspired by Notion and Bumble. The implementation ignores them completely.

**The numbers:**
- 53 raw `<button>` elements (Button component exists, has 8 imports)
- 34 raw `<input>` elements (Input component exists, has 2 imports)
- 5 shadcn components installed with 0 imports each
- 0 files use coral, navy, amber, or sand color tokens (all defined in globals.css)
- 5 pages use `alert()` for errors
- 7 pages have no success feedback
- 4 different button patterns, 3 different tab patterns, 3 different border radii
- Public profile hero is 34vh (style guide says 65vh)

**This is not a cosmetic pass.** This is a structural rewrite that:
1. Builds the component framework so this can never drift again
2. Brings every surface to the quality level the design system describes
3. Introduces the color personality that makes YachtieLink look like YachtieLink, not a generic SaaS

---

## Architecture: Two Layers

### Layer 1: The Backbone (Parts 1–3)
Build the component infrastructure. After this, it's physically hard to build an inconsistent page because the components enforce the system.

### Layer 2: The Polish (Parts 4–7)
Apply the backbone to every surface. Introduce color, fix sizing, add the interactions that make it feel premium.

---

## Part 1: Component Foundation

**Goal:** One source of truth for every interactive element. If it's a button, it's `<Button>`. If it's an input, it's `<Input>`. No exceptions.

### 1A. Unify token system
**Decision: Legacy `var(--color-*)` tokens are the standard.**
- 90% of the app uses them
- shadcn bridge mapping stays for when shadcn components get used
- Button.tsx gets rewritten to use `var(--color-*)` tokens (currently uses shadcn `bg-primary`)
- Input.tsx error state: `border-red-500` → `border-[var(--color-error)]`
- Toast.tsx success: `bg-emerald-600` → `bg-[var(--color-success)]`

### 1B. Missing components
- `Textarea.tsx` — matches Input pattern (label, hint, error, tokens)
- `Select.tsx` — matches Input pattern (label, hint, error, rounded-xl, tokens)
- `FormField.tsx` — wrapper for label + description + error + children (DRY for date inputs, custom fields)
- `IconButton.tsx` — square button for icon-only actions (share, save, close)

### 1C. Button variants expansion
Add to existing Button.tsx:
- `outline` variant — border + transparent bg, used for secondary actions
- `link` variant — looks like a text link, behaves like a button
- `icon` variant — square, for icon-only buttons

### 1D. Fix EmptyState
- Card variant: add `border border-[var(--color-border)]` to match real cards
- Use `bg-[var(--color-surface-raised)]` not `bg-[var(--color-surface)]`
- Add optional `accentColor` prop for section-colored empty states (Sprint 11 Salty mounting point)

### 1E. Extract navigation config
- Create `lib/nav-config.ts` with shared `tabs` array, `Tab` interface
- Import in both `BottomTabBar.tsx` and `SidebarNav.tsx`
- Fix SidebarNav active state opacity syntax

### 1F. Dark mode token gaps
- Add `.dark` overrides for `--color-success`, `--color-warning`, `--color-error`
- Add `.dark` overrides for coral, navy, amber section colors (200-level shades per style guide)
- Fix `--color-text-inverse` for dark mode usage

---

## Part 2: Section Color System

**Goal:** Each feature area gets its own accent color per the style guide. This is what makes the app look like Notion, not a generic grey-and-teal template.

### Color assignments (from style guide)
| Section/Feature | Accent | Background tint | Icon color | Badge color |
|---|---|---|---|---|
| Network / Colleagues | **Navy** | `--color-navy-50` | `--color-navy-500` | `--color-navy-200` |
| Endorsements | **Coral** | `--color-coral-50` | `--color-coral-500` | `--color-coral-200` |
| CV / Documents | **Amber** | `--color-amber-50` | `--color-amber-500` | `--color-amber-200` |
| Certifications | **Amber** | `--color-amber-50` | `--color-amber-500` | `--color-amber-200` |
| Profile / Identity | **Teal** | `--color-teal-50` | `--color-teal-700` | `--color-teal-200` |
| Insights / Analytics | **Navy** | `--color-navy-50` | `--color-navy-500` | `--color-navy-200` |
| Pro / Premium | **Sand** | `--color-sand-100` | `--color-sand-400` | `--color-sand-200` |

### How section colors appear
- **Page-level:** Subtle background tint on the page (`bg-[var(--color-navy-50)]` on Network)
- **Card accents:** Colored left border on key cards (`border-l-4 border-[var(--color-coral-500)]` on endorsement cards)
- **Tab bar icons:** Active tab icon uses section color, not teal
- **Empty states:** Icon/illustration fill uses section color
- **Badges/pills:** Section-colored backgrounds (cert status, endorsement count)
- **Chart colors:** Already mapped (`--chart-1` through `--chart-5`) — verify they use section colors

### Implementation
- Create `lib/section-colors.ts` — maps section names to their color tokens
- Create `SectionProvider` context (optional) or pass via props
- Update navigation: active tab icon tint per section
- Update cards: add left-border accent variant
- Update empty states: section-colored icon

---

## Part 3: Form System Rewrite

**Goal:** Every form in the app uses the same components and patterns. No more drift.

### 3A. Auth pages (5 files)
- Replace all raw `<input>` with `<Input>` (gains: label, hint, error, a11y, focus-visible, dark mode)
- Replace all raw `<button>` with `<Button>` (gains: loading spinner, press animation, dark mode, consistent styling)
- Add password visibility toggle (eye icon via Input's `suffix` prop)
- Replace hardcoded error alerts with token-based pattern
- Add `export const metadata` to each page
- Add `PageTransition` wrapper
- Fix welcome page: dark mode brand name color, increase tagline size
- Fix invite-only page: use font-serif, add BackButton, fix email

### 3B. Profile edit pages (12+ files)
- Replace ALL raw `<input>`, `<select>`, `<textarea>`, `<button>` with components
- Replace `alert()` → `useToast()` on 5 pages
- Add success toast on save for 7 pages that silently navigate
- Replace "Loading..." text with `<Skeleton>` blocks on 5 pages
- Fix cert edit delete: text link → `<Button variant="destructive">`
- Fix attachment pages: remove `min-h-screen` custom wrapper, use standard layout, fix title/label sizing

### 3C. Standardize across all forms
- Page title: `text-xl font-semibold text-[var(--color-text-primary)]` (DM Sans, not serif)
- Form label: `text-sm font-medium text-[var(--color-text-primary)]`
- Input height: `h-12` (48px) — consistent with auth pages
- Gap: `gap-4` between form fields
- Disabled opacity: `0.5` everywhere
- BackButton placement: always in `flex items-center gap-3` row with page title
- Bottom padding: `pb-24` on all pages (already done in 10.1 for most)

---

## Part 4: Public Profile Overhaul

**Goal:** The public profile is the product. It must look premium.

### 4A. Hero scroll behavior (parallax shrink)
- Start at `h-[60vh]` on first load
- As user scrolls down, hero smoothly shrinks to `h-[34vh]` and stays
- Implementation: `useScroll()` + `useTransform()` from Framer Motion
- Profile name + role overlay pins to bottom of hero during shrink
- On fresh load / scroll-to-top, hero re-expands
- Desktop: sticky left panel stays at 40% — no height animation needed (already works)

### 4B. Section gaps + contrast
- Content gap: `gap-2` → `gap-4`
- Background: Increase contrast between page bg and card bg, or add subtle card borders
- Accordion cards: `shadow-sm` → `shadow-md` for clearer elevation

### 4C. Accordion quality
- Chevron: replace `›` text character with Lucide `ChevronRight` icon (smooth rotation)
- Title: `text-base` → `text-lg` for stronger hierarchy (keep font-serif)
- Expanded content: `pt-1` → `pt-3` for breathing room above divider
- Add active/press state on accordion header (subtle scale or bg change)

### 4D. Endorsement cards
- Border radius: `rounded-lg` → `rounded-2xl` (match everything else)
- Text color: `text-secondary` → `text-primary` (testimonial words are the most important thing)
- Avatar: `h-8 w-8` → `h-10 w-10` (trust signal needs to be recognizable)
- Fallback avatar: hash-based background color for initials (like Slack/Notion)
- Left border: add `border-l-4 border-[var(--color-coral-500)]` (section color!)
- Quote marks: style as decorative element (large quote above, or left-border accent)

### 4E. Photo gallery
- Add crossfade transition between photos (Framer Motion AnimatePresence)
- Dot indicators: `w-1.5 h-1.5` → `w-2 h-2` (easier to tap)
- Desktop arrows: `w-8 h-8` → `w-10 h-10`, change to `bg-white/80 shadow-md` (Airbnb style)
- Empty state: replace emoji with proper illustration placeholder

### 4F. Social link icons
- Replace all emoji icons with proper SVGs (Lucide where available, custom for platforms)
- Instagram: Lucide `Instagram`
- LinkedIn: Lucide `Linkedin`
- YouTube: Lucide `Youtube`
- Twitter/X: custom SVG or Lucide `Twitter`
- Facebook: Lucide `Facebook`
- TikTok: custom SVG
- Website: Lucide `Globe`
- Location pin: Lucide `MapPin` (replace emoji 📍)

### 4G. Hero name sizing
- Mobile: `text-2xl` → `text-3xl` (30px — fills more of the overlay)
- Desktop: `text-3xl md:text-4xl` (36px — commands the split panel)

### 4H. Bottom CTA
- For non-logged-in users: make "Build your crew profile" CTA sticky at bottom of viewport
- Use `fixed bottom-0` with a backdrop-blur treatment

---

## Part 5: Main App Pages

### 5A. CV page rewrite
- Add page title ("Your CV & Share Links")
- Change ALL `rounded-lg` → `rounded-2xl` on cards
- Replace hand-rolled radio buttons with proper radio group
- Add QR code toggle animation
- Restructure: primary actions (share, download) prominent, secondary (regenerate, edit) smaller

### 5B. Insights page
- Teaser cards: replace `opacity-70` with proper locked card pattern (blur overlay + lock icon SVG)
- Free user: add explanatory section ("What is Insights?") with illustration
- Ensure page title uses DM Sans, not serif (in-app rule)

### 5C. Segment control consolidation
- Pick ONE pattern: the Network page iOS-style segmented control
- Apply to Insights time range selector (replace `<Link>` elements with client-side state)
- Apply to More page theme toggle
- Saved profiles folder pills stay as horizontal scroll pills (different use case — filters, not tabs)

### 5D. Missing loading.tsx files
- Create `loading.tsx` for: network, insights, cv, more
- Use `<Skeleton>` component consistently
- Replace hand-rolled `animate-pulse` divs in account page with `<Skeleton>`

### 5E. Delete account page
- Match standard layout (remove custom `max-w-sm`)
- Use `<Button variant="destructive">` instead of hand-rolled red button
- Use shadcn `Dialog` for confirmation instead of native `window.confirm`

---

## Part 6: Color & Warmth Pass

**Goal:** The app currently reads as "teal and grey." The style guide describes "teal primary, sand warmth, coral/navy/amber for section identity." This pass brings that to life.

### 6A. Section tint backgrounds
- Network page: `bg-[var(--color-navy-50)]` subtle background tint
- Insights page: `bg-[var(--color-navy-50)]` (same family as network)
- CV page: `bg-[var(--color-amber-50)]` warm background
- Profile page: stays on default surface (teal accents come from components)
- More page: stays on default surface

### 6B. Card accent borders
- Endorsement cards: `border-l-4 border-[var(--color-coral-500)]`
- Certification cards (with expiry): `border-l-4 border-[var(--color-amber-500)]`
- Yacht/experience cards: `border-l-4 border-[var(--color-navy-500)]`
- Pro feature cards: `border-l-4 border-[var(--color-sand-300)]`

### 6C. Sand warmth touches
- Pro badge: `bg-[var(--color-sand-100)] text-[var(--color-sand-400)]`
- Insights "Pro" pill: sand-tinted
- Welcome page: subtle sand gradient accent (not overwhelming)

### 6D. Badge/pill colors by section
- Cert status "Valid": keep green
- Cert status "Expiring": `bg-[var(--color-amber-100)] text-[var(--color-amber-700)]`
- Endorsement count badge: `bg-[var(--color-coral-100)] text-[var(--color-coral-700)]`
- Colleague count: `bg-[var(--color-navy-100)] text-[var(--color-navy-700)]`

### 6E. Dark mode section colors
- Use 200-level shades per style guide: coral-200, navy-200, amber-200
- Verify contrast on dark surface (#0f172a)
- Card accent borders: use 500-level (brighter) in dark mode

---

## Part 7: Animation & Interaction Polish

### 7A. Page transitions
- Every page gets `<PageTransition>` wrapper (currently only 4 pages have it)
- Auth pages get entrance animation
- Edit pages get entrance animation

### 7B. Skeleton → content crossfade
- When async data loads, crossfade from skeleton to content (not instant swap)
- Use `AnimatePresence` with `mode="wait"`

### 7C. Button press feedback
- Verify all `<Button>` instances have `active:scale-[0.97]` (built into component)
- Add subtle press feedback to accordion headers

### 7D. ShowMoreButton animation
- Add `AnimatePresence` + height animation when content reveals
- Currently just pops in with no transition

### 7E. Photo gallery transitions
- Crossfade between photos using `AnimatePresence` (already specified in Part 4E)

---

## Build Order

```
Part 1: Component Foundation (Wave 0 — blocks everything)
  1A Token unification
  1B Missing components (Textarea, Select, FormField, IconButton)
  1C Button variants
  1D EmptyState fix
  1E Nav config extraction
  1F Dark mode token gaps

Part 2: Section Color System (can parallel with Part 3)
  2A Color assignments + lib/section-colors.ts
  2B Implementation across nav, cards, empty states

Part 3: Form System Rewrite (can parallel with Part 2)
  3A Auth pages (5 files)
  3B Profile edit pages (12+ files)
  3C Standardization pass

Part 4: Public Profile Overhaul
  4A Hero scroll (parallax shrink)
  4B-4H All other public profile fixes

Part 5: Main App Pages
  5A-5E All main page fixes

Part 6: Color & Warmth Pass (after Parts 2-5 establish the structure)
  6A-6E Apply section colors everywhere

Part 7: Animation & Interaction Polish (final pass)
  7A-7E Entrance animations, crossfades, press feedback
```

**Estimated effort:**
- Part 1: 1 day
- Part 2: 0.5 days
- Part 3: 2 days (most files)
- Part 4: 1.5 days
- Part 5: 1 day
- Part 6: 1 day
- Part 7: 0.5 days
- **Total: ~7-8 days with parallel agents**

---

## Exit Criteria

- Zero raw `<button>`, `<input>`, `<select>`, `<textarea>` in page files
- Zero `alert()` calls
- Every save flow shows a success toast
- Every async page shows `<Skeleton>` loading
- All cards use `rounded-2xl`
- All inputs use `rounded-xl`
- Coral, navy, amber, sand tokens visible in at least 15 components
- Section color tints on Network, Insights, CV pages
- Public profile hero scroll behavior working
- Photo gallery has crossfade transitions
- Social links use SVG icons
- Dark mode correct on every page
- `npm run build` zero errors
- Visual check passes at 375px and 1280px, both themes

---

## Risks

- Part 4A (hero parallax shrink) is the most complex single feature — isolate it so it doesn't block other work
- Section colors in dark mode need careful contrast testing
- Replacing raw inputs with components may change spacing — need visual diff per page
- Attachment pages are structurally different — may need partial rewrite rather than component swap
