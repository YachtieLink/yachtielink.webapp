# Wave 3: AI Prompt Rewrite + Parse Chain Hardening

## Scope

Rewrite AI extraction prompt from ~6 fields to ~40. Add pre-flight text validation. Add retry logic. Update TypeScript types. Fix .doc handling. Field names reference `field-registry.md`.

## Files

| File | Action |
|------|--------|
| `lib/cv/prompt.ts` | REWRITE -- complete new extraction prompt |
| `lib/cv/validate.ts` | CREATE -- pre-flight text validation |
| `lib/cv/types.ts` | CREATE -- shared parsed CV types |
| `app/api/cv/parse/route.ts` | MODIFY -- validation, retry, limits, .doc |

## Pre-Flight Validation (Fail Early)

**New file: `lib/cv/validate.ts`**

After text extraction, before AI call. Catches bad files in <1 second.

```ts
interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
  charCount: number
}

export function validateExtractedText(text: string): ValidationResult
```

Checks:
- charCount === 0: "couldn't read any text" (corrupt/image-only/encrypted)
- charCount < 200: "not enough text for a CV"
- nonAsciiRatio > 0.4: "text looks garbled"
- charCount > 25000: warning "long document, will focus on key sections"

## Retry Logic

Wrap AI call with 1 retry, 30s timeout, AbortController.

```ts
async function callAiWithRetry(prompt: string, text: string, maxRetries = 1): Promise<ParsedCvData>
```

If both attempts fail: return structured error (wizard handles gracefully).

## New AI Prompt

Replace entire `CV_EXTRACTION_PROMPT`. The prompt asks AI to return JSON with these top-level keys:

- `personal{}` -- UF1-UF6 fields plus name, role, bio, phone, email, location
- `languages[]` -- UF7 shape: {language, proficiency}
- `employment_yacht[]` -- yacht entries with YF1, AF1-AF4 fields plus name, type, length, flag, dates, crew/guest counts, former_names
- `employment_land[]` -- non-yacht jobs (displayed in wizard, not stored)
- `certifications[]` -- with EF1 (issuing body), category, dates
- `education[]` -- institution, qualification, field, location, dates
- `skills[]` -- string array
- `hobbies[]` -- string array
- `references[]` -- name, role, yacht/company, contact info
- `social_media{}` -- instagram handle, website

Prompt rules: yacht CVs are reverse-chronological, convert feet to meters, M/Y = motor yacht, S/Y = sailing yacht, former names in parentheses, builder names are shipyards, parse cert expiry from inline notes, only extract references with name + contact method.

## TypeScript Types

**New file: `lib/cv/types.ts`**

Define interfaces for each JSON key above. Use actual DB column names (from field-registry.md) as property names. Key interfaces:

- `ParsedCvData` -- top-level, all keys above
- `ParsedPersonal` -- all UF1-UF6 fields plus standard profile fields
- `ParsedYachtEmployment` -- yacht entry with YF1, AF1-AF4
- `ParsedCertification` -- with EF1
- `ParsedLanguage` -- UF7 item shape
- `ParsedLandEmployment`, `ParsedEducation`, `ParsedReference`, `ParsedSocialMedia`

Also define confirmed/save types:
- `ConfirmedImportData` -- wizard output, input to save function
- `ConfirmedPersonal`, `ConfirmedYacht`, `ConfirmedCert`, `ConfirmedEducation`
- `ConfirmedEndorsementRequest`
- `SaveStats` -- returned for celebration screen

Keep backward-compat legacy fields on ParsedCvData for old sessionStorage data.

## Parse Route Changes

In `app/api/cv/parse/route.ts`:

1. Add pre-flight validation after text extraction
2. Increase limits: text 15K to 25K, timeout 15s to 30s, max_tokens 2K to 8K
3. Add `response_format: { type: 'json_object' }`
4. Add retry via callAiWithRetry
5. Add .doc error: "can't read .doc files, save as .pdf or .docx"

## Verification

- [ ] Pre-flight: empty PDF returns instant 400
- [ ] Pre-flight: garbled text returns instant 400
- [ ] Pre-flight: <200 char file returns instant 400
- [ ] Pre-flight: valid file passes
- [ ] Retry fires on first timeout
- [ ] Both fail returns structured error
- [ ] New prompt produces valid JSON for test CVs
- [ ] response_format prevents markdown-wrapped responses
- [ ] TypeScript types compile
- [ ] Larger limits work (25K chars, 8K tokens, 30s)
- [ ] .doc returns helpful error
- [ ] Existing parse flow still works
- [ ] Legacy sessionStorage data doesn't crash
- [ ] Build passes
