# Wave 2c: Attachment Edit + Cert Edit

## Scope

Add new employment detail fields to attachment edit page (AF1-AF4) and issuing body to cert edit page (EF1). Fields reference `field-registry.md`.

## Files

| File | Action |
|------|--------|
| `app/(protected)/app/attachment/[id]/edit/page.tsx` | MODIFY |
| `app/(protected)/app/certification/[id]/edit/page.tsx` | MODIFY |

## Attachment Edit Changes

### Existing Pattern

- `'use client'` with individual useState per field
- Loads via direct supabase select, saves via direct supabase update
- Uses Input, DatePicker, Button components

### Add State

4 new useState calls: AF1 (string), AF2 (string), AF3 (string), AF4 (string)

### Extend Select Query

Add AF1-AF4 column names to `.select()`.

### Extend Update Object

Add AF1-AF4 to `.update()`. Text fields trim + fallback to null.

### Load from Data

Set state from loaded data in the `.then()` callback.

### New UI Section

After end date section, before save button:

Section: "Employment Details"
- Select for AF1 (5 enum options from registry)
- Select for AF2 (3 enum options from registry)
- Input for AF4 (placeholder: "e.g. Mediterranean, Caribbean")
- Textarea for AF3 (max 2000 chars, character count display below)

AF1 options: Permanent, Seasonal, Freelance, Relief, Temporary

AF2 options: Private, Charter, Private/Charter

Textarea styling: `min-h-[120px] resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm`

Character count: `text-xs text-[var(--color-text-tertiary)] text-right`

## Cert Edit Changes

### Add State

1 new useState: `issuingBody` (string)

### Extend Select Query

Add EF1 column name to `.select()`.

### Extend Update Object

Add `issuing_body: issuingBody.trim() || null` to `.update()`.

### Load from Data

Set issuingBody from loaded data.

### New UI

Add Input for EF1 after expiry date section, before document upload:
- Label: "Issuing body"
- Placeholder: "e.g. Maritime Authority"

## Verification

- [ ] Attachment edit shows 4 new fields
- [ ] Enum selects have correct options
- [ ] Textarea has character count
- [ ] AF3 enforces 2000 char max
- [ ] All fields save and reload correctly
- [ ] Cert edit shows issuing body field
- [ ] Cert issuing body saves and reloads
- [ ] Mobile layout at 375px
- [ ] Build passes
