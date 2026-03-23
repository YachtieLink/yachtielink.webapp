# Wave 3: AI Prompt Rewrite + Parse Chain Hardening

## Scope

Rewrite the AI extraction prompt from ~6 fields to ~40. Add pre-flight text validation so we fail early on unreadable files. Add retry logic so we almost never fail. Update TypeScript types. Fix .doc handling.

## Files

| File | Action |
|------|--------|
| `lib/cv/prompt.ts` | REWRITE — complete new extraction prompt |
| `lib/cv/validate.ts` | CREATE — pre-flight text validation |
| `lib/cv/types.ts` | CREATE — all parsed CV types (shared by prompt, save, wizard) |
| `app/api/cv/parse/route.ts` | MODIFY — validation, retry, increased limits, .doc handling |

## Pre-Flight Validation (Fail Early)

**New file: `lib/cv/validate.ts`**

After text extraction but BEFORE sending to the AI, validate the extracted text. This catches bad files in <1 second instead of after a 30-second timeout.

```ts
interface ValidationResult {
  valid: boolean
  error?: string         // user-facing message
  warning?: string       // non-blocking hint
  charCount: number
}

export function validateExtractedText(text: string): ValidationResult {
  const charCount = text.trim().length

  // Empty — corrupt PDF, image-only PDF, or encrypted
  if (charCount === 0) {
    return {
      valid: false,
      charCount,
      error: "We couldn't read any text from this file. If it's a scanned document, try saving it as a text-based PDF or DOCX.",
    }
  }

  // Too little text — probably not a real CV
  if (charCount < 200) {
    return {
      valid: false,
      charCount,
      error: "This file doesn't seem to contain enough text for a CV. Try uploading a different file.",
    }
  }

  // Garbled text — common with bad PDF encodings
  const nonAsciiRatio = (text.replace(/[\x20-\x7E\n\r\t]/g, '').length) / charCount
  if (nonAsciiRatio > 0.4) {
    return {
      valid: false,
      charCount,
      error: "The text in this file looks garbled — this sometimes happens with certain PDF formats. Try re-saving it as a new PDF or DOCX.",
    }
  }

  // Warning: very long CV (will be truncated)
  if (charCount > 25000) {
    return {
      valid: true,
      charCount,
      warning: "This is a long document — we'll focus on the most important sections.",
    }
  }

  return { valid: true, charCount }
}
```

**Where it runs:** In the parse route, after text extraction, before the AI call. If invalid → return 400 with the user-facing error immediately.

## Retry Logic (Almost Never Fail)

In the parse route, wrap the AI call with retry:

```ts
async function callAiWithRetry(prompt: string, text: string, maxRetries = 1): Promise<ParsedCvData> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text },
        ],
        max_tokens: 8000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }, { signal: controller.signal })

      clearTimeout(timeout)

      const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
      return parsed as ParsedCvData

    } catch (err) {
      if (attempt < maxRetries) continue  // retry once
      throw err  // give up after max retries
    }
  }
  throw new Error('Unreachable')
}
```

**If both attempts fail:** The parse route returns a structured error. The wizard handles this gracefully (see Wave 4 spec — no dead-end, user can fill manually or retry).

## New AI Prompt

Replace entire `CV_EXTRACTION_PROMPT`. The complete prompt text is in `build_plan.md` Part 4.1 — copy it verbatim into `prompt.ts`.

**Key additions vs current:**

| Current | New |
|---------|-----|
| `employment_history[]` (yacht only) | `employment_yacht[]` + `employment_land[]` |
| No personal details | `personal{}` — DOB, nationality, smoker, tattoo, visa, license, phone, email |
| `languages: string[]` | `languages: [{language, proficiency}]` |
| No education/skills/hobbies | `education[]`, `skills[]`, `hobbies[]` |
| No references | `references[]` with name, role, yacht, phone, email |
| No builder/program/description per yacht | All included per yacht entry |
| No issuing body on certs | `issuing_body` per cert |
| No social media | `social_media{}` — instagram, website |
| No former yacht names | `former_names[]` per yacht |

## TypeScript Types

**New file: `lib/cv/types.ts`** — shared types used by prompt, save, and wizard.

```ts
// ── Parsed data (output from AI) ─────────────────────

export interface ParsedPersonal {
  full_name: string | null
  primary_role: string | null
  bio: string | null
  phone: string | null
  email: string | null
  date_of_birth: string | null      // YYYY-MM-DD
  nationality: string | null
  location_country: string | null
  location_city: string | null
  smoker: 'non_smoker' | 'smoker' | 'social_smoker' | null
  tattoo_visibility: 'none' | 'visible' | 'non_visible' | null
  drivers_license: string | null
  visa_types: string[]
  marital_status: string | null      // extracted but not stored
}

export interface ParsedLanguage {
  language: string
  proficiency: 'native' | 'fluent' | 'intermediate' | 'basic' | null
}

export interface ParsedYachtEmployment {
  yacht_name: string
  former_names: string[]
  yacht_type: 'motor' | 'sailing' | null
  length_meters: number | null
  builder: string | null
  flag_state: string | null
  year_built: number | null
  program: 'private' | 'charter' | 'private_charter' | null
  role: string
  employment_type: 'permanent' | 'seasonal' | 'freelance' | 'relief' | 'temporary' | null
  start_date: string | null          // YYYY-MM or YYYY
  end_date: string | null            // YYYY-MM or YYYY or "Current"
  description: string | null
  crew_count: number | null
  guest_capacity: number | null
  cruising_area: string | null
}

export interface ParsedLandEmployment {
  company_name: string
  location: string | null
  role: string
  start_date: string | null
  end_date: string | null
  description: string | null
}

export interface ParsedCertification {
  name: string
  category: string | null
  issued_date: string | null
  expiry_date: string | null
  issuing_body: string | null
}

export interface ParsedEducation {
  institution: string
  qualification: string | null
  field_of_study: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
}

export interface ParsedReference {
  name: string
  role: string | null
  company_or_yacht: string | null
  phone: string | null
  email: string | null
}

export interface ParsedSocialMedia {
  instagram: string | null
  website: string | null
}

export interface ParsedCvData {
  personal: ParsedPersonal
  languages: ParsedLanguage[]
  employment_yacht: ParsedYachtEmployment[]
  employment_land: ParsedLandEmployment[]
  certifications: ParsedCertification[]
  education: ParsedEducation[]
  skills: string[]
  hobbies: string[]
  references: ParsedReference[]
  social_media: ParsedSocialMedia

  // Legacy fields — old parse results in sessionStorage
  full_name?: string | null
  bio?: string | null
  location?: { country?: string | null; city?: string | null } | null
  employment_history?: ParsedYachtEmployment[]
  primary_role?: string | null
}

// ── Confirmed data (output from wizard, input to save) ──

export interface ConfirmedPersonal {
  full_name: string | null
  primary_role: string | null
  bio: string | null
  phone: string | null
  date_of_birth: string | null
  nationality: string | null
  location_country: string | null
  location_city: string | null
  smoker: string | null
  tattoo_visibility: string | null
  drivers_license: string | null
  visa_types: string[]
}

export interface ConfirmedYacht {
  yacht_id: string                    // resolved by matching pipeline
  yacht_name: string                  // for display in summary
  role_label: string
  started_at: string
  ended_at: string | null
  employment_type: string | null
  yacht_program: string | null
  description: string | null
  cruising_area: string | null
  is_update: boolean                  // true = enrich existing attachment
  existing_attachment_id?: string     // set when is_update = true
  create_yacht?: {                    // set when creating a new yacht
    name: string
    yacht_type: string | null
    length_meters: number | null
    builder: string | null
    flag_state: string | null
  }
}

export interface ConfirmedCert {
  certification_type_id: string | null
  custom_cert_name: string | null
  issued_at: string | null
  expires_at: string | null
  issuing_body: string | null
  is_update: boolean
  existing_cert_id?: string
}

export interface ConfirmedEducation {
  institution: string
  qualification: string | null
  field_of_study: string | null
  started_at: string | null
  ended_at: string | null
}

export interface ConfirmedEndorsementRequest {
  recipient_name: string
  recipient_email?: string | null
  recipient_phone?: string | null
  recipient_user_id?: string | null   // if found on platform
  yacht_id?: string | null
  source: 'colleague' | 'reference'
}

export interface ConfirmedImportData {
  personal: ConfirmedPersonal
  languages: ParsedLanguage[]
  yachts: ConfirmedYacht[]
  certifications: ConfirmedCert[]
  education: ConfirmedEducation[]
  skills: string[]
  hobbies: string[]
  endorsementRequests: ConfirmedEndorsementRequest[]
  socialLinks?: { platform: string; url: string }[]
}

export interface SaveStats {
  profileFieldsUpdated: string[]
  yachtsCreated: number
  yachtsEnriched: number
  certificationsCreated: number
  certificationsEnriched: number
  educationCreated: number
  skillsCreated: number
  hobbiesCreated: number
  languagesSaved: number
  endorsementRequestsSent: number
  profileCompletionPercent: number    // computed after save
}
```

## Parse Route Changes

In `app/api/cv/parse/route.ts`:

**1. Add pre-flight validation** (after text extraction, before AI call):
```ts
import { validateExtractedText } from '@/lib/cv/validate'

// After extractedText is obtained:
const validation = validateExtractedText(extractedText)
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 })
}
```

**2. Parameter changes:**
```
extractedText.slice(0, 15000)  →  extractedText.slice(0, 25000)
setTimeout(() => controller.abort(), 15000)  →  30000
max_tokens: 2000  →  max_tokens: 8000
```

**3. Use `response_format: { type: 'json_object' }`** to guarantee valid JSON from OpenAI.

**4. Retry logic** via `callAiWithRetry()` (see above).

**5. .doc file handling** — add before the else/unsupported branch:
```ts
} else if (storagePath.endsWith('.doc')) {
  return NextResponse.json(
    { error: "We can't read .doc files yet. Please save your CV as a .pdf or .docx and re-upload." },
    { status: 400 },
  )
}
```

## Verification

- [ ] Pre-flight: empty PDF returns instant 400 with helpful message
- [ ] Pre-flight: garbled text PDF returns instant 400
- [ ] Pre-flight: <200 char file returns instant 400
- [ ] Pre-flight: valid file passes validation
- [ ] Retry: if first AI call times out, second attempt fires
- [ ] Retry: if both fail, returns structured error (not 500 crash)
- [ ] New prompt produces valid JSON for all 9 test CVs
- [ ] `response_format: json_object` prevents markdown-wrapped responses
- [ ] TypeScript types compile (shared types file)
- [ ] Parse route handles larger payloads (25K chars, 8K tokens, 30s timeout)
- [ ] .doc file returns helpful error
- [ ] Existing parse flow still works end-to-end
- [ ] Legacy sessionStorage data doesn't crash (backward compat types)
- [ ] Build passes
