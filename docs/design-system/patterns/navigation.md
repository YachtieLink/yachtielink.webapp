# Pattern: Navigation

## Typography in Navigation — Quick Reference

When in doubt about which font/size to use:

| Element | Font | Class | Example |
|---------|------|-------|---------|
| In-app page title | DM Sans | `font-semibold text-lg` (18px) | "My Profile", "Edit Education" |
| Section heading | DM Sans | `font-semibold text-base` (16px) | Accordion titles, settings group labels |
| Card title | DM Sans | `text-sm font-medium` (14px) | Within cards, list items |
| Back link | DM Sans | `text-sm` (14px) | "← Back" |
| Hero headline | DM Serif Display | `font-serif text-4xl` (36-48px) | Landing page, onboarding welcome only |

**Rule:** DM Serif Display is for marketing/landing/onboarding impact only. Never use it for in-app page titles, card titles, or body text. All in-app UI uses DM Sans.

## Page Headers

**Standard — back link + title:**
```tsx
<div className="flex items-center gap-3">
  <Link href="/app/profile" className="text-sm text-[var(--color-interactive)]">← Back</Link>
  <h1 className="font-semibold text-lg">Page Title</h1>
</div>
```

**Profile page — title + action link:**
```tsx
<div className="flex items-center justify-between px-1">
  <h1 className="font-semibold text-lg">My Profile</h1>
  <Link href={`/u/${handle}`} className="text-xs text-[var(--color-interactive)]">👁 Preview →</Link>
</div>
```

**Settings section header:**
```tsx
<SectionHeader title="Appearance" />
{/* Renders as a muted uppercase or bold label above a settings group */}
```

## Back Navigation

Always use `← Back` as a text link, not a button or icon. Color: `text-[var(--color-interactive)]`. Positioned top-left.

For edit pages, `href` points to `/app/profile` explicitly (not `router.back()`), unless the page is Cancel-able — then Cancel uses `router.back()`.

## In-Section Edit Links

Small pill-style link inside accordion headers:

```tsx
<Link href={editHref} onClick={(e) => e.stopPropagation()}
  className="text-[10px] text-[var(--color-interactive)] font-medium px-2 py-0.5 rounded-full bg-[var(--color-interactive)]/10">
  Edit
</Link>
```

## Tab Bar

Mobile: `BottomTabBar` — fixed bottom, 5 tabs, 16px height, 10px labels.
Desktop: `SidebarNav` — fixed left, 64px wide, icon + label, vertical.

Both prefetch all tab routes on mount. Active tab uses `text-[var(--color-interactive)]`. Network tab has a notification dot.

**Content must account for the tab bar:**
- Mobile pages: `pb-24` or `pb-tab-bar` on the page container
- Desktop pages: `md:pl-16` on the main content area (set in layout, not per-page)
