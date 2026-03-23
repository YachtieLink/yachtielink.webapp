# Sprint CV-Parse — CV Parse & Populate Rally + Build

**Phase:** 1B (must complete before Phase 1B closes — gate to Phase 1C)
**Priority:** P0 — this is the core onboarding experience
**Status:** 🏗️ Built — Code complete, reviewed, migration applied. Pending: manual testing with 9 real CVs + PR to main.
**Type:** Build (specs complete, co-authored with founder)
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

- **Two upload modes:** "Build my profile" (5-step wizard) vs "Just upload" (store only)
- **Batch confirm UX:** Show merged results as cards, user taps "Looks good" or edits. Never field-by-field radio buttons.
- **Never make them type:** If a field is empty, don't show a blank input. Say "add it later" and move on.
- **Pre-flight validation:** Catch unreadable files in <1 second, before the AI even runs
- **Retry logic:** Retry once on AI failure. If both fail, graceful fallback (manual fill), not dead-end.
- **Yacht matching pipeline:** 4 card states (matched/needs-pick/new/already-on-profile) with scoring
- **N+1 fix:** Batch yacht creation, attachment inserts, skill deduplication
- **CV viewable on profile:** Generated and uploaded CVs both accessible — owner preview + public viewer
- **Celebration screen:** After import, show completion %, stats, what's left
- **End-to-end test:** Upload 9 real CVs, verify ≥80% profile completion after import

---

## Exit Criteria

- [ ] Rally report with findings prioritized
- [ ] All P1/P2 findings fixed
- [ ] "Just upload" stores file, no parsing
- [ ] "Build my profile" launches 5-step wizard with progressive parse
- [ ] Pre-flight validation rejects unreadable files in <1s with helpful message
- [ ] AI parse retries once on failure, graceful fallback if both fail
- [ ] Wizard Step 1 loads immediately (no blank screen while parsing)
- [ ] Confirm cards: "Looks good" / "Edit" pattern works on every step
- [ ] Empty fields NOT shown on confirm cards — "add later" message
- [ ] Yacht matching: confident matches auto-confirmed, fuzzy matches show picker
- [ ] Yacht creation: new yachts created with builder from CV
- [ ] Duplicate yacht/cert detection: auto-enriches existing entries
- [ ] Skills/hobbies deduplication: no double-inserts
- [ ] Celebration screen: accurate completion %, stats, next steps
- [ ] Wizard state persisted to sessionStorage (resume on refresh)
- [ ] CV owner preview at /app/cv/preview — edit links + missing field prompts
- [ ] CV public viewer at /u/[handle]/cv — clean render, gated by cv_public
- [ ] PDF template includes all new fields (all 3 templates)
- [ ] Tested with 9 real CVs — ≥80% profile completion target
- [ ] Wizard speed test: <60 seconds upload-to-celebration
- [ ] Mobile: all wizard steps + CV preview work at 375px
- [ ] Build passes, `/review` clean

---

## Build Specs

Implementation-ready specs in `specs/`:

| Wave | File | Scope |
|------|------|-------|
| — | `merge-ux.md` | ConfirmCard, ConflictInput, ChipSelect patterns |
| 1 | `wave-1-migration.md` | 14 new columns, DOB REVOKE |
| 2 | `wave-2-edit-pages.md` | Settings, attachment edit, languages, cert issuing body, hero card |
| 3 | `wave-3-ai-prompt.md` | Pre-flight validation, retry, prompt rewrite, shared types |
| 4 | `wave-4-import-wizard.md` | 5-step wizard, yacht matching, celebration screen |
| 5 | `wave-5-save-function.md` | Batch save, dedup, completion %, error resilience |
| 6 | `wave-6-pdf-preview.md` | PDF template, CvPreview, public viewer |
| 7 | `wave-7-verification.md` | 9 CV tests, wizard UX tests, two-phase review |

Also: `build_plan.md` — AI prompt text, field mapping, architectural decisions.

## Key Files (Existing Code)

```
lib/cv/prompt.ts                       — AI extraction prompt (rewrite in Wave 3)
lib/cv/save-parsed-cv-data.ts          — Profile field merging (new function in Wave 5)
app/api/cv/parse/route.ts              — Parse API route (harden in Wave 3)
app/(protected)/app/cv/upload/page.tsx  — Upload page
components/cv/CvUploadClient.tsx        — Upload UI (two-path split in Wave 4)
components/cv/CvReviewClient.tsx        — Review/edit (replaced by wizard in Wave 4)
lib/storage/upload.ts                   — Storage upload helper
```

---

## Relationship to Phase Plan

This sprint gates Phase 1B completion. The Phase 1C sprints (availability, search, AI pack) all depend on reliable, complete profile data. If CV parse produces bad data, everything downstream is compromised.

```
Phase 1B: Sprint 11 → 12 → 13 → CV-Parse → Phase 1B Complete
Phase 1C: Sprint 14 → 15 → 16 → 17 → Phase 1C Complete
```
