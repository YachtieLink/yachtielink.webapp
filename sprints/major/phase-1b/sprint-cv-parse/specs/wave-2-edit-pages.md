# Wave 2: Edit Pages for New Fields

## Scope

Add UI for users to manually fill the new Wave 1 fields. Modify 2 existing pages, create 1 new page + 1 new API route. Update ProfileHeroCard with nationality + sea time.

## Files

| File | Action |
|------|--------|
| `app/(protected)/app/profile/settings/page.tsx` | MODIFY — add DOB, nationality, smoker, tattoo, visa, license, show_dob, show_nationality |
| `app/(protected)/app/attachment/[id]/edit/page.tsx` | MODIFY — add employment_type, yacht_program, description, cruising_area |
| `app/(protected)/app/languages/edit/page.tsx` | CREATE — language edit page with proficiency |
| `app/api/profile/languages/route.ts` | CREATE — GET + PATCH for users.languages JSONB |
| `components/profile/ProfileHeroCard.tsx` | MODIFY — add nationality flag + sea time line |
| `app/(protected)/app/profile/page.tsx` | MODIFY — add languages row, CV completeness prompt, pass new props to hero, remove SeaTimeSummary |

## Profile Settings Page

**Existing pattern:** `'use client'`, data loads in `useEffect`, saves via direct `supabase.from('users').update()`. No API route.

**Add below location city, before visibility toggles:**

```
── Personal Details ─────────────────

Date of Birth   [DatePicker includeDay, maxYear=currentYear-16, minYear=1940]
Nationality     [SearchableSelect — reuse ALL_COUNTRIES/PINNED_COUNTRIES from lib/constants/countries.ts]
Smoker Status   [Select: Non Smoker | Smoker | Social Smoker]
Tattoo Vis.     [Select: No Visible Tattoos | Visible | Non-Visible (covered) | Not Specified]
Driver License  [Input type=text, placeholder "e.g. International Drivers License"]

── Visa & Passport ──────────────────

[checkbox] B1/B2
[checkbox] Schengen
[checkbox] EU Citizen
[checkbox] Seaman's Book
(+ "Other" free-text input for unlisted visa types)

── Visibility ───────────────────────

[existing toggles]
[NEW] Show age on profile     [ToggleRow → show_dob]
[NEW] Show nationality        [ToggleRow → show_nationality]
```

**Visa types implementation:** `visa_types` is `text[]`. Render common values as checkboxes, toggle in/out of the array. Pattern:
```tsx
const COMMON_VISAS = ['B1/B2', 'Schengen', 'EU Citizen', "Seaman's Book"]

function toggleVisa(visa: string) {
  setForm(f => ({
    ...f,
    visa_types: f.visa_types.includes(visa)
      ? f.visa_types.filter(v => v !== visa)
      : [...f.visa_types, visa]
  }))
}
```

**Add to select query:** `date_of_birth, nationality, smoker, tattoo_visibility, visa_types, drivers_license, show_dob, show_nationality`

**Add to update object:** same 8 fields.

## Attachment Edit Page

**Existing pattern:** `'use client'`, loads attachment via direct Supabase query, saves via direct `.update()`.

**Add after end date, before transfer section:**

```
── Employment Details ───────────────

Type            [Select: Permanent | Seasonal | Freelance | Relief | Temporary]
Program         [Select: Private | Charter | Private/Charter]
Cruising Area   [Input placeholder "e.g. Mediterranean, Caribbean"]
Description     [textarea, maxLength 2000, placeholder "What did you do in this role?"]
                [character count: 0/2000]
```

**Textarea styling:** `min-h-[120px] resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm`

**Add to select query:** `employment_type, yacht_program, description, cruising_area`
**Add to update:** same 4 fields.

## Languages Edit Page (NEW)

**Pattern:** follows social-links edit page (JSONB via API route).

**Data shape:** `users.languages` = `[{language: string, proficiency: 'native' | 'fluent' | 'intermediate' | 'basic'}]`

**Layout:**
```
← Languages

┌─────────────────────────────────┐
│ English        [Native       ▾] │
│                            [✕] │
├─────────────────────────────────┤
│ French         [Basic        ▾] │
│                            [✕] │
└─────────────────────────────────┘

[+ Add language]

When adding:
Language  [Input — free text, not a picker]
Level     [Select: Native | Fluent | Intermediate | Basic]
[Add]

[Save]
```

- Max 10 languages
- Duplicate prevention (can't add same language twice)
- `BackButton` to `/app/profile`
- `PageTransition` wrapper, `pb-24`

## Languages API Route (NEW)

**Pattern:** follows `app/api/profile/social-links/route.ts`

```ts
// GET — return current languages
// PATCH — validate with Zod schema, write to users.languages

const languagesSchema = z.object({
  languages: z.array(z.object({
    language: z.string().min(1).max(50),
    proficiency: z.enum(['native', 'fluent', 'intermediate', 'basic']),
  })).max(10),
})
```

## ProfileHeroCard Changes

Add props: `nationality?: string | null`, `seaTimeTotalDays?: number`, `seaTimeYachtCount?: number`

Render:
- Nationality flag emoji after `primaryRole`: `Head Chef · 🇬🇧`
- Sea time line below departments: `12y at sea · 10 yachts` (text-xs, text-tertiary)

Helper needed: `countryToFlag(country: string): string` — converts country name to flag emoji via ISO code lookup. Add to `lib/constants/countries.ts`.

Remove standalone `SeaTimeSummary` card from profile page (folded into hero).

## Profile Page Changes

1. **Languages chip row** — between SocialLinksRow and ProfileStrength (if languages exist)
2. **CV completeness prompt** — if DOB, smoker, or nationality empty: "Complete your CV details" card linking to settings
3. Pass `nationality`, `seaTimeTotalDays`, `seaTimeYachtCount` to ProfileHeroCard
4. Remove `<SeaTimeSummary>` standalone card
5. Add `languages` to the profile data fetch

## Certification Edit Page — Issuing Body

**Extend existing:** certification edit page (wherever certs are edited — check for `certifications` update paths).

The `certifications.issuing_body` column exists in the schema but has no edit UI. Add:

```
── Certification Details ────────────
Issuing Body   [Input placeholder "e.g. Romanian Naval Authority"]
```

Add to the cert form below expiry date. Add to the select query and update object.

## countryToFlag Helper

**Add to `lib/constants/countries.ts`:**

```ts
export function countryToFlag(country: string): string {
  // Convert country name to ISO 3166-1 alpha-2, then to regional indicator symbols
  const code = COUNTRY_TO_ISO[country.toLowerCase()]
  if (!code) return ''
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}
```

Needs a `COUNTRY_TO_ISO` mapping (country name → 2-letter code). Keyed by lowercase name for fuzzy matching.

## Verification

- [ ] All new fields on settings page: load, save, reload
- [ ] DatePicker with includeDay for DOB
- [ ] Nationality reuses existing SearchableSelect + countries
- [ ] Visa checkboxes toggle array values correctly
- [ ] Attachment edit: 4 new fields save + reload
- [ ] Description textarea: character count, 2000 max
- [ ] Certification edit: issuing_body field saves + loads
- [ ] Languages: add/remove with proficiency, max 10, no duplicates
- [ ] Languages API: GET + PATCH work correctly
- [ ] ProfileHeroCard: nationality flag + sea time render
- [ ] countryToFlag returns correct emoji for common countries
- [ ] Profile page: languages row shows, CV prompt shows when needed
- [ ] Mobile: all edit pages work at 375px
- [ ] Build passes
