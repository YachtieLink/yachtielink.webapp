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

### Layer 1: The Backbone (Parts 0–3)
Fix known bugs, build the component infrastructure. After this, it's physically hard to build an inconsistent page because the components enforce the system.

### Layer 2: The Polish (Parts 4–8)
Apply the backbone to every surface. Introduce color, fix sizing, add the interactions that make it feel premium.

---

## Part 0: Pre-Work Bug Fixes

**Goal:** Fix confirmed bugs from audits before the rewrite begins, so they don't compound.

- **Theme localStorage key mismatch:** Audit `yl-theme` vs `theme` — pick one, update all references
- **Welcome page legal links:** Verify paths resolve correctly
- **CookieBanner z-index:** Fix overlap with BottomTabBar (CookieBanner must sit above it)
- **`var(--teal-N)` audit:** 10+ components reference bare `--teal-N` instead of `--color-teal-N` — fix all instances for dark mode compatibility

---

## Part 1: Component Foundation

**Goal:** One source of truth for every interactive element. If it's a button, it's `<Button>`. If it's an input, it's `<Input>`. No exceptions.

### 1A. Token unification
**Decision: Button keeps shadcn tokens.** They already bridge correctly via globals.css. Changing them risks breaking 8 existing imports for zero user-facing benefit. The real fix is making everything else USE the Button.

- Input.tsx error state: `border-red-500` → `border-[var(--color-error)]`
- Toast.tsx success: `bg-emerald-600` → `bg-[var(--color-success)]`

### 1B. Missing components
Create in `components/ui/`:
- `Textarea.tsx` — matches Input pattern (label, hint, error, tokens, `focus-visible:` not `focus:`)
- `Select.tsx` — matches Input pattern (label, hint, error, rounded-xl, tokens, `focus-visible:` not `focus:`)
- `FormField.tsx` — generic wrapper: label + optional description + error message + children slot. DRY for date inputs, file inputs, and any non-standard field that can't use Input/Textarea/Select directly. Interface: `{ label?: string; description?: string; error?: string; required?: boolean; children: React.ReactNode; htmlFor?: string }`
- `IconButton.tsx` — wraps `<Button variant="icon">` with enforced square sizing and `aria-label` requirement. Interface: `{ icon: React.ReactNode; label: string; size?: 'sm' | 'md' | 'lg'; variant?: Variant }`. Renders `<Button variant="icon" aria-label={label} size={size}>{icon}</Button>`.
- `Badge.tsx` — extends shadcn Badge with a `colorScheme` prop mapping to section colors. Variants: `default | coral | navy | amber | sand | teal | success | warning | destructive`. Each maps to the appropriate `bg-[var(--color-{section}-100)] text-[var(--color-{section}-700)]` pair. Replaces all hand-coded badge color classes throughout the app.
- `ProfileAvatar.tsx` — wraps shadcn Avatar with hash-based fallback color. Props: `{ name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }`. Fallback renders initials on a deterministic background color (coral-200, navy-200, amber-200, teal-200 — hashed from name). Sizes: sm=`h-8 w-8`, md=`h-10 w-10`, lg=`h-12 w-12`.

### 1C. Button variants expansion
Add to existing Button.tsx:
- `outline` variant — `border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]`
- `link` variant — `bg-transparent text-[var(--color-interactive)] hover:underline p-0 h-auto font-medium`
- `icon` variant — `p-0 h-10 w-10 rounded-xl` (square, no text padding)

**Post-change verification:** Grep all existing Button imports and visually confirm they still render correctly. The new variants don't change existing variant behavior, but confirm the type union expansion doesn't cause TS errors at call sites.

### 1D. Fix EmptyState
- Card variant: add `border border-[var(--color-border)]` to match real cards
- Use `bg-[var(--color-surface-raised)]` not `bg-[var(--color-surface)]`
- Add optional `accentColor?: SectionColor` prop (from `lib/section-colors.ts`) that tints the icon/illustration with the section's accent color. Default remains neutral.

### 1E. Extract navigation config
- Create `lib/nav-config.ts` with shared `tabs` array, `Tab` interface
- **Icons stay in their respective nav component files** — the existing paired custom SVGs (outline + filled from `./icons.tsx`) are kept. `nav-config.ts` exports route/label/matchPrefix data only. `NavTab` interface uses `icon: React.ComponentType` and `activeIcon: React.ComponentType`, imported from the existing `./icons` files.
- Fix SidebarNav active state opacity syntax

### 1F. Dark mode token gaps
- Add `.dark` overrides for `--color-success`, `--color-warning`, `--color-error`
- Add `.dark` overrides for coral, navy, amber, **teal**, sand section colors (200-level shades per style guide)
- Fix `--color-text-inverse` for dark mode usage

### 1G. Accessibility in new components
- All new components (Textarea, Select, FormField) use `focus-visible:` not `focus:` for keyboard-only focus rings
- `prefers-reduced-motion` media query support added in Part 7 animations

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
- **Badges/pills:** Use `<Badge colorScheme="coral">` (from Part 1B) instead of hand-coded classes
- **Chart colors:** Already mapped (`--chart-1` through `--chart-5`) — verify they use section colors

### Implementation
- Create `lib/section-colors.ts` — maps section names to their color tokens
- **Use a Tailwind class lookup map** (not inline styles) for dynamic section colors. This keeps JIT happy:
  ```ts
  export const sectionClassMap: Record<SectionColor, { text: string; bg: string; border: string }> = {
    teal:  { text: 'text-[var(--color-teal-700)]',  bg: 'bg-[var(--color-teal-50)]',  border: 'border-[var(--color-teal-700)]' },
    coral: { text: 'text-[var(--color-coral-500)]', bg: 'bg-[var(--color-coral-50)]', border: 'border-[var(--color-coral-500)]' },
    // ...
  }
  ```
- Update navigation: active tab icon tint per section (via class map, not inline style)
- Update cards: add left-border accent variant
- Update empty states: section-colored icon

---

## Part 3: Form System Rewrite

**Goal:** Every form in the app uses the same components and patterns. No more drift.

### 3A. Auth pages (5 files)

**Files:**
1. `app/(auth)/login/page.tsx`
2. `app/(auth)/signup/page.tsx`
3. `app/(auth)/reset-password/page.tsx`
4. `app/(auth)/update-password/page.tsx`
5. `app/(auth)/welcome/page.tsx`

**Changes per file:**
- Replace all raw `<input>` with `<Input>` (gains: label, hint, error, a11y, focus-visible, dark mode)
- Replace all raw `<button>` with `<Button>` (gains: loading spinner, press animation, dark mode, consistent styling)
- Add password visibility toggle (eye icon via Input's `suffix` prop)
- Replace hardcoded error alert classes with token-based: `bg-[var(--color-error)]/10 text-[var(--color-error)]`
- Add `PageTransition` wrapper
- Fix welcome page: dark mode brand name color, increase tagline size
- Fix invite-only page: use font-serif, add BackButton, fix email

**Note:** These are `'use client'` pages — skip `export const metadata` (not worth adding layout.tsx per auth route just for a title).

### 3B. Profile edit pages (13 files)

**Complete file list:**
1. `app/(protected)/app/profile/page.tsx` — main profile view
2. `app/(protected)/app/profile/photo/page.tsx` — profile photo edit
3. `app/(protected)/app/profile/photos/page.tsx` — photo management / reorder
4. `app/(protected)/app/profile/gallery/page.tsx` — gallery view
5. `app/(protected)/app/profile/settings/page.tsx` — profile settings
6. `app/(protected)/app/about/edit/page.tsx` — bio/about edit
7. `app/(protected)/app/hobbies/edit/page.tsx` — hobbies edit
8. `app/(protected)/app/skills/edit/page.tsx` — skills edit
9. `app/(protected)/app/social-links/edit/page.tsx` — social links edit
10. `app/(protected)/app/education/[id]/edit/page.tsx` — education entry edit
11. `app/(protected)/app/certification/[id]/edit/page.tsx` — certification edit
12. `app/(protected)/app/endorsement/[id]/edit/page.tsx` — endorsement edit
13. `app/(protected)/app/attachment/[id]/edit/page.tsx` — attachment edit

**Changes per file:**
- Replace ALL raw `<input>`, `<select>`, `<textarea>`, `<button>` with `<Input>`, `<Select>`, `<Textarea>`, `<Button>`
- Replace `alert()` → `useToast()` (affects: hobbies, skills, social-links, photos, gallery)
- Add success toast on save for pages that silently navigate (affects: education, hobbies, skills, social-links, about, certification, endorsement)
- Replace `Loading…` text with `<Skeleton>` blocks (affects: about, education, certification, endorsement, attachment)
- Fix cert edit delete: text link → `<Button variant="destructive" size="sm">`
- Fix attachment pages: remove `min-h-screen` custom wrapper, use standard layout, fix title/label sizing

### 3C. Standardize across all forms

| Property | Value |
|---|---|
| Page title | `text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]` (DM Sans — matches style guide 28px/700/-0.02em) |
| Section heading | `tracking-[-0.01em]` |
| Form label | `text-sm font-medium text-[var(--color-text-primary)]` |
| Input height | `h-12` (48px) |
| Gap | `gap-4` between form fields |
| Disabled opacity | Via `<Button>` component (built in) |
| BackButton placement | `<div className="flex items-center gap-3"><BackButton href="..." /><h1>...</h1></div>` |
| Bottom padding | `pb-24` on all pages |
| Required indicator | `*` in label text |

---

## Part 4: Public Profile Overhaul

**Goal:** The public profile is the product. It must look premium.

### 4A. Hero scroll behavior (parallax shrink → framed card)

**Architecture:** `PublicProfileContent.tsx` is a server component. Extract the hero into `components/public/HeroSection.tsx` with `'use client'`. Parent passes photo URLs and profile data as props.

**The interaction (mobile only, desktop stays at sticky 40%):**
- **60vh (initial load):** Full-bleed, edge-to-edge photo — immersive Bumble-style
- **As user scrolls (0–200px):** Photo container smoothly gains margins + rounded corners + border, transitioning from full-bleed to a framed portrait card
- **34vh (scrolled):** Photo sits in a `rounded-2xl` card with `mx-4` margins and `border border-[var(--color-border-subtle)]`

**Animated properties (all via `useTransform` mapped to scrollY 0→200):**
- `height`: 60vh → 34vh
- `marginInline`: 0px → 16px
- `borderRadius`: 0px → 16px
- `border`: transparent → `var(--color-border-subtle)`

**User preference toggle:**
- "Immersive profile photo" toggle in profile settings page
- Stored in `section_visibility` JSONB (key: `immersive_hero`, default: `true`)
- **Schema note:** `section_visibility` JSONB column already exists on the `users` table (added in migration `20260317000021`). It accepts arbitrary keys — no migration needed. The API endpoint at `app/api/profile/section-visibility/route.ts` already handles PATCH updates to this field.
- When off: photo starts and stays at 34vh framed card — no scroll animation
- Pass preference as prop to `HeroSection`

### 4B. Section gaps + contrast
- Content gap: `gap-2` → `gap-4`
- Background: Add subtle card border `border border-[var(--color-border-subtle)]`
- Accordion cards: keep `shadow-sm` (adding border provides enough contrast)

### 4C. Accordion quality
- Chevron: replace `›` text character with Lucide `ChevronRight` icon (smooth rotation)
- Title: `text-base` → `text-lg` for stronger hierarchy (keep font-serif)
- Expanded content: `pt-1` → `pt-3` for breathing room above divider
- Add active/press state: `active:scale-[0.99] transition-transform`
- **Note:** Actual old_string for card wrapper is `"bg-[var(--color-surface)] rounded-2xl shadow-sm overflow-hidden"` (has `overflow-hidden`, no `p-4`)

### 4D. Endorsement cards
- Border radius: `rounded-lg` → `rounded-2xl` (match everything else — update cards pattern doc too)
- Text color: `text-secondary` → `text-primary` (testimonial words are the most important thing)
- Avatar: replace inline fallback with `<ProfileAvatar>` component (from Part 1B)
- Left border: add `border-l-4 border-[var(--color-coral-500)]` (section color)
- Quote marks: style as decorative element (large quote above, or left-border accent)

### 4E. Photo gallery
- Add crossfade transition between photos (Framer Motion AnimatePresence)
- Dot indicators: `w-1.5 h-1.5` → `w-2.5 h-2.5` (easier to tap)
- Desktop arrows: `w-8 h-8` → `w-10 h-10`, change to `bg-white/80 shadow-md` (Airbnb style)
- Empty state: replace emoji with proper illustration placeholder

### 4F. Social link icons
- Replace all emoji icons with proper SVGs (Lucide where available, custom for platforms)
- **Type change:** `SocialLinksRow` icon type changes from `string` to `React.ReactNode` — update the `PLATFORM_CONFIG` interface accordingly
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

### 4I. Photo reorder fix
- `app/(protected)/app/profile/photos/page.tsx` — photo reorder is currently broken
- Verify `sort_order` field on `user_photos` table and that the API supports PATCH updates
- Ensure drag-and-drop works on mobile (touch events) or wire up/down buttons to PATCH endpoint
- Test: reorder photos, reload, confirm order persists

---

## Part 5: Main App Pages

### 5A. CV page rewrite
- Add page title ("Your CV & Share Links")
- Change card container `rounded-lg` → `rounded-2xl` (**only card wrappers**, not inner button radii)
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

### 5D. Loading states
- **Already exist:** `loading.tsx` files for network, insights, cv, more, profile, network/saved
- **Fix:** Replace any hand-rolled `animate-pulse` divs in these files with `<Skeleton>` component
- **No new `loading.tsx` files needed** — they were created in a prior sprint

### 5E. Delete account page
- Match standard layout (remove custom `max-w-sm`)
- Use `<Button variant="destructive">` instead of hand-rolled red button
- **Note:** No `window.confirm` exists here. The existing confirmation pattern (type "DELETE MY ACCOUNT") is good — keep it. Just swap the styled button.
- **Correct button text:** "Delete Account" (not "Delete my account")

### 5F. Bento grid layouts
- **Profile page:** Photo card large (2-col span), stat cards side-by-side
- **Insights page:** One big chart card + 2–3 small stat cards
- Implementation: CSS Grid with `grid-cols-2` and `col-span-2` for featured cards
- Desktop: `max-w-2xl mx-auto` for centered content width

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
- Pro badge: use `<Badge colorScheme="sand">`
- Insights "Pro" pill: sand-tinted
- Welcome page: subtle sand gradient accent (not overwhelming)

### 6D. Badge/pill colors by section
Use `<Badge>` component with `colorScheme` prop throughout:
- Cert status "Valid": keep green (`<Badge colorScheme="success">`)
- Cert status "Expiring": `<Badge colorScheme="amber">`
- Endorsement count: `<Badge colorScheme="coral">`
- Colleague count: `<Badge colorScheme="navy">`

### 6E. Dark mode section colors
- Use 200-level shades per style guide: coral-200, navy-200, amber-200
- **Contrast validation:** Run all dark-mode section color hex values through WCAG AA contrast checker against dark surface `#0f172a` BEFORE implementation. Minimum 4.5:1 for body text, 3:1 for large text and UI components.
- Card accent borders: use 500-level (brighter) in dark mode

---

## Part 7: Animation & Interaction Polish

### 7A. Page transitions
- Every page gets `<PageTransition>` wrapper (currently only 4 pages have it)
- Auth pages get entrance animation
- Edit pages get entrance animation
- **`prefers-reduced-motion` support:** Wrap all new animations in `@media (prefers-reduced-motion: no-preference)` or use Framer Motion's `useReducedMotion()` hook. When reduced motion is preferred, skip entrance animations and crossfades — show content immediately.

### 7B. Skeleton → content crossfade
- For pages using `loading.tsx`: Next.js Suspense handles the transition automatically — no extra code needed
- For client-side loading states (edit pages): wrap in `AnimatePresence mode="wait"` with opacity fade

### 7C. Button press feedback
- Verify all `<Button>` instances have `active:scale-[0.97]` (built into component)
- Add subtle press feedback to accordion headers: `active:scale-[0.99] transition-transform`

### 7D. ShowMoreButton animation
- Add `AnimatePresence` + height animation when content reveals
- Currently just pops in with no transition

### 7E. Photo gallery transitions
- Crossfade between photos using `AnimatePresence` (already specified in Part 4E)

---

## Part 8: Documentation Updates

- Update cards pattern doc: `rounded-lg` → `rounded-2xl` to match style guide
- Update style guide hero height: 65vh → 60vh (post-implementation)
- Verify all doc references match implemented values

---

## Build Order

```
Part 0: Pre-Work Bug Fixes (~1 hour)
  Theme key, legal links, CookieBanner z-index, var(--teal-N) audit

Part 1: Component Foundation (Wave 0 — blocks everything, ~1 day)
  1A Token unification (Input, Toast)
  1B Missing components (Textarea, Select, FormField, IconButton, Badge, ProfileAvatar)
  1C Button variants (outline, link, icon) + verify existing call sites
  1D EmptyState fix + accentColor prop
  1E Nav config extraction (route/label data only)
  1F Dark mode token gaps (including teal)
  1G Accessibility audit on new components

Part 2: Section Color System (~0.5 day, can parallel with Part 3)
  2A Color assignments + lib/section-colors.ts + sectionClassMap
  2B Implementation across nav, cards, empty states

Part 3: Form System Rewrite (~2 days, can parallel with Part 2)
  3A Auth pages (5 files — enumerated above)
  3B Profile edit pages (13 files — enumerated above)
  3C Standardization pass (28px/700 titles, tracking, gaps)

Part 4: Public Profile Overhaul (~1.5 days)
  4A Hero parallax shrink → framed card (extract HeroSection.tsx client component)
  4B–4H Visual fixes
  4I Photo reorder fix

Part 5: Main App Pages (~1.5 days)
  5A–5E Page-specific fixes
  5F Bento grid layouts (profile, insights)

Part 6: Color & Warmth Application Pass (~1 day)
  6A–6E Apply section colors everywhere (using Badge component + section class map)

Part 7: Animation & Interaction Polish (~0.5 day)
  7A–7E Animations with prefers-reduced-motion support

Part 8: Documentation Updates (~0.5 hour)
```

**Estimated effort: ~8–9 days with parallel agents**

---

## Exit Criteria

### Automated checks (run these commands)
```bash
# Zero raw HTML form elements in page files (excludes component definitions)
grep -rn '<button\b' app/ --include='*.tsx' | grep -v 'components/' | grep -v 'node_modules'
grep -rn '<input\b' app/ --include='*.tsx' | grep -v 'components/' | grep -v 'node_modules'
grep -rn '<select\b' app/ --include='*.tsx' | grep -v 'components/' | grep -v 'node_modules'
grep -rn '<textarea\b' app/ --include='*.tsx' | grep -v 'components/' | grep -v 'node_modules'
# Expected: zero results for all four

# Zero alert() calls
grep -rn 'alert(' app/ --include='*.tsx' | grep -v 'node_modules' | grep -v '// '
# Expected: zero results

# Zero hardcoded red classes in non-component files
grep -rn 'bg-red-\|border-red-\|text-red-' app/ --include='*.tsx' | grep -v 'components/ui/' | grep -v 'node_modules'
# Expected: zero results (all error styling via tokens)

# Confirm section color adoption
grep -rn 'color-coral-\|color-navy-\|color-amber-\|color-sand-' components/ app/ --include='*.tsx' -l | wc -l
# Expected: >= 15 files

# Zero bare --teal-N references (should all be --color-teal-N)
grep -rn 'var(--teal-' app/ components/ --include='*.tsx' --include='*.css'
# Expected: zero results

# Build passes
npm run build
# Expected: zero errors

# TypeScript passes
npx tsc --noEmit
# Expected: zero errors
```

### Manual checks
- Visual check passes at 375px and 1280px, both themes
- Dark mode correct on every modified page (use browser DevTools → Rendering → Emulate `prefers-color-scheme: dark`)
- Every save flow shows a success toast
- Every async page shows `<Skeleton>` loading
- All cards use `rounded-2xl`
- All inputs use `rounded-xl`
- Section color tints visible on Network, Insights, CV pages
- Public profile hero scroll behavior working (60vh → 34vh framed card)
- Photo gallery has crossfade transitions
- Photo reorder works and persists
- Social links use SVG icons
- `prefers-reduced-motion` disables animations gracefully

### Dark mode contrast validation
Before marking Part 6E complete, verify these hex values against `#0f172a` background:
| Token | Dark value | Min ratio | Use |
|-------|-----------|-----------|-----|
| `--color-coral-200` | `#F9A99C` | 4.5:1 | Badge text |
| `--color-coral-500` | `#F9A99C` | 3:1 | Border accent |
| `--color-navy-200` | `#A8BAD3` | 4.5:1 | Badge text |
| `--color-navy-500` | `#A8BAD3` | 3:1 | Border accent |
| `--color-amber-200` | `#FBD97D` | 4.5:1 | Badge text |
| `--color-amber-500` | `#FBD97D` | 3:1 | Border accent |
| `--color-success` | `#34d399` | 4.5:1 | Status text |
| `--color-error` | `#f87171` | 4.5:1 | Error text |

Tool: https://webaim.org/resources/contrastchecker/ or `npx wcag-contrast`

---

## Risks

- Part 4A (hero parallax shrink) is the most complex single feature — isolate it in its own client component so it doesn't block other work
- Section colors in dark mode need contrast validation BEFORE implementation (see exit criteria table)
- Replacing raw inputs with components may change spacing — need visual diff per page
- Attachment pages are structurally different — may need partial rewrite rather than component swap
- Photo reorder (Part 4I) may need investigation — treat as a spike with 2-hour timebox, escalate if the API doesn't support sort_order updates
