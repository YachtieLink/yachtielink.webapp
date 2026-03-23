# Feature: Two-Pass CV Parse

**Started:** 2026-03-23
**Status:** ✅ Shipped
**Priority:** High

## Why Now

CV parsing takes 30-45 seconds. Users stare at a loading screen the entire time with nothing to do. Personal data (name, role, location, languages) can be extracted in ~5-10 seconds with a smaller AI prompt. By splitting into two passes, users start editing Step 1 immediately while the full parse runs in the background.

## Architecture

**Pass 1 (fast ~5-10s):** New route `/api/cv/parse-personal` — lightweight prompt extracts only `personal{}` + `languages[]`. User gets Step 1 with real data almost immediately.

**Pass 2 (background ~30-40s):** Existing `/api/cv/parse` — full extraction runs in parallel. When it completes, Steps 2-5 populate reactively. User may already be done editing Step 1 by then.

Both routes independently download + extract the file. At <10MB per CV this costs fractions of a cent per parse — not worth optimising at launch scale.

## Scope

### Create

| File | Purpose |
|------|---------|
| `lib/cv/extract-text.ts` | Shared helper: download file, extract PDF/DOCX text, validate, truncate |
| `app/api/cv/parse-personal/route.ts` | Fast parse route — personal + languages only |

### Modify

| File | Change |
|------|--------|
| `lib/cv/prompt.ts` | Add `CV_PERSONAL_PROMPT` (smaller, personal + languages only) |
| `app/api/cv/parse/route.ts` | Refactor to use shared `extractCvText()` from extract-text.ts |
| `components/cv/CvImportWizard.tsx` | Two parallel fetches, split loading states, pass personal data to Step 1 |
| `components/cv/steps/StepPersonal.tsx` | Decouple button disable from full `parseLoading` — use `parsePersonalLoading` instead |

## Review Findings Addressed

### CRITICAL: StepPersonal buttons disabled by full parseLoading

StepPersonal has `disabled={parseLoading}` on both "Looks good" and "Edit details" buttons. Under two-pass, `parseLoading` (full parse) is still true when Step 1 renders — blocking the user from interacting. **Fix:** Pass a separate `personalReady` prop (or rename `parseLoading` to `parsePersonalLoading` for Step 1). Buttons enable when personal data is available, regardless of full parse status.

### CRITICAL: StepPersonal state initialisation from props

StepPersonal initialises `useState` hooks from `parsed` props at mount time. Under two-pass, fast-parse personal data arrives via different props than the full parsed object. **Fix:** Wizard passes `parsedPersonal ?? parsed?.personal` to StepPersonal. The component's existing re-merge logic (lines 66-81) handles late-arriving data.

### HIGH: Conflict resolution — fast parse vs full parse personal data

Fast parse is canonical for personal fields. Once fast parse returns, the wizard sets `parsedPersonal` and never overwrites it from full parse. Full parse personal data is ignored — it exists in `parsed` but Step 1 only reads from `parsedPersonal`. This avoids field flickering mid-edit.

### HIGH: SessionStorage resume between fast and full parse

If user refreshes after fast parse but before full parse:
- SessionStorage has `parsedPersonal` + `parsedLanguages` but `parsed` is null
- On resume: restore personal data, re-fire full parse only
- Full parse re-fire does NOT count against 3/day limit (the `check_cv_parse_limit` RPC was already called on first attempt and the window is still open)
- Guard: if `parsed` exists in sessionStorage, skip both fetches entirely (existing behaviour)

### HIGH: Auth, ownership, validation on parse-personal route

The new route has the SAME preamble as the existing parse route:
- `supabase.auth.getUser()` — 401 if missing
- `validateBody(req, parseCVSchema)` — validate storagePath
- Ownership guard: `storagePath.startsWith(user.id)`
- `.doc` rejection (handled by `extractCvText()`)
- `applyRateLimit(req, 'fileUpload', user.id)` — same category, prevents abuse

### MEDIUM: cv_storage_path / cv_parsed_at update

Only the FULL parse route writes `cv_storage_path` and `cv_parsed_at` to the users table. The fast parse route does not touch the users table. This ensures these fields reflect a complete parse.

### MEDIUM: Race condition — full parse returns before fast parse

Guard in wizard: if `parsed` is already set when fast parse returns, ignore the fast parse result. Use `parsed.personal` instead. This handles the unlikely case where full parse wins the race.

## Implementation Detail

### 1. `lib/cv/extract-text.ts`

Extract the shared logic from the parse route into a reusable helper:

```ts
export async function extractCvText(storagePath: string): Promise<
  { text: string; warning?: string } | { error: string; status: number }
>
```

Contains: service client file download, PDF extraction (pdf-parse with 15s timeout), DOCX extraction (mammoth), .doc rejection, pre-flight validation (empty, too short, garbled), truncation to 25K chars.

### 2. `CV_PERSONAL_PROMPT` in prompt.ts

Lightweight prompt returning JSON with only `personal` and `languages`. Same field names and extraction rules as the full prompt, just scoped to personal section. ~30% of the full prompt size.

### 3. `/api/cv/parse-personal` route

- `maxDuration = 30`
- Auth + ownership + body validation + rate limit (same as full parse)
- Uses `extractCvText()` for file handling
- `max_tokens: 2000`, 15s timeout, no retry
- Does NOT count against 3/day `check_cv_parse_limit` (only full parse does)
- Does NOT update `cv_storage_path` / `cv_parsed_at`
- Returns `{ ok: true, data: { personal, languages } }`

### 4. Refactor `/api/cv/parse` route

- Replace inline text extraction with `extractCvText()` call
- Everything else stays the same (auth, rate limit, AI call, user record update)

### 5. `CvImportWizard.tsx` changes

**New state:**
- `parsePersonalLoading` (boolean, starts true)
- `parsedPersonal` (ParsedPersonal | null)
- `parsedLanguages` (ParsedLanguage[] | null)

**On mount — two parallel fetches:**
```
fetch('/api/cv/parse-personal') → sets parsedPersonal + parsedLanguages, clears parsePersonalLoading
fetch('/api/cv/parse')          → sets full parsed data, clears parseLoading
```

**Race guard:** If full parse completes first, set `parsedPersonal` from `parsed.personal` and clear `parsePersonalLoading`. Ignore later fast-parse result.

**Fallback:** If fast parse fails, don't show error. Keep showing ParseProgress. Full parse will still complete and populate everything (including personal).

**Render logic:**
- `parsePersonalLoading === true` → show ParseProgress (animated loading screen)
- `parsePersonalLoading === false` → show wizard steps
  - Step 1 receives `parsedPersonal` + `parsedLanguages` + `parsePersonalLoading: false`
  - Steps 2-5 receive `parseLoading` as before → show skeletons until full parse completes

**SessionStorage:** Persist `parsedPersonal` + `parsedLanguages` alongside existing fields. On resume: if `parsed` exists, skip both fetches. If only `parsedPersonal` exists, skip fast fetch, re-fire full fetch only.

### 6. `StepPersonal.tsx` changes

- Rename `parseLoading` prop to `loading` (or add `personalReady` prop)
- Button `disabled` checks `loading` (which is `parsePersonalLoading`, not full `parseLoading`)
- No other changes — existing re-merge logic handles data flow correctly

## Out of Scope

- Streaming/SSE from the AI call
- Caching extracted text between routes (optimise later if needed)
- Splitting the full parse into more than 2 passes
- Changing the save function
- Changing Steps 2-5 components

## Files Affected

- `lib/cv/extract-text.ts` (new)
- `lib/cv/prompt.ts`
- `app/api/cv/parse-personal/route.ts` (new)
- `app/api/cv/parse/route.ts`
- `components/cv/CvImportWizard.tsx`
- `components/cv/steps/StepPersonal.tsx`

## Exit Criteria

- [ ] Fast parse returns personal + languages in <10s
- [ ] Step 1 shows real data and buttons are ENABLED while Steps 2-5 show loading skeletons
- [ ] User can confirm Step 1 and advance to Step 2 (which shows skeleton until full parse completes)
- [ ] Full parse completes in background, Steps 2-5 populate automatically
- [ ] If fast parse fails, falls back to full parse loading (no error shown)
- [ ] If full parse fails, error screen shows correctly
- [ ] If full parse returns before fast parse, Step 1 still works correctly
- [ ] SessionStorage resume works: refresh after fast parse but before full parse restores Step 1 data and re-fires full parse
- [ ] Rate limit: only full parse counts against 3/day
- [ ] Build passes
