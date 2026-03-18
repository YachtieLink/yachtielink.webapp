# Pattern: Cards

## Base Card

From `components/ui/Card.tsx`. Used when you need a contained section with a border.

```tsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

Styles: `rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-sm`. Interactive variant adds `hover:-translate-y-0.5 hover:shadow-md`.

## Profile Section Card

Used on the profile page for photo strip, identity, and inline content. **Not** the base Card component — a simpler div.

```tsx
<div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Section Title</span>
    <Link href="/edit" className="text-xs text-[var(--color-interactive)]">Edit</Link>
  </div>
  {/* Content */}
</div>
```

Use `p-3` for tighter cards (photo strip), `p-4` for standard.

## Endorsement Card

Used for displaying endorsement quotes on public profiles.

```tsx
<div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
  <div className="flex items-center gap-3 mb-3">
    <Image src={photo} width={32} height={32} className="h-8 w-8 rounded-full" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{role}</p>
    </div>
  </div>
  <p className="text-sm">"{text}"</p>
</div>
```

Note: `rounded-lg` not `rounded-2xl` — slightly tighter than section cards.

## Settings Row

Used in the More page. Not a standalone card — rows are grouped in a container.

```tsx
{/* Container */}
<div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
  <SettingsRow label="Theme" sublabel="Light / Dark" href="/settings" />
  <SettingsRow label="Account" href="/more/account" />
</div>

{/* Individual row */}
<Link href={href} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-raised)]/30">
  <div>
    <p className="text-sm">{label}</p>
    {sublabel && <p className="text-xs text-[var(--color-text-secondary)]">{sublabel}</p>}
  </div>
  <span className="text-[var(--color-text-secondary)] text-lg">›</span>
</Link>
```

## When to Use What

| Pattern | When |
|---------|------|
| Base Card | Standalone content blocks, interactive items |
| Profile Section Card | Profile page sections, inline editable areas |
| Endorsement Card | Quotes, testimonials, user-attributed content |
| Settings Row (grouped) | Menu items, settings, navigable options |
