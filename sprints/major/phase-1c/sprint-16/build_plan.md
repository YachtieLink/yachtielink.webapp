# Sprint 16 — AI Pack 1: Build Plan

## Context

Sprint 16 adds four AI-powered convenience features that accelerate profile completion and endorsement quality. All four use OpenAI APIs, share a common integration layer in `lib/ai/`, and respect the canonical rule: AI improves presentation and convenience, never creates or alters trust.

### What Already Exists

| Piece | Location | Notes |
|-------|----------|-------|
| OpenAI SDK | `openai` npm package, used in `app/api/cv/parse/route.ts` and `app/api/profile/ai-summary/route.ts` | Instantiated per-route — no shared singleton yet |
| `OPENAI_API_KEY` env var | `.env.local` | Already provisioned for CV parse and AI summary |
| Content moderation | `lib/ai/moderation.ts` | Singleton pattern with lazy init — good reference for shared client |
| CV extraction prompt | `lib/cv/prompt.ts` | Shows prompt-as-constant pattern |
| Endorsement form | `components/endorsement/WriteEndorsementForm.tsx` | "Help me write" button plugs in here |
| Endorsement request email | `app/api/endorsement-requests/route.ts` | `buildHtml()` + `buildText()` templates — translation wraps these |
| Resend notify pipeline | `lib/email/notify.ts` → `lib/email/client.ts` | `sendNotifyEmail()` — the send function AI-03 hooks into |
| Cert add form | `app/(protected)/app/certification/new/page.tsx` | 3-step flow: category → cert → details. OCR button goes on details step |
| Cert edit form | `app/(protected)/app/certification/[id]/edit/page.tsx` | Same pattern |
| Bio edit page | `app/(protected)/app/about/edit/page.tsx` | "Improve" button plugs in here |
| About section | `components/profile/AboutSection.tsx` | Displays bio on profile |
| Rate limiter | `lib/rate-limit/helpers.ts` + `lib/rate-limit/limiter.ts` | Redis-backed, `RATE_LIMITS` config object, `applyRateLimit()` helper |
| Validation | `lib/validation/validate.ts` + `lib/validation/schemas.ts` | Zod schemas, `validateBody()` helper |
| Error handling | `lib/api/errors.ts` | `handleApiError()` + `apiError()` — Sentry capture |
| Server analytics | `lib/analytics/server.ts` | `trackServerEvent()` for PostHog server-side capture |
| Storage upload | `lib/storage/upload.ts` | `uploadCertDocument()` for cert photo attachment |
| Supabase admin | `lib/supabase/admin.ts` | `createServiceClient()` — service role, bypasses RLS |
| `certification_types` table | Seeded in `20260313000006_seed_reference.sql` | Name, short_name, category, keywords with trigram index |
| `certifications` table | `20260313000003_core_tables.sql` line 229 | Has `certificate_number`, `issuing_body`, `issued_at`, `expires_at`, `document_url` columns |

### What Does NOT Exist Yet

| Missing | Impact | Action |
|---------|--------|--------|
| `preferred_language` column on `users` | AI-03 depends on this to detect language mismatch | Add via migration in this sprint |
| `ai_usage_log` table | Cost tracking for all AI features | Create via migration |
| Shared `lib/ai/` client module | Each route creates its own OpenAI instance | Build shared singleton |
| Any `lib/ai/prompts/` directory | No versioned prompts | Create directory + 4 prompt files |

### Dependencies

- Sprint 15 complete (stable profile, endorsement, certification infrastructure)
- `OPENAI_API_KEY` env var set (already exists)
- `REDIS_URL` env var set (rate limiting — already exists)
- `RESEND_API_KEY` env var set (email — already exists)

### Codebase Patterns to Follow

- API routes: auth via `createClient()` → `supabase.auth.getUser()`, rate limit via `applyRateLimit()`, validate via `validateBody()`, errors via `handleApiError()`
- Server analytics: `trackServerEvent(userId, eventName, properties)`
- Rate limits: add to `RATE_LIMITS` object in `lib/rate-limit/helpers.ts`
- Validation: Zod schemas in `lib/validation/schemas.ts`
- All colour references use semantic CSS custom properties from `globals.css`
- Mobile-first: 375px base, `md:` breakpoints for tablet/desktop
- RPCs use `security definer` (codebase convention)
- `GRANT EXECUTE ON FUNCTION ... TO authenticated` on every new function

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260324000001_sprint16_ai_pack1.sql`

```sql
-- Sprint 16: AI Pack 1
-- ai_usage_log table for cost tracking, preferred_language column for multilingual requests

-- ═══════════════════════════════════════════════════════════
-- 1. AI USAGE LOG — cost tracking for all AI features
-- ═══════════════════════════════════════════════════════════

create table public.ai_usage_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete cascade,
  feature         text not null,   -- 'endorsement_draft', 'cert_ocr', 'translate', 'profile_suggest'
  model           text not null,   -- 'gpt-5-nano', 'gpt-4o-mini'
  input_tokens    int,
  output_tokens   int,
  estimated_cost_eur numeric(10,6),
  metadata        jsonb,           -- feature-specific context (e.g. source/target language, cert type)
  created_at      timestamptz not null default now()
);

create index idx_ai_usage_user_feature_date
  on public.ai_usage_log (user_id, feature, created_at);

create index idx_ai_usage_created
  on public.ai_usage_log (created_at);

-- RLS
alter table public.ai_usage_log enable row level security;

create policy "Users can read own AI usage"
  on public.ai_usage_log for select
  using (auth.uid() = user_id);

create policy "AI usage: own insert"
  on public.ai_usage_log for insert
  with check (auth.uid() = user_id);
  -- Insert happens server-side via service client in API routes.
  -- The API route is already authenticated; the insert is done after auth check.
  -- Restricts to authenticated users inserting their own records
  -- (AI-03 translation) may log via service client on behalf of user.

-- ═══════════════════════════════════════════════════════════
-- 2. PREFERRED LANGUAGE on users
-- ═══════════════════════════════════════════════════════════

-- Required for AI-03 multilingual endorsement requests.
-- Default 'en' (English) — users can change in profile settings.
alter table public.users
  add column if not exists preferred_language text not null default 'en';

-- ═══════════════════════════════════════════════════════════
-- 3. HELPER: fuzzy cert type match
-- ═══════════════════════════════════════════════════════════

-- Returns top 5 certification_types matching a given name string,
-- ordered by trigram similarity. Used by AI-02 cert OCR to match
-- extracted cert names against the seeded list.

create or replace function match_certification_type(p_name text, p_limit int default 5)
returns table (
  id uuid,
  name text,
  short_name text,
  category text,
  similarity real
)
language sql stable security definer
as $$
  select
    ct.id,
    ct.name,
    ct.short_name,
    ct.category,
    similarity(ct.name, p_name) as similarity
  from public.certification_types ct
  where similarity(ct.name, p_name) > 0.1
  order by similarity(ct.name, p_name) desc
  limit p_limit;
$$;

grant execute on function match_certification_type(text, int) to authenticated;
```

---

## Part 2: Shared AI Integration Layer

### 2.1 — OpenAI Singleton Client

**File to create:** `lib/ai/openai-client.ts`

```typescript
import OpenAI from 'openai'

let _client: OpenAI | null = null

/**
 * Shared OpenAI client singleton.
 * Returns null if OPENAI_API_KEY is not configured (non-blocking).
 */
export function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

/**
 * Same as getOpenAIClient() but throws if not configured.
 * Use in API routes where the AI feature IS the endpoint.
 */
export function requireOpenAIClient(): OpenAI {
  const client = getOpenAIClient()
  if (!client) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return client
}
```

### 2.2 — Cost Tracker

**File to create:** `lib/ai/cost-tracker.ts`

```typescript
import { createServiceClient } from '@/lib/supabase/admin'

/** Estimated cost per 1K tokens (EUR) — update when pricing changes */
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-5-nano':   { input: 0.00010, output: 0.00040 },  // $0.10/$0.40 per 1M tokens
  'gpt-4o-mini':  { input: 0.00015, output: 0.00060 },  // $0.15/$0.60 per 1M tokens
}

interface UsageLogEntry {
  userId: string
  feature: 'endorsement_draft' | 'cert_ocr' | 'translate' | 'profile_suggest'
  model: string
  inputTokens: number
  outputTokens: number
  metadata?: Record<string, unknown>
}

/**
 * Log AI API usage with estimated cost.
 * Non-blocking — failures are logged but never surface to the user.
 */
export async function logAIUsage(entry: UsageLogEntry): Promise<void> {
  try {
    const costs = MODEL_COSTS[entry.model] ?? { input: 0.001, output: 0.004 }
    const estimatedCostEur =
      (entry.inputTokens / 1000) * costs.input +
      (entry.outputTokens / 1000) * costs.output

    const supabase = createServiceClient()
    await supabase.from('ai_usage_log').insert({
      user_id: entry.userId,
      feature: entry.feature,
      model: entry.model,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      estimated_cost_eur: estimatedCostEur,
      metadata: entry.metadata ?? null,
    })
  } catch (err) {
    console.error('Failed to log AI usage:', err)
    // Non-fatal — never block the user flow for cost tracking
  }
}
```

### 2.3 — Prompt Files

All prompts live in `lib/ai/prompts/` as exported constants. Each file is a single feature's prompt(s).

**File to create:** `lib/ai/prompts/endorsement-draft.ts`

```typescript
/**
 * AI-04: Endorsement Writing Assistant
 * Model: gpt-5-nano
 * Temperature: 0.8
 * Max tokens: 500
 */
export const ENDORSEMENT_DRAFT_SYSTEM_PROMPT = `You are a ghostwriter helping yacht crew write endorsements for their colleagues. You write the way real maritime professionals talk — direct, specific, warm but not gushing.

CONTEXT:
You will receive structured answers to 2-3 questions about the person being endorsed, plus context about the yacht, role, and time period.

RULES:
- Write a 100-250 word endorsement in FIRST PERSON from the endorser's perspective
- Reference the specific yacht name, the recipient's role, and the approximate time period
- Draw on the specific answers provided — do NOT invent details the endorser didn't mention
- Use natural, conversational language — the way a chief stew or bosun would actually talk, not corporate HR speak
- Avoid: "passionate", "dynamic", "exceptional", "a true asset", "I cannot recommend enough", "pleasure to work with"
- Avoid: superlatives, generic praise, AI clichés, exclamation marks
- Do include: specific observations, concrete examples drawn from the answers, honest professional assessment
- Tone: respectful, genuine, like you're recommending someone to a captain you trust
- If the endorser said "Absolutely" to working together again, include a natural mention of that. If "Yes", include it subtly. If skipped, omit it.
- End naturally — no formulaic closing
- Return ONLY the endorsement text, no labels, no quotes, no preamble`

export function buildEndorsementDraftUserPrompt(params: {
  recipientName: string
  recipientRole: string
  yachtName: string
  overlapPeriod: string
  answer1: string
  answer2: string
  answer3?: string
}): string {
  const lines = [
    `Person being endorsed: ${params.recipientName}`,
    `Their role: ${params.recipientRole}`,
    `Yacht: ${params.yachtName}`,
    `Time period: ${params.overlapPeriod}`,
    ``,
    `What did they excel at in their role?`,
    params.answer1,
    ``,
    `What stood out about working with them?`,
    params.answer2,
  ]

  if (params.answer3) {
    lines.push(``, `Would you work with them again?`, params.answer3)
  }

  return lines.join('\n')
}
```

**File to create:** `lib/ai/prompts/cert-ocr.ts`

```typescript
/**
 * AI-02: Certification OCR & Auto-Fill
 * Model: gpt-4o-mini (vision)
 * Temperature: 0.1 (low — we want accurate extraction, not creativity)
 * Max tokens: 500
 */
export const CERT_OCR_SYSTEM_PROMPT = `You are extracting structured data from a photograph of a maritime/yachting certification document. The certificate may be from any country and in any language. Return ONLY valid JSON with no explanation.

Extract the following fields. If a field is not visible or cannot be determined, use null.

{
  "cert_name": "string — the full name of the certification as printed on the document",
  "cert_name_english": "string or null — English translation of the cert name if not already in English",
  "certificate_number": "string or null — certificate/document number if visible",
  "issuing_body": "string or null — the organisation or authority that issued the certificate",
  "issued_date": "YYYY-MM-DD or YYYY-MM or null — date of issue",
  "expiry_date": "YYYY-MM-DD or YYYY-MM or null — date of expiry (null if lifetime/no expiry visible)",
  "holder_name": "string or null — name of the certificate holder if visible",
  "confidence": "high | medium | low — your confidence in the extraction accuracy"
}

RULES:
- Yachting certificates include: STCW, ENG1, GMDSS, MCA CoC, food safety, powerboat, yacht master, sea survival, fire fighting, medical, etc.
- Dates may be in any format (DD/MM/YYYY, MM/DD/YYYY, written months, etc.) — normalise to YYYY-MM-DD or YYYY-MM
- If the document is in a non-Latin script, transliterate names and extract dates
- If the photo is blurry, angled, or partially obscured, extract what you can and set confidence to "low"
- Do NOT guess dates or numbers you cannot read — use null
- Return valid JSON only, no markdown code fences`
```

**File to create:** `lib/ai/prompts/translate.ts`

```typescript
/**
 * AI-03: Multilingual Endorsement Requests
 * Model: gpt-5-nano
 * Temperature: 0.3 (low — faithful translation, not creative rewriting)
 * Max tokens: 800
 */
export const TRANSLATION_SYSTEM_PROMPT = `You are a translator for a professional maritime networking platform called YachtieLink. You translate endorsement request emails from one language to another.

RULES:
- Translate faithfully — preserve the meaning, tone, and professional courtesy of the original
- Keep proper nouns (names, yacht names, "YachtieLink") untranslated
- Keep URLs and email addresses exactly as they are
- Maintain the same paragraph structure and formatting
- Use the formal register appropriate for professional communication in the target language (e.g. "vous" not "tu" in French, "usted" in Spanish)
- If the source language and target language are the same, return the text unchanged
- Return ONLY the translated text, no labels or preamble

You will receive a JSON object with "source_language", "target_language", "subject", and "body". Return a JSON object with "subject" and "body" — both translated.`

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  tl: 'Filipino/Tagalog',
  es: 'Spanish',
  hr: 'Croatian',
  af: 'Afrikaans',
  it: 'Italian',
  el: 'Greek',
  pt: 'Portuguese',
  nl: 'Dutch',
  de: 'German',
  ru: 'Russian',
  uk: 'Ukrainian',
  pl: 'Polish',
  tr: 'Turkish',
  th: 'Thai',
  id: 'Indonesian',
  ja: 'Japanese',
  zh: 'Chinese',
}

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code] ?? code
}
```

**File to create:** `lib/ai/prompts/profile-suggest.ts`

```typescript
/**
 * AI-17: Smart Profile Suggestions
 * Model: gpt-5-nano
 * Temperature: 0.6
 * Max tokens: 400
 */
export const PROFILE_SUGGEST_SYSTEM_PROMPT = `You are a writing coach for yacht crew profiles on YachtieLink, a professional maritime networking platform. You improve bio text while preserving the crew member's voice and intent.

CONTEXT:
You will receive the user's current bio text plus their role, department, and experience level for context.

RULES:
- Preserve the user's voice, personality, and intent — improvements should feel like THEM, just polished
- Fix grammar, spelling, and punctuation — especially important for non-native English speakers
- Improve clarity and conciseness — cut filler words, tighten sentences
- Add industry-standard terminology where appropriate (e.g. "guest-facing service" not "helping guests")
- If the bio is very short, suggest additions — but frame them as optional: "Consider mentioning your language skills" or "You could add your yacht size experience"
- Do NOT add false claims, embellish experience, or invent qualifications
- Do NOT add generic corporate language ("passionate", "dynamic professional", "results-driven")
- Do NOT change factual content (names, dates, yacht names, qualifications)
- Do NOT use AI clichés or marketing speak
- Keep the bio under 500 characters (the platform limit)
- Return ONLY the improved bio text, no labels, no quotes, no preamble, no explanation of changes`

export function buildProfileSuggestUserPrompt(params: {
  currentText: string
  role?: string
  department?: string
  experienceYears?: number
}): string {
  const context: string[] = []
  if (params.role) context.push(`Role: ${params.role}`)
  if (params.department) context.push(`Department: ${params.department}`)
  if (params.experienceYears) context.push(`Experience: ~${params.experienceYears} years`)

  return [
    context.length > 0 ? `Context: ${context.join(', ')}` : '',
    '',
    'Current bio:',
    params.currentText,
  ].filter(Boolean).join('\n')
}
```

### 2.4 — Shared AI Index

**File to create:** `lib/ai/index.ts`

```typescript
export { getOpenAIClient, requireOpenAIClient } from './openai-client'
export { logAIUsage } from './cost-tracker'
```

---

## Part 3: Rate Limit Configuration

**File to modify:** `lib/rate-limit/helpers.ts`

Add four new entries to the `RATE_LIMITS` object:

```typescript
// Add after existing 'aiSummary' entry:
aiEndorsementDraft: { limit: 10, window: 24 * 60 * 60,  scope: 'user' as const }, // 10/24h/user
aiCertOcr:          { limit: 20, window: 24 * 60 * 60,  scope: 'user' as const }, // 20/24h/user (Pro only)
aiTranslate:        { limit: 30, window: 24 * 60 * 60,  scope: 'user' as const }, // 30/24h/user (generous — tied to endorsement request flow)
aiProfileSuggest:   { limit: 20, window: 24 * 60 * 60,  scope: 'user' as const }, // 20/24h/user
```

---

## Part 4: Validation Schemas

**File to modify:** `lib/validation/schemas.ts`

Add at the end of the file:

```typescript
// --- AI Features (Sprint 16) ---

export const aiEndorsementDraftSchema = z.object({
  recipientName: safeText(200),
  recipientRole: safeText(200),
  yachtName: safeText(200),
  overlapPeriod: safeText(200),
  answer1: safeText(500).refine((s) => s.length >= 5, 'Please provide a bit more detail'),
  answer2: safeText(500).refine((s) => s.length >= 5, 'Please provide a bit more detail'),
  answer3: z.enum(['Yes', 'Absolutely', '']).optional(),
})

export const aiCertOcrSchema = z.object({
  imageBase64: z.string().min(100).max(15_000_000), // base64 image, max ~10MB
  imageType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

export const aiTranslateSchema = z.object({
  subject: safeText(500),
  body: safeText(5000),
  sourceLanguage: safeText(10),
  targetLanguage: safeText(10),
})

export const aiProfileSuggestSchema = z.object({
  text: safeText(500).refine((s) => s.length >= 10, 'Text must be at least 10 characters'),
  role: safeText(200).optional(),
  department: safeText(100).optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
})
```

---

## Part 5: API Routes

### 5.1 — POST /api/ai/endorsement-draft

**File to create:** `app/api/ai/endorsement-draft/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOpenAIClient, logAIUsage } from '@/lib/ai'
import { ENDORSEMENT_DRAFT_SYSTEM_PROMPT, buildEndorsementDraftUserPrompt } from '@/lib/ai/prompts/endorsement-draft'
import { validateBody } from '@/lib/validation/validate'
import { aiEndorsementDraftSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const MODEL = 'gpt-5-nano'
const MAX_TOKENS = 500
const TEMPERATURE = 0.8

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'aiEndorsementDraft', user.id)
    if (limited) return limited

    const result = await validateBody(req, aiEndorsementDraftSchema)
    if ('error' in result) return result.error
    const { recipientName, recipientRole, yachtName, overlapPeriod, answer1, answer2, answer3 } = result.data

    trackServerEvent(user.id, 'ai_endorsement_draft_requested', { yacht: yachtName })

    const openai = requireOpenAIClient()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: ENDORSEMENT_DRAFT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildEndorsementDraftUserPrompt({
              recipientName,
              recipientRole,
              yachtName,
              overlapPeriod,
              answer1,
              answer2,
              answer3: answer3 || undefined,
            }),
          },
        ],
      },
      { signal: controller.signal },
    )

    clearTimeout(timeout)

    const draft = completion.choices[0]?.message?.content?.trim()
    if (!draft) {
      trackServerEvent(user.id, 'ai_api_error', { feature: 'endorsement_draft', error: 'empty_response' })
      return NextResponse.json({ error: 'Could not generate a draft. Write your own below.' }, { status: 500 })
    }

    // Log usage
    const usage = completion.usage
    if (usage) {
      logAIUsage({
        userId: user.id,
        feature: 'endorsement_draft',
        model: MODEL,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      })
    }

    trackServerEvent(user.id, 'ai_endorsement_draft_completed', {
      yacht: yachtName,
      draft_length: draft.length,
    })

    return NextResponse.json({ draft })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Draft generation timed out. Write your own below.' },
        { status: 504 },
      )
    }
    return handleApiError(err)
  }
}
```

**Request schema:**
```json
{
  "recipientName": "Sarah Jones",
  "recipientRole": "Chief Stewardess",
  "yachtName": "M/Y Horizon",
  "overlapPeriod": "Jan 2024 – Aug 2024",
  "answer1": "She ran the interior like clockwork. The guest turnovers were always seamless.",
  "answer2": "Her attention to detail was incredible — she noticed things before guests did.",
  "answer3": "Absolutely"
}
```

**Response schema:**
```json
{ "draft": "I worked alongside Sarah on M/Y Horizon through the 2024 Med season..." }
```

**Error responses:**
- `401` — Not authenticated
- `400` — Validation failed (answers too short, etc.)
- `429` — Rate limit exceeded (10/day)
- `500` — AI generation failed (empty response)
- `504` — Timeout (15s)

---

### 5.2 — POST /api/ai/cert-ocr

**File to create:** `app/api/ai/cert-ocr/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOpenAIClient, logAIUsage } from '@/lib/ai'
import { CERT_OCR_SYSTEM_PROMPT } from '@/lib/ai/prompts/cert-ocr'
import { validateBody } from '@/lib/validation/validate'
import { aiCertOcrSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { getProStatus } from '@/lib/stripe/pro'

const MODEL = 'gpt-4o-mini'
const MAX_TOKENS = 500
const TEMPERATURE = 0.1

interface CertOcrResult {
  cert_name: string | null
  cert_name_english: string | null
  certificate_number: string | null
  issuing_body: string | null
  issued_date: string | null
  expiry_date: string | null
  holder_name: string | null
  confidence: 'high' | 'medium' | 'low'
}

interface CertTypeMatch {
  id: string
  name: string
  short_name: string | null
  category: string
  similarity: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pro-only gate
    const proStatus = await getProStatus(user.id)
    if (!proStatus.isPro) {
      return NextResponse.json(
        { error: 'Certification scanning is a Pro feature. Upgrade to scan your certs.' },
        { status: 403 },
      )
    }

    const limited = await applyRateLimit(req, 'aiCertOcr', user.id)
    if (limited) return limited

    const result = await validateBody(req, aiCertOcrSchema)
    if ('error' in result) return result.error
    const { imageBase64, imageType } = result.data

    trackServerEvent(user.id, 'ai_cert_ocr_scanned', {})

    const openai = requireOpenAIClient()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s for vision

    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CERT_OCR_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: 'Extract the certification details from this document photo.',
              },
            ],
          },
        ],
      },
      { signal: controller.signal },
    )

    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) {
      trackServerEvent(user.id, 'ai_cert_ocr_failed', { reason: 'empty_response' })
      return NextResponse.json(
        { error: "We couldn't read this certificate. Please enter the details manually." },
        { status: 422 },
      )
    }

    let extracted: CertOcrResult
    try {
      extracted = JSON.parse(content) as CertOcrResult
    } catch {
      trackServerEvent(user.id, 'ai_cert_ocr_failed', { reason: 'json_parse' })
      return NextResponse.json(
        { error: "We couldn't read this certificate. Please enter the details manually." },
        { status: 422 },
      )
    }

    // Log usage
    const usage = completion.usage
    if (usage) {
      logAIUsage({
        userId: user.id,
        feature: 'cert_ocr',
        model: MODEL,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        metadata: { confidence: extracted.confidence, cert_name: extracted.cert_name },
      })
    }

    // Fuzzy match cert name against seeded certification_types
    let certTypeMatches: CertTypeMatch[] = []
    const certNameToMatch = extracted.cert_name_english ?? extracted.cert_name
    if (certNameToMatch) {
      const { data: matches } = await supabase.rpc('match_certification_type', {
        p_name: certNameToMatch,
        p_limit: 5,
      })
      if (matches) {
        certTypeMatches = matches as CertTypeMatch[]
      }
    }

    trackServerEvent(user.id, 'ai_cert_ocr_completed', {
      confidence: extracted.confidence,
      cert_name: extracted.cert_name,
      matched_type: certTypeMatches[0]?.name ?? null,
      match_similarity: certTypeMatches[0]?.similarity ?? null,
    })

    return NextResponse.json({
      extracted,
      certTypeMatches,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      trackServerEvent('unknown', 'ai_cert_ocr_failed', { reason: 'timeout' })
      return NextResponse.json(
        { error: 'Certificate scanning timed out. Please try again or enter details manually.' },
        { status: 504 },
      )
    }
    return handleApiError(err)
  }
}
```

**Request schema:**
```json
{
  "imageBase64": "/9j/4AAQSkZJRg...",
  "imageType": "image/jpeg"
}
```

**Response schema:**
```json
{
  "extracted": {
    "cert_name": "STCW Basic Safety Training",
    "cert_name_english": null,
    "certificate_number": "BST-2024-12345",
    "issuing_body": "MCA",
    "issued_date": "2024-03-15",
    "expiry_date": "2029-03-15",
    "holder_name": "Jane Smith",
    "confidence": "high"
  },
  "certTypeMatches": [
    { "id": "uuid", "name": "STCW Basic Safety Training", "short_name": "BST", "category": "Safety & Sea Survival", "similarity": 0.95 },
    { "id": "uuid", "name": "STCW Advanced Fire Fighting", "short_name": "AFF", "category": "Safety & Sea Survival", "similarity": 0.42 }
  ]
}
```

**Error responses:**
- `401` — Not authenticated
- `403` — Not Pro subscriber
- `400` — Validation failed (bad image data)
- `422` — OCR extraction failed (unreadable image)
- `429` — Rate limit exceeded (20/day)
- `504` — Timeout (30s)

---

### 5.3 — POST /api/ai/translate

**File to create:** `app/api/ai/translate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOpenAIClient, logAIUsage } from '@/lib/ai'
import { TRANSLATION_SYSTEM_PROMPT, getLanguageName } from '@/lib/ai/prompts/translate'
import { validateBody } from '@/lib/validation/validate'
import { aiTranslateSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const MODEL = 'gpt-5-nano'
const MAX_TOKENS = 800
const TEMPERATURE = 0.3

interface TranslationResult {
  subject: string
  body: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'aiTranslate', user.id)
    if (limited) return limited

    const result = await validateBody(req, aiTranslateSchema)
    if ('error' in result) return result.error
    const { subject, body, sourceLanguage, targetLanguage } = result.data

    // Same language — return unchanged
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ subject, body, translated: false })
    }

    trackServerEvent(user.id, 'ai_translation_triggered', {
      source: sourceLanguage,
      target: targetLanguage,
    })

    const openai = requireOpenAIClient()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              source_language: getLanguageName(sourceLanguage),
              target_language: getLanguageName(targetLanguage),
              subject,
              body,
            }),
          },
        ],
      },
      { signal: controller.signal },
    )

    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ subject, body, translated: false })
    }

    let translation: TranslationResult
    try {
      translation = JSON.parse(content) as TranslationResult
    } catch {
      return NextResponse.json({ subject, body, translated: false })
    }

    // Log usage
    const usage = completion.usage
    if (usage) {
      logAIUsage({
        userId: user.id,
        feature: 'translate',
        model: MODEL,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        metadata: { source: sourceLanguage, target: targetLanguage },
      })
    }

    return NextResponse.json({
      subject: translation.subject,
      body: translation.body,
      translated: true,
      sourceLanguage,
      targetLanguage,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // Timeout — return original untranslated
      return NextResponse.json({ error: 'Translation timed out' }, { status: 504 })
    }
    return handleApiError(err)
  }
}
```

**Request schema:**
```json
{
  "subject": "Sarah asked you to endorse their work on M/Y Horizon",
  "body": "They've worked on M/Y Horizon and would like you to write a short endorsement...",
  "sourceLanguage": "en",
  "targetLanguage": "fr"
}
```

**Response schema:**
```json
{
  "subject": "Sarah vous demande d'endosser son travail sur le M/Y Horizon",
  "body": "Ils ont travaillé sur le M/Y Horizon et aimeraient que vous rédigiez...",
  "translated": true,
  "sourceLanguage": "en",
  "targetLanguage": "fr"
}
```

---

### 5.4 — POST /api/ai/profile-suggest

**File to create:** `app/api/ai/profile-suggest/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOpenAIClient, logAIUsage } from '@/lib/ai'
import { PROFILE_SUGGEST_SYSTEM_PROMPT, buildProfileSuggestUserPrompt } from '@/lib/ai/prompts/profile-suggest'
import { validateBody } from '@/lib/validation/validate'
import { aiProfileSuggestSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const MODEL = 'gpt-5-nano'
const MAX_TOKENS = 400
const TEMPERATURE = 0.6

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'aiProfileSuggest', user.id)
    if (limited) return limited

    const result = await validateBody(req, aiProfileSuggestSchema)
    if ('error' in result) return result.error
    const { text, role, department, experienceYears } = result.data

    trackServerEvent(user.id, 'ai_profile_suggestion_requested', {
      text_length: text.length,
    })

    const openai = requireOpenAIClient()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: PROFILE_SUGGEST_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildProfileSuggestUserPrompt({
              currentText: text,
              role,
              department,
              experienceYears,
            }),
          },
        ],
      },
      { signal: controller.signal },
    )

    clearTimeout(timeout)

    const suggestion = completion.choices[0]?.message?.content?.trim()
    if (!suggestion) {
      return NextResponse.json({ error: 'Could not generate a suggestion.' }, { status: 500 })
    }

    // Log usage
    const usage = completion.usage
    if (usage) {
      logAIUsage({
        userId: user.id,
        feature: 'profile_suggest',
        model: MODEL,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      })
    }

    trackServerEvent(user.id, 'ai_profile_suggestion_shown', {
      original_length: text.length,
      suggestion_length: suggestion.length,
    })

    return NextResponse.json({ suggestion })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Suggestion timed out.' }, { status: 504 })
    }
    return handleApiError(err)
  }
}
```

---

## Part 6: Component Modifications

### 6.1 — AI-04: "Help Me Write" in Endorsement Form

**File to modify:** `components/endorsement/WriteEndorsementForm.tsx`

**Integration point:** Below the textarea (line 187, after the char count div), before the "Add details" collapsible.

**Changes:**

1. Add new state variables at the top of the component:
```typescript
const [showDraftFlow, setShowDraftFlow] = useState(false)
const [draftStep, setDraftStep] = useState(1)
const [draftAnswer1, setDraftAnswer1] = useState('')
const [draftAnswer2, setDraftAnswer2] = useState('')
const [draftAnswer3, setDraftAnswer3] = useState<'Yes' | 'Absolutely' | ''>('')
const [generatingDraft, setGeneratingDraft] = useState(false)
const [isDraft, setIsDraft] = useState(false)
```

2. Add a new function `handleGenerateDraft`:
```typescript
async function handleGenerateDraft() {
  setGeneratingDraft(true)
  try {
    const res = await fetch('/api/ai/endorsement-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientName,
        recipientRole: recipientRole || 'crew member',
        yachtName,
        overlapPeriod: [prefillStartDate, prefillEndDate].filter(Boolean).join(' – ') || 'their time together',
        answer1: draftAnswer1,
        answer2: draftAnswer2,
        answer3: draftAnswer3,
      }),
    })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      toast(data.error ?? "Couldn't generate a draft — write your own below.", 'error')
      setShowDraftFlow(false)
      return
    }
    const { draft } = await res.json() as { draft: string }
    setContent(draft)
    setIsDraft(true)
    setShowDraftFlow(false)
  } catch {
    toast("Couldn't generate a draft — write your own below.", 'error')
    setShowDraftFlow(false)
  } finally {
    setGeneratingDraft(false)
  }
}
```

3. Clear draft indicator when user edits text — modify the textarea `onChange`:
```typescript
onChange={(e) => {
  setContent(e.target.value)
  if (isDraft) setIsDraft(false)
}}
```

4. Add the "Help me write" button and mini-flow UI between the textarea div and the "Add details" collapsible button:

```tsx
{/* Help me write — AI draft assistant */}
{!isEditMode && !showDraftFlow && content.length === 0 && (
  <button
    type="button"
    onClick={() => setShowDraftFlow(true)}
    className="flex items-center gap-2 text-sm text-[var(--color-interactive)] font-medium"
  >
    <Sparkles size={16} />
    Help me write
  </button>
)}

{/* Draft indicator */}
{isDraft && (
  <div className="rounded-lg bg-[var(--color-teal-50)] px-3 py-2 text-xs text-[var(--color-teal-700)]">
    Draft — edit before submitting
  </div>
)}

{/* Mini-flow */}
{showDraftFlow && (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
        Quick questions to get started
      </p>
      <button
        type="button"
        onClick={() => setShowDraftFlow(false)}
        className="text-xs text-[var(--color-text-secondary)]"
      >
        Cancel
      </button>
    </div>

    {draftStep >= 1 && (
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          What did {recipientName} excel at as {recipientRole || 'a crew member'} on {yachtName}?
        </label>
        <textarea
          value={draftAnswer1}
          onChange={(e) => setDraftAnswer1(e.target.value)}
          placeholder="1-2 sentences"
          rows={2}
          maxLength={500}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-interactive)] focus:outline-none resize-none"
        />
      </div>
    )}

    {draftStep >= 2 && (
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          What stood out about working with them?
        </label>
        <textarea
          value={draftAnswer2}
          onChange={(e) => setDraftAnswer2(e.target.value)}
          placeholder="1-2 sentences"
          rows={2}
          maxLength={500}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-interactive)] focus:outline-none resize-none"
        />
      </div>
    )}

    {draftStep >= 3 && (
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Would you work with them again? (optional)
        </label>
        <div className="flex gap-2">
          {(['Yes', 'Absolutely', ''] as const).map((opt) => (
            <button
              key={opt || 'skip'}
              type="button"
              onClick={() => setDraftAnswer3(opt)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                draftAnswer3 === opt
                  ? 'bg-[var(--color-teal-700)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              {opt || 'Skip'}
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="flex gap-2">
      {draftStep < 3 ? (
        <Button
          onClick={() => setDraftStep((s) => s + 1)}
          disabled={
            (draftStep === 1 && draftAnswer1.length < 5) ||
            (draftStep === 2 && draftAnswer2.length < 5)
          }
          className="w-full"
          size="sm"
        >
          Next
        </Button>
      ) : (
        <Button
          onClick={handleGenerateDraft}
          disabled={generatingDraft || draftAnswer1.length < 5 || draftAnswer2.length < 5}
          loading={generatingDraft}
          className="w-full"
          size="sm"
        >
          {generatingDraft ? 'Writing draft…' : 'Generate draft'}
        </Button>
      )}
    </div>
  </div>
)}
```

5. Add import for `Sparkles` from `lucide-react`:
```typescript
import { Sparkles } from 'lucide-react'
```

6. Track draft-to-submission funnel in `handleSubmit` — add before the fetch call:
```typescript
if (isDraft) {
  // Track that user submitted an AI-drafted endorsement (possibly edited)
  // We can't reliably detect edits on the client — track it server-side by comparing.
}
```

The PostHog event `ai_endorsement_draft_submitted` fires on the API when the endorsement is created and the text matches or is derived from a draft. Since we can't know server-side, track it client-side in `handleSubmit`:
```typescript
// In handleSubmit, after successful response:
if (isDraft) {
  // PostHog client-side event — indicates user submitted with an AI draft
  // (may or may not have edited it)
  posthog?.capture('ai_endorsement_draft_submitted', { edited: content !== /* original draft */ })
}
```

To track whether the user edited the draft, store the original draft text:
```typescript
const [originalDraft, setOriginalDraft] = useState('')
```
In `handleGenerateDraft`, after setting content: `setOriginalDraft(draft)`.

---

### 6.2 — AI-02: "Scan Certificate" in Cert Form

**File to modify:** `app/(protected)/app/certification/new/page.tsx`

**Integration point:** At the top of the `details` step (step 3), add a "Scan certificate" button before the form fields.

**Changes:**

1. Add new state variables:
```typescript
const [scanning, setScanning] = useState(false)
const [scanResult, setScanResult] = useState<{
  extracted: CertOcrResult
  certTypeMatches: CertTypeMatch[]
} | null>(null)
const [isPro, setIsPro] = useState(false)
const certPhotoRef = useRef<HTMLInputElement>(null)
const [certPhotoFile, setCertPhotoFile] = useState<File | null>(null)
```

2. Fetch `subscription_status` in the initial `useEffect`:
```typescript
// Add to existing useEffect after loading cert types:
const { data: profile } = await supabase
  .from('users')
  .select('subscription_status')
  .eq('id', user.id)
  .single()
setIsPro(profile?.subscription_status === 'pro')
```

3. Add the scan handler:
```typescript
async function handleScanCert(file: File) {
  setCertPhotoFile(file)
  setScanning(true)
  try {
    // Convert to base64
    const buffer = await file.arrayBuffer()
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    const res = await fetch('/api/ai/cert-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        imageType: file.type,
      }),
    })

    if (!res.ok) {
      const data = await res.json() as { error?: string }
      toast(data.error ?? "Couldn't read the certificate. Please enter details manually.", 'error')
      return
    }

    const result = await res.json()
    setScanResult(result)

    // Auto-fill form fields from OCR result
    const { extracted, certTypeMatches } = result

    if (certTypeMatches.length > 0 && certTypeMatches[0].similarity > 0.5) {
      // High-confidence match — select the cert type
      setSelectedId(certTypeMatches[0].id)
      setCategory(certTypeMatches[0].category)
      setIsOther(false)
    } else if (extracted.cert_name) {
      // No good match — use as custom name
      setIsOther(true)
      setCustomName(extracted.cert_name_english ?? extracted.cert_name)
    }

    if (extracted.issued_date) setIssuedAt(extracted.issued_date)
    if (extracted.expiry_date) {
      setExpiresAt(extracted.expiry_date)
      setNoExpiry(false)
    } else {
      setNoExpiry(true)
    }

    // Set the scanned photo as the document file for upload
    setDocFile(file)

    toast('Certificate scanned — review the details below.', 'success')
  } catch {
    toast("Couldn't scan the certificate. Please enter details manually.", 'error')
  } finally {
    setScanning(false)
  }
}
```

4. Add scan UI at the top of the `details` step, before the form fields card:

```tsx
{/* Scan certificate — Pro only */}
{step === 'details' && !scanResult && (
  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 text-center">
    {isPro ? (
      <>
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Scan your certificate
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Take a photo or upload an image — we'll read the details for you.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => certPhotoRef.current?.click()}
          loading={scanning}
          disabled={scanning}
        >
          {scanning ? 'Scanning…' : 'Scan certificate'}
        </Button>
        <input
          ref={certPhotoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleScanCert(file)
          }}
          className="hidden"
        />
      </>
    ) : (
      <>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Upgrade to Pro to scan certificates with your camera.
        </p>
        <Link
          href="/app/more/subscription"
          className="text-sm text-[var(--color-interactive)] font-medium hover:underline mt-1 inline-block"
        >
          Upgrade to Pro
        </Link>
      </>
    )}
  </div>
)}

{/* Scan disclaimer */}
{scanResult && (
  <div className="rounded-lg bg-[var(--color-amber-50)] px-3 py-2 text-xs text-[var(--color-amber-700)]">
    Scanned data is pre-filled for your review. Please verify all details before saving.
    Scanned data does not constitute verification.
  </div>
)}
```

5. Modify `handleSave` to upload the scanned photo as the cert document attachment. The existing logic already handles `docFile` upload, and we set `setDocFile(file)` when scanning, so no additional change is needed — the photo is automatically uploaded as the document attachment.

---

### 6.3 — AI-03: Multilingual Translation in Endorsement Request Email

**File to modify:** `app/api/endorsement-requests/route.ts`

**Integration point:** After building the email HTML/text (around line 190, before `sendNotifyEmail()`), add translation logic.

**Changes:**

1. Add import at the top:
```typescript
import { getLanguageName } from '@/lib/ai/prompts/translate'
```

2. After fetching the requester profile (around line 106), also fetch the requester's preferred language:
```typescript
// Modify the existing profile select to include preferred_language:
const { data: profile } = await supabase
  .from("users")
  .select("display_name, full_name, subscription_status, preferred_language")
  .eq("id", user.id)
  .single();
```

3. After resolving `notifyEmail` and before the email send block (around line 186), fetch the recipient's preferred language and translate if needed:

```typescript
// Determine if translation is needed
let emailSubject = `${requesterName} asked you to endorse their work${subjectYacht}`
let emailHtml = buildHtml(safeRequesterName, safeYachtDisplay, deepLink)
let emailText = buildText(requesterName, yachtDisplay, deepLink)

const senderLang = profile?.preferred_language ?? 'en'

// Fetch recipient's preferred language
let recipientLang = 'en'
if (recipientUserId) {
  const { data: recipientProfile } = await supabase
    .from("users")
    .select("preferred_language")
    .eq("id", recipientUserId)
    .single()
  recipientLang = recipientProfile?.preferred_language ?? 'en'
}

// Translate if languages differ
if (senderLang !== recipientLang && recipientLang !== 'en') {
  try {
    const translateRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'}/api/ai/translate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailText,
          sourceLanguage: senderLang,
          targetLanguage: recipientLang,
        }),
      },
    )
    if (translateRes.ok) {
      const translation = await translateRes.json() as {
        subject: string; body: string; translated: boolean
      }
      if (translation.translated) {
        // Use translated content
        const translationNote = `[This message was automatically translated from ${getLanguageName(senderLang)}]`
        emailSubject = translation.subject
        // Rebuild HTML with translated text + translation note
        emailHtml = buildHtml(safeRequesterName, safeYachtDisplay, deepLink)
          .replace(
            '</td></tr>\n\n        <!-- Footer -->',
            `<p style="margin:16px 0 0;font-size:12px;color:#6b7280;font-style:italic;">${translationNote}</p></td></tr>\n\n        <!-- Footer -->`
          )
        emailText = `${translation.body}\n\n${translationNote}`

        trackServerEvent(user.id, 'ai_translation_triggered', {
          source: senderLang,
          target: recipientLang,
        })
      }
    }
  } catch {
    // Translation failure is non-fatal — send in original language
  }
}
```

**Alternative approach (simpler, avoids internal fetch):** Instead of calling the translate API route via HTTP, extract the translation logic into a shared function in `lib/ai/translate.ts` and call it directly. This avoids the overhead of an HTTP round-trip within the same server process:

**File to create:** `lib/ai/translate.ts`

```typescript
import { requireOpenAIClient } from './openai-client'
import { logAIUsage } from './cost-tracker'
import { TRANSLATION_SYSTEM_PROMPT, getLanguageName } from './prompts/translate'

interface TranslateParams {
  subject: string
  body: string
  sourceLanguage: string
  targetLanguage: string
  userId: string
}

interface TranslateResult {
  subject: string
  body: string
  translated: boolean
}

/**
 * Translate email content. Returns original if same language or on failure.
 * Non-blocking — gracefully falls back to original on any error.
 */
export async function translateContent(params: TranslateParams): Promise<TranslateResult> {
  if (params.sourceLanguage === params.targetLanguage) {
    return { subject: params.subject, body: params.body, translated: false }
  }

  try {
    const openai = requireOpenAIClient()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-5-nano',
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              source_language: getLanguageName(params.sourceLanguage),
              target_language: getLanguageName(params.targetLanguage),
              subject: params.subject,
              body: params.body,
            }),
          },
        ],
      },
      { signal: controller.signal },
    )

    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) return { subject: params.subject, body: params.body, translated: false }

    const parsed = JSON.parse(content) as { subject: string; body: string }

    // Log usage
    const usage = completion.usage
    if (usage) {
      logAIUsage({
        userId: params.userId,
        feature: 'translate',
        model: 'gpt-5-nano',
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        metadata: { source: params.sourceLanguage, target: params.targetLanguage },
      })
    }

    return { subject: parsed.subject, body: parsed.body, translated: true }
  } catch {
    return { subject: params.subject, body: params.body, translated: false }
  }
}
```

**Then in `app/api/endorsement-requests/route.ts`**, use the direct function:

```typescript
import { translateContent } from '@/lib/ai/translate'
import { getLanguageName } from '@/lib/ai/prompts/translate'

// ... inside the route, after resolving notifyEmail:

const senderLang = profile?.preferred_language ?? 'en'
let recipientLang = 'en'
if (recipientUserId) {
  const { data: recipientProfile } = await supabase
    .from("users")
    .select("preferred_language")
    .eq("id", recipientUserId)
    .single()
  recipientLang = recipientProfile?.preferred_language ?? 'en'
}

// Build email content
const subject = `${requesterName} asked you to endorse their work${subjectYacht}`
const textBody = buildText(requesterName, yachtDisplay, deepLink)

let finalSubject = subject
let finalHtml = buildHtml(safeRequesterName, safeYachtDisplay, deepLink)
let finalText = textBody

if (senderLang !== recipientLang && recipientLang !== 'en') {
  const translation = await translateContent({
    subject,
    body: textBody,
    sourceLanguage: senderLang,
    targetLanguage: recipientLang,
    userId: user.id,
  })

  if (translation.translated) {
    const note = `This message was automatically translated from ${getLanguageName(senderLang)}`
    finalSubject = translation.subject
    // Rebuild HTML with translated body — the simplest approach is to translate
    // the text body and inject into a modified template
    finalHtml = buildTranslatedHtml(safeRequesterName, safeYachtDisplay, deepLink, translation.body, note)
    finalText = `${translation.body}\n\n[${note}]`

    trackServerEvent(user.id, 'ai_translation_triggered', {
      source: senderLang,
      target: recipientLang,
    })
  }
}

// Then use finalSubject, finalHtml, finalText in sendNotifyEmail()
```

Add a `buildTranslatedHtml()` function alongside the existing `buildHtml()`:

```typescript
function buildTranslatedHtml(
  requesterName: string,
  yachtName: string,
  deepLink: string,
  translatedBody: string,
  translationNote: string,
) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">YachtieLink</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;white-space:pre-wrap;">${translatedBody}</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${deepLink}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                Write an endorsement →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;line-height:1.5;">
            Or copy this link: <a href="${deepLink}" style="color:#9ca3af;">${deepLink}</a>
          </p>
          <p style="margin:0;font-size:12px;color:#6b7280;font-style:italic;">${translationNote}</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
            You received this because ${requesterName} added your email address.
            If you don't know them, you can ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
```

---

### 6.4 — AI-17: "Improve" Button on Bio Edit Page

**File to modify:** `app/(protected)/app/about/edit/page.tsx`

**Integration point:** Below the Textarea component, before the character count display.

**Changes:**

1. Add new state variables:
```typescript
const [suggesting, setSuggesting] = useState(false)
const [suggestion, setSuggestion] = useState<string | null>(null)
```

2. Add handler:
```typescript
async function handleImprove() {
  if (bio.length < 10) {
    toast('Write at least 10 characters first.', 'error')
    return
  }
  setSuggesting(true)
  setSuggestion(null)
  try {
    // Fetch user context for better suggestions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('users')
      .select('primary_role, departments')
      .eq('id', user.id)
      .single()

    const res = await fetch('/api/ai/profile-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: bio,
        role: profileData?.primary_role ?? undefined,
        department: profileData?.departments?.[0] ?? undefined,
      }),
    })

    if (!res.ok) {
      // Silently fail — don't block editing
      return
    }

    const { suggestion: text } = await res.json() as { suggestion: string }
    setSuggestion(text)
  } catch {
    // Silently fail
  } finally {
    setSuggesting(false)
  }
}

function acceptSuggestion() {
  if (suggestion) {
    setBio(suggestion)
    setSuggestion(null)
    // PostHog client-side
    posthog?.capture('ai_profile_suggestion_accepted')
  }
}

function dismissSuggestion() {
  setSuggestion(null)
  posthog?.capture('ai_profile_suggestion_dismissed')
}
```

3. Add UI after the Textarea, before the char count paragraph:

```tsx
{/* Improve button */}
{!suggestion && bio.length >= 10 && (
  <button
    type="button"
    onClick={handleImprove}
    disabled={suggesting}
    className="flex items-center gap-1.5 text-xs text-[var(--color-interactive)] font-medium mt-1"
  >
    <Sparkles size={14} />
    {suggesting ? 'Improving…' : 'Improve with AI'}
  </button>
)}

{/* Suggestion panel */}
{suggestion && (
  <div className="mt-3 rounded-2xl border border-[var(--color-teal-200)] bg-[var(--color-teal-50)] p-4 flex flex-col gap-3">
    <p className="text-xs font-medium text-[var(--color-teal-700)]">Suggested improvement</p>
    <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
      {suggestion}
    </p>
    <div className="flex gap-2">
      <Button size="sm" onClick={acceptSuggestion} className="flex-1">
        Accept
      </Button>
      <Button size="sm" variant="secondary" onClick={() => {
        setBio(suggestion)
        setSuggestion(null)
      }} className="flex-1">
        Edit
      </Button>
      <Button size="sm" variant="secondary" onClick={dismissSuggestion} className="flex-1">
        Dismiss
      </Button>
    </div>
  </div>
)}
```

4. Add import:
```typescript
import { Sparkles } from 'lucide-react'
```

---

### 6.5 — Language Preference in Profile Settings

**File to create or modify:** The preferred language dropdown needs to be accessible in profile settings. If there is no existing language preference UI, add a dropdown to the profile settings/more page.

**New component to create:** `components/profile/LanguagePreference.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'tl', label: 'Filipino / Tagalog' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'hr', label: 'Hrvatski' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'it', label: 'Italiano' },
  { code: 'el', label: '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac' },
  { code: 'pt', label: 'Portugu\u00eas' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { code: 'uk', label: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'T\u00fcrk\u00e7e' },
  { code: 'th', label: '\u0e44\u0e17\u0e22' },
  { code: 'id', label: 'Bahasa Indonesia' },
]

interface Props {
  initialLanguage: string
  userId: string
}

export function LanguagePreference({ initialLanguage, userId }: Props) {
  const [language, setLanguage] = useState(initialLanguage)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  async function handleChange(code: string) {
    setLanguage(code)
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ preferred_language: code })
        .eq('id', userId)
      if (error) throw error
      toast('Language preference saved.', 'success')
    } catch {
      toast('Failed to save language preference.', 'error')
      setLanguage(initialLanguage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
        Preferred language
      </label>
      <p className="text-xs text-[var(--color-text-secondary)] mb-2">
        Endorsement requests you receive will be translated into this language.
      </p>
      <select
        value={language}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-interactive)] focus:outline-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  )
}
```

**Integration point:** Add this component to the profile settings page (likely `app/(protected)/app/more/page.tsx` or a dedicated profile settings page). The exact location depends on where profile settings live — add a `SettingsRow` that links to a language preference section, or inline the dropdown in the existing settings page.

---

## Part 7: PostHog Event Specifications

| Event | Properties | Trigger |
|-------|-----------|---------|
| `ai_endorsement_draft_requested` | `{ yacht: string }` | User opens the "Help me write" flow and submits questions |
| `ai_endorsement_draft_completed` | `{ yacht: string, draft_length: number }` | API returns a draft successfully |
| `ai_endorsement_draft_submitted` | `{ edited: boolean }` | User submits an endorsement that started as an AI draft |
| `ai_cert_ocr_scanned` | `{}` | User submits a cert photo for scanning |
| `ai_cert_ocr_completed` | `{ confidence: string, cert_name: string \| null, matched_type: string \| null, match_similarity: number \| null }` | OCR returns successfully |
| `ai_cert_ocr_failed` | `{ reason: 'empty_response' \| 'json_parse' \| 'timeout' }` | OCR fails |
| `ai_cert_ocr_accepted` | `{ cert_type_matched: boolean }` | User saves the cert from OCR results — tracked client-side in the cert form `handleSave` when `scanResult` is set |
| `ai_translation_triggered` | `{ source: string, target: string }` | Translation attempted on endorsement request email |
| `ai_profile_suggestion_requested` | `{ text_length: number }` | User clicks "Improve with AI" |
| `ai_profile_suggestion_shown` | `{ original_length: number, suggestion_length: number }` | Suggestion returned successfully |
| `ai_profile_suggestion_accepted` | `{}` | User clicks "Accept" |
| `ai_profile_suggestion_dismissed` | `{}` | User clicks "Dismiss" |
| `ai_api_error` | `{ feature: string, model: string, error: string }` | Any AI API call fails |

**Server-side events** use `trackServerEvent()`. **Client-side events** (accepted/dismissed) use the PostHog client SDK (`posthog?.capture()`).

---

## Part 8: File-by-File Implementation Order

Each file is listed with its dependencies. Implement top-down — no file should be built before its dependencies.

### Phase A: Foundation (no dependencies on each other)

| # | File | Type | Dependencies |
|---|------|------|-------------|
| 1 | `supabase/migrations/20260324000001_sprint16_ai_pack1.sql` | Create | None |
| 2 | `lib/ai/openai-client.ts` | Create | None |
| 3 | `lib/ai/cost-tracker.ts` | Create | `lib/supabase/admin.ts` (exists) |
| 4 | `lib/ai/index.ts` | Create | #2, #3 |
| 5 | `lib/ai/prompts/endorsement-draft.ts` | Create | None |
| 6 | `lib/ai/prompts/cert-ocr.ts` | Create | None |
| 7 | `lib/ai/prompts/translate.ts` | Create | None |
| 8 | `lib/ai/prompts/profile-suggest.ts` | Create | None |
| 9 | `lib/ai/translate.ts` | Create | #2, #3, #7 |

### Phase B: Configuration (depends on Phase A)

| # | File | Type | Dependencies |
|---|------|------|-------------|
| 10 | `lib/rate-limit/helpers.ts` | Modify | None (add 4 new rate limit entries) |
| 11 | `lib/validation/schemas.ts` | Modify | None (add 4 new Zod schemas) |

### Phase C: API Routes (depends on Phase A + B)

| # | File | Type | Dependencies |
|---|------|------|-------------|
| 12 | `app/api/ai/endorsement-draft/route.ts` | Create | #4, #5, #10, #11 |
| 13 | `app/api/ai/cert-ocr/route.ts` | Create | #4, #6, #10, #11, migration #1 |
| 14 | `app/api/ai/translate/route.ts` | Create | #4, #7, #10, #11 |
| 15 | `app/api/ai/profile-suggest/route.ts` | Create | #4, #8, #10, #11 |

### Phase D: Components (depends on Phase C)

| # | File | Type | Dependencies |
|---|------|------|-------------|
| 16 | `components/endorsement/WriteEndorsementForm.tsx` | Modify | #12 — add "Help me write" button + mini-flow |
| 17 | `app/(protected)/app/certification/new/page.tsx` | Modify | #13 — add "Scan certificate" button + OCR flow |
| 18 | `app/api/endorsement-requests/route.ts` | Modify | #9 — add translation wrapping |
| 19 | `app/(protected)/app/about/edit/page.tsx` | Modify | #15 — add "Improve" button + suggestion panel |
| 20 | `components/profile/LanguagePreference.tsx` | Create | Migration #1 |

### Phase E: Integration + Settings

| # | File | Type | Dependencies |
|---|------|------|-------------|
| 21 | Profile settings page (add language dropdown) | Modify | #20 |
| 22 | `components/endorsement/DeepLinkFlow.tsx` | Verify | #16 — ensure "Help me write" also works via deep link flow |

### Phase F: Documentation + Cleanup

| # | File | Type | Dependencies |
|---|------|------|-------------|
| 23 | `CHANGELOG.md` | Update | All |
| 24 | `docs/modules/ai.md` (or relevant module file) | Create/Update | All |

---

## Part 9: OpenAI API Call Summary

| Feature | Model | Temperature | Max Tokens | Response Format | Timeout |
|---------|-------|------------|------------|----------------|---------|
| AI-04 Endorsement Draft | `gpt-5-nano` | 0.8 | 500 | plain text | 15s |
| AI-02 Cert OCR | `gpt-4o-mini` | 0.1 | 500 | `json_object` | 30s |
| AI-03 Translation | `gpt-5-nano` | 0.3 | 800 | `json_object` | 15s |
| AI-17 Profile Suggest | `gpt-5-nano` | 0.6 | 400 | plain text | 10s |

**Model note:** If `gpt-5-nano` is not yet available in the OpenAI API at build time, use `gpt-4o-mini` as a drop-in replacement for all three text features. The prompts work with either model. Update the model string in each API route and the cost table in `cost-tracker.ts` when gpt-5-nano becomes available.

---

## Part 10: Testing Checklist

### AI-04 — Endorsement Writing Assistant

- [ ] "Help me write" button appears below empty endorsement textarea
- [ ] Button is hidden when textarea already has content
- [ ] Button is hidden in edit mode (editing existing endorsement)
- [ ] Mini-flow renders 3 questions in sequence (step 1 → 2 → 3)
- [ ] "Next" button disabled until answer has >=5 characters
- [ ] "Generate draft" calls API and populates textarea
- [ ] "Draft — edit before submitting" indicator appears after draft generation
- [ ] Indicator disappears when user edits the text
- [ ] Draft references the correct yacht name and recipient name
- [ ] Draft tone is natural — no AI cliches, no superlatives
- [ ] API failure shows toast and falls through to manual writing
- [ ] Rate limit (10/day) triggers 429 response after exhausting
- [ ] PostHog events fire: `ai_endorsement_draft_requested`, `ai_endorsement_draft_completed`, `ai_endorsement_draft_submitted`
- [ ] Cost logged to `ai_usage_log` table
- [ ] Works at 375px width — mini-flow doesn't overflow

### AI-02 — Cert OCR

- [ ] "Scan certificate" button appears on cert details step for Pro users
- [ ] Free users see "Upgrade to Pro" message instead
- [ ] Camera capture opens on mobile (`capture="environment"`)
- [ ] File picker opens on desktop
- [ ] JPEG, PNG, WebP accepted — other types rejected
- [ ] API sends image, returns extracted fields
- [ ] Form pre-fills: cert type, issued date, expiry date
- [ ] High-similarity cert type match auto-selects from dropdown
- [ ] Low-similarity match falls through to custom cert name
- [ ] Scanned photo automatically set as document attachment
- [ ] Disclaimer banner appears: "Scanned data does not constitute verification"
- [ ] User can edit all pre-filled fields before saving
- [ ] API failure shows toast and falls through to manual entry
- [ ] Rate limit (20/day Pro) triggers 429
- [ ] PostHog events fire: `ai_cert_ocr_scanned`, `ai_cert_ocr_completed` / `ai_cert_ocr_failed`, `ai_cert_ocr_accepted`
- [ ] Cost logged to `ai_usage_log`
- [ ] **Test with real cert photos (mandatory):**
  - [ ] UK ENG1 medical certificate
  - [ ] STCW Basic Safety Training certificate
  - [ ] French STCW certificate (non-English)
  - [ ] Philippine SIRB (non-Latin potential)
  - [ ] South African food safety certificate
  - [ ] Blurry/angled photo (should return low confidence)
  - [ ] Non-certificate image (should return mostly nulls)
  - [ ] Certificate with no expiry date (should return null for expiry)

### AI-03 — Multilingual Endorsement Requests

- [ ] Endorsement request email sends in English when both users have `preferred_language = 'en'`
- [ ] Email translated when sender and recipient have different languages
- [ ] Translation note appears in email: "This message was automatically translated from [language]"
- [ ] Email reverts to original language if translation fails
- [ ] Email sends in English if recipient has no preferred_language set
- [ ] Deep link in translated email still works
- [ ] PostHog event fires: `ai_translation_triggered`
- [ ] Cost logged to `ai_usage_log`
- [ ] Test language pairs:
  - [ ] English → French
  - [ ] English → Filipino/Tagalog
  - [ ] French → English
  - [ ] Croatian → English
  - [ ] English → Greek

### AI-17 — Smart Profile Suggestions

- [ ] "Improve with AI" button appears on bio edit page when bio >= 10 chars
- [ ] Button hidden when bio < 10 chars
- [ ] Clicking shows loading state ("Improving…")
- [ ] Suggestion panel appears with improved text
- [ ] "Accept" replaces bio with suggestion
- [ ] "Edit" replaces bio with suggestion (same as accept, for further editing)
- [ ] "Dismiss" closes suggestion panel, keeps original bio
- [ ] Suggestion preserves user's voice — not corporate-speak
- [ ] Suggestion stays under 500 chars (bio limit)
- [ ] API failure silently hides suggestion UI (no error toast)
- [ ] Rate limit (20/day) triggers 429
- [ ] PostHog events fire: `ai_profile_suggestion_requested`, `ai_profile_suggestion_shown`, `ai_profile_suggestion_accepted` / `ai_profile_suggestion_dismissed`
- [ ] Cost logged to `ai_usage_log`
- [ ] Works at 375px width

### Language Preference

- [ ] `preferred_language` column exists on `users` table with default 'en'
- [ ] Language dropdown renders in profile settings
- [ ] Selecting a language persists to database
- [ ] Language preference used correctly in endorsement request translation

### Shared Infrastructure

- [ ] `ai_usage_log` table created with correct schema
- [ ] RLS: users can read own usage, service role can insert
- [ ] `match_certification_type()` RPC returns fuzzy matches
- [ ] All four rate limits enforce correctly (Redis-backed)
- [ ] All four API routes return proper error codes (401, 403, 429, 500, 504)
- [ ] OpenAI client singleton is reused across requests
- [ ] Cost tracker logs correctly with estimated EUR cost
- [ ] No feature blocks the user flow on AI failure — all fall back gracefully

### Cross-Cutting

- [ ] All components render correctly at 375px width (mobile-first)
- [ ] No `console.log` statements in committed code
- [ ] No hardcoded API keys or secrets
- [ ] TypeScript types on all new interfaces — no `any`
- [ ] Sentry captures AI API errors (via `handleApiError`)
- [ ] CHANGELOG.md updated
- [ ] Module docs updated

---

## Part 11: Rollback Plan

### If any AI feature breaks in production:

1. **Individual feature kill switch:** Each API route can be disabled by setting an environment variable. Add a check at the top of each route:
   ```typescript
   if (process.env.DISABLE_AI_FEATURES === 'true') {
     return NextResponse.json({ error: 'AI features are temporarily unavailable.' }, { status: 503 })
   }
   ```
   This disables all AI features at once. For per-feature control:
   - `DISABLE_AI_ENDORSEMENT_DRAFT=true`
   - `DISABLE_AI_CERT_OCR=true`
   - `DISABLE_AI_TRANSLATE=true`
   - `DISABLE_AI_PROFILE_SUGGEST=true`

2. **Client-side graceful degradation:** All four features are additive — they enhance existing flows but don't replace them. If an AI route returns an error, the UI falls through to the manual flow. No feature gate removal needed.

3. **Database rollback:** The migration adds one table (`ai_usage_log`) and one column (`preferred_language`). If the migration needs reverting:
   ```sql
   DROP TABLE IF EXISTS public.ai_usage_log;
   DROP FUNCTION IF EXISTS match_certification_type(text, int);
   ALTER TABLE public.users DROP COLUMN IF EXISTS preferred_language;
   ```
   This is safe — no existing data depends on these additions.

4. **OpenAI cost runaway:** If AI costs spike unexpectedly:
   - Set `DISABLE_AI_FEATURES=true` in Vercel env vars → immediate zero cost
   - Check `ai_usage_log` table: `SELECT feature, SUM(estimated_cost_eur), COUNT(*) FROM ai_usage_log WHERE created_at > now() - interval '24 hours' GROUP BY feature`
   - Tighten rate limits in `lib/rate-limit/helpers.ts` and redeploy
   - Switch from `gpt-4o-mini` to `gpt-5-nano` for cert OCR if vision model costs are the problem

5. **Full revert:** If the entire sprint needs reverting, `vercel rollback` to the previous deployment. The `ai_usage_log` table and `preferred_language` column will exist but be unused — no harm from orphaned schema additions.

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S16-01 | Shared `lib/ai/` module with singleton client | Existing code creates OpenAI instances per-route. Centralising prevents key sprawl, enables cost tracking interception, and provides a single point for model upgrades. |
| D-S16-02 | Authenticated client for `ai_usage_log` inserts | RLS `with check (auth.uid() = user_id)` restricts inserts to authenticated users inserting their own records. API routes are already auth-gated. For server-side translation (called within another route), the authenticated client's `auth.uid()` is available from the parent request context. |
| D-S16-03 | `lib/ai/translate.ts` direct function, not HTTP call | Endorsement request route calls translation inline. Internal HTTP fetch adds latency and cold start risk. Direct function call is simpler, faster, and testable. The `/api/ai/translate` route exists for future client-side use (AI-10 multilingual profiles). |
| D-S16-04 | `gpt-4o-mini` fallback if `gpt-5-nano` unavailable | The build plan specifies gpt-5-nano for text features but gpt-4o-mini is confirmed available. If gpt-5-nano doesn't exist in the API at build time, use gpt-4o-mini everywhere and swap when available. Prompts work with either. |
| D-S16-05 | Cert OCR uses base64 image upload, not URL | The cert photo hasn't been uploaded to storage yet when OCR runs — it's still a local file. Base64 in the request body is the simplest path. Max 10MB image → ~13MB base64 → within Next.js default body size limit (but may need `bodyParser: { sizeLimit: '15mb' }` in route config). |
| D-S16-06 | No AI attribution on submitted endorsements | Per AI-04 spec and D-003: the endorser's words once submitted. Adding "AI-assisted" labels would discourage use and create a trust signal gap (AI-assisted vs. hand-written endorsements). |
| D-S16-07 | Translation is transparent — no user action | AI-03 triggers automatically when language mismatch detected. No "translate?" prompt. If translation fails, email sends in original language. The recipient never knows translation was attempted unless it succeeded. |
| D-S16-08 | Per-feature env var kill switches | Each feature can be disabled independently without redeploying. Critical for cost control and incident response. |
| D-S16-09 | `preferred_language` defaults to 'en' | Existing users without the field get English. Translation only triggers when recipient has a non-English preference explicitly set. This avoids translating emails for users who never set a preference. |
| D-S16-10 | Cert type matching uses Postgres trigram + Levenshtein via RPC | Server-side fuzzy matching avoids shipping a JS string-distance library. The `certification_types` table already has a GIN trigram index. The `match_certification_type()` RPC leverages this existing infrastructure. |

---

## Cost Estimates

| Feature | Model | Est. cost per call | Daily rate limit | Max daily cost per user |
|---------|-------|--------------------|-----------------|------------------------|
| AI-04 Endorsement Draft | gpt-5-nano | EUR 0.0003 | 10 | EUR 0.003 |
| AI-02 Cert OCR | gpt-4o-mini (vision) | EUR 0.003 | 20 | EUR 0.06 |
| AI-03 Translation | gpt-5-nano | EUR 0.0003 | 30 | EUR 0.009 |
| AI-17 Profile Suggest | gpt-5-nano | EUR 0.0002 | 20 | EUR 0.004 |

**At 100 active users, worst case (everyone maxes rate limits daily):**
- AI-04: EUR 0.30/day
- AI-02: EUR 6.00/day (Pro only — assume 20% Pro = 20 users)
- AI-03: EUR 0.90/day
- AI-17: EUR 0.40/day
- **Total: EUR 7.60/day = EUR 228/month**

**Realistic estimate (10% of users use AI features, average 2 calls/day):**
- EUR 0.50–2.00/month total

Monitor via `ai_usage_log`: `SELECT feature, DATE(created_at), SUM(estimated_cost_eur) FROM ai_usage_log GROUP BY feature, DATE(created_at) ORDER BY 2 DESC`
