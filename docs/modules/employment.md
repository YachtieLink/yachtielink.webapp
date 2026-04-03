---
module: employment
updated: 2026-04-03
status: shipped
phase: 1A
---

# Employment

One-line: Yacht entities as shared graph nodes, employment attachments linking crew to yachts, colleague discovery via shared attachments, and yacht detail pages with crew lists and cover photos.

## Current State

- Yacht entities: working — `yachts` table with name, yacht_type, size_category, length_meters, flag_state, year_built, is_established, cover_photo_url, created_by
- Yacht search: working — `ilike` name search used in both onboarding and attachment creation
- Yacht creation: working — users can create new yachts during onboarding or attachment flow (name, type, size, optional length)
- Duplicate prevention: planned per D-037 — fuzzy match at creation time with confirmation prompt; not yet implemented in code (current flow uses simple `ilike` search only)
- Yacht detail page: working at `/app/yacht/[id]` — shows cover photo, metadata (type, length, flag, year), crew count stat, and full crew list with role + date range
- Yacht cover photo: working — single photo per yacht, upload gated to users with attachment (D-038); overwrites previous photo
- Attachment creation: working — 3-step wizard at `/app/attachment/new` (yacht picker -> role selection with department filter -> date picker with "currently working" toggle)
- Attachment editing: working at `/app/attachment/[id]/edit` — edit role label, start/end dates, or soft-delete
- Attachment soft delete: working — sets `deleted_at` timestamp; preserves endorsements received for that yacht
- Role selection: working — loads from `roles` table with department grouping, search/filter, and custom role fallback
- Custom roles: logged to `other_role_entries` table for future reference taxonomy updates
- Colleague graph: working — `get_colleagues` RPC returns colleague IDs with shared yacht arrays; used for endorsement request flow
- Coworker verification: working — `are_coworkers_on_yacht` RPC used to gate endorsement creation
- Established yachts: `is_established` column exists; establishment rule (60 days + crew threshold per D-017) is defined but enforcement deferred
- No yacht merging: per D-006, duplicate yachts remain separate in Phase 1
- RLS: attachments scoped to own user via anon key; yacht reads are public (any authenticated user)
- Rate limiting: attachment creation goes through standard profile-edit limits

## Key Files

| What | Where |
|------|-------|
| Yacht detail page | `app/(protected)/app/yacht/[id]/page.tsx` |
| Yacht cover photo upload | `app/(protected)/app/yacht/[id]/photo/page.tsx` |
| New attachment wizard | `app/(protected)/app/attachment/new/page.tsx` |
| Edit attachment | `app/(protected)/app/attachment/[id]/edit/page.tsx` |
| Yacht picker component | `components/yacht/YachtPicker.tsx` |
| Profile queries (attachments) | `lib/queries/profile.ts` |
| Validation schemas | `lib/validation/schemas.ts` |

## Decisions

**2026-03-14** — D-039: Yacht photos — single cover photo in Sprint 4, full multi-photo gallery deferred to Phase 1B Sprint 11. Cover photo adds visual authenticity with minimal build cost. — Ari

**2026-03-14** — D-038: Yacht photo upload gated to users with a past or present attachment. Open upload would invite spam; attachment gating keeps the gallery credible by construction. — Ari

**2026-03-14** — D-037: Yacht duplicate prevention via creation-time fuzzy match prompt. Merge deferred to Phase 2. Duplicate yachts break the colleague graph; prevention at creation time solves the majority of the problem with minimal complexity. — Ari

**2026-01-28** — D-017: Yachts become "established" after 60 days AND reaching crew threshold. Balances open graph formation with protection against late-stage infiltration. — Ari

**2026-01-05** — D-008: Introduce yacht entities as verification infrastructure in Phase 1. Yacht attachment is the gating mechanism for endorsements — without this, endorsements are meaningless. — Ari

**2025-12-15** — D-006: Renamed or duplicate yachts remain separate entities in Phase 1. No merge functionality. Premature merging creates irreversible trust errors. — Ari

## Next Steps

- [ ] Implement fuzzy match duplicate prevention at yacht creation time (D-037)
- [ ] Enforce yacht establishment rule (is_established auto-set after 60 days + crew threshold)
- [ ] Full yacht photo gallery (Phase 1B Sprint 11, per D-039)
- [ ] Yacht merge tooling (Phase 2, per D-006)

## Recent Activity

**2026-04-03** — Rally 009 Session 6, Lane 1 (feat/cert-registry): Cert matching application layer on `certifications_registry`. New `lib/cv/cert-matching.ts`: `matchCertification()` via `search_certifications` RPC — green (≥0.6 auto-match), amber (0.3–0.59 ambiguous "did you mean?"), blue (<0.3 manual). `StepQualifications.tsx` rewritten with three card states, amber blocks wizard continuation, expiry nudges from `typical_validity_years`. `CvImportWizard.tsx` typed with exported `WizardCert`. Alias learning in `save-parsed-cv-data.ts` — confirmed aliases written back to registry aliases array. Migration 100004 (UPDATE policy on certifications_registry) required so alias writes succeed.

**2026-04-03** — Rally 009 Session 6, Lane 3 (feat/experience-transfer): Experience transfer system. `POST /api/transfer-experience`: moves attachment to another yacht, duplicate-attachment guard (400 if dest already active), audit log to `experience_transfers`, triggers dormancy recalc + colleague rebuild, returns `audit_logged`. `TransferExperienceButton` in CareerTimeline with 5-step UI (idle → pick yacht → confirm → transferring → success/error). Unified old `/api/attachment/transfer` endpoint to also call dormancy + rebuild. `experience_transfers` table + `attachments.is_dormant` column from migration 100003 (pre-session).

**2026-04-03** — Rally 009 Session 2, Lane 1 (feat/land-experience): New `land_experience` table (migration `20260403000001`). RLS: owner full access + public read for completed profiles. CV parser saves `employment_land` data via `save-parsed-cv-data.ts` with dedup on company+role. `industry` field saved. Land experience integrated into GDPR data export. New wizard step `StepLandExperience` for reviewing/editing shore-side roles. 4 CV re-parse data integrity fixes (trackOverwrite, education dedup, languages merge, travel docs union).

**2026-04-03** — Rally 009 Session 2, Lane 2 (fix/sea-time-overlap): New `lib/sea-time.ts` utilities: `mergeOverlappingRanges`, `calculateSeaTimeDays`, `detectOverlaps` (generic). Union-based sea time calculation replaces naive sum in `StepExperience.tsx`. Overlap detection with two-tier warning UI + amber ring highlights on overlapping cards. `parseCVDate` NaN guard added. Inverted range filter added.

**2026-03-23** — CV Parse Sprint: Attachment edit — 4 new fields (employment_type, yacht_program, description w/ 2000 char counter, cruising_area). Cert edit — issuing_body field. 5-step CV import wizard with yacht cards, skip/edit, celebration screen. `saveConfirmedImport()` with yacht search→create, cert type matching, batch operations. PDF templates enhanced with builder, program, description, cruising area per employment + issuing body per cert.
**2026-03-21** — Sprint 10.3: CV page bento button hierarchy — Share primary, Generate/Upload secondary, QR/Edit ghost; lock icons on Pro templates; `router.push` replacing `window.location.href`.
**2026-03-18** — Phase 1A Profile Robustness: `profile_queries.ts` extended — `getExtendedProfileSections()`, `getEndorserRoleOnYacht()` added to support employment context on public profile.
**2026-03-17** — Phase 1A Cleanup Spec 01: Fixed Wizard.tsx — `yachtielink.com` → `yachtie.link`, `Audience tab` → `Network tab`.
**2026-03-14** — Sprint 4 pre-planning: Decided yacht merging deferred to Phase 2; invest in creation-time duplicate prevention instead; single cover photo per yacht (attachment-gated); updated docs for Sprint 4 scope.
**2026-03-14** — Sprint 4: Migration `20260314000011_yacht_sprint4.sql` — `cover_photo_url` on yachts, `yacht_near_miss_log` table, `search_yachts` fuzzy RPC (trigram, 0.45 threshold), `yacht-photos` storage bucket. Built `YachtPicker.tsx` with fuzzy duplicate detection + near-miss logging. Built `/app/attachment/new` 3-step flow. Built `/app/attachment/[id]/edit` with soft-delete. Built `/app/yacht/[id]` detail page. Built `/app/yacht/[id]/photo` cover photo upload. Fixed `YachtsSection` link from `/u/:yacht_id` → `/app/yacht/:yacht_id`.
**2026-03-14** — Sprint 3: Built `YachtsSection` component — reverse-chronological attachment list, expand to view yacht / request endorsements / edit attachment.
**2026-03-13** — Sprint 1: Core schema — `yachts` table, `attachments` table, DB functions (`are_coworkers`, `are_coworkers_on_yacht`, `yacht_crew_count`, `get_colleagues`); seeded 7 departments and 56 roles across 8 departments.
**2026-03-13** — Feature spec: yacht type limited to Motor Yacht / Sailing Yacht, length in exact metres, flag state dropdown, year built optional; endorsement signals from yacht history deferred to Phase 1B.
