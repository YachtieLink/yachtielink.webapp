# Sprint 11: CV Onboarding + Public Profile Polish — Detailed Build Plan

## Context

Phase 1A is code-complete on `feat/ui-refresh-phase1`. Sprint 11 is the first Phase 1B sprint. The centrepiece is rebuilding the onboarding wizard around CV upload — one file drop, then land on a populated profile. Under a minute of active input.

**Salty mascot moved to Phase 2/3.** Sprint 11 focuses on the activation funnel.

---

## What Already Exists

**CV parsing pipeline (Sprint 6, fully working):**
- `components/cv/CvUploadClient.tsx` — drag-drop upload UI (PDF/DOCX, 10MB limit)
- `app/api/cv/parse/route.ts` — OpenAI GPT-4o-mini structured extraction
- `lib/cv/prompt.ts` — extraction prompt (employment history, certs, languages, role, bio, location, full_name)
- `components/cv/CvReviewClient.tsx` — editable review form, saves to profile (yachts, certs, profile fields)
- `lib/storage/upload.ts` — `uploadCV(userId, file)` helper
- `cv-uploads` bucket with RLS, rate limiting via `check_cv_parse_limit` RPC (3/day)
- Estimated parse time: **5–8 seconds** (upload 1-2s, text extraction <1s, LLM call 3-6s)

**Handle generation (exists):**
- `suggest_handles` RPC — generates handle suggestions from full_name
- `handle_available` RPC — checks handle uniqueness
- Both used in current `StepHandle` component

**Current onboarding wizard (`components/onboarding/Wizard.tsx`, 1140 lines):**
```
Step 1: NAME         — full name + optional display name
Step 2: HANDLE       — unique @username, live availability check
Step 3: ROLE         — department chip select → role picker from DB
Step 4: YACHT        — search or create yacht + attachment (skippable)
Step 5: ENDORSEMENTS — email up to 5 colleagues (skippable, auto-skips if no yacht)
Step 6: DONE         — shows profile URL, auto-redirects to /app/profile after 2.2s
```

**Other codebase state (validated 2026-03-21):**
- Section colors: `lib/section-colors.ts` fully defined (missing `experience` key)
- Framer Motion presets: all exist in `lib/motion.ts`
- ProfileAccordion: 8 instances in `PublicProfileContent.tsx`, no `accentColor` prop
- OG image: working route at `/app/api/og/route.tsx`
- QR code: `PublicQRCode.tsx` + `IdentityCard.tsx` using `react-qr-code` v2.0.18
- Mobile hero: 70vh. Dark mode: tokens ready, force-disabled.
- Font files: NOT in `public/fonts/`

---

## Pre-flight Checklist

- [ ] Phase 1A branch merged to `main` (`npm run build` zero errors)
- [ ] Privacy page business address resolved or deferred
- [ ] Add `experience: "navy"` to `sectionColors` map in `lib/section-colors.ts`
- [ ] Download DM Serif Display + DM Sans `.ttf` files to `public/fonts/`
- [ ] Install `html-to-image`: `npm install html-to-image`

---

## Part 1: Onboarding Rebuild — CV-First Flow

**Effort:** 2–3 days (centrepiece)
**File:** `components/onboarding/Wizard.tsx`
**Design refs:** `docs/design-system/philosophy.md` (Instant Good), `docs/design-system/flows/onboarding.md`

### 1a. New flow — two paths

The wizard is now a fork: upload a CV or enter manually. The CV path has **one user interaction** (drop a file), then a loading screen, then they're in the app.

```
                    ┌─ CV UPLOAD ─→ "Setting up your profile…" ─→ /app/profile
ONBOARDING START ──→│
                    └─ SKIP ─→ NAME ─→ HANDLE ─→ /app/profile
```

**CV path (one interaction + loading screen):**
1. User sees upload screen: "Got a CV? Drop it here and we'll do the rest."
2. User drops PDF/DOCX
3. Loading screen: "Setting up your profile…" (~5-8 seconds)
4. Behind the scenes: upload → parse → auto-generate handle → save everything
5. Redirect to `/app/profile` with populated profile
6. User reviews and edits any field on their profile page

**Manual path (two interactions):**
1. User taps "Skip — I'll add my details manually"
2. Name step (existing `StepName`, unchanged)
3. Handle step (existing `StepHandle`, unchanged)
4. Redirect to `/app/profile` with empty profile
5. User fills in details via profile page + ProfileStrength prompts

### 1b. STEPS array

```tsx
// BEFORE
const STEPS = ["name", "handle", "role", "yacht", "endorsements", "done"] as const;

// AFTER — two paths share the same array, skip logic handles branching
const STEPS = ["cv-upload", "name", "handle", "done"] as const;
```

`getStartingStep()`:
```tsx
function getStartingStep(data: WizardProps["initialData"]): number {
  // If they already have a handle, onboarding is effectively complete
  if (data.handle) return 3; // done
  // If they have a name but no handle, they're on the manual path
  if (data.full_name) return 2; // handle
  // Otherwise start at cv-upload
  return 0;
}
```

Progress bar: **2 visible segments for CV path** (upload + processing), **2 for manual path** (name + handle). Or simply hide the progress bar — onboarding is so short now it doesn't need one. Founder call.

### 1c. StepCvUpload component

First screen the user sees after signup:

```
┌─────────────────────────────────────┐
│                                     │
│  Got a CV handy?                    │
│  Drop it here and we'll set up      │
│  your profile for you.              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │       ⬆ (upload icon)       │    │
│  │                             │    │
│  │  Drag & drop your CV here   │    │
│  │    or tap to browse files   │    │
│  │                             │    │
│  │    PDF or DOCX · Max 10 MB  │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Skip — I'll add my details manually│
│                                     │
└─────────────────────────────────────┘
```

**On file drop — transition to loading screen:**

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         (spinner animation)         │
│                                     │
│    Setting up your profile…         │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

No progress steps, no confirmation screen. User waits ~5-8 seconds, then lands on their profile. The profile page IS the review.

**On skip:** Advance to `name` step (index 1).

### 1d. Behind the loading screen — parallel operations

While "Setting up your profile…" is showing, run everything in parallel where possible:

```
1. Upload file to storage                          → storagePath
2. Parse CV via /api/cv/parse                      → ParsedData
3. ──── After parse completes ────
   a. Auto-generate handle:
      - Extract full_name from parsed data
      - Call suggest_handles RPC with full_name     → ["sarah-mitchell", "s-mitchell", ...]
      - Call handle_available RPC on first suggestion
      - Use first available handle
   b. Save all data via saveParsedCvData():
      - User profile: full_name, display_name (first name), primary_role, bio, location
      - Handle: auto-generated
      - Yachts + attachments: from employment_history
      - Certifications: from certifications
      - Set onboarding_complete = true
4. Redirect to /app/profile
```

Steps 3a and 3b can run in parallel — handle generation doesn't depend on yacht/cert saves.

**Display name logic:** If CV extracts "Sarah Mitchell", set `display_name` to "Sarah" (first token of full_name). Same logic as existing `StepName` default.

### 1e. Error handling during loading screen

The loading screen assumes success. When it fails:

| Scenario | Behaviour |
|----------|-----------|
| Upload fails | Show error inline on upload screen (before loading): "Upload failed. Try again or skip." — user never sees loading screen |
| Parse fails (API error, timeout) | Loading screen transitions to: "Couldn't read that file. Try a different one, or add details manually." — two buttons: [Try again] [Add manually] |
| Parse returns empty/unusable | Same as parse fail — "Couldn't find enough to work with." |
| Rate limit (3/day) | "You've used your uploads for today. Add details manually for now." — [Add manually] button → name step |
| Handle generation fails (all suggestions taken) | Fall back to `user-{random6}` pattern. Extremely unlikely but handled. User changes it in settings. |
| Save fails (DB error) | Log to Sentry. Show: "Something went wrong. Let's try the manual route." → name step. Parsed data is lost — but they can re-upload from /app/cv/upload later. |

### 1f. Save logic — `lib/cv/save-parsed-cv-data.ts`

Shared save function used by both onboarding and standalone review page:

```tsx
interface ParsedData {
  full_name?: string | null
  bio?: string | null
  location?: { country?: string | null; city?: string | null } | null
  employment_history?: ParsedEmployment[]
  certifications?: ParsedCertification[]
  languages?: string[]
  primary_role?: string | null
}

interface SaveOptions {
  /** Also set these fields on the user record (e.g., handle, display_name, onboarding_complete) */
  additionalUserFields?: Record<string, unknown>
  /** Skip updating profile fields that already have a value */
  skipExistingFields?: boolean
}

interface SaveResult {
  ok: true
  stats: {
    yachtsCreated: number
    attachmentsCreated: number
    certificationsCreated: number
    profileFieldsUpdated: string[]
  }
} | { ok: false; error: string }

export async function saveParsedCvData(
  supabase: SupabaseClient,
  userId: string,
  data: ParsedData,
  options?: SaveOptions
): Promise<SaveResult>
```

**Implementation — reuse logic from `CvReviewClient.handleSave()` (lines 100-211):**

1. **User profile update:**
   - Set `full_name`, `primary_role`, `bio`, `location_country`, `location_city` from parsed data
   - Merge `additionalUserFields` (handle, display_name, onboarding_complete for onboarding context)
   - If `skipExistingFields`, only update fields that are currently null/empty

2. **Yachts + attachments (for each `employment_history` entry):**
   - `search_yachts` RPC to fuzzy-match existing yachts (similarity > 0.3)
   - Create new yacht if no match (name, type, length_m, flag_state, created_by)
   - Create attachment (user_id, yacht_id, role_label, started_at, ended_at)
   - `normalizeDateToISO()` for YYYY and YYYY-MM formats (reuse existing helper)

3. **Certifications (for each `certifications` entry):**
   - Match against `certification_types` table by name/short_name (case-insensitive)
   - Create cert record with matched `certification_type_id` or `custom_cert_name`
   - Set `issued_at`, `expires_at` with date normalisation

4. Return stats for logging/debugging

**Onboarding calls it with:**
```tsx
await saveParsedCvData(supabase, userId, parsedData, {
  additionalUserFields: {
    handle: autoGeneratedHandle,
    display_name: parsedData.full_name?.split(' ')[0] ?? '',
    onboarding_complete: true,
    cv_parsed_at: new Date().toISOString(),
  },
})
```

### 1g. Refactor CvReviewClient to use shared save

Update `components/cv/CvReviewClient.tsx`:
- Replace inline save logic (~110 lines) with call to `saveParsedCvData()`
- Keep the editable review UI — user still reviews fields before saving in standalone flow
- Pass `skipExistingFields: true` to avoid overwriting intentional edits

### 1h. Remove dead wizard code

**Remove from wizard render + handlers:**
- `StepRole` render branch + `handleRoleNext`
- `StepYacht` render branch + `handleYachtNext`, `handleYachtSkip`
- `StepEndorsements` render branch + `handleEndorsementsNext`, `handleEndorsementsSkip`
- State: `departments`, `primaryRole`, `yachtId`, `yachtName`

**Keep step component definitions** (StepRole, StepYacht, StepEndorsements, RoleRow) — move to a separate file `components/onboarding/removed-steps.tsx` or delete entirely. They exist on the profile page in different form already.

### 1i. Standalone CV flow unchanged

`/app/cv/upload` → `/app/cv/review` still works for re-uploads and post-onboarding use. Only change: `CvReviewClient` now calls `saveParsedCvData()` instead of inline logic.

### 1j. Verification

```bash
# STEPS array updated
grep "STEPS" components/onboarding/Wizard.tsx
# Expected: ["cv-upload", "name", "handle", "done"]

# StepCvUpload exists
grep "StepCvUpload" components/onboarding/Wizard.tsx

# Save utility exists
test -f lib/cv/save-parsed-cv-data.ts && echo "exists"

# CvReviewClient uses shared save
grep "saveParsedCvData" components/cv/CvReviewClient.tsx

# Manual test — CV path:
# 1. Create new account (or reset onboarding_complete for dev-qa)
# 2. See CV upload screen → drop a test PDF
# 3. See "Setting up your profile…" loading screen (~5-8s)
# 4. Redirected to /app/profile
# 5. Verify: name, handle, role, yachts, certs, bio all populated
# 6. Verify: handle auto-generated and visible at yachtie.link/u/{handle}

# Manual test — Skip path:
# 1. Create new account
# 2. CV upload screen → "Skip — I'll add my details manually"
# 3. Name step → enter name → continue
# 4. Handle step → pick handle → continue
# 5. Redirected to /app/profile
# 6. Verify: only name + handle set, rest empty, ProfileStrength shows prompts

# Manual test — Error:
# 1. Upload a .jpg → verify rejection before loading screen
# 2. Upload a broken PDF → verify graceful fallback to manual path

# Manual test — Standalone re-upload:
# 1. Go to /app/cv/upload → upload PDF → review page → save → verify profile updated
```

---

## Part 2: Section Colours on Public Profile

**Effort:** 0.5–1 day

### 2a. Add `experience: "navy"` to sectionColors
**File:** `lib/section-colors.ts`

### 2b. Add `accentColor` prop to ProfileAccordion
**File:** `components/profile/ProfileAccordion.tsx`
- Left border: 3px solid `accent500`
- Chevron: tinted `accent500` when expanded

### 2c. Thread through PublicProfileContent
**File:** `components/public/PublicProfileContent.tsx` — 6 of 8 accordions:

| Section | Colour | Section | Colour |
|---------|--------|---------|--------|
| About | teal | Education | teal |
| Experience | navy | Hobbies | — |
| Endorsements | coral | Skills | — |
| Certifications | amber | Gallery | teal |

### 2d. Implement accentColor in EmptyState
**File:** `components/ui/EmptyState.tsx` — prop exists, implement rendering.

### 2e. Dark mode 700-level overrides
**File:** `app/globals.css` — add coral-700, navy-700, amber-700, teal-900 dark mode values.

### 2f. Own-profile section colours — DEFERRED
Uses `ProfileSectionGrid`, not `ProfileAccordion`. Follow-up.

---

## Part 3: Public Profile Motion Polish

**Effort:** 0.5 day

### 3a. Staggered endorsement cards
`staggerContainer` + `fadeUp` wrappers on endorsement list.

### 3b. Card hover effects
`cardHover` preset on endorsement and yacht cards.

---

## Part 4: OG Image Enhancement

**Effort:** 0.5–1 day
**Hard dep:** `.ttf` files in `public/fonts/`

### 4a. Layout
Photo left (rounded-xl), name (DM Serif Display) + role + handle right, teal branded bottom strip. No wave pattern. No section colour dots.

### 4b. Font loading
`.ttf` via `import.meta.url` → `arrayBuffer()`. Fallback: system sans-serif.

### 4c. Edge cases
No photo → logo. Long names → truncate. No role → omit.

### 4d. Social sharing validation
WhatsApp preview, Twitter/X cards.

---

## Part 5: QR Code Polish

**Effort:** 0.5 day

### 5a. Branded QR card
160px, error correction `"H"`, teal border, CSS logo overlay, name + `@handle` below.

### 5b. Download as PNG
`html-to-image`, SVG fallback for iOS Safari. Free-tier.

---

## Part 6: Profile Templates (STRETCH)

**Effort:** 2–3 days. Only if Parts 1-5 complete.
2 templates (Classic + Bold), CSS-driven, Pro-gated. New `profile_template text` column.

---

## Sequencing

```
Day 1-3:   Part 1 (Onboarding Rebuild)
Day 3-4:   Part 2 (Section Colours)
Day 4:     Part 3 (Motion Polish)
Day 5:     Part 4 (OG Image) + Part 5 (QR Code)
Day 6:     Testing, mobile QA, cleanup
Day 7+:    Part 6 (Templates) — stretch
```

**Estimated total:** 5–7 days core. 7–9 with stretch.

---

## Exit Criteria

### Required

```
□ CV path: drop file → loading screen → land on populated /app/profile (~5-8s)
□ CV saves: full_name, handle (auto-generated), role, yachts, certs, bio, location
□ Manual path: skip → name → handle → empty /app/profile
□ Error handling: parse fail / rate limit → graceful fallback to manual path
□ Standalone CV flow (/app/cv/upload + /app/cv/review) still works
□ Save logic shared via lib/cv/save-parsed-cv-data.ts
□ Public profiles use section colours (6 of 8 accordions)
□ OG image: photo, DM Serif Display, branding
□ QR code: branded, PNG download
□ All new CSS uses token variables
□ Mobile-first: no regressions at 375px
□ npm run build zero errors
```

### Stretch

```
□ Profile templates (2 variants, Pro-gated)
□ Section colours on own-profile view
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Parse takes >10s, user thinks it's broken | Medium | High | Progress animation with stages ("Uploading… Reading… Setting up…"); timeout at 30s → fallback to manual |
| Auto-generated handle is unwanted | Low | Low | User changes in settings; handle is always editable post-onboarding |
| Parse quality varies by CV format | Medium | Medium | Profile page is the review — user edits any field; existing prompt handles most formats |
| Removing role/yacht steps reduces completeness | Medium | Medium | CV path handles both; manual path relies on ProfileStrength prompts |
| Wizard refactor breaks name/handle steps | Low | Medium | Steps are unchanged — just moved in the array |
| OG font loading fails | Medium | Low | Fallback to system sans-serif |
| `html-to-image` iOS Safari issues | Medium | Low | SVG download fallback |

---

## Notes

> **One file drop. One loading screen. You're in.** That's the CV onboarding promise. No reviewing, no confirming, no extra steps. The profile page is the review.

> **Handle auto-generation is the enabler.** Without it, we'd still need a manual step. `suggest_handles` RPC already exists — we just call it with the CV-extracted name instead of requiring user input.

> **The manual path is the safety net.** No CV? No problem. Name → handle → in. Two inputs, done.

> **Endorsement invites move to contextual in-app prompts.** "Invite colleagues" during signup is a cold ask. After adding a yacht and seeing crew appear — that's when it makes sense. Future sprint scope.
