# Wave 5: Save Function + Celebration

## Scope

New `saveConfirmedImport()` that receives pre-confirmed data from wizard and batch-writes to DB. Returns stats for celebration screen. Types defined in Wave 3 (`lib/cv/types.ts`).

## Files

| File | Action |
|------|--------|
| `lib/cv/save-parsed-cv-data.ts` | ADD saveConfirmedImport(), mark old @deprecated |

## Interface

All types from `lib/cv/types.ts`: `ConfirmedImportData`, `SaveStats`

## Save Logic (Batch Operations)

1. **Users UPDATE** -- single call: personal fields + UF7 JSONB + social_links JSONB
2. **Create new yachts** -- batch INSERT, get back IDs
3. **Attachments** -- split into INSERTs (new) and UPDATEs (enrichments)
4. **Certifications** -- same split: INSERTs + UPDATEs
5. **Education** -- batch INSERT
6. **Skills** -- batch INSERT to user_skills (deduplicate against existing)
7. **Hobbies** -- batch INSERT to user_hobbies (deduplicate against existing)
8. **Endorsement requests** -- sequential fetch per request (non-fatal)
9. **Profile completion** -- compute after all saves via `computeProfileStrength()`

## Deduplication

Before inserting skills/hobbies, fetch existing and filter:

```ts
const existingNames = new Set(existingSkills?.map(s => s.skill_name.toLowerCase()) ?? [])
const newSkills = data.skills.filter(s => !existingNames.has(s.toLowerCase()))
```

## Error Handling

Each block try/catches independently. Partial failure is OK -- celebration screen shows what succeeded.

## Stats Return

`SaveStats` includes counts for everything created/enriched plus `profileCompletionPercent` (0-100).

## Verification

- [ ] Batch INSERT for new yachts
- [ ] New yacht creation returns IDs for attachment insert
- [ ] Batch INSERT for new attachments
- [ ] UPDATE works for enriched yachts (is_update = true)
- [ ] Batch INSERT for certs, education
- [ ] UPDATE works for enriched certs
- [ ] Skills/hobbies deduplicated
- [ ] UF7 saved to users JSONB
- [ ] Social links appended
- [ ] Endorsement requests fire for opted-in
- [ ] Stats accurate
- [ ] Completion percent accurate
- [ ] Partial failure doesn't corrupt
- [ ] Old saveParsedCvData still works
- [ ] Build passes
