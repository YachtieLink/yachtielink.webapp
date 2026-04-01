# Lane 4 — Country SearchableSelect: ISO Code Resolution

## Objective
Fix the bug where countries stored as ISO codes (e.g. "MC" for Monaco, "FR" for France, "AU" for Australia) don't populate in the SearchableSelect. The root cause: the CV parser LLM may return ISO 2-letter codes, ISO 3-letter codes, or abbreviations instead of full country names, but the SearchableSelect options use full names ("Monaco", "France", "Australia").

## Root Cause
1. `lib/cv/prompt.ts` tells the LLM to return `"ISO country name"` — ambiguous, LLM may return "MC", "MCO", "Monaco", etc.
2. `lib/cv/save-parsed-cv-data.ts` saves whatever the LLM returns directly to the DB (line 190-193)
3. `app/(protected)/app/profile/settings/page.tsx` loads the raw DB value and tries to match it against `ALL_COUNTRIES` options which use full names
4. `SearchableSelect` does strict equality matching (`o.value === value`) — "MC" !== "Monaco" → no match → field appears empty

## Tasks

### 1. Create a country normalizer utility
**File:** `lib/constants/country-normalize.ts` (NEW)

Build a function that resolves any country input to the canonical full name used in `ALL_COUNTRIES`:

```typescript
export function normalizeCountry(input: string | null | undefined): string | null
```

It should handle:
- **ISO 3166-1 alpha-2 codes:** "MC" → "Monaco", "FR" → "France", "AU" → "Australia", "GB" → "United Kingdom", "US" → "United States"
- **ISO 3166-1 alpha-3 codes:** "MCO" → "Monaco", "FRA" → "France", "AUS" → "Australia"
- **Common abbreviations:** "UK" → "United Kingdom", "USA" → "United States", "UAE" → "United Arab Emirates"
- **Already-correct full names:** "Monaco" → "Monaco" (passthrough)
- **Case insensitive:** "monaco" → "Monaco", "fr" → "France"
- **null/empty:** → null

Use the existing `COUNTRY_TO_ISO` map from `lib/constants/country-iso.ts` — **invert it** to build an ISO-to-name map. Also add alpha-3 and common abbreviation entries.

### 2. Normalize on CV parse save
**File:** `lib/cv/save-parsed-cv-data.ts`

Around lines 190-193, wrap the country values with the normalizer:

```typescript
if (p.location_country) updates.location_country = normalizeCountry(p.location_country) ?? p.location_country
if (p.home_country) updates.home_country = normalizeCountry(p.home_country) ?? p.home_country
```

### 3. Normalize on profile settings load
**File:** `app/(protected)/app/profile/settings/page.tsx`

Around lines 163, 170 — normalize when loading from DB so existing bad data displays correctly:

```typescript
setLocationCountry(normalizeCountry(profile.location_country) ?? profile.location_country ?? '')
setHomeCountry(normalizeCountry(profile.home_country) ?? profile.home_country ?? '')
```

### 4. Clarify the CV parser prompt
**File:** `lib/cv/prompt.ts`

Change the ambiguous `"ISO country name"` to be explicit:

```
"location_country": "string|null — full country name (e.g. 'France', 'United Kingdom', 'Monaco'), NOT ISO codes",
"home_country": "string|null — nationality/home country, full name (e.g. 'Australia', 'South Africa'), NOT ISO codes",
```

Also update `flag_state` on line 28 to be consistent:
```
"flag_state": "string|null — full country name (e.g. 'France', 'Cayman Islands'), NOT ISO codes",
```

### 5. Verify flag emoji still works
`countryToFlag()` in `lib/constants/country-iso.ts` does `country.toLowerCase()` lookup — it expects full names. After normalization, this should keep working. Verify it does.

### 6. Check other places countries are saved from external input
Search for any other place that writes country values to the DB — ghost profiles, endorsements, etc. If found, add normalization there too.

## Allowed Files
- `lib/constants/country-normalize.ts` (NEW)
- `lib/cv/save-parsed-cv-data.ts`
- `lib/cv/prompt.ts`
- `app/(protected)/app/profile/settings/page.tsx`
- `lib/constants/country-iso.ts` (read-only reference, don't modify unless needed)
- `lib/constants/countries.ts` (read-only reference)

## Forbidden Files
- Any file not in the allowed list
- CHANGELOG.md, STATUS.md, session files
- SearchableSelect component (the component is fine — the data is the problem)

## Edge Cases
- Country name not in normalizer → pass through as-is (don't lose data)
- Multiple valid names for same country (e.g. "Ivory Coast" / "Côte d'Ivoire") — map to whichever is in ALL_COUNTRIES
- Empty string → null
- The normalizer should be tiny and fast — just a lookup map, no external deps
