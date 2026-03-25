# SRP / DRY / Complexity Audit

Date: 2026-03-25
Scope: `app/`, `components/`, `lib/`
Constraint: report only; no other files changed

## Verdict

- Grade: `6/10`
- Summary: not a Jenga tower yet, but no longer especially concise. The main problem is not raw LOC alone. It is duplicated end-to-end flows, especially CV import and photo/gallery handling, plus several oversized client components that mix data access, orchestration, and rendering.

## Structural Metrics

- `app/ + components/ + lib/`: `28,822` LOC
- Files over `600` LOC: `3`
- Files over `400` LOC: `7`
- Largest files:
  - `components/pdf/ProfilePdfDocument.tsx` - `985`
  - `components/onboarding/Wizard.tsx` - `711`
  - `components/public/PublicProfileContent.tsx` - `646`
  - `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` - `546`
  - `components/audience/AudienceTabs.tsx` - `469`
  - `components/cv/CvImportWizard.tsx` - `447`
  - `app/(protected)/app/profile/settings/page.tsx` - `445`
- Largest file overall is the PDF document renderer. That is debt, but the riskier files are the large stateful client components.

## Findings

### 1. [HIGH] CV import exists as two active pipelines plus leftover legacy artifacts

- `components/onboarding/Wizard.tsx:102-227` validates, uploads, parses, generates handles, and saves CV data directly during onboarding.
- `components/onboarding/Wizard.tsx:206-213` still calls deprecated `saveParsedCvData`.
- `components/cv/CvUploadClient.tsx:35-68` implements a second CV upload entry path and routes into the newer review wizard.
- `lib/cv/save-parsed-cv-data.ts:64-212` keeps the deprecated saver beside the new one at `lib/cv/save-parsed-cv-data.ts:216-397`.
- `components/cv/CvImportWizard.tsx:97-116` still accepts `existingAttachments`, `existingCerts`, and `existingEducation`, but never uses them.
- `components/cv/CvImportWizard.tsx:269-292` and `components/cv/CvImportWizard.tsx:427-441` build the same `ConfirmedImportData` shape twice.
- `components/cv/CvReviewClient.tsx:42-104` still carries a sessionStorage review flow keyed off `cv_parsed_data`, but no active writer sets that key anymore.

- Why it matters: CV import is the clearest active drift zone in the repo. Bug fixes or product changes now need to be applied across parallel flows, and the code already shows half-retired artifacts from prior iterations.

### 2. [HIGH] Photo and gallery features are copy-pasted variants at both the storage-helper and API layers

- `lib/storage/upload.ts:248-330` duplicates upload/delete logic for `user-photos` and `user-gallery`.
- `app/api/user-photos/route.ts:29-120` and `app/api/user-gallery/route.ts:29-102` duplicate auth, plan-limit checks, create flows, and reorder logic.
- `app/api/user-photos/[id]/route.ts:13-43` and `app/api/user-gallery/[id]/route.ts:34-56` duplicate ownership + storage deletion handling.
- `lib/stripe/pro.ts:14-40` already exists as the shared Pro-status helper, but both route files still inline `subscription_status === 'pro'`.

- Why it matters: upload limits, ownership rules, and reorder behavior now need synchronized edits in multiple files. This is classic DRY debt in an active subsystem, not harmless duplication.

### 3. [MEDIUM] CV/profile read models are duplicated instead of composed through one shared query layer

- `app/(protected)/app/cv/preview/page.tsx:12-25` and `app/(public)/u/[handle]/cv/page.tsx:48-56` repeat the same six section queries for attachments, certs, endorsements, education, skills, and hobbies.
- `lib/queries/profile.ts:115-150` already returns `photos`, but `app/(protected)/app/profile/page.tsx:32-43` re-queries `user_photos` anyway.
- `app/(public)/u/[handle]/page.tsx:54-91` builds another bespoke public-profile read model instead of leaning on a richer shared helper.

- Why it matters: profile and CV field changes will continue to fan out into multiple pages. The shared query layer exists, but it is only partially adopted.

### 4. [MEDIUM] The public profile surface is a real SRP hotspot

- `app/(public)/u/[handle]/page.tsx:97-177` performs viewer-relationship graph logic, saved-status lookup, mutual-colleague derivation, and page composition inline.
- `app/(public)/u/[handle]/page.tsx:192-200` then has to cast most of the payload with `as any`.
- `components/public/PublicProfileContent.tsx:61-85` defines `attachments`, `certifications`, and `endorsements` as `any[]`.
- `components/public/PublicProfileContent.tsx:146-645` combines mobile hero, desktop hero, contact card, CV CTA, and eight section renderers in one component.

- Why it matters: profile behavior and profile presentation are tightly coupled. Small feature changes now require editing a very large typed-weak surface.

### 5. [MEDIUM] Endorsement request UI is doing orchestration, transport, and presentation in one client component

- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx:68-545` owns share-link fetching, contact parsing, manual invite batching, colleague invite flow, WhatsApp/native sharing, rate-limit state, and rendering.
- The POST request construction is duplicated between `sendToColleague()` at `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx:154-184` and `handleSendContacts()` at `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx:188-230`.

- Why it matters: behavior changes in request sending or share transport will keep generating incidental churn inside one already-large UI file.

### 6. [MEDIUM] `ProfileSettingsPage` has crossed from "form page" into "mini feature module"

- `app/(protected)/app/profile/settings/page.tsx:85-185` handles auth lookup, initial load, normalization, and save logic inside the page.
- `app/(protected)/app/profile/settings/page.tsx:198-445` renders contact fields, personal details, travel-document chip management, visibility toggles, and submit UX in the same component.

- Why it matters: the file is still understandable, but it has no clean seam for extracting fetch/save logic or field-group subcomponents. It will get harder to change safely as more settings are added.

### 7. [MEDIUM] CV rendering logic is duplicated across HTML preview and PDF templates

- `components/cv/CvPreview.tsx:14-188` re-implements `formatDate`, `calculateAge`, `humanize`, and section rendering logic.
- `components/pdf/ProfilePdfDocument.tsx:444-539` defines the same helper layer again.
- `components/pdf/ProfilePdfDocument.tsx:543-717`, `components/pdf/ProfilePdfDocument.tsx:722-852`, and `components/pdf/ProfilePdfDocument.tsx:857-985` render three largely parallel template trees with the same domain sections.

- Why it matters: new CV fields or formatting rules now require synchronized edits across multiple renderers and multiple template branches.

### 8. [LOW] There are visible leftovers from partial refactors

- `components/audience/AudienceTabs.tsx:76-117` accepts `mostRecentYachtId`, but never uses it.
- `app/(protected)/app/network/page.tsx:103-149` still computes and passes it.

- Why it matters: small on its own, but it matches the broader pattern of partially consolidated features leaving dead surface area behind.

## What Is Not Actually Scary

- `lib/queries/profile.ts` is compact and directionally good. The repo does have a shared-query pattern; it just has not been applied consistently.
- `components/pdf/ProfilePdfDocument.tsx` is large mostly because it contains three full templates and their styles. That is maintenance debt, but less dangerous than a giant stateful controller component.
- This codebase is not in inevitable-failure territory. The risk is drift, not collapse.

## Bottom Line

- Current grade: `6/10`
- Translation: functional and recoverable, but already carrying real duplication debt.
- If left alone for a few more feature sprints, this likely drops into `4-5/10`.
- First cleanup targets:
  - unify CV import into one pipeline
  - extract shared photo/gallery helpers at the API and storage layers
  - centralize CV/profile read models behind shared query helpers

## Best Practices Going Forward

These are the operating rules that would both fix the current problem areas and help the project finish cleanly without recreating them elsewhere.

### 1. One Canonical Path Per Feature

- Every major feature gets one live workflow only.
- If a replacement flow ships, the old one must be deleted in the same sprint or explicitly retired immediately after cutover.
- No new work should land on deprecated paths like the old CV review/save flow just because it is still present.

Why this matters:

- The repo's worst duplication today comes from parallel live paths, not just repeated helpers.

### 2. Keep `app/` Thin

- Route handlers and page files should authenticate, validate input, call shared feature/query helpers, and return.
- Business rules, transport logic, data shaping, graph assembly, and external-service work should live in `lib/<feature>/...` or feature-specific helpers.
- If an `app/` file starts owning both orchestration and domain logic, split it before adding more UI.

Why this matters:

- The public profile page, endorsement request route, and saved-profiles route are already carrying too much mixed responsibility.

### 3. Shared Read Models Before Shared UI

- Before building or changing a complex surface, define one typed read model for it.
- Public profile, CV preview/PDF, and network relationship views should each have a shared data-builder layer.
- Components should receive typed, already-shaped props instead of raw Supabase rows and `any[]`.

Why this matters:

- Right now the same profile/CV data is being re-queried and reshaped in multiple pages.

### 4. Shared Section Renderers for Multi-Surface Content

- If the same domain section appears in more than one place, build the section once and adapt styling per surface.
- CV sections should be shared across owner preview, public CV view, and PDF generation.
- Profile sections should be split into focused section components rather than one giant render file.

Why this matters:

- The PDF templates are the clearest case of whole-section duplication.

### 5. Standardize CRUD Patterns

- User-owned list resources like skills, hobbies, photos, gallery, folders, and education should follow one route pattern and one client editing pattern.
- Shared concerns such as auth, validation, reorder logic, rollback logic, and Pro gating should be extracted once and reused.
- Similar edit pages should share form hooks or resource helpers instead of re-implementing load/save cycles.

Why this matters:

- The codebase already has repeat-pattern drift in both API routes and edit pages.

### 6. Centralize Business Rules, Never Inline Them Twice

- Pro status, handle rules, yacht matching, CV dedup logic, endorsement limits, and visibility/privacy rules should each have one source of truth.
- If a helper already exists, new code must use it rather than re-stating the rule locally.
- Inline checks should be treated as temporary debt to remove, not a normal pattern.

Why this matters:

- Inline Pro checks are already drifting away from `lib/stripe/pro.ts`.

### 7. Delete Dead Code Aggressively

- After every refactor or workflow replacement, remove dead props, dead branches, dead clients, and unused helper code in the same follow-up.
- Leaving "maybe still needed" code around should be the exception, not the default.
- If something must stay briefly, mark the removal condition clearly and track it in the sprint.

Why this matters:

- The repo already shows partial-refactor leftovers, especially in the CV area.

### 8. Put Size and Complexity Guardrails on New Work

- Treat `300+` LOC as a review warning, `400+` LOC as a split candidate, and `500+` LOC as "justify or refactor now."
- Large stateful client files should be split earlier than large presentational files.
- If a feature needs a large file temporarily, extract the next seam before the next sprint builds on it.

Why this matters:

- The average file size in the repo is healthy; the real risk comes from a small hotspot cluster growing unchecked.

### 9. No New Query Duplication Without Checking `lib/queries/`

- Before writing a new Supabase query for profile/CV/network data, check whether a shared query helper already exists.
- If two pages need near-identical data, extend the shared helper instead of cloning the query.
- The read layer should grow intentionally, not by page-by-page copy.

Why this matters:

- The repo has the beginnings of a good shared query layer, but adoption is inconsistent.

### 10. Separate Workflow State from Presentation

- Big flow components should become: orchestrator + extracted step components + service/helper layer.
- Validation, batching, and API transport should not sit inline inside giant JSX files if they are likely to change.
- Use focused hooks or feature services for state transitions and remote actions.

Why this matters:

- Several medium-risk components are acting like mini apps rather than UI units.

### 11. Make "Replacement Includes Cleanup" a Definition-of-Done Rule

- A sprint that replaces a flow is not done when the new flow works; it is done when the old one is removed and shared helpers are updated.
- "Works plus cleanup" should be part of the acceptance criteria for onboarding, CV, media, and network work.

Why this matters:

- Most of the current complexity is not from bad first drafts; it is from half-finished replacements.

### 12. Protect the Final Stretch With Finish-Focused QA

- For the rest of the project, prioritize finishing vertical slices over adding alternate implementations.
- Add lightweight smoke coverage or repeatable manual QA for the flows that matter most:
  - onboarding
  - CV upload/import
  - public profile
  - endorsement requests
  - photo/gallery upload
  - PDF generation
  - Pro upgrade flow
- Do not build new surface variants on top of duplicated flows that have not been consolidated yet.

Why this matters:

- The project is still recoverable because the debt is concentrated. Finishing cleanly now is mainly about discipline.
