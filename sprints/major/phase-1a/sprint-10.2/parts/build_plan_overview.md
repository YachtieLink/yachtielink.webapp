# Sprint 10.2: UXUI & Frontend Rewrite — Detailed Build Plan

## Context

The design system docs describe a warm, colorful, Notion-inspired experience with coral/navy/amber section colors, sand warmth, photo-forward profiles, and consistent component usage. The implementation ignores all of it — 53 raw buttons, 34 raw inputs, zero uses of the section color palette, emoji icons, `alert()` for errors, and four competing button patterns.

This build plan brings the implementation to match the spec.

**Current component state (what exists and works):**
- `Button.tsx`: 96 lines, forwardRef, variants (primary/secondary/ghost/destructive), sizes (sm/md/lg), loading spinner, press animation — uses shadcn tokens (`bg-primary`)
- `Input.tsx`: 83 lines, forwardRef, label/hint/error/suffix — uses legacy tokens but error state uses hardcoded `border-red-500`
- `Card.tsx`: 74 lines, interactive mode, sub-components (CardHeader/CardTitle/CardBody)
- `Toast.tsx`: 125 lines, context provider, success/error/info — success uses hardcoded `bg-emerald-600`
- `EmptyState.tsx`: 57 lines, card/inline variants — card uses `bg-[var(--color-surface)]` (wrong, should be `--color-surface-raised`)
- `BackButton.tsx`: 25 lines, pill with chevron SVG

**Current token state:**
- globals.css has coral, navy, amber, sand scales fully defined (lines 33–58)
- Zero files outside globals.css reference these tokens
- Two parallel token systems: legacy `var(--color-*)` and shadcn (`bg-primary`, `text-foreground`)
- Dark mode `.dark` block exists (lines 173–227) but missing overrides for `--color-success`, `--color-warning`, `--color-error`

---

## Part 1: Component Foundation

### 1A. Fix Button.tsx token system

The Button currently uses shadcn tokens (`bg-primary`, `text-primary-foreground`). These work because globals.css bridges them, but they're inconsistent with the rest of the app which uses `var(--color-*)`. **Keep the Button using shadcn tokens** — they already bridge correctly, and changing them risks breaking the 8 existing imports. The real fix is making everything else USE the Button.

**No code changes to Button.tsx token system.** The Button works correctly in both themes already via the bridge mapping.

**Add missing variants:**

```tsx
// Add to variantClasses (after line 21):
  outline:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]",
  link:
    "bg-transparent text-[var(--color-interactive)] hover:underline p-0 h-auto font-medium",
```

Update the `Variant` type (line 4):
```tsx
type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
```

### 1B. Fix Input.tsx error tokens

Replace hardcoded red with design system tokens.

**Line 40 — error border:**
```tsx
// Before:
"border-red-500 focus:border-red-500 focus:ring-red-500/20"
// After:
"border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
```

**Line 63 — error text:**
```tsx
// Before:
className="text-xs text-red-600 dark:text-red-400"
// After:
className="text-xs text-[var(--color-error)]"
```

### 1C. Fix Toast.tsx color tokens

**Line 84 — success color:**
```tsx
// Before:
success: "bg-emerald-600 text-white",
// After:
success: "bg-[var(--color-success)] text-white",
```

**Line 85 — error color:**
```tsx
// Before:
error: "bg-red-600 text-white",
// After:
error: "bg-[var(--color-error)] text-white",
```

### 1D. Fix EmptyState.tsx card variant

**Line 52 — card background:**
```tsx
// Before:
<div className="bg-[var(--color-surface)] rounded-2xl p-6 text-center">
// After:
<div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-6 text-center">
```

### 1E. Create Textarea.tsx

**File:** `components/ui/Textarea.tsx`

```tsx
import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className = "", ...props }, ref) => {
    const reactId = useId();
    const textareaId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full min-h-[120px] rounded-xl border px-4 py-3 text-sm
            bg-[var(--color-surface)]
            text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-tertiary)]
            focus:outline-none focus:ring-2
            transition-colors resize-y
            ${
              error
                ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
                : "border-[var(--color-border)] focus:border-[var(--color-interactive)] focus:ring-[var(--color-interactive)]/20"
            }
            ${className}
          `}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          aria-invalid={error ? true : undefined}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} role="alert" className="text-xs text-[var(--color-error)]">
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={`${textareaId}-hint`} className="text-xs text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
```

### 1F. Create Select.tsx

**File:** `components/ui/Select.tsx`

```tsx
import { type SelectHTMLAttributes, forwardRef, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, id, className = "", children, ...props }, ref) => {
    const reactId = useId();
    const selectId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={`
            h-12 w-full rounded-xl border px-4 text-sm appearance-none
            bg-[var(--color-surface)]
            text-[var(--color-text-primary)]
            focus:outline-none focus:ring-2
            transition-colors
            ${
              error
                ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
                : "border-[var(--color-border)] focus:border-[var(--color-interactive)] focus:ring-[var(--color-interactive)]/20"
            }
            ${className}
          `}
          aria-describedby={
            error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
          }
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>

        {error && (
          <p id={`${selectId}-error`} role="alert" className="text-xs text-[var(--color-error)]">
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={`${selectId}-hint`} className="text-xs text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
```

### 1G. Extract nav config

**File:** `lib/nav-config.ts`

```ts
import {
  User, FileText, BarChart3, Users, MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavTab {
  label: string
  href: string
  icon: LucideIcon
  /** Used to match active route */
  matchPrefix: string
}

export const tabs: NavTab[] = [
  { label: 'My Profile', href: '/app/profile', icon: User, matchPrefix: '/app/profile' },
  { label: 'CV',         href: '/app/cv',      icon: FileText, matchPrefix: '/app/cv' },
  { label: 'Insights',   href: '/app/insights', icon: BarChart3, matchPrefix: '/app/insights' },
  { label: 'Network',    href: '/app/network',  icon: Users, matchPrefix: '/app/network' },
  { label: 'More',       href: '/app/more',     icon: MoreHorizontal, matchPrefix: '/app/more' },
]
```

Then refactor both `BottomTabBar.tsx` and `SidebarNav.tsx` to import from this file instead of defining their own arrays. Keep the layout-specific rendering (horizontal vs vertical) in each component.

### 1H. Dark mode token gaps

**Add to globals.css `.dark` block (after line 226):**

```css
/* Status colors — dark mode */
--color-success: #34d399;
--color-warning: #fbbf24;
--color-error:   #f87171;

/* Section colors — dark mode (200-level for softer appearance) */
--color-coral-50:  #2a1512;
--color-coral-100: #3d1f1a;
--color-coral-200: #F9A99C;
--color-coral-500: #F9A99C;

--color-navy-50:  #131b2e;
--color-navy-100: #1c2a45;
--color-navy-200: #A8BAD3;
--color-navy-500: #A8BAD3;

--color-amber-50:  #1f1a0e;
--color-amber-100: #2d2515;
--color-amber-200: #FBD97D;
--color-amber-500: #FBD97D;

--color-sand-100: #1e1c17;
--color-sand-200: #2d2a21;
--color-sand-300: #D4C4A8;
--color-sand-400: #D4C4A8;
```

### 1I. Update barrel exports

**Update `components/ui/index.ts`** to export the new components:

```ts
export { Textarea } from './Textarea'
export { Select } from './Select'
```

---

## Part 2: Section Color System

### 2A. Create section-colors.ts

**File:** `lib/section-colors.ts`

```ts
/**
 * Section color assignments per style guide.
 * Each feature area gets one accent color.
 * Never combine all three in one component.
 */

export type SectionColor = 'teal' | 'coral' | 'navy' | 'amber' | 'sand'

export interface SectionColorTokens {
  bg50: string      // Subtle page tint
  bg100: string     // Light card background
  bg200: string     // Badge background
  accent500: string // Icon color, accents
  text700: string   // Dark text on colored bg
  borderAccent: string // Left-border accent on cards
}

const colorMap: Record<SectionColor, SectionColorTokens> = {
  teal: {
    bg50: 'var(--color-teal-50)',
    bg100: 'var(--color-teal-100)',
    bg200: 'var(--color-teal-200)',
    accent500: 'var(--color-teal-700)',
    text700: 'var(--color-teal-900)',
    borderAccent: 'var(--color-teal-700)',
  },
  coral: {
    bg50: 'var(--color-coral-50)',
    bg100: 'var(--color-coral-100)',
    bg200: 'var(--color-coral-200)',
    accent500: 'var(--color-coral-500)',
    text700: 'var(--color-coral-700)',
    borderAccent: 'var(--color-coral-500)',
  },
  navy: {
    bg50: 'var(--color-navy-50)',
    bg100: 'var(--color-navy-100)',
    bg200: 'var(--color-navy-200)',
    accent500: 'var(--color-navy-500)',
    text700: 'var(--color-navy-700)',
    borderAccent: 'var(--color-navy-500)',
  },
  amber: {
    bg50: 'var(--color-amber-50)',
    bg100: 'var(--color-amber-100)',
    bg200: 'var(--color-amber-200)',
    accent500: 'var(--color-amber-500)',
    text700: 'var(--color-amber-700)',
    borderAccent: 'var(--color-amber-500)',
  },
  sand: {
    bg50: 'var(--color-sand-100)',
    bg100: 'var(--color-sand-200)',
    bg200: 'var(--color-sand-300)',
    accent500: 'var(--color-sand-400)',
    text700: 'var(--color-sand-400)',
    borderAccent: 'var(--color-sand-300)',
  },
}

/** Feature → section color mapping */
export const sectionColors: Record<string, SectionColor> = {
  profile:        'teal',
  network:        'navy',
  colleagues:     'navy',
  endorsements:   'coral',
  cv:             'amber',
  certifications: 'amber',
  insights:       'navy',
  pro:            'sand',
  education:      'teal',
  gallery:        'teal',
}

export function getSectionTokens(section: string): SectionColorTokens {
  const color = sectionColors[section] ?? 'teal'
  return colorMap[color]
}
```

### 2B. Apply section colors to navigation

In both `BottomTabBar.tsx` and `SidebarNav.tsx`, the active tab currently uses teal for everything. Update so the active icon tint uses the section's accent color:

```tsx
// In the active tab rendering:
import { getSectionTokens } from '@/lib/section-colors'

// For each tab, get the section color:
const tokens = getSectionTokens(tab.matchPrefix.split('/').pop() ?? '')
// Active state uses: style={{ color: tokens.accent500 }}
```

**Note:** This requires converting the static Tailwind classes to inline styles for the color, since CSS vars can't be dynamically selected via Tailwind classes. Alternative: use a small lookup of Tailwind classes per section.

### 2C. Apply section colors to cards

Endorsement cards get coral left border:
```tsx
className="... border-l-4 border-[var(--color-coral-500)]"
```

Certification cards:
```tsx
className="... border-l-4 border-[var(--color-amber-500)]"
```

Yacht/experience cards:
```tsx
className="... border-l-4 border-[var(--color-navy-500)]"
```

### 2D. Apply section color page tints

Network page background:
```tsx
className="... bg-[var(--color-navy-50)]"
```

Insights page:
```tsx
className="... bg-[var(--color-navy-50)]"
```

CV page:
```tsx
className="... bg-[var(--color-amber-50)]"
```

---

## Part 3: Form System Rewrite

### 3A. Auth pages — pattern

For each auth page (login, signup, reset-password, update-password), the transformation is:

**Raw input → Input component:**
```tsx
// Before:
<div className="flex flex-col gap-1.5">
  <label htmlFor="email" className="text-sm font-medium text-[var(--color-text-primary)]">Email</label>
  <input id="email" type="email" ... className="h-12 rounded-xl border ..." />
</div>

// After:
<Input
  label="Email"
  type="email"
  autoComplete="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="you@example.com"
/>
```

**Raw button → Button component:**
```tsx
// Before:
<button type="submit" disabled={loading}
  className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-teal-700)] ...">
  {loading ? "Signing in…" : "Sign in"}
</button>

// After:
<Button type="submit" loading={loading} className="w-full">
  Sign in
</Button>
```

**Error alert → token-based:**
```tsx
// Before:
<p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">

// After:
<p className="rounded-xl bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
```

**Add to each auth page:**
- `import { Input } from '@/components/ui/Input'`
- `import { Button } from '@/components/ui/Button'`
- `export const metadata = { title: 'Sign In — YachtieLink' }` (at top, server-side — but these are `'use client'` pages so metadata won't work. Instead add `<title>` via next/head or keep as is. **Decision: Skip metadata on client pages — not worth adding a layout.tsx for each auth route just for a title.**)
- `PageTransition` wrapper (import and wrap content div)

**Password visibility toggle:**
```tsx
const [showPassword, setShowPassword] = useState(false)

<Input
  label="Password"
  type={showPassword ? "text" : "password"}
  suffix={
    <button type="button" onClick={() => setShowPassword(!showPassword)}
      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  }
  ...
/>
```

### 3B. Profile edit pages — pattern

**Replace `alert()` with toast:**
```tsx
// Before (hobbies, skills, social-links, photos, gallery):
} catch {
  alert('Something went wrong')
}

// After:
import { useToast } from '@/components/ui/Toast'
const { toast } = useToast()
// ...
} catch {
  toast('Something went wrong', 'error')
}
```

**Add success toast:**
```tsx
// Before (education, hobbies, skills, social-links):
router.push('/app/profile')

// After:
toast('Saved successfully', 'success')
router.push('/app/profile')
```

**Replace "Loading..." with Skeleton:**
```tsx
// Before:
if (loading) return <p className="p-4 text-[var(--color-text-secondary)]">Loading...</p>

// After:
import { Skeleton } from '@/components/ui/skeleton'
if (loading) return (
  <div className="flex flex-col gap-4 pb-24">
    <Skeleton className="h-6 w-40" />
    <Skeleton className="h-12 w-full rounded-xl" />
    <Skeleton className="h-12 w-full rounded-xl" />
    <Skeleton className="h-12 w-full rounded-xl" />
  </div>
)
```

**Replace raw inputs with Input component:**
Same pattern as auth pages — swap raw `<input>` + `<label>` for `<Input label="..." />`.

**Replace raw selects with Select component:**
```tsx
// Before:
<select className="... rounded-lg ...">

// After:
<Select label="Country" value={...} onChange={...}>
  <option>...</option>
</Select>
```

**Replace raw textarea with Textarea component:**
```tsx
// Before (about/edit):
<textarea className="... rounded-xl ..." />

// After:
<Textarea label="Bio" value={bio} onChange={...} hint="Tell people about yourself" />
```

**Fix cert edit delete action:**
```tsx
// Before:
<button className="text-sm text-red-500 hover:underline text-center">Delete</button>

// After:
<Button variant="destructive" size="sm" onClick={handleDelete}>Delete certification</Button>
```

### 3C. Standardization rules

Apply these consistently to ALL form pages:

| Property | Value |
|---|---|
| Page title | `<h1 className="text-xl font-semibold text-[var(--color-text-primary)]">` |
| Root gap | `gap-4` |
| Bottom padding | `pb-24` |
| BackButton placement | `<div className="flex items-center gap-3"><BackButton href="..." /><h1>...</h1></div>` |
| Disabled opacity | Via `<Button>` component (built in) |
| Required indicator | `*` in label text |

---

## Part 4: Public Profile Overhaul

### 4A. Hero parallax shrink

**File to modify:** `components/public/PublicProfileContent.tsx`

Add to the mobile hero section:

```tsx
'use client'
import { useScroll, useTransform, motion } from 'framer-motion'
import { useRef } from 'react'

// Inside the component:
const heroRef = useRef<HTMLDivElement>(null)
const { scrollY } = useScroll()

// Map scroll 0-200px to height 60vh-34vh
const heroHeight = useTransform(scrollY, [0, 200], ['60vh', '34vh'])

// Mobile hero:
<motion.div
  ref={heroRef}
  style={{ height: heroHeight }}
  className="relative w-full overflow-hidden md:hidden"
>
  {/* Photo content */}
</motion.div>
```

**Desktop stays the same** — sticky left panel at 40% doesn't need height animation.

### 4B. Section gaps + contrast

```tsx
// Before (line ~244):
className="... gap-2 ..."
// After:
className="... gap-4 ..."
```

Card contrast — add subtle border:
```tsx
// ProfileAccordion.tsx card wrapper:
// Before:
className="bg-[var(--color-surface)] rounded-2xl p-4 shadow-sm"
// After:
className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-4 shadow-sm"
```

### 4C. Accordion quality

**Replace `›` with Lucide ChevronRight:**
```tsx
import { ChevronRight } from 'lucide-react'

// Before:
<span className="... transition-transform ...">›</span>

// After:
<ChevronRight size={18} className="text-[var(--color-text-secondary)] transition-transform shrink-0" />
```

**Title size:**
```tsx
// Before:
className="font-serif text-base ..."
// After:
className="font-serif text-lg ..."
```

**Expanded content padding:**
```tsx
// Before:
className="... pt-1 ..."
// After:
className="... pt-3 ..."
```

### 4D. Endorsement cards

**File:** `components/public/EndorsementCard.tsx`

```tsx
// Border radius:
// Before: rounded-lg
// After: rounded-2xl

// Add coral left border:
className="... border-l-4 border-[var(--color-coral-500)] ..."

// Text color:
// Before: text-[var(--color-text-secondary)]
// After: text-[var(--color-text-primary)]

// Avatar size:
// Before: h-8 w-8
// After: h-10 w-10

// Fallback avatar with hash-based color:
function avatarColor(name: string): string {
  const colors = ['bg-[var(--color-coral-200)]', 'bg-[var(--color-navy-200)]', 'bg-[var(--color-amber-200)]', 'bg-[var(--color-teal-200)]']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
```

### 4E. Photo gallery transitions

**File:** `components/profile/PhotoGallery.tsx`

Add AnimatePresence crossfade:
```tsx
import { AnimatePresence, motion } from 'framer-motion'

// Wrap the current image:
<AnimatePresence mode="wait">
  <motion.div
    key={currentIndex}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Image ... />
  </motion.div>
</AnimatePresence>
```

Dot size:
```tsx
// Before: w-1.5 h-1.5
// After: w-2.5 h-2.5
```

Desktop arrows:
```tsx
// Before: w-8 h-8 bg-black/40
// After: w-10 h-10 bg-white/80 shadow-md text-[var(--color-text-primary)]
```

### 4F. Social link SVG icons

**File:** `components/profile/SocialLinksRow.tsx`

Replace emoji/text icons with Lucide imports:
```tsx
import { Instagram, Linkedin, Youtube, Facebook, Globe } from 'lucide-react'

const platformConfig = {
  instagram: { icon: Instagram, hoverColor: 'hover:text-[#E4405F]' },
  linkedin:  { icon: Linkedin,  hoverColor: 'hover:text-[#0A66C2]' },
  youtube:   { icon: Youtube,   hoverColor: 'hover:text-[#FF0000]' },
  facebook:  { icon: Facebook,  hoverColor: 'hover:text-[#1877F2]' },
  website:   { icon: Globe,     hoverColor: 'hover:text-[var(--color-interactive)]' },
}

// For X/Twitter and TikTok (no Lucide icon), create small inline SVGs or use custom icon components
```

Replace location emoji:
```tsx
import { MapPin } from 'lucide-react'
// Before: 📍
// After: <MapPin size={14} className="shrink-0" />
```

### 4G. Hero name sizing

```tsx
// Before:
className="font-serif text-2xl ..."
// After:
className="font-serif text-3xl md:text-4xl ..."
```

### 4H. Sticky bottom CTA

For non-logged-in viewers, add a sticky CTA:
```tsx
{!isAuthenticated && (
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-surface)]/80 backdrop-blur-md border-t border-[var(--color-border-subtle)] z-40 md:hidden">
    <Link href="/welcome" className="block">
      <Button className="w-full">Build your crew profile</Button>
    </Link>
  </div>
)}
```

---

## Part 5: Main App Pages

### 5A. CV page card radius

In `components/cv/CvActions.tsx`:
```tsx
// All instances of rounded-lg → rounded-2xl
// All instances of border p-3 → border p-4
```

Add page title to `cv/page.tsx`:
```tsx
<h1 className="text-xl font-semibold text-[var(--color-text-primary)]">CV & Sharing</h1>
```

### 5B. Insights locked cards

```tsx
// Before:
<div className="opacity-70">
  <TeaserCard icon="🔒" ... />

// After:
<div className="relative">
  <div className="blur-[2px] pointer-events-none">
    <TeaserCard ... />
  </div>
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="bg-[var(--color-surface)]/90 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
      <Lock size={16} className="text-[var(--color-text-secondary)]" />
      <span className="text-sm font-medium text-[var(--color-text-primary)]">Pro</span>
    </div>
  </div>
</div>
```

### 5C. Missing loading.tsx files

Create `loading.tsx` for each main route that does server-side data fetching:

**Pattern:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pb-24">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  )
}
```

Create for: `network/loading.tsx`, `insights/loading.tsx`, `cv/loading.tsx`, `more/loading.tsx`

### 5D. Delete account page

```tsx
// Replace hand-rolled button:
// Before:
<button className="... bg-red-500 text-white rounded-xl py-3 ...">Delete my account</button>

// After:
<Button variant="destructive" className="w-full">Delete my account</Button>

// Replace window.confirm with shadcn Dialog (import and use)
```

---

## Part 6: Color & Warmth Pass

This part applies the section colors from Part 2 across the app. Specific changes per file are listed in the README. Key principle: **one accent color per section**, using 50-level for backgrounds, 500-level for icons/accents, 100-200 level for badges.

### Badge/pill color updates

```tsx
// Endorsement count badge (AudienceTabs, profile):
// Before: generic teal
// After: bg-[var(--color-coral-100)] text-[var(--color-coral-700)]

// Cert expiry "Expiring soon":
// Before: bg-amber-500/10 text-amber-600
// After: bg-[var(--color-amber-100)] text-[var(--color-amber-700)]

// Colleague count:
// Before: generic style
// After: bg-[var(--color-navy-100)] text-[var(--color-navy-700)]
```

---

## Part 7: Animation & Interaction Polish

### 7A. PageTransition everywhere

Every page that doesn't already have `PageTransition` or `motion.div fadeUp` needs it. This includes all auth pages and all edit pages.

### 7B. Skeleton → content crossfade

For pages with server-side data:
```tsx
// The loading.tsx provides the skeleton. Next.js Suspense handles the transition.
// No additional code needed if using loading.tsx files.
```

For client-side loading states (edit pages):
```tsx
// Wrap the content swap in AnimatePresence:
<AnimatePresence mode="wait">
  {loading ? (
    <motion.div key="skeleton" exit={{ opacity: 0 }}>
      <Skeleton ... />
    </motion.div>
  ) : (
    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* page content */}
    </motion.div>
  )}
</AnimatePresence>
```

### 7C. Press feedback on accordions

```tsx
// ProfileAccordion.tsx button:
// Add:
className="... active:scale-[0.99] transition-transform"
```

---

## File Change Summary

### New files (6):
- `components/ui/Textarea.tsx`
- `components/ui/Select.tsx`
- `lib/nav-config.ts`
- `lib/section-colors.ts`
- `app/(protected)/app/network/loading.tsx`
- `app/(protected)/app/insights/loading.tsx`
- `app/(protected)/app/cv/loading.tsx`

### Modified files (~50+):
- `components/ui/Button.tsx` — add outline + link variants
- `components/ui/Input.tsx` — fix error tokens
- `components/ui/Toast.tsx` — fix color tokens
- `components/ui/EmptyState.tsx` — fix card variant
- `components/ui/index.ts` — add exports
- `components/nav/BottomTabBar.tsx` — use nav-config
- `components/nav/SidebarNav.tsx` — use nav-config, fix opacity syntax
- `app/globals.css` — dark mode status + section color overrides
- `app/(auth)/login/page.tsx` — full rewrite to use components
- `app/(auth)/signup/page.tsx` — full rewrite
- `app/(auth)/reset-password/page.tsx` — full rewrite
- `app/(auth)/update-password/page.tsx` — full rewrite
- `app/(auth)/welcome/page.tsx` — use Button component, fix dark mode
- `app/(public)/invite-only/page.tsx` — fix brand, add BackButton
- All 12+ profile edit pages — component swap + toast + skeleton
- `components/public/PublicProfileContent.tsx` — hero parallax, gaps, name size, CTA
- `components/profile/ProfileAccordion.tsx` — chevron icon, title size, padding
- `components/public/EndorsementCard.tsx` — radius, colors, avatar, border
- `components/profile/PhotoGallery.tsx` — transitions, dots, arrows
- `components/profile/SocialLinksRow.tsx` — SVG icons
- `components/cv/CvActions.tsx` — card radius
- `app/(protected)/app/insights/page.tsx` — locked card pattern
- `app/(protected)/app/more/delete-account/page.tsx` — use Button + Dialog
- `components/audience/AudienceTabs.tsx` — section color badges
- `components/profile/CertsSection.tsx` — section color badges

### Deleted files: none

---

## Verification Plan

After each Part:
1. `npx tsc --noEmit` — zero errors
2. `npm run build` — successful build
3. Visual check at 375px (mobile) and 1280px (desktop)
4. Toggle dark mode — check every modified page
5. Check button press animation works
6. Check toast appears on save
7. Check skeleton loading states render

Final verification:
- Navigate every route in the app
- Toggle dark mode on every page
- Verify at 375px viewport
- Grep for `alert(` — should be zero results
- Grep for `bg-red-` — should only be in approved locations
- Grep for `rounded-lg` in page files — should only be in non-card contexts
