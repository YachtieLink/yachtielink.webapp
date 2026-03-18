# Pattern: Forms

## Standard Edit Page Layout

Every edit page follows this structure:

```tsx
<div className="flex flex-col gap-4 pb-24">
  {/* 1. Back link + title */}
  <div className="flex items-center gap-3">
    <Link href="/app/profile" className="text-sm text-[var(--color-interactive)]">← Back</Link>
    <h1 className="font-semibold text-lg">Page Title</h1>
  </div>

  {/* 2. Optional description */}
  <p className="text-sm text-[var(--color-text-secondary)]">Helper text</p>

  {/* 3. Form content (varies) */}

  {/* 4. Save button(s) — always at the bottom */}
</div>
```

`pb-24` clears the tab bar on mobile.

## Input Fields

Use the `Input` component from `components/ui/Input.tsx`:

```tsx
<Input label="Institution *" value={form.institution} onChange={...} placeholder="e.g. UKSA" error={errors.institution} />
```

Inline inputs (not using the component):
```tsx
<input className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20" />
```

Key: `rounded-xl`, `border-[var(--color-border)]`, `bg-[var(--color-surface)]`, `focus:ring-2`.

## Date Fields (Two-Column Grid)

```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-sm font-medium mb-1">Start date</label>
    <input type="date" className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)]" />
  </div>
  <div>
    <label className="block text-sm font-medium mb-1">End date</label>
    <input type="date" className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)]" />
  </div>
</div>
```

## Textarea with Character Count

```tsx
<div className="relative">
  <textarea rows={8} className={`w-full bg-[var(--color-surface)] border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 ${overLimit ? 'border-red-500' : 'border-[var(--color-border)]'}`} />
  <span className={`absolute bottom-3 right-4 text-xs ${overLimit ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>
    {remaining}
  </span>
</div>
```

## Tag/Pill Input (Hobbies, Skills)

```tsx
{/* Input row */}
<div className="flex gap-2">
  <input placeholder="e.g. Surfing" className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)]" />
  <button className="px-4 py-2 rounded-xl bg-[var(--color-interactive)] text-white disabled:opacity-40">Add</button>
</div>

{/* Tag display */}
<div className="flex flex-wrap gap-2">
  {items.map(item => (
    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)]">
      {item.name}
      <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">×</button>
    </span>
  ))}
</div>
```

## Save Button Patterns

**Single button (most edit pages):**
```tsx
<button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white font-medium disabled:opacity-50">
  {saving ? 'Saving…' : 'Save'}
</button>
```

**Two-button footer (about, complex edits):**
```tsx
<div className="flex gap-3">
  <Button variant="secondary" onClick={() => router.back()} className="flex-1">Cancel</Button>
  <Button onClick={save} loading={saving} className="flex-1">Save</Button>
</div>
```

## Loading Skeleton

Show before data arrives:
```tsx
{!loaded ? (
  <div className="h-40 bg-[var(--color-surface-raised)] rounded-xl animate-pulse" />
) : (
  {/* Actual form */}
)}
```

## Error & Feedback Patterns

Three types of feedback, each with a specific use:

### Inline error — for validation before submit
Show directly under the field that failed. Red text, appears immediately on validation.
```tsx
{error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
```
Use for: required fields, character limits, date range validation (end ≥ start), format errors.

### Toast — for API responses after submit
Non-blocking notification that appears briefly after a save/delete/action.
```tsx
toast({ title: 'Saved', variant: 'success' })
toast({ title: 'Something went wrong. Please try again.', variant: 'error' })
```
Use for: save success, save failure, delete confirmation, network errors. Always clear the loading state regardless of outcome (`.finally()`).

### Page-level error — for fetch failures on load
When the initial data fetch fails and the form can't render at all.
```tsx
{fetchError ? (
  <p className="text-sm text-[var(--color-text-secondary)]">
    Couldn't load data. <button onClick={retry} className="text-[var(--color-interactive)] underline">Try again</button>
  </p>
) : (
  {/* Form */}
)}
```

### Decision tree
| Situation | Pattern |
|-----------|---------|
| Field doesn't pass validation before save | Inline error under the field |
| API returns error after save attempt | Toast (error) |
| API returns success after save | Toast (success) + navigate back |
| Initial data fetch fails | Page-level error with retry |
| Character limit approaching | Inline counter (not error yet) |
| Character limit exceeded | Inline counter turns red |
