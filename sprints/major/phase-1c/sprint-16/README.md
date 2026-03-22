# Sprint 16 — AI Pack 1

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 1C
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 15 (crew search, expanded analytics, notification preferences, endorsement pinning)

## Goal

Add AI-powered convenience features that accelerate profile completion and endorsement quality — the two metrics that determine graph density. Four features ship together: an endorsement writing assistant that turns blank-page paralysis into completed endorsements (AI-04), certification OCR that replaces 15 minutes of manual data entry with a phone photo (AI-02), multilingual endorsement requests that remove the language barrier from graph formation (AI-03), and smart profile suggestions that polish bios and text fields (AI-17). All four use OpenAI APIs, share a common integration pattern, and respect the canonical rule: AI improves presentation and convenience, never creates or alters trust. Sprint 15's mature profile, endorsement, and certification infrastructure means these features plug into existing flows — no new pages, just smarter versions of existing ones.

## Scope

**In:**
- AI-04: Endorsement Writing Assistant — "Help me write" button in endorsement form, 2–3 question mini-flow, draft generation (Free, GPT-5 Nano)
- AI-02: Certification OCR & Auto-Fill — photo capture → extract cert type, dates, issuer → pre-fill form (Pro, GPT-4o Mini Vision)
- AI-03: Multilingual Endorsement Requests — auto-translate request emails when sender/recipient languages differ (Free, GPT-5 Nano)
- AI-17: Smart Profile Suggestions — "Improve" button on bio and text fields, inline suggestion with accept/dismiss (Free, GPT-5 Nano)
- Shared OpenAI API integration layer: API key management, error handling, cost tracking, rate limiting
- AI usage telemetry: track per-feature usage, cost, and completion rates in PostHog

**Out:**
- AI-01 Content Moderation (should ship with launch — Phase 1A, not bundled here)
- AI-05 Cert Expiry Intelligence (Pro, deferred — build on cert data after OCR adoption stabilises)
- AI-07 NLP Crew Search (Phase 2, Sprint 20 — requires vector infrastructure)
- AI-10 Multilingual Profile Translation (larger feature — translating all profile content is a separate sprint)
- AI-08 CV Parser Vision Upgrade (photo CV upload — separate from cert OCR)
- AI-15 AI Profile Insights (narrative analytics — deferred to when analytics data is rich enough)
- Endorsement text translation (AI-03 translates the request email only, not the endorsement itself — see AI-10)
- AI attribution on endorsements (the endorser's words once they submit — no "AI-assisted" label)

## Dependencies

- Sprint 15 complete: search, analytics, notification preferences (not directly blocking, but the profile/endorsement infrastructure must be stable)
- Endorsement form and flow — exists from Sprint 5 (the writing assistant plugs into this)
- Certification add/edit form — exists from Sprint 3 (OCR plugs into this)
- Endorsement request email sending via Resend — exists from Sprint 5 (multilingual wraps this)
- Profile bio edit form — exists from Sprint 3 (suggestions plug into this)
- OpenAI API key provisioned and stored in environment variables
- Languages field on user profiles — exists from Sprint 3 (used for language detection in AI-03)
- Seeded certification type list — exists from Sprint 3 (used for cert type matching in AI-02)

## Key Deliverables

### Shared AI Integration Layer

- ⬜ `lib/ai/openai-client.ts` — singleton OpenAI client, reads API key from env
- ⬜ `lib/ai/rate-limiter.ts` — per-user rate limiting for AI features (uses existing Vercel KV rate limiter pattern from Sprint 8)
- ⬜ `lib/ai/cost-tracker.ts` — logs model, tokens used, estimated cost per call to `ai_usage_log` table
- ⬜ `CREATE TABLE ai_usage_log (id uuid PK, user_id uuid FK, feature text, model text, input_tokens int, output_tokens int, estimated_cost_eur numeric, created_at timestamptz DEFAULT now())`
- ⬜ Shared error handling: graceful fallback on API failure (never block the user — always fall through to manual flow)
- ⬜ Shared prompt templates directory: `lib/ai/prompts/` with versioned prompt files per feature
- ⬜ Environment variable: `OPENAI_API_KEY` (already exists from CV import in Sprint 6 — verify and reuse)

### AI-04 — Endorsement Writing Assistant

- ⬜ "Help me write" button below the endorsement text field in the endorsement form
- ⬜ Button opens a 2–3 question mini-flow (bottom sheet on mobile, modal on desktop):
  1. "What did [recipient name] excel at in their role as [role] on [yacht]?" (free text, 1–2 sentences)
  2. "What stood out about working with them?" (free text, 1–2 sentences)
  3. "Would you work with them again?" (Yes / Absolutely / skip)
- ⬜ Context auto-populated from attachment data: recipient's name, role, yacht name, overlap period
- ⬜ API call: GPT-5 Nano with system prompt + user answers → 100–300 word draft endorsement
- ⬜ System prompt guardrails: write authentically, avoid superlatives, match how real crew speak, reference specific yacht/role/time period, no generic praise
- ⬜ Draft populated into the text field with a "Draft — edit before submitting" indicator
- ⬜ User can edit freely; submitting removes draft indicator
- ⬜ No AI attribution on the published endorsement
- ⬜ Does NOT affect endorsement eligibility or trust weighting
- ⬜ API route: `POST /api/ai/endorsement-draft` — accepts answers + context, returns draft text
- ⬜ Rate limit: 10 drafts/day per user (generous — most users write 1–3 endorsements per session)
- ⬜ Fallback: if API fails, show "Couldn't generate a draft — write your own below" and log error

### AI-02 — Certification OCR & Auto-Fill

- ⬜ "Scan certificate" button on the cert add form (Pro only — free users see "Upgrade to Pro to scan certs")
- ⬜ Camera capture: `<input type="file" accept="image/*" capture="environment">` for mobile camera, standard file picker on desktop
- ⬜ Accepted formats: JPEG, PNG, WebP — max 10MB
- ⬜ Image sent to GPT-4o Mini Vision via API with structured extraction prompt
- ⬜ Extracted fields: cert type (matched against seeded cert type list using fuzzy match), issue date, expiry date, issuing authority, certificate number
- ⬜ Review step: pre-filled cert form shown to user for confirmation/editing before saving (same UX pattern as CV import review from Sprint 6)
- ⬜ Cert type matching: extracted name run against the seeded list with Levenshtein distance; if no close match, show dropdown pre-opened with best guesses
- ⬜ Simultaneously upload the photo as the cert document attachment (saves a second upload step)
- ⬜ API route: `POST /api/ai/cert-ocr` — accepts image, returns extracted fields
- ⬜ Rate limit: 20 scans/day per user (Pro only)
- ⬜ Fallback: if extraction fails or confidence is low, "We couldn't read this one — please enter the details manually" and pre-open manual form
- ⬜ Does not constitute verification — extracted data is still self-reported (display disclaimer on review screen)

### AI-03 — Multilingual Endorsement Requests

- ⬜ Hook into existing endorsement request email send flow (Sprint 5 Resend integration)
- ⬜ Trigger: sender's `preferred_language` differs from recipient's `preferred_language`
- ⬜ If recipient's language not set, default to English (no translation)
- ⬜ Translate: email subject line + body text via GPT-5 Nano
- ⬜ Include note in translated email: "This message was automatically translated from [sender's language]"
- ⬜ Original language version preserved (stored alongside translation for audit)
- ⬜ Priority languages (10): English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch
- ⬜ Other languages: attempt translation for any language GPT-5 Nano supports, fall back to English if unsupported
- ⬜ Does NOT translate the endorsement text itself — stored in the language it was written in
- ⬜ API route: `POST /api/ai/translate` — generic translation endpoint, reusable for future features (AI-10)
- ⬜ Rate limit: inherits endorsement request rate limit (10/day free, 20/day Pro) — no separate AI limit needed
- ⬜ Fallback: if translation fails, send email in sender's language with a note "Translation unavailable"
- ⬜ No user action required — translation is transparent on send
- ⬜ Requires `preferred_language` field on user profiles (verify exists from Sprint 3 Languages feature — if not yet built, add a language preference dropdown to profile settings)

### AI-17 — Smart Profile Suggestions

- ⬜ "Improve" button next to bio text field and other free-text profile fields
- ⬜ Trigger: button tap, or suggested via subtle CTA after user finishes typing and blurs the field
- ⬜ Input: user's current text + role, department, experience level for context
- ⬜ API call: GPT-5 Nano with system prompt → suggested revision
- ⬜ System prompt guardrails: preserve user's voice and intent, fix grammar, improve clarity, add industry-standard terminology, suggest completeness improvements (e.g., "Consider mentioning your language skills"), never add false claims or embellish
- ⬜ Display: inline suggestion shown as diff-style (original vs improved) or side-by-side on wider screens
- ⬜ Actions: "Accept" (replaces text), "Edit" (opens with suggestion pre-filled), "Dismiss" (keeps original)
- ⬜ API route: `POST /api/ai/profile-suggest` — accepts text + user context, returns suggestion
- ⬜ Rate limit: 20 suggestions/day per user
- ⬜ Fallback: if API fails, hide the suggestion UI silently — don't block editing
- ⬜ Free for all users — profile quality benefits the entire ecosystem

### Database Migration

- ⬜ `CREATE TABLE ai_usage_log (id uuid PK, user_id uuid FK, feature text NOT NULL, model text NOT NULL, input_tokens int, output_tokens int, estimated_cost_eur numeric(10,6), created_at timestamptz DEFAULT now())`
- ⬜ Index: `ai_usage_log(user_id, feature, created_at)` for rate limiting queries and per-user cost tracking
- ⬜ RLS: users can read their own usage logs; admin can read all
- ⬜ Verify `preferred_language` column exists on `users` table; if not, `ALTER TABLE users ADD COLUMN preferred_language text DEFAULT 'en'`
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `ai_endorsement_draft_requested` / `ai_endorsement_draft_completed` / `ai_endorsement_draft_submitted` (track funnel: requested → generated → actually submitted with/without edits)
- ⬜ `ai_cert_ocr_scanned` / `ai_cert_ocr_accepted` / `ai_cert_ocr_failed` with cert type
- ⬜ `ai_translation_triggered` with source/target languages
- ⬜ `ai_profile_suggestion_shown` / `ai_profile_suggestion_accepted` / `ai_profile_suggestion_dismissed`
- ⬜ `ai_api_error` with feature name, model, error type (for monitoring)

## Exit Criteria

- Endorsement writing assistant: "Help me write" → 2–3 questions → draft generated → user can edit and submit
- Cert OCR: Pro users photograph cert → fields extracted → review form pre-filled → save cert + photo attachment
- Multilingual requests: endorsement request emails auto-translated when sender/recipient languages differ
- Profile suggestions: "Improve" on bio → inline suggestion shown → accept/edit/dismiss
- All four features fall back gracefully on API failure (never block the user flow)
- AI usage logged to `ai_usage_log` table with cost tracking
- Rate limits enforced per feature
- Free-tier AI features (AI-03, AI-04, AI-17) cost under EUR 0.01/user/month at current usage estimates
- Pro-tier AI features (AI-02) cost under EUR 0.10/user/month
- All components work at 375px width (mobile-first)
- PostHog events firing for all AI feature interactions (full funnels, not just triggers)
- No AI feature affects endorsement eligibility, trust weighting, or graph behaviour

## Estimated Effort

7–9 days

## Notes

**Single vendor, single bill.** All four features use OpenAI APIs (GPT-5 Nano for text, GPT-4o Mini for vision). The `OPENAI_API_KEY` already exists from CV import (Sprint 6). The shared integration layer (`lib/ai/`) provides a consistent pattern for error handling, rate limiting, and cost tracking that future AI features (Sprint 17's yacht autocomplete, Phase 2's NLP search) will reuse.

**AI-04 is the highest-impact feature in this sprint.** Endorsement completion rate is the bottleneck for graph density. If 40% of endorsement form opens result in abandonment (industry norm for blank text fields), and the writing assistant cuts that to 20%, that's a direct doubling of endorsement flow. Track the funnel carefully: draft requested → draft generated → endorsement actually submitted → endorsement with/without edits.

**AI-02 requires the Languages feature.** The multilingual request feature (AI-03) depends on `preferred_language` being set on user profiles. The Languages feature is specced in yl_features.md as part of the Profile section (Sprint 3) but may not be built yet — the build plan needs to verify this and add it if missing. It's a small addition (dropdown + storage) but a blocker for AI-03.

**Cost monitoring is critical.** These are the first AI features that run at scale on user-triggered actions. The `ai_usage_log` table provides per-user and per-feature cost visibility. Set up a PostHog dashboard or Supabase query to monitor daily AI spend. If any feature exceeds its cost target, the response is to tighten rate limits or switch models — not to remove the feature.

**Hardest technical challenge:** Cert OCR (AI-02) across the wildly varied certificate formats in the yachting industry. A UK ENG1, a French STCW, a Philippine SIRB, and a South African food safety cert all look completely different. The vision model handles layout variation well, but cert type matching against the seeded list needs fuzzy logic. The Levenshtein-based matching will need manual testing with 10–15 real cert photos across flag states.

**Next sprint picks up:** Sprint 17 adds the attachment confirmation flow for established yachts (D-017) and smart yacht autocomplete using semantic embeddings (AI-11). Both are graph integrity features — reducing false attachments and duplicate yachts that fragment the colleague graph. Sprint 17 closes Phase 1C and prepares the platform for Phase 2's recruiter access.
