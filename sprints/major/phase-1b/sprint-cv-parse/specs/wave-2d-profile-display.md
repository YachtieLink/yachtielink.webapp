# Wave 2d: Profile Display Updates

## Scope

Languages edit page, ProfileHeroCard updates, profile page layout changes.

## Files

| File | Action |
|------|--------|
| `app/(protected)/app/languages/edit/page.tsx` | CREATE |
| `components/profile/ProfileHeroCard.tsx` | MODIFY |
| `app/(protected)/app/profile/page.tsx` | MODIFY |

## 1. Languages Edit Page (CREATE)

Follow social-links edit page pattern: load via fetch GET, save via fetch PATCH to `/api/profile/languages`.

**State:** array of `{language: string, proficiency: string}`

**Layout:**
- BackButton to /app/profile
- PageTransition wrapper, pb-24
- List of current languages, each with proficiency Select + remove button
- "Add language" section: free-text Input for language name, Select for proficiency level, Add button
- Max 10, duplicate prevention by language name (case-insensitive)
- Save button calls PATCH with full array

**Proficiency options:** Native, Fluent, Intermediate, Basic

**Components:** Input, Select, Button, BackButton, PageTransition, AnimatePresence, Skeleton, useToast

## 2. ProfileHeroCard (MODIFY)

### Add Props

```tsx
home_country?: string | null
seaTimeTotalDays?: number
seaTimeYachtCount?: number
```

### Render Changes

After primaryRole text, if home_country is set:
- Append ` · {flag}` using `countryToFlag(home_country)` from `lib/constants/countries`

Below departments line, if seaTimeTotalDays > 0:
- New line: `{formatted_time} at sea · {n} yachts`
- Use `formatSeaTime()` from `lib/sea-time`
- Style: `text-xs text-[var(--color-text-tertiary)]`

### Imports to Add

- `countryToFlag` from `lib/constants/countries`
- `formatSeaTime` from `lib/sea-time`

## 3. Profile Page Layout (MODIFY)

### Data Fetch

Add UF2 and UF7 column names to the profile select query (inside getUserById or inline).

Also add UF1, UF3 for the CV completeness check.

### Pass to Hero

Add to ProfileHeroCard props:
- `home_country={profile.home_country}`
- `seaTimeTotalDays={seaTimeTotalDays}`
- `seaTimeYachtCount={seaTimeYachtCount}`

### Remove SeaTimeSummary

Delete the standalone `<SeaTimeSummary>` card (sea time is now in the hero).
Remove the import if unused.

### Add Languages Row

Between SocialLinksRow and ProfileStrength, if UF7 has entries:

```tsx
{languages.length > 0 && (
  <Link href="/app/languages/edit">
    <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-3">
      <p className="text-sm text-[var(--color-text-secondary)]">
        {languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}
      </p>
    </div>
  </Link>
)}
```

### Add CV Completeness Prompt

Between languages row and ProfileStrength, if UF1/UF2/UF3 are null:

```tsx
<Link href="/app/profile/settings">
  <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-3 border border-amber-200">
    <p className="text-sm font-medium text-[var(--color-text-primary)]">
      Your generated CV is missing {count} fields captains look for.
    </p>
    <p className="text-xs text-[var(--color-interactive)] mt-1">
      Complete your CV details
    </p>
  </div>
</Link>
```

Count = number of null among [UF1, UF2, UF3].

## Verification

- [ ] Languages edit page loads, add/remove works
- [ ] Max 10 languages enforced
- [ ] Duplicate language names prevented
- [ ] Save persists and reloads correctly
- [ ] Hero card shows flag emoji after role
- [ ] Hero card shows sea time line
- [ ] SeaTimeSummary card removed from profile
- [ ] Languages row appears between social links and strength
- [ ] CV prompt appears when fields are missing
- [ ] CV prompt disappears when fields are filled
- [ ] Mobile layout at 375px
- [ ] Build passes
