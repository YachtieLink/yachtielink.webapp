# CV Review — Certification Fuzzy Matching & Database Building

**Status:** fleshed-out
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary
The CV review certifications step should fuzzy-match parsed cert names against the `certification_types` table rather than accepting free text. When the parser pulls "ENG" or "STCW BCT", the user should be prompted with the closest DB match (e.g. "ENG1 Medical Certificate") and can confirm or pick from alternatives. If a cert genuinely doesn't exist in the DB, the user can add it — crowdsourcing the certification database with every import.

Same pattern as the yacht matching proposal (`cv-review-existing-yacht-badge.md`) — match against the DB, show social proof, let the user override, and grow the database organically.

## Current Behaviour
- Parser extracts cert names as free text strings
- Review step shows them as-is with no DB matching
- Save function does dedup by exact name match against existing user certs — but doesn't match against `certification_types`
- Unrecognised certs are saved as `custom_cert_name` with no link to a `certification_type_id`
- The `certification_types` table exists but isn't used during CV import

## Proposed UX

### Card States

**Matched (green)** — parsed name fuzzy-matched a cert type in the DB
- Shows: DB cert name (not the raw parsed text), issuing body if known
- Social proof: "328 crew hold this certification" (count from `user_certifications` where `certification_type_id = X`)
- Action: "Not this cert?" → opens cert picker/search
- Action: "Edit" → edit expiry date, issuing authority

**Ambiguous (amber)** — multiple close matches (e.g. "ENG" could be ENG1 or ENG2)
- Shows: "Did you mean one of these?" with top 3 matches
- User taps the correct one
- Action: "None of these — add as new"

**Unmatched (blue)** — no DB match above threshold
- Shows: parsed name as-is
- Copy: "We don't recognise this certification. Would you like to add it to our database?"
- Action: "Add to database" → creates a new `certification_types` row (pending review flag if we want moderation)
- Action: "Skip" → exclude from import

### Matching Logic
- Use trigram similarity (`pg_trgm`) against `certification_types.name` — same approach as `search_yachts`
- Also match against `certification_types.abbreviation` if that column exists (or add it)
- Common aliases: "STCW BCT" → "STCW Basic Safety Training", "ENG" → "ENG1 Medical Certificate", "PST" → "Personal Survival Techniques"
- Build an alias/abbreviation mapping over time from user corrections

### Cert Picker (modal or inline)
- Text search input → queries `certification_types` by name/abbreviation
- Shows top results with: name, issuing body, how many crew hold it
- User taps one → card updates to matched state
- "Not here — add new certification" at bottom

### Database Growth
- Every "add to database" creates a new `certification_types` row
- Every confirmed match reinforces that the DB entry is correct
- Over time, the parser gets better context for common abbreviations
- Optional: flag user-created cert types for admin review before they appear in search for others

## Data Flow
1. CV parsed → cert names extracted as strings
2. Client calls API/server action: batch fuzzy-match cert names against `certification_types`
3. Returns: `{ parsedIndex, matchedCertTypeId, similarity, certName, crewCount, alternatives[] }[]`
4. `StepQualifications` shows matched/ambiguous/unmatched cards
5. User confirms, overrides, or adds new
6. Save links `user_certifications` to `certification_type_id` where matched, or creates new cert type + links

## Edge Cases
- "STCW BCT" — abbreviation, not a name. Need abbreviation matching or an alias table
- "ENG" — ambiguous (ENG1 vs ENG2). Show both as options
- Expired vs current — this is already handled by the expiry date field, no change needed
- Same cert from different issuers (MCA vs AMSA vs RYA) — match the cert type, let user pick issuer separately
- User adds a cert that already exists under a different name — dedup on admin review or suggest "Did you mean X?"

## Files Likely Affected
- `components/cv/steps/StepQualifications.tsx` — match UI, cert picker, card states
- `components/cv/CvImportWizard.tsx` — thread match results
- `lib/cv/save-parsed-cv-data.ts` — save with `certification_type_id` instead of just `custom_cert_name`
- New: API route or server action for batch cert matching
- New: `search_cert_types` RPC (trigram search on `certification_types`)
- Possibly: add `abbreviation` column to `certification_types`
- Possibly: add `created_by_user` / `review_status` columns for crowdsourced entries

## Relationship to Yacht Matching
This is the same pattern as `cv-review-existing-yacht-badge.md`:
- Parse → fuzzy match → show confidence → let user override → crowdsource gaps
- Both build the database with every import
- Both provide social proof ("12 crew on this yacht" / "328 crew hold this cert")
- Both should ship together or sequentially for a consistent review experience
