# Build Spec: Two-Pass CV Parse

> Parent: `README.md` in this folder. Field names from `field-registry.md`.

---

## Wave 1: Shared Text Extraction Helper

### CREATE `lib/cv/extract-text.ts`

Extracts the text extraction pipeline from `app/api/cv/parse/route.ts` lines 87-134 into a reusable function.

```ts
import { createServiceClient } from '@/lib/supabase/admin'
import { validateExtractedText } from '@/lib/cv/validate'

interface ExtractSuccess { text: string; warning?: string }
interface ExtractError { error: string; status: number }
export type ExtractResult = ExtractSuccess | ExtractError

export function isExtractError(r: ExtractResult): r is ExtractError {
  return 'error' in r && 'status' in r
}

export async function extractCvText(storagePath: string): Promise<ExtractResult>
```

**Logic:**
1. Reject `.doc` (not `.docx`) → `{ error, status: 400 }`
2. Download from `cv-uploads` bucket via service client → `{ error, status: 500 }` on failure
3. PDF extraction — NOTE: `pdf-parse` v2 uses a non-standard class API:
   ```ts
   const { PDFParse } = await import('pdf-parse')
   const parser = new PDFParse({ data: new Uint8Array(buffer) })
   const textResult = await Promise.race([
     parser.getText(),
     new Promise<never>((_, reject) =>
       setTimeout(() => reject(new Error('PDF extraction timed out')), 15000)
     ),
   ])
   extractedText = textResult.pages.map((p: { text: string }) => p.text).join('\n')
   ```
4. DOCX: `mammoth.extractRawText({ buffer })`
5. Other extensions: `{ error, status: 400 }`
6. Catch extraction errors: `{ error, status: 422 }`
7. `validateExtractedText(text.trim())` — if invalid, return `{ error, status: 400 }`
8. Truncate: `text.slice(0, 25000)` (untrimmed, matching current behavior)
9. Return `{ text, warning? }`

---

## Wave 2: Personal Prompt + Route

### MODIFY `lib/cv/prompt.ts`

Add export after existing `CV_EXTRACTION_PROMPT`:

```ts
export const CV_PERSONAL_PROMPT = `You are extracting personal details and languages from a yacht crew CV. Return ONLY valid JSON matching this schema. Use null for missing values, empty arrays for missing lists.

{
  "personal": {
    "full_name": "string|null",
    "primary_role": "string|null — most recent/main role title",
    "bio": "string|null — professional summary, max 500 chars",
    "phone": "string|null",
    "email": "string|null",
    "location_country": "string|null — ISO country name",
    "location_city": "string|null",
    "dob": "YYYY-MM-DD|null",
    "home_country": "string|null — nationality/home country, ISO name",
    "smoke_pref": "non_smoker|smoker|social_smoker|null",
    "appearance_note": "none|visible|non_visible|not_specified|null — tattoos/piercings",
    "travel_docs": ["string"] — visas, seaman's books, travel documents,
    "license_info": "string|null — driving license details"
  },
  "languages": [
    { "language": "string", "proficiency": "native|fluent|intermediate|basic" }
  ]
}

Rules:
- If a language is listed without proficiency, infer from context (native for nationality language, fluent otherwise)
- Return valid JSON only — no markdown, no code fences, no explanation`
```

### CREATE `app/api/cv/parse-personal/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { CV_PERSONAL_PROMPT } from '@/lib/cv/prompt'
import { validateBody } from '@/lib/validation/validate'
import { parseCVSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { extractCvText, isExtractError } from '@/lib/cv/extract-text'
import type { ParsedPersonal, ParsedLanguage } from '@/lib/cv/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit (same fileUpload category as full parse)
  const limited = await applyRateLimit(req, 'fileUpload', user.id)
  if (limited) return limited

  // Body validation
  const result = await validateBody(req, parseCVSchema)
  if ('error' in result) return result.error
  const { storagePath } = result.data

  // Ownership guard
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Extract text (shared helper)
  const extraction = await extractCvText(storagePath)
  if (isExtractError(extraction)) {
    return NextResponse.json({ error: extraction.error }, { status: extraction.status })
  }

  // AI call — no retry, 15s timeout
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'CV parsing is not configured' }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CV_PERSONAL_PROMPT },
          { role: 'user', content: extraction.text },
        ],
      },
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content')

    const data = JSON.parse(content) as { personal: ParsedPersonal; languages: ParsedLanguage[] }
    return NextResponse.json({ ok: true, data, warning: extraction.warning })
  } catch {
    clearTimeout(timeout)
    return NextResponse.json(
      { error: 'Could not parse personal details.' },
      { status: 422 },
    )
  }

  // NOTE: Does NOT update cv_storage_path / cv_parsed_at
  // NOTE: Does NOT count against check_cv_parse_limit RPC
}
```

---

## Wave 3: Refactor Full Parse Route

### MODIFY `app/api/cv/parse/route.ts`

Replace TWO separate blocks, preserving the `check_cv_parse_limit` RPC between them:

**Block 1 — Delete lines 70-76** (.doc rejection — now in extractCvText):
```ts
// DELETE: if (storagePath.endsWith('.doc') && !storagePath.endsWith('.docx')) { ... }
```

**Block 2 — Replace lines 87-134** (file download, text extraction, validation, truncation) with:
```ts
import { extractCvText, isExtractError } from '@/lib/cv/extract-text'

const extraction = await extractCvText(storagePath)
if (isExtractError(extraction)) {
  return NextResponse.json({ error: extraction.error }, { status: extraction.status })
}
const truncated = extraction.text
```

**PRESERVE lines 78-85** (`check_cv_parse_limit` RPC) — do NOT delete this block.

Remove these imports (now handled by extract-text.ts):
- `createServiceClient` from `@/lib/supabase/admin`
- `validateExtractedText` from `@/lib/cv/validate`

Keep everything else unchanged: auth, rate limit, ownership guard, `check_cv_parse_limit` RPC, `callAiWithRetry`, user record update, `trackServerEvent`.

---

## Wave 4: Wizard + StepPersonal

### MODIFY `components/cv/CvImportWizard.tsx`

**New state (add after existing state declarations, ~line 48):**

```ts
const [parsePersonalLoading, setParsePersonalLoading] = useState(true)
const [parsedPersonal, setParsedPersonal] = useState<ParsedPersonal | null>(null)
const [parsedLanguages, setParsedLanguages] = useState<ParsedLanguage[]>([])
```

**Replace the single fetch useEffect (lines 60-108) with two parallel fetches:**

```ts
useEffect(() => {
  // Check sessionStorage for resume
  const key = `cv-wizard-${storagePath}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      const state = JSON.parse(stored)
      if (state.parsed) { setParsed(state.parsed); setParseLoading(false); parsedRef.current = state.parsed }
      if (state.parsedPersonal) { setParsedPersonal(state.parsedPersonal); setParsePersonalLoading(false) }
      if (state.parsedLanguages) setParsedLanguages(state.parsedLanguages)
      // Note: parsePersonalLoading is set to false above when parsedPersonal is restored,
      // so the user sees the wizard immediately (not the loading screen)
      if (state.step) setStep(state.step)
      if (state.confirmedPersonal) setConfirmedPersonal(state.confirmedPersonal)
      if (state.confirmedLanguages) setConfirmedLanguages(state.confirmedLanguages)
      if (state.confirmedYachts) setConfirmedYachts(state.confirmedYachts)
      if (state.confirmedCerts) setConfirmedCerts(state.confirmedCerts)
      if (state.confirmedEducation) setConfirmedEducation(state.confirmedEducation)
      if (state.skills) setSkills(state.skills)
      if (state.hobbies) setHobbies(state.hobbies)

      // If full parse is already cached, skip both fetches
      if (state.parsed) return
      // If only personal is cached, skip fast fetch, re-fire full only
      if (state.parsedPersonal) {
        fireFullParse()
        return
      }
    } catch { /* ignore corrupt storage */ }
  }

  // Fire both parses in parallel
  firePersonalParse()
  fireFullParse()
}, [storagePath])
```

**Add a ref to track full parse completion (after state declarations):**

```ts
const parsedRef = useRef<ParsedCvData | null>(null)
```

Keep it in sync:
```ts
useEffect(() => { parsedRef.current = parsed }, [parsed])
```

**Add the two fetch functions (before the useEffect):**

```ts
const firePersonalParse = useCallback(() => {
  fetch('/api/cv/parse-personal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storagePath }),
  })
    .then(async (res) => {
      if (!res.ok) return // Silent fail — full parse will handle it
      const { data } = await res.json()
      // Race guard: if full parse already completed, ignore fast parse result
      if (parsedRef.current) return
      setParsedPersonal(data.personal)
      setParsedLanguages(data.languages ?? [])
      setParsePersonalLoading(false)
    })
    .catch(() => {
      // Silent fail — full parse will handle it
    })
}, [storagePath])

const fireFullParse = useCallback(() => {
  fetch('/api/cv/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storagePath }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setParseError(body.error || 'Could not parse CV')
        setParseLoading(false)
        setParsePersonalLoading(false)
        return
      }
      const { data, warning } = await res.json()
      if (warning) toast(warning, 'success')

      setParsed(data as ParsedCvData)

      // If fast parse hasn't returned yet, populate personal from full parse
      setParsedPersonal(prev => prev ?? (data as ParsedCvData).personal)
      setParsedLanguages(prev => prev.length ? prev : ((data as ParsedCvData).languages ?? []))
      setParsePersonalLoading(false)

      // Merge skills/hobbies
      const newSkills = [...new Set([...existingSkills, ...(data.skills ?? [])])]
      const newHobbies = [...new Set([...existingHobbies, ...(data.hobbies ?? [])])]
      setSkills(newSkills)
      setHobbies(newHobbies)

      setParseLoading(false)
    })
    .catch(() => {
      setParseError('Something went wrong. Try again or enter your details manually.')
      setParseLoading(false)
      setParsePersonalLoading(false)
    })
}, [storagePath, existingSkills, existingHobbies, toast])
```

**Update sessionStorage persistence (line ~111-118) — add parsedPersonal + parsedLanguages:**

```ts
useEffect(() => {
  if (parsePersonalLoading && parseLoading) return
  const key = `cv-wizard-${storagePath}`
  sessionStorage.setItem(key, JSON.stringify({
    parsed, parsedPersonal, parsedLanguages,
    step, confirmedPersonal, confirmedLanguages,
    confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies,
  }))
}, [parsed, parsedPersonal, parsedLanguages, step, confirmedPersonal, confirmedLanguages, confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies, parsePersonalLoading, parseLoading, storagePath])
```

**Update render — replace current `if (parseLoading)` guard with `parsePersonalLoading`:**

Current (line ~166):
```tsx
if (parseLoading) {
  return <div className="flex flex-col gap-4 pb-24"><ParseProgress /></div>
}
```

Change to:
```tsx
if (parsePersonalLoading) {
  return <div className="flex flex-col gap-4 pb-24"><ParseProgress /></div>
}
```

**Update Step 1 props — pass parsedPersonal instead of parsed?.personal:**

```tsx
{step === 1 && (
  <StepPersonal
    parsed={parsedPersonal}
    languages={parsedLanguages}
    existing={existingProfile}
    parseLoading={parseLoading}
    onConfirm={(personal, langs) => {
      setConfirmedPersonal(personal)
      setConfirmedLanguages(langs)
      setStep(2)
    }}
  />
)}
```

Note: `parseLoading` is still passed — but StepPersonal will no longer use it to disable buttons (see below).

### MODIFY `components/cv/steps/StepPersonal.tsx`

**Single change — line 211-212. Remove `disabled={parseLoading}` from both buttons:**

Before:
```tsx
<Button onClick={handleConfirm} className="flex-1" disabled={parseLoading}>Looks good</Button>
<Button variant="secondary" onClick={() => setEditing(true)} className="flex-1" disabled={parseLoading}>Edit details</Button>
```

After:
```tsx
<Button onClick={handleConfirm} className="flex-1">Looks good</Button>
<Button variant="secondary" onClick={() => setEditing(true)} className="flex-1">Edit details</Button>
```

**Also remove the "Reading your CV for more..." spinner (lines 197-202)** — this was a mid-parse indicator that no longer makes sense when personal data arrives independently:

Before:
```tsx
{parseLoading && (
  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-interactive)]" />
    Reading your CV for more...
  </div>
)}
```

Remove this block entirely.

**Change the skeleton fallback guard to use `parsePersonalLoading` (line 179):**

Before:
```tsx
{parseLoading && displayFields.length === 0 ? (
```

After:
```tsx
{parsePersonalLoading && displayFields.length === 0 ? (
```

This shows skeletons only while personal data is loading. Once fast parse completes (even with empty data), the else branch renders with buttons — the user is never stuck. The `parsePersonalLoading` prop needs adding to the interface:

```ts
interface StepPersonalProps {
  parsed: ParsedPersonal | null
  languages: ParsedLanguage[]
  existing: Record<string, unknown>
  parseLoading: boolean
  parsePersonalLoading: boolean  // NEW — controls skeleton vs buttons
  onConfirm: (personal: ParsedPersonal, languages: ParsedLanguage[]) => void
}
```

And pass from wizard:
```tsx
<StepPersonal
  parsed={parsedPersonal}
  languages={parsedLanguages}
  existing={existingProfile}
  parseLoading={parseLoading}
  parsePersonalLoading={parsePersonalLoading}
  onConfirm={...}
/>
```

**Remove `parseLoading` from the "found few details" hint (line 204):**

Before:
```tsx
{!parseLoading && displayFields.length > 0 && displayFields.length < 3 && (
```

After:
```tsx
{displayFields.length > 0 && displayFields.length < 3 && (
```

**Optionally remove `parseLoading` from the interface** if no longer used — but keep it for now since it's passed from the wizard and may be useful for future UI indicators.

---

## Verification Checklist

- [ ] `next build` passes clean
- [ ] Fast parse returns personal + languages in <10s
- [ ] Step 1 buttons are enabled and interactive while Steps 2-5 are still loading
- [ ] User can confirm Step 1 and see Step 2 skeleton while full parse runs
- [ ] Full parse completes, Steps 2-5 populate without page reload
- [ ] If fast parse fails silently, full parse still works (user waits longer but gets all data)
- [ ] If full parse fails, error screen shows correctly
- [ ] If full parse returns before fast parse, Step 1 still works (race guard)
- [ ] SessionStorage resume: refresh after Step 1 confirmed restores state, re-fires only full parse
- [ ] SessionStorage resume: refresh after both parses complete skips all fetches
- [ ] Rate limit: `check_cv_parse_limit` only called by full parse route
- [ ] Both routes have auth + ownership guard + body validation
- [ ] No console.logs, no hardcoded values, no dead code
