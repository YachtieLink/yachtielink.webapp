# Wave 2a: Helpers + Languages API

## Scope

Languages validation schema and API route. The countryToFlag helper is already built (`lib/constants/country-iso.ts`).

## Files

| File | Action |
|------|--------|
| `lib/constants/country-iso.ts` | ALREADY DONE -- no changes needed |
| `lib/validation/schemas.ts` | MODIFY -- add languages validation schema |
| `app/api/profile/languages/route.ts` | CREATE -- GET + PATCH for UF7 |

## 1. countryToFlag Helper — DONE

Already exists at `lib/constants/country-iso.ts`. Exports `COUNTRY_TO_ISO` and `countryToFlag()`. No work needed.

## 2. Languages Schema

Add to `lib/validation/schemas.ts`:

```ts
export const languagesSchema = z.object({
  languages: z.array(z.object({
    language: z.string().min(1).max(50).trim(),
    proficiency: z.enum(['native', 'fluent', 'intermediate', 'basic']),
  })).max(10),
})
```

## 3. Languages API Route

Create `app/api/profile/languages/route.ts`.
Follow `app/api/profile/social-links/route.ts` pattern exactly.

**GET**: return `{ languages: user.languages ?? [] }`
**PATCH**: validate with languagesSchema, update users.languages

## Verification

- [ ] Languages GET returns empty array for new user
- [ ] Languages PATCH validates and saves
- [ ] Languages PATCH rejects >10 entries
- [ ] Build passes
