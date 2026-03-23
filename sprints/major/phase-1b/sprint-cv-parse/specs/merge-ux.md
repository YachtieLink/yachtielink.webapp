# Spec: Batch Confirm Merge UX

## The Core Principle

**Show the merged result. Ask "Does this look right?" Edit only if it doesn't.**

The user should never be asked to make a decision that the system can make intelligently. Radio buttons per field are work. Confirming a card is effortless.

## The Three Merge Scenarios

When a CV is parsed, every piece of data falls into one of three scenarios:

| Scenario | What happens | User sees |
|----------|-------------|-----------|
| **No conflict** — field was empty, CV has a value | Auto-fill with CV value | Pre-filled card, no choice needed |
| **No conflict** — field has value, CV matches or has nothing | Keep existing value | Pre-filled card, no choice needed |
| **Conflict** — field has value, CV has a *different* value | Auto-pick the smarter value, flag it | Card with highlighted fields, can edit |

Most fields will be scenario 1 or 2. The wizard should feel like: "We read your CV — here's your profile. Confirm and go."

## Auto-Merge Logic

Before showing anything to the user, run a merge pass that produces a single "best" value per field:

```ts
function autoMerge(existing: string | null, fromCv: string | null): {
  value: string | null
  source: 'existing' | 'cv' | 'both_match' | 'empty'
  hasConflict: boolean
} {
  if (!existing && !fromCv) return { value: null, source: 'empty', hasConflict: false }
  if (!existing && fromCv)  return { value: fromCv, source: 'cv', hasConflict: false }
  if (existing && !fromCv)  return { value: existing, source: 'existing', hasConflict: false }
  if (normalize(existing) === normalize(fromCv)) return { value: existing, source: 'both_match', hasConflict: false }
  // Both exist and differ — conflict. Default to CV (it's what they just uploaded).
  return { value: fromCv, source: 'cv', hasConflict: true }
}
```

**Conflict default: prefer CV value.** The user just uploaded this CV — it's probably more current than whatever was in their profile. They can switch back if needed.

**Exception: dates.** If the existing date is more precise than the CV date (e.g., existing = "2020-06-15", CV = "2020"), keep the existing date. The CV parser often loses precision.

## The Pattern: Confirm Cards

### Personal Details Card

After auto-merge, render the user's details as a **preview card** — not a form:

```
┌─────────────────────────────────────┐
│  Your Details                       │
│                                     │
│  Christian Arnold                   │
│  Head Chef · British · 36           │
│  Antibes, France                    │
│  +33 6 12 34 56 78                  │
│                                     │
│  Non Smoker · No Visible Tattoos    │
│  B1/B2 · Schengen                   │
│  Int'l Drivers License              │
│                                     │
│  English (native) · French (basic)  │
│                                     │
│  ⚡ 2 fields updated from your CV   │ ← subtle count, not per-field callout
│                                     │
│  [Looks good ✓]     [Edit details]  │
└─────────────────────────────────────┘
```

**"Looks good"** → confirms all values, moves to next step.

**"Edit details"** → expands into an editable form. Only conflict fields are highlighted (amber left border + "CV said: {value}" hint below the input). Non-conflict fields are plain inputs.

```
┌─────────────────────────────────────┐
│  Your Details                       │
│                                     │
│  Full Name     [Christian Arnold  ] │
│  Primary Role  [Head Chef         ] │
│                                     │
│ ┃ Nationality  [British          ▾] │ ← amber border = conflict
│ ┃              Was: "UK"            │ ← shows what existed before
│                                     │
│  Date of Birth [18/08/1988        ] │
│  Location      [France ▾] [Antibes] │
│  Phone         [+33 6 12 34 56 78 ] │
│                                     │
│  ── Quick Facts ─────────────────── │
│  Smoker        [Non Smoker       ▾] │
│  Tattoos       [No Visible       ▾] │
│  License       [Int'l License     ] │
│  Visas         [x] B1/B2 [x] Schen │
│                                     │
│  ── Languages ───────────────────── │
│  English  [Native        ▾]    [✕] │
│  French   [Basic         ▾]    [✕] │
│  [+ Add language]                   │
│                                     │
│  [Done editing ✓]     [Cancel]      │
└─────────────────────────────────────┘
```

### Yacht Cards

Each yacht from the CV is a confirm card:

**New yacht (no duplicate):**
```
┌─────────────────────────────────────┐
│  M/Y Amevi                          │
│  80m · Oceanco · Private · 🇲🇹      │
│  Head Chef · Oct 2020 – Sep 2021    │
│  Mediterranean, Maldives            │
│                                     │
│  ☑ Add to profile    [Edit] [Skip]  │
└─────────────────────────────────────┘
```

**Duplicate detected (same yacht, overlapping dates):**
```
┌─────────────────────────────────────┐
│  M/Y Amevi                          │
│  80m · Oceanco · Private · 🇲🇹      │
│  Head Chef · Oct 2020 – Sep 2021    │
│  Mediterranean, Maldives            │
│                                     │
│  Already on your profile — we'll    │
│  add the new details (builder,      │
│  program, cruising area).           │
│                                     │
│  [Looks good ✓]     [Edit] [Skip]   │
└─────────────────────────────────────┘
```

The system auto-decides to merge enrichment fields into the existing entry. The user just confirms. No radio buttons for keep/update/add-separate — that's over-engineering for a rare edge case. If the dates are different enough that it's clearly a separate stint, offer "Add as new entry" as a secondary option.

**Yacht edit view** (when "Edit" is tapped):
```
┌─────────────────────────────────────┐
│  M/Y Amevi                          │
│                                     │
│  Role         [Head Chef         ]  │
│  From         [Oct 2020          ]  │
│  To           [Sep 2021          ]  │
│  Type         [Permanent        ▾]  │
│  Program      [Private          ▾]  │
│  Cruising     [Mediterranean     ]  │
│  Description  [Responsible for...]  │
│                                     │
│  [Done ✓]                [Cancel]   │
└─────────────────────────────────────┘
```

**All yachts shown together as a scrollable list**, not one-at-a-time pagination. "Yacht 1 of N" makes a 10-yacht CV feel like a slog. Show the full list — most users will scroll through, confirm the batch, and move on.

```
┌─────────────────────────────────────┐
│  Your Experience                    │
│  We found 8 yachts on your CV      │
│                                     │
│  [Yacht card 1]  ☑ [Edit] [Skip]   │
│  [Yacht card 2]  ☑ [Edit] [Skip]   │
│  [Yacht card 3]  ☑ [Edit] [Skip]   │
│  ...                                │
│                                     │
│  ⚡ 2 already on your profile —     │
│     we'll add the new details       │
│                                     │
│  [Confirm all ✓]                    │
└─────────────────────────────────────┘
```

### Certification Cards

All certs shown as a batch list:

```
┌─────────────────────────────────────┐
│  Your Certifications                │
│  We found 12 on your CV            │
│                                     │
│  ✓ STCW Basic Safety               │
│    Valid until Jan 2027 · Romanian  │
│    Naval Authority                  │
│                                     │
│  ⚠ ENG1 Medical                    │
│    Expired May 2025                 │
│                                     │
│  ✓ Powerboat Level 2               │
│    Issued 2019 · RYA               │
│                                     │
│  ✓ Food Hygiene Level 3            │
│    ⚠ Already on your profile       │
│    Updated with issuing body        │
│                                     │
│  ...                                │
│                                     │
│  [Looks good ✓]      [Edit certs]  │
└─────────────────────────────────────┘
```

"Edit certs" expands each into an editable row. Per-cert: cert type (SearchableSelect), issued, expires, issuing body, remove button.

### Skills, Hobbies, Education

**Skills & Hobbies:** shown as chip clouds, all pre-selected. Tap a chip to deselect. Add more with free text input.

```
┌─────────────────────────────────────┐
│  Skills & Interests                 │
│                                     │
│  Skills from your CV:               │
│  [Silver Service ✓] [Wine ✓]       │
│  [Menu Development ✓] [French ✓]   │
│  [Food Presentation ✓]             │
│  [+ Add more]                       │
│                                     │
│  Hobbies from your CV:             │
│  [Diving ✓] [Yoga ✓] [Travel ✓]   │
│  [+ Add more]                       │
│                                     │
│  Already on your profile:           │
│  Silver Service · Wine Knowledge    │
│  (kept, not duplicated)             │
│                                     │
│  [Looks good ✓]                     │
└─────────────────────────────────────┘
```

**Education:** rendered as cards, same pattern as yachts but simpler (no matching needed).

```
┌─────────────────────────────────────┐
│  Education                          │
│                                     │
│  Le Cordon Bleu                     │
│  Culinary Arts · 2010 – 2011       │
│  Austin, TX                         │
│                                     │
│  City & Guilds                      │
│  NVQ Level 3 Catering · 2008       │
│                                     │
│  ☑ Add to profile    [Edit] [Skip]  │
│                                     │
│  [Looks good ✓]                     │
└─────────────────────────────────────┘
```

## Conflict Highlighting

When the edit view is expanded, only conflict fields get visual treatment:

- **Amber left border** on the input row
- **"Was: {existing value}"** hint in `text-xs text-secondary` below the input
- The input is pre-filled with the auto-merged (CV) value
- User can type over it or clear to restore existing

Non-conflict fields are plain inputs — no extra UI, no noise.

## Component Architecture

The old spec had 3 granular components (`FieldMerge`, `ArrayMerge`, `DuplicateDetector`). The new pattern needs:

| Component | File | Purpose |
|-----------|------|---------|
| `ConfirmCard` | `components/cv/ConfirmCard.tsx` | Wrapper: preview mode + "Looks good" / "Edit" toggle. Handles confirm/edit state. |
| `ConflictInput` | `components/cv/ConflictInput.tsx` | Input with amber conflict highlight + "Was: {value}" hint. Used in edit mode only. |
| `ChipSelect` | `components/cv/ChipSelect.tsx` | Toggleable chip cloud for skills/hobbies. Tap to deselect. Free-text add. |

`ConfirmCard` is the workhorse. It wraps any content in two modes:

```tsx
interface ConfirmCardProps {
  title: string
  subtitle?: string           // e.g. "We found 8 yachts"
  conflictCount?: number      // e.g. "2 fields updated from your CV"
  onConfirm: () => void
  onSkip?: () => void         // optional skip button
  children: React.ReactNode   // preview content
  editContent: React.ReactNode // edit form content
}
```

## Re-upload Scenario

Same flow. More fields will have existing values → more potential conflicts → the auto-merge resolves most of them silently. The confirm card might show "5 fields updated from your new CV" instead of "2". User taps "Looks good" or edits the few that changed.

## Smart Merge Rules by Data Type

| Data type | Auto-merge strategy |
|-----------|-------------------|
| **Text fields** (name, role, city) | CV wins if conflict (it's newer). Show "Was: {old}" in edit view. |
| **Dates** | Keep the more precise value. Existing "2020-06-15" beats CV "2020". CV "2020-06" beats existing null. |
| **Enums** (smoker, tattoo, program) | CV wins if conflict. |
| **Arrays** (visa_types, skills, hobbies) | Union. Existing items kept, new items added. Duplicates auto-removed. |
| **Languages** | Union by language name. If both have "French" with different proficiency → keep the higher proficiency. |
| **Yachts** | Match by yacht name + overlapping dates. If matched → enrich existing entry with new fields (builder, program, description, cruising area). If new → add. |
| **Certs** | Match by cert type. If matched → enrich (add issuing body, keep more precise dates). If new → add. |
| **Education** | Match by institution + overlapping dates. If matched → enrich. If new → add. |

## Design Tokens

- Confirm card: `bg-[var(--color-surface)]` with `border border-[var(--color-border)]` rounded-2xl
- Confirmed state: `var(--color-success)` checkmark
- Conflict highlight: `border-l-2 border-amber-400` on the input row
- "Was" hint: `text-xs text-[var(--color-text-tertiary)]`
- Chip selected: `bg-[var(--color-interactive-muted)] text-[var(--color-interactive)]`
- Chip deselected: `bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] line-through`
- Skip: `text-[var(--color-text-tertiary)]` ghost button
