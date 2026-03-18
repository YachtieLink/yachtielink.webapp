# Spec 06 — Responsive Layout (Desktop Support)

**Goal:** Add content width constraints and responsive breakpoints so the app doesn't look broken on desktop screens. Zero responsive breakpoints currently exist in application code.

---

## Files to modify

- `app/(protected)/app/layout.tsx` — add max-width to main content
- `components/nav/BottomTabBar.tsx` — hide on desktop, add sidebar variant
- `app/(public)/u/[handle]/page.tsx` — widen public profile, add two-column at lg:
- `components/public/PublicProfileContent.tsx` — responsive grid for endorsements
- `app/globals.css` — add sidebar CSS custom property

## Files to create

- `components/nav/SidebarNav.tsx` — desktop sidebar navigation

---

## Step 1: Add Content Width Constraint to App Layout

**File:** `app/(protected)/app/layout.tsx`

**Current (line 33):**
```tsx
<main className="flex-1 pb-tab-bar">{children}</main>
```

**Change to:**
```tsx
<main className="flex-1 pb-tab-bar md:pb-0 md:pl-16">
  <div className="mx-auto max-w-2xl">
    {children}
  </div>
</main>
```

The `md:pb-0` removes bottom tab bar padding on desktop (where sidebar is used instead). `md:pl-16` accounts for the 64px sidebar. `max-w-2xl` (672px) constrains content width.

---

## Step 2: Create Desktop Sidebar Navigation

**Create `components/nav/SidebarNav.tsx`:**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Profile',  href: '/app/profile',  icon: ProfileIcon, activeIcon: ProfileIconFilled },
  { label: 'CV',       href: '/app/cv',       icon: CvIcon,      activeIcon: CvIconFilled },
  { label: 'Insights', href: '/app/insights', icon: InsightsIcon, activeIcon: InsightsIconFilled },
  { label: 'Network',  href: '/app/network',  icon: NetworkIcon,  activeIcon: NetworkIconFilled },
  { label: 'More',     href: '/app/more',     icon: MoreIcon,     activeIcon: MoreIconFilled },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center gap-1 pt-6 pb-4 border-r border-[var(--color-border)] bg-[var(--color-surface)] z-40"
    >
      {/* Logo mark */}
      <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-interactive)] text-white text-xs font-bold">
        YL
      </div>

      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        const Icon = isActive ? tab.activeIcon : tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            title={tab.label}
            className={`
              flex h-10 w-10 items-center justify-center rounded-xl transition-colors
              ${isActive
                ? 'text-[var(--color-interactive)] bg-[var(--color-interactive)]/10'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
              }
            `}
          >
            <span className="h-5 w-5">
              <Icon />
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// Copy the icon functions from BottomTabBar.tsx (ProfileIcon, ProfileIconFilled, etc.)
// OR extract them into a shared icons file.
// For now, import them from BottomTabBar if they are exported,
// or duplicate them here.
```

**Important:** The icon SVG functions currently live inside `BottomTabBar.tsx` as private functions. Either:
1. Export them from `BottomTabBar.tsx` and import in both files, OR
2. Extract to a shared `components/nav/icons.tsx` file, OR
3. Duplicate them in `SidebarNav.tsx`

Option 2 is cleanest. Create `components/nav/icons.tsx` with all the icon functions exported, then import in both `BottomTabBar.tsx` and `SidebarNav.tsx`.

---

## Step 3: Hide Bottom Tab Bar on Desktop

**File:** `components/nav/BottomTabBar.tsx` line 52

**Current:**
```tsx
className="fixed bottom-0 left-0 right-0 z-50 bottom-tab-bar border-t border-[var(--color-border)] bg-[var(--color-surface)]"
```

**Change to:**
```tsx
className="fixed bottom-0 left-0 right-0 z-50 bottom-tab-bar border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden"
```

---

## Step 4: Add SidebarNav to App Layout

**File:** `app/(protected)/app/layout.tsx`

Add the import and render the sidebar:

```tsx
import { SidebarNav } from "@/components/nav/SidebarNav";

// In the return:
return (
  <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)]">
    <SidebarNav />
    <main className="flex-1 pb-tab-bar md:pb-0 md:pl-16">
      <div className="mx-auto max-w-2xl">
        {children}
      </div>
    </main>
    <BottomTabBar />
  </div>
);
```

---

## Step 5: Widen Public Profile for Desktop

**File:** `app/(public)/u/[handle]/page.tsx` line 214

**Current:**
```tsx
<div className="mx-auto max-w-[640px] px-4 py-8">
```

**Change to:**
```tsx
<div className="mx-auto max-w-[640px] lg:max-w-4xl px-4 py-8">
```

This widens the public profile container to 896px on large screens.

---

## Step 6: Add Two-Column Layout to Public Profile on Desktop

**File:** `components/public/PublicProfileContent.tsx`

Wrap the content sections in a responsive grid. The hero section stays full-width. Below it, on `lg:` screens, use a two-column layout.

**Current structure (simplified):**
```tsx
<div className="flex flex-col gap-6">
  {/* Hero */}
  {/* About */}
  {/* Contact */}
  {/* Employment History */}
  {/* Certifications */}
  {/* Endorsements */}
  {/* QR Code */}
</div>
```

**Change to:**
```tsx
<div className="flex flex-col gap-6">
  {/* Hero — full width */}
  <div className="flex flex-col items-center text-center">
    {/* ... existing hero code ... */}
  </div>

  {/* Content grid — single column mobile, two columns desktop */}
  <div className="flex flex-col lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8 gap-6">
    {/* Left column: About + Contact + Certs */}
    <div className="flex flex-col gap-6">
      {/* About section */}
      {/* Contact section */}
      {/* Certifications section */}
    </div>

    {/* Right column: Employment + Endorsements */}
    <div className="flex flex-col gap-6">
      {/* Employment History section */}
      {/* Endorsements section */}
    </div>
  </div>

  {/* QR Code — full width */}
</div>
```

This keeps mobile layout unchanged (single column) and adds a two-column layout at `lg:` breakpoint.

---

## Verification

1. `npm run build` — no type errors
2. Open app at 375px width (mobile) — should look identical to before
3. Open app at 1440px width (desktop) — should show:
   - Left sidebar with 5 navigation icons
   - Content centered in a ~672px column
   - No bottom tab bar
4. Open public profile at 1440px — should show wider layout with two columns
5. Resize browser from mobile to desktop — layout should transition smoothly
