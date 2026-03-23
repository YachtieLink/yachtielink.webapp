# Wave 7: Verification + Testing

## Scope

End-to-end testing with real CVs, two-phase code review, pre-commit checklist.

## Steps

### 7.1 — Build Check

`npm run build` — must pass clean.

### 7.2 — Migration Verification

Apply migration (founder approval): `supabase db push`

Verify: columns exist, CHECK constraints work, DOB column-level REVOKE works.

### 7.3 — Edit Pages Manual Test

1. **Profile settings** — set all new fields, save, reload, verify persistence
2. **Attachment edit** — set employment_type, program, description, cruising_area
3. **Languages edit** — add/remove languages with proficiency
4. **Profile page** — home_country flag in hero, sea time in hero, languages row, CV completeness prompt

### 7.4 — Pre-Flight Validation Test

1. Upload an image-only PDF → instant error: "couldn't read any text"
2. Upload a 50-byte PDF → instant error: "not enough text"
3. Upload a garbled-encoding PDF → instant error: "text looks garbled"
4. Upload a .doc file → instant error: "can't read .doc files"
5. Upload a valid PDF → passes validation, proceeds to parse
6. Upload a valid DOCX → passes validation, proceeds to parse

### 7.5 — CV Parse Test (9 Real CVs)

For each CV: upload → choose "Build my profile" → walk through wizard → verify extracted data → complete import → verify saved correctly → check profile completion %.

**Target: ≥80% profile completion after import for CVs with average completeness.**

**CVs:**
- [ ] Test CV 1 — land-based only, skills, hobbies, languages, education
- [ ] Test CV 2 (2023) — yacht experience, inline references, DOB, home_country
- [ ] Test CV 2 (2024) — same person, different format, cuisine skills
- [ ] Test CV 3 — references with yacht context, education, social media
- [ ] Test CV 4 — .doc file (error message), social media, GCSE grades
- [ ] Test CV 5 — B1B2, vaccination, certifications
- [ ] Test CV 6 — heavy freelance, 20+ positions, 5 references
- [ ] Test CV 7 — 4-page, chalet + yacht, multiple cookery schools
- [ ] Test CV 8 — 4-page, Michelin background, multiple yachts

### 7.6 — Wizard UX Test

1. **Speed test:** Upload a CV → time from "Build my profile" to celebration screen. Target: <60 seconds for a typical CV (user confirms quickly).
2. **Step 1 loads immediately** — no blank screen, existing data shown
3. **Parse progress** — staged messages visible ("Reading your CV..." etc.)
4. **Confirm cards** — "Looks good" works on every step
5. **Edit view** — expanding a card shows editable form with conflict highlights
6. **Empty fields** — NOT shown on confirm cards, available under "Add more details" in edit
7. **Yacht matching** — confident matches show green check, fuzzy matches show picker
8. **Yacht "Needs pick"** — radio card selection works, "None of these" creates new
9. **Skip** — dimming + undo works on yachts, certs, education
10. **Celebration screen** — completion %, stats, next steps all accurate
11. **State persistence** — refresh mid-wizard → resumes where left off (sessionStorage)
12. **Parse failure** — graceful fallback message, not dead-end

### 7.7 — Merge UX Test

1. Populate profile manually with some data
2. Upload a CV that has different values for the same fields
3. Verify confirm card shows merged result (CV values preferred)
4. Verify "Edit details" shows conflict fields with amber highlight + "was: {old}"
5. Verify duplicate yacht detection shows "already on your profile" with enrichment
6. Verify duplicate cert detection auto-enriches (adds issuing body)
7. Verify skills/hobbies shown as chips with existing items non-removable

### 7.8 — CV Preview/Viewer Test

1. Owner preview at /app/cv/preview — all fields, missing prompts, edit links
2. Public viewer (generated) at /u/[handle]/cv — clean render, no edit links
3. Public viewer (uploaded) — PDF iframe renders
4. "View CV" + "Download PDF" buttons on public profile
5. Mobile: preview readable at 375px

### 7.9 — PDF Generation Test

1. Generate PDF, verify new fields appear
2. Test with Test CV 6 (20+ positions) — layout doesn't break
3. Verify all 3 templates render correctly

### 7.10 — Two-Phase Code Review

Run `/review`:
- Phase 1 (Sonnet): schema mismatches, logic bugs, UX regressions, downstream callers
- Phase 2 (Opus): trace every changed contract, CHECK constraint consistency, RLS, GRANT, DOB REVOKE

### 7.11 — Fix All Findings

Fix P1 + P2. Log deferred.

### 7.12 — Pre-Commit

- [ ] CHANGELOG.md updated
- [ ] Module state files updated
- [ ] Sprint README status updated
- [ ] Files staged explicitly
- [ ] Commit message covers all changes

## Test CV Locations

```
/Users/ari/Library/CloudStorage/GoogleDrive-ari@steeleyachting.com/My Drive/~ The Yachtie Academy ~ Shared/CV's/
```

Real CVs — personal data must not be committed or logged.
