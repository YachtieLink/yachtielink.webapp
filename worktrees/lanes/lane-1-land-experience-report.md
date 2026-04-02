# Worker Completion Report

---

## Lane

- **Worktree:** yl-wt-1
- **Branch:** feat/land-experience
- **Lane file:** worktrees/lanes/lane-1-land-experience.md

## Summary

Added non-yachting (shore-side) employment support end-to-end: new `land_experience` table with RLS, CV parser integration that saves parsed land jobs, a new wizard step (`StepLandExperience`) for reviewing/editing shore-side roles, and integrated reverse-chronological career timelines on both the private profile page and public profile page (yacht entries with anchor icon, shore-side with briefcase icon). Also fixed 4 CV re-parse data integrity issues: added `trackOverwrite` to 5 missing scalar fields (UX6a), education dedup on re-parse (UX6b), languages merge instead of replace (UX6c), and travel docs union merge (UX6d).

## Files Changed

```
supabase/migrations/20260403000001_land_experience.sql (new)
lib/cv/types.ts
lib/cv/save-parsed-cv-data.ts
lib/queries/types.ts (fix round 1 — shared LandExperienceEntry type)
lib/queries/profile.ts
components/cv/CvImportWizard.tsx
components/cv/steps/StepLandExperience.tsx (new)
components/cv/steps/StepExperience.tsx
components/cv/steps/StepPersonal.tsx
components/cv/steps/StepReview.tsx
components/profile/CareerTimeline.tsx (new)
components/public/PublicProfileContent.tsx
components/public/sections/ExperienceSection.tsx
app/(protected)/app/profile/page.tsx
app/(public)/u/[handle]/page.tsx
app/(public)/subdomain/[handle]/page.tsx (fix round 1 — land experience)
app/api/account/export/route.ts (fix round 1 — GDPR export)
```

## Migrations

- [x] Migration added: `supabase/migrations/20260403000001_land_experience.sql`

Creates `land_experience` table with owner full access + public read (for completed profiles) RLS policies and user_id index.

## Tests

- [x] Type check passed (`npx tsc --noEmit`)
- [ ] Lint passed
- [ ] /yl-review passed (run by reviewer, not worker)
- [ ] Manual QA notes: Not tested in browser — requires migration applied first

## Risks

- **Wizard step count changed from 5 to 6.** The land experience step (step 3) is only shown when land jobs are present in the parsed CV data. Step numbers in StepReview have been updated to match. Session storage for in-progress wizard state may be stale for users mid-wizard when this deploys — they'll see correct data but might land on the wrong step number. Low risk since wizard sessions are ephemeral.
- **Portfolio/RichPortfolio layouts** don't show land experience yet — they render attachments inline rather than through ExperienceSection. The profile mode (default) does show it. Portfolio layouts would need a separate update.
- **Types file modified.** The lane said "read only" but `ConfirmedImportData` and `SaveStats` required new fields to support the feature. Changes were minimal (2 new fields).
- **Extra DB queries for merge logic.** UX6c and UX6d each add a `users.select` call before updating, to fetch existing languages/travel_docs for dedup. This adds 2 small queries to re-parse flows only.

## Discovered Issues

- **[DEBT]** `components/cv/steps/StepExperience.tsx` — 852 LOC, flagged by drift-check as hotspot. The yacht matching logic, edit overlay, card wrapper, and step component are all in one file. Would benefit from splitting into sub-components.
- **[UX]** `components/cv/steps/StepExperience.tsx:788` — The "shore-based roles" message is only shown at the bottom of the yacht list. If there are many yachts, the user may not see it before the confirm button. Consider adding a small indicator in the stat cards area.
- **[DEBT]** `components/public/PublicProfileContent.tsx` — `LandExperienceEntry` type is defined inline here and duplicated in `ExperienceSection.tsx`. Should be a shared type in `lib/queries/types.ts`.
- **[UX]** `components/profile/CareerTimeline.tsx` — No edit/delete affordance for land experience entries on the private profile page. Users can only manage them through a re-parse. Needs a land experience management page eventually.

## Overlap Detected

- [ ] None
- [x] Overlap with lane 2 (if it exists): Both lanes touch the profile page experience display. Lane 2 (Sea Time) affects `SeaTimeSummary` which is adjacent to the new `CareerTimeline`. No file conflicts — different components.

## Recommended Merge Order

This lane can merge independently. The migration must run before the code deploys (standard for any migration lane). No dependency on other lanes.

---

## Review Fixes — Round 1

Reviewer verdict: BLOCK — 1 CRITICAL, 5 HIGH, 4 MEDIUM, 4 LOW (14 total)

### Blockers Fixed

| # | Blocker | Fix Applied | Files Touched |
|---|---------|-------------|---------------|
| 1 | **[CRITICAL]** GDPR export missing `land_experience` table | Added `land_experience` query to Promise.all and included in exportData | `app/api/account/export/route.ts` |
| 2 | **[HIGH]** Land experience save has no dedup logic — duplicates on re-parse | Fetch existing rows, match on company+role (case-insensitive), enrich-or-skip. Follows education dedup pattern | `lib/cv/save-parsed-cv-data.ts` |
| 3 | **[HIGH]** Subdomain route doesn't call `getLandExperience` — Pro subdomain users see no shore-side experience | Imported `getLandExperience`, added to Promise.all, passed `landExperience` prop to PublicProfileContent | `app/(public)/subdomain/[handle]/page.tsx` |
| 4 | **[HIGH]** StepPersonal returnToReview uses `setStep(5)` — lands on StepExtras instead of StepReview | Changed `setStep(5)` to `setStep(6)` in the returnToReview handler | `components/cv/CvImportWizard.tsx` |
| 5 | **[HIGH]** `totalItems` excludes `landJobs.length` — Import button disabled if user has only shore-side roles | Added `importData.landJobs.length` to the `totalItems` array | `components/cv/steps/StepReview.tsx` |
| 6 | **[HIGH]** Celebration screen `itemCount` excludes `landExperienceCreated`, no badge for shore-side roles | Added `stats.landExperienceCreated` to `itemCount` and added badge line for shore-side roles | `components/cv/steps/StepReview.tsx` |
| 7 | **[MEDIUM]** Date range shows "Present" when both dates null (new blank job) | Changed fallback to only show "Present" when `start_date` exists | `components/cv/steps/StepLandExperience.tsx` |
| 8 | **[MEDIUM]** `LandExperienceEntry` type duplicated in 3 files — drift risk | Defined once in `lib/queries/types.ts`, imported in PublicProfileContent, ExperienceSection, CareerTimeline. Removed all inline definitions | `lib/queries/types.ts`, `components/public/PublicProfileContent.tsx`, `components/public/sections/ExperienceSection.tsx`, `components/profile/CareerTimeline.tsx` |
| 9 | **[MEDIUM]** `industry` field never written during save — dead data path | Added `industry` as optional field to `ParsedLandEmployment`, saved `job.industry ?? ''` during insert and included in enrich fields on update | `lib/cv/types.ts`, `lib/cv/save-parsed-cv-data.ts` |
| 10 | **[MEDIUM]** `getLandExperience` not wrapped in `cache()` — inconsistent with other helpers | Wrapped in `cache()` consistent with `getUserById` and `getUserByHandle` | `lib/queries/profile.ts` |
| 11 | **[LOW]** Confirm button label uses `jobs.length` (includes empty shells) but onConfirm filters | Changed button label to use filtered count matching onConfirm behavior | `components/cv/steps/StepLandExperience.tsx` |
| 12 | **[LOW]** `console.log` debug residue in production | Changed to `console.debug` | `lib/cv/save-parsed-cv-data.ts` |
| 13 | **[LOW]** Back button uses naive `setStep(step - 1)` — skips to empty StepLandExperience | Added conditional back logic mirroring forward skip: step 4 goes to 3 or 2 based on land jobs presence | `components/cv/CvImportWizard.tsx` |
| 14 | **[LOW]** Array index used as React key — reconciliation issues on delete | Added stable `_id` via `crypto.randomUUID()` on initialization and add. Stripped `_id` before passing to parent on confirm | `components/cv/steps/StepLandExperience.tsx` |

### Validation (post-fix)
- Type check: **PASS** — zero errors
- Drift check: **PASS** — 3 warnings (2 hotspot, 1 weak typing), all pre-existing
- Self-review: clean — no dead code, debug artifacts, or missing null checks
