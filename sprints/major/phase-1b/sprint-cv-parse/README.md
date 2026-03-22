# Sprint CV-Parse — CV Parse & Populate Rally + Build

**Phase:** 1B (must complete before Phase 1B closes — gate to Phase 1C)
**Priority:** P0 — this is the core onboarding experience
**Status:** 🔲 Not Started
**Type:** Rally → Build (investigate first, then execute)
**Depends on:** Sprint 11 (CV upload infrastructure)

---

## Why This Sprint Exists

CV parse-and-populate is the single highest-value feature in YachtieLink. It's the difference between a 20-minute manual profile setup and a 30-second onboarding. Getting it wrong means bad data everywhere — wrong yacht associations, duplicate yachts, missing certs, overwritten profile fields. Getting it right means users land with a complete profile and immediately see the value.

The feature was built during early sprints (Sprint 7) before the review process, rally system, or lessons-learned existed. It has never been audited. Phase 1C depends on reliable profile data, so this must be solid before we move forward.

---

## Scope

### Phase 1: Rally (Investigate)

Full audit of the CV parse-and-populate chain:

1. **Upload flow** — file validation, storage, bucket permissions
2. **AI extraction** — OpenAI prompt quality, response parsing, error handling, edge cases (scanned PDFs, multi-language CVs, unusual formats)
3. **Yacht matching** — `search_yachts` RPC, similarity threshold, new yacht creation, deduplication
4. **Attachment creation** — role mapping, date normalization, duplicate prevention
5. **Certification matching** — cert type lookup, custom cert fallback, duplicate prevention
6. **Profile field merging** — which fields get overwritten, which are preserved, field-level control
7. **Error handling** — what happens when any step fails mid-chain (partial state)
8. **Rate limiting** — `check_cv_parse_limit` RPC, TOCTOU race
9. **Data quality** — test with 5+ real yachtie CVs, measure extraction accuracy
10. **N+1 performance** — sequential RPC + INSERT per employment entry (Rally 003 A6-F3)

### Phase 2: Build (Fix + Enhance)

Based on rally findings, plus these known requirements:

- **Two upload modes:** "Upload & populate" vs "Upload only" (see `sprints/backlog/cv-upload-modes.md`)
- **Overwrite warning:** When profile has existing data, warn before populating
- **Field-level control:** User can choose which fields to update from parsed CV
- **Yacht deduplication:** Verify `search_yachts` similarity matching works correctly
- **N+1 fix:** Batch yacht lookups and attachment inserts
- **CV viewable on profile:** Generated and uploaded CVs both accessible from CV & Sharing page
- **End-to-end test:** Upload a real CV, verify every field populates correctly

---

## Exit Criteria

- [ ] Rally report with findings prioritized
- [ ] All P1/P2 findings fixed
- [ ] Upload-only mode works (store CV, skip parsing)
- [ ] Upload-and-populate mode has overwrite warning for non-empty profiles
- [ ] CvReviewClient field exclusion checkboxes work correctly
- [ ] Yacht matching produces correct associations (not duplicates)
- [ ] Cert matching associates with correct cert types
- [ ] Error at any step shows user-friendly message
- [ ] CV is viewable/downloadable from CV & Sharing page
- [ ] Public profile shows download button when cv_public is enabled
- [ ] N+1 query pattern fixed (batched operations)
- [ ] Tested with 5+ real CVs of varying formats
- [ ] Build passes, `/review` clean

---

## Key Files

```
lib/cv/prompt.ts                       — AI extraction prompt
lib/cv/save-parsed-cv-data.ts          — Profile field merging + yacht/cert creation
app/api/cv/parse/route.ts              — Parse API route
app/(protected)/app/cv/upload/page.tsx  — Upload page
components/cv/CvUploadClient.tsx        — Upload UI
components/cv/CvReviewClient.tsx        — Review/edit parsed data before saving
lib/storage/upload.ts                   — Storage upload helper
sprints/backlog/cv-upload-modes.md      — Two-mode upload proposal
```

---

## Relationship to Phase Plan

This sprint gates Phase 1B completion. The Phase 1C sprints (availability, search, AI pack) all depend on reliable, complete profile data. If CV parse produces bad data, everything downstream is compromised.

```
Phase 1B: Sprint 11 → 12 → 13 → CV-Parse → Phase 1B Complete
Phase 1C: Sprint 14 → 15 → 16 → 17 → Phase 1C Complete
```
