# Pattern: Lists, Sections & Empty States

## ProfileAccordion (Collapsible Sections)

The primary section pattern on the profile page. From `components/profile/ProfileAccordion.tsx`.

```tsx
<ProfileAccordion title="Experience" summary="3 yachts · 4 years at sea" editHref="/app/attachment/new">
  {/* Expanded content */}
</ProfileAccordion>
```

Structure: `rounded-2xl bg-[var(--color-surface)] shadow-sm`. Header is a full-width button with title + summary + chevron. Content expands with Framer Motion `AnimatePresence`. Edit button is a small pill link (`text-[10px]`) that stops propagation.

**When to use:** any section on the profile or public profile that has a title, summary, and expandable detail.

## Experience List (Bullet Style)

For employment history, structured lists with dates:

```tsx
<div className="flex flex-col gap-3">
  {items.map(item => (
    <div key={item.id} className="flex gap-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-interactive)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}
          <span className="font-normal text-[var(--color-text-secondary)]"> — {item.subtitle}</span>
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">{item.dates}</p>
      </div>
    </div>
  ))}
</div>
```

The teal dot bullet is distinctive to YachtieLink experience lists.

## Simple Text List (Education, Certs)

For items without the bullet treatment:

```tsx
<div className="flex flex-col gap-3">
  {items.map(item => (
    <div key={item.id}>
      <p className="text-sm font-medium">{item.primary}</p>
      {item.secondary && <p className="text-sm text-[var(--color-text-secondary)]">{item.secondary}</p>}
    </div>
  ))}
</div>
```

## Tag/Pill Display (Hobbies, Skills)

For flat lists of short items:

```tsx
<div className="flex flex-wrap gap-2">
  {items.map(item => (
    <span key={item.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)]">
      {item.emoji ? `${item.emoji} ${item.name}` : item.name}
    </span>
  ))}
</div>
```

## Empty States

**Rule: empty sections don't render on the public profile.** On the own-profile page, empty sections show a CTA to add content.

**CTA with icon (prominent):**
```tsx
<Link href="/app/profile/photos" className="flex items-center gap-3 p-1 rounded-xl hover:bg-[var(--color-surface-raised)]">
  <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--color-surface-raised)] flex items-center justify-center text-2xl">👤</div>
  <div>
    <p className="text-sm font-medium">Add profile photos</p>
    <p className="text-xs text-[var(--color-text-secondary)]">Show the crew who you are</p>
  </div>
</Link>
```

**Inline text CTA (subtle):**
```tsx
<p className="text-sm text-[var(--color-text-secondary)]">
  No endorsements yet. <Link href="/app/endorsement/request" className="text-[var(--color-interactive)] underline">Request one →</Link>
</p>
```

**When to use which:**
- Icon CTA → photos, gallery, major profile sections (high visual impact)
- Text CTA → endorsements, education, hobbies (lower priority, less visual weight)
