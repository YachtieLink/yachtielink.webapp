# Wave 5: Save Function + Celebration

## Scope

New `saveConfirmedImport()` function that receives pre-confirmed data from the wizard (yacht IDs resolved, cert types matched, fields edited) and batch-writes everything to the database. Returns stats for the celebration screen. Keep old `saveParsedCvData()` for backward compat.

## Files

| File | Action |
|------|--------|
| `lib/cv/save-parsed-cv-data.ts` | ADD `saveConfirmedImport()`, mark old function `@deprecated` |
| `lib/cv/types.ts` | Types already defined in Wave 3 — `ConfirmedImportData`, `SaveStats` |

## Interface

All types imported from `lib/cv/types.ts` (defined in Wave 3):

- `ConfirmedImportData` — the wizard's output: personal fields, yachts (with resolved IDs), certs, education, skills, hobbies, endorsement requests, social links
- `ConfirmedPersonal` — typed personal fields (not `Record<string, any>`)
- `ConfirmedYacht` — includes `is_update`, `existing_attachment_id`, and optional `create_yacht` for new yachts
- `ConfirmedCert` — includes `is_update`, `existing_cert_id`
- `SaveStats` — returned to wizard for celebration screen, includes `profileCompletionPercent`

## Save Logic

All batch operations — no N+1:

1. **Users UPDATE** — single call. `personal` fields + `languages` JSONB + `social_links` JSONB
2. **Create new yachts** — batch INSERT for yachts that need creating (from `create_yacht` on ConfirmedYacht). Get back IDs.
3. **Attachments** — split into INSERTs (new) and UPDATEs (enrichments from "already on profile" cards)
4. **Certifications** — same: INSERTs for new, UPDATEs for enrichments
5. **Education** — batch INSERT (all new — no update scenario in wizard)
6. **Skills** — batch INSERT to `user_skills` (deduplicate against existing)
7. **Hobbies** — batch INSERT to `user_hobbies` (deduplicate against existing)
8. **Endorsement requests** — sequential `fetch('/api/endorsement-requests')` per request (non-fatal if any fail)
9. **Profile completion** — compute `profileCompletionPercent` after all saves complete (using `computeProfileStrength()`)

**Update vs Insert for yachts/certs:** The confirm cards in Wave 4 produce entries with `is_update: true` when enriching existing records. The save function uses `.update()` for these instead of `.insert()`.

```ts
// Split yachts into creates, inserts, and updates
const yachtsToCreate = data.yachts.filter(y => y.create_yacht)
const yachtsToInsert = data.yachts.filter(y => !y.is_update && !y.create_yacht)
const yachtsToUpdate = data.yachts.filter(y => y.is_update && y.existing_attachment_id)

// 1. Create new yachts first (need IDs for attachments)
if (yachtsToCreate.length > 0) {
  const { data: newYachts } = await supabase.from('yachts')
    .insert(yachtsToCreate.map(y => y.create_yacht!))
    .select('id, name')
  // Map created yacht IDs back to the yacht entries
}

// 2. Batch insert new attachments
if (yachtsToInsert.length > 0) {
  await supabase.from('attachments').insert(yachtsToInsert.map(y => ({
    user_id: userId,
    yacht_id: y.yacht_id,
    role_label: y.role_label,
    started_at: y.started_at,
    ended_at: y.ended_at,
    employment_type: y.employment_type,
    yacht_program: y.yacht_program,
    description: y.description,
    cruising_area: y.cruising_area,
  })))
}

// 3. Individual updates for enrichments (different fields per entry)
for (const y of yachtsToUpdate) {
  await supabase.from('attachments')
    .update({
      employment_type: y.employment_type,
      yacht_program: y.yacht_program,
      description: y.description,
      cruising_area: y.cruising_area,
    })
    .eq('id', y.existing_attachment_id)
}
```

## Deduplication

Before inserting skills/hobbies, filter out ones the user already has:

```ts
// Skills: fetch existing, filter new
const { data: existingSkills } = await supabase
  .from('user_skills').select('skill_name').eq('user_id', userId)
const existingNames = new Set(existingSkills?.map(s => s.skill_name.toLowerCase()) ?? [])
const newSkills = data.skills.filter(s => !existingNames.has(s.toLowerCase()))
```

Same pattern for hobbies.

## Profile Completion Calculation

After all saves, re-fetch the user's profile and compute completion:

```ts
import { computeProfileStrength } from '@/lib/profile-summaries'

// Re-fetch profile + counts after save
const [profile, attachmentCount, certCount, ...] = await Promise.all([...])
const completion = computeProfileStrength(profile, attachmentCount, certCount, ...)

stats.profileCompletionPercent = completion.percent
```

This powers the celebration screen: "Your profile is now 84% complete."

## Stats Return

```ts
// SaveStats is defined in lib/cv/types.ts
// Returned to the wizard for the celebration screen
return {
  profileFieldsUpdated,       // string[] of field names that changed
  yachtsCreated,              // new attachments inserted
  yachtsEnriched,             // existing attachments enriched with new fields
  certificationsCreated,
  certificationsEnriched,
  educationCreated,
  skillsCreated,
  hobbiesCreated,
  languagesSaved,
  endorsementRequestsSent,
  profileCompletionPercent,   // 0-100, computed after save
}
```

## Error Handling

The save function should be resilient to partial failure:

```ts
// Save in order of importance. Each block try/catches independently.
// If certs fail, profile + yachts are already saved.
const results = {
  profileOk: false,
  yachtsOk: false,
  certsOk: false,
  // ...
}

try { /* save profile */ results.profileOk = true } catch (e) { console.error(e) }
try { /* save yachts */ results.yachtsOk = true } catch (e) { console.error(e) }
try { /* save certs */ results.certsOk = true } catch (e) { console.error(e) }
// ...

// Celebration screen can show what succeeded even if some parts failed
```

## Verification

- [ ] Batch INSERT for new yachts (single call, not N)
- [ ] New yacht creation returns IDs used in attachment insert
- [ ] Batch INSERT for new attachments
- [ ] UPDATE works for enriched yachts (is_update = true)
- [ ] Batch INSERT for certs, education
- [ ] UPDATE works for enriched certs
- [ ] Skills/hobbies deduplicated against existing
- [ ] Languages saved to users.languages JSONB
- [ ] Social links appended to users.social_links
- [ ] Endorsement requests fire for opted-in, skip for opted-out
- [ ] Stats accurately reflect what was created vs enriched
- [ ] profileCompletionPercent is accurate
- [ ] Partial failure doesn't corrupt (blocks are independent)
- [ ] Old `saveParsedCvData` still works (not deleted, marked deprecated)
- [ ] Build passes
