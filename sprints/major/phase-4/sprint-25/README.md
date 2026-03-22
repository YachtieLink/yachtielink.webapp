# Sprint 25 — Advanced AI

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 4
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 24 (AI career tools: cert intelligence, season readiness, portfolio advisor, gap analyzer; career goals fields; cert knowledge base)

## Goal

Ship the most ambitious AI features in the roadmap — features that differentiate YachtieLink from every competitor in the market. Voice onboarding lets crew build a complete profile by having a 5-minute conversation in their native language (AI-14). Photo coaching gives private, constructive feedback on profile photos (AI-18). Cover letter generation produces tailored application letters from profile data (AI-19). Interview prep runs a mock interview with role-specific questions (AI-20). Voice onboarding is the activation game-changer: a free one-time use that removes the biggest barrier to profile completion for crew who are more comfortable speaking than typing (especially in a second language). The other three are Pro features that make the subscription feel premium. Sprint 24's pattern (data → AI → structured output → in-app card) is reused, plus the OpenAI Realtime API for voice.

## Scope

**In:**
- AI-14: Voice Onboarding — conversational profile creation via WebRTC voice, multilingual, 10 priority languages (Free one-time, Pro re-run; OpenAI Realtime API)
- AI-18: Photo Coach — private feedback on profile photo lighting, framing, background (Pro; GPT-4o Mini Vision)
- AI-19: Cover Letter Generator — tailored cover letter from profile data + target position/yacht (Pro; GPT-5 Mini)
- AI-20: Interview Prep — mock interview with role-specific questions and answer feedback (Pro; GPT-5 Mini)
- Voice onboarding integration with existing CV import review flow (same pre-filled form pattern)
- Cover letter PDF export using existing PDF generation pipeline (Sprint 6)

**Out:**
- Voice messaging or voice notes in DMs (voice is for onboarding only in this sprint)
- Video-based interview prep (text-based Q&A for V1 — voice interview prep is future)
- AI-generated profile photos or photo editing (the coach gives feedback, it doesn't modify photos)
- Real-time voice translation during conversations (not a communication tool)
- Continuous voice profile updating (voice onboarding is a session, not a persistent voice interface)
- AI-14 as a standalone app or widget (embedded in the web app only)
- Cover letter templates beyond the standard format (one professional template for V1)

## Dependencies

- Sprint 24 complete: career goals fields (`target_role`, `target_yacht_size`), cert knowledge base, AI career tools pattern established
- Sprint 16 complete: `lib/ai/openai-client.ts`, `lib/ai/cost-tracker.ts`, `lib/ai/rate-limiter.ts`, `ai_usage_log`, `POST /api/ai/translate`
- Sprint 11 complete: CV import review flow pattern — pre-filled form after extraction (reused for voice onboarding review step)
- Sprint 6 complete: PDF generation pipeline (reused for cover letter PDF export)
- Sprint 3 complete: profile save utilities, cert save utilities, yacht attachment creation
- `preferred_language` on users table — exists from Sprint 16 (voice language detection)
- Seeded role list, cert type list, yacht search — all exist (used by voice extraction function calls)
- OpenAI Realtime API access (verify API availability and pricing)
- WebRTC browser support (iOS Safari 16+, Chrome, Firefox — verify compatibility)

## Key Deliverables

### AI-14 — Voice Onboarding

- ⬜ New onboarding path: alongside existing CV upload and manual entry, add "Tell us about yourself" voice option
- ⬜ Voice UI: full-screen voice conversation page with:
  - Animated waveform indicating AI is listening/speaking
  - Transcript display (real-time, scrolling)
  - "End conversation" button
  - Language indicator showing detected/selected language
- ⬜ Language selection: before starting, user picks their preferred language from the 10 priority languages (English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch)
- ⬜ Connection: WebRTC via OpenAI Realtime API (`gpt-realtime` or `gpt-realtime-mini`)
- ⬜ Conversational flow (~3–5 minutes):
  1. Name and preferred display name
  2. Current/most recent role and department
  3. Employment history — yachts, roles, dates (as many as mentioned)
  4. Key certifications
  5. Languages spoken
  6. Location and availability
- ⬜ Real-time extraction: OpenAI function calling during the voice session extracts structured data as the user speaks:
  - `extract_name(full_name, display_name)`
  - `extract_role(role, department)`
  - `extract_yacht(yacht_name, role, start_date, end_date)`
  - `extract_certification(cert_type, issue_date, expiry_date)`
  - `extract_languages(languages[])`
  - `extract_location(country, city)`
- ⬜ System prompt: conversational interviewer tone, professional but warm. Ask follow-up questions for unclear dates. Handle interruptions naturally (OpenAI semantic VAD). Speak in the user's selected language.
- ⬜ Review step: after conversation ends, user sees the same pre-filled profile form as CV import (Sprint 11) — name, handle, role, yachts, certs populated from voice extraction
- ⬜ User can edit everything before saving — voice extraction is a starting point, not final
- ⬜ On save: create profile, yacht attachments, certs using existing save utilities (`lib/cv/save-parsed-cv-data.ts` from Sprint 11)
- ⬜ Fallback: if voice fails (poor connection, browser unsupported, accent issues), graceful redirect to standard onboarding with message "Voice didn't work — let's try the form instead"
- ⬜ Free for first-time onboarding (one-time use). Pro users can re-run to update profile via voice.
- ⬜ API route: `POST /api/ai/voice-session` — initiates Realtime API session, returns WebRTC connection details
- ⬜ Cost: ~EUR 0.30/conversation (5 minutes of Realtime API)
- ⬜ Rate limit: 1 free use per account + unlimited for Pro (rate-limited to 3/day to prevent abuse)

### AI-18 — Photo Coach

- ⬜ "Get photo feedback" button on profile photo upload screen (Pro only)
- ⬜ Trigger: optional — appears after photo upload, not automatic (crew shouldn't feel judged)
- ⬜ Input: the uploaded profile photo sent to GPT-4o Mini Vision
- ⬜ System prompt guardrails: focus on controllable factors (lighting, framing, attire, background). NEVER comment on physical appearance, attractiveness, age, race, or gender. Encouraging and constructive tone.
- ⬜ Output: 2–3 specific, actionable suggestions displayed as an in-app card:
  - "Good lighting and professional appearance. Suggestion: crop tighter to head and shoulders."
  - "A plain or nautical background would look more professional."
  - "Consider a photo in uniform or smart casual."
- ⬜ Actions: "Retake photo" (opens camera/upload again) or "Keep current photo" (dismisses)
- ⬜ Does NOT reject or block photos — suggestions are entirely optional
- ⬜ API route: `POST /api/ai/photo-coach` — Pro-gated, accepts image
- ⬜ Rate limit: 5 analyses/day
- ⬜ Cost: ~EUR 0.002/analysis (GPT-4o Mini Vision)

### AI-19 — Cover Letter Generator

- ⬜ "Generate cover letter" button in profile tools / CV section (Pro only)
- ⬜ Input form:
  - Target role (typeahead from seeded list, or select from active positions)
  - Target yacht name/type/size (optional — typeahead from yacht database)
  - Specific requirements or context (optional free text, max 500 chars)
- ⬜ Data assembly: user's profile data (role, experience, certs, endorsement highlights, yacht history) + target position context
- ⬜ API call: GPT-5 Mini (needs more capability than Nano for quality writing)
- ⬜ System prompt: professional, concise, 200–400 words. Reference specific experience, applicable certs, endorsement highlights. Match how crew actually communicate — no corporate jargon. Never fabricate experience or certs.
- ⬜ Output: generated letter shown in an editable text area
- ⬜ User can edit freely before export
- ⬜ Export as PDF: formatted to match Pro PDF template style (Sprint 6 pipeline), downloadable alongside or separately from profile PDF
- ⬜ API route: `POST /api/ai/cover-letter` — Pro-gated
- ⬜ Rate limit: 5 cover letters/day
- ⬜ Cost: ~EUR 0.01/letter (GPT-5 Mini)
- ⬜ Does NOT fabricate experience — only references what exists on the user's profile

### AI-20 — Interview Prep

- ⬜ "Practice interview" button in career tools section (Pro only)
- ⬜ Setup: user selects target role, yacht type, yacht size. Optional context ("first time interviewing for 60m+", "switching from sailing to motor")
- ⬜ Flow: 5–8 interview questions, text-based (type answers in a chat-like interface):
  - 2–3 role-specific technical questions (e.g., engineer: "Walk me through a generator failure during charter")
  - 2–3 soft-skill questions common in yacht interviews ("How do you handle guest complaints?")
  - 1–2 scenario-based questions relevant to yacht size/type
- ⬜ Per-answer feedback: after each answer, GPT-5 Mini provides constructive feedback on content, clarity, and completeness
- ⬜ Summary: at the end, a brief assessment with strengths and areas to practice
- ⬜ Session stored: interview sessions saved so users can review past practice (stored in `interview_sessions` table)
- ⬜ API route: `POST /api/ai/interview-prep` — Pro-gated, streaming responses for feedback
- ⬜ Rate limit: 3 sessions/day
- ⬜ Cost: ~EUR 0.02/session (GPT-5 Mini, ~8 question/answer/feedback cycles)
- ⬜ Does NOT store answers or share with anyone — completely private
- ⬜ Does NOT contribute to profile, trust score, or any visible metric
- ⬜ Knowledge base: common yacht interview questions maintained as structured reference file (similar to cert knowledge base from Sprint 24)

### Database Migration

- ⬜ `ALTER TABLE users ADD COLUMN voice_onboarding_used boolean DEFAULT false` (tracks one-time free use)
- ⬜ `CREATE TABLE interview_sessions (id uuid PK, user_id uuid FK, target_role text, target_yacht_type text, target_yacht_size text, context text, questions_answers jsonb, summary text, created_at timestamptz DEFAULT now())`
- ⬜ Index: `interview_sessions(user_id, created_at DESC)`
- ⬜ RLS: users can only read their own interview sessions
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `voice_onboarding_started` with selected_language
- ⬜ `voice_onboarding_completed` with duration_seconds, fields_extracted_count
- ⬜ `voice_onboarding_failed` with failure_reason (connection, browser, timeout)
- ⬜ `voice_onboarding_review_saved` with edits_made_count (how much the user changed)
- ⬜ `ai_photo_coach_requested` / `ai_photo_coach_retake` / `ai_photo_coach_kept`
- ⬜ `ai_cover_letter_generated` with has_target_yacht, has_context
- ⬜ `ai_cover_letter_exported_pdf`
- ⬜ `ai_interview_prep_started` with target_role, target_yacht_size
- ⬜ `ai_interview_prep_completed` with question_count, session_duration
- ⬜ `ai_interview_prep_reviewed` (user revisited a past session)

## Exit Criteria

- Voice onboarding: crew can build a complete profile via 3–5 minute voice conversation in any of 10 languages
- Voice extraction populates the same review form as CV import — user confirms/edits before saving
- Voice fallback to form-based onboarding works gracefully on connection failure or unsupported browser
- One-time free voice use tracked per account; Pro users can re-run
- Photo coach: Pro users receive 2–3 constructive suggestions after uploading a profile photo
- Photo coach guardrails verified: no comments on appearance, age, race, or gender
- Cover letter: Pro users generate tailored letters from profile data + target role, editable, exportable as PDF
- Interview prep: Pro users complete 5–8 question mock interviews with per-answer feedback and session summary
- Interview sessions saved and reviewable
- All features Pro-gated (except voice onboarding one-time free use)
- AI cost tracked in `ai_usage_log`; voice at ~EUR 0.30/session, others within EUR 0.10/user/month
- All components work at 375px width (mobile-first — voice onboarding especially must work on mobile)
- PostHog events firing for all feature funnels
- No AI feature affects trust, endorsements, or graph behaviour

## Estimated Effort

10–14 days

## Notes

**Voice onboarding is the highest-impact feature in this sprint and possibly the entire roadmap.** A Filipino deckhand in Antibes who speaks basic English can talk through their career in Tagalog and get a fully populated profile. This removes the single biggest barrier to profile completion for non-English-speaking crew — the demographic most underserved by traditional crewing agencies. Track the activation funnel obsessively: voice started → voice completed → review saved → first endorsement requested. If voice onboarding crew reach their first endorsement faster than CV/manual crew, it validates the entire feature.

**WebRTC browser compatibility is the main risk for AI-14.** OpenAI's Realtime API uses WebRTC, which is well-supported on modern browsers (Chrome, Firefox, Safari 16+). But crew phones vary widely — older Android browsers, in-app WebViews, and restricted corporate devices may not support it. The fallback to form-based onboarding must be seamless and obvious. Test on: Mobile Safari (iPhone 12+), Chrome Android, Samsung Internet, and Firefox Android.

**Photo coach guardrails need explicit QA.** The system prompt prohibits comments on physical appearance, but vision models can be unpredictable. Before launch, run the photo coach against 50+ diverse test photos and verify that no output comments on body type, skin colour, age, or attractiveness. If any slip through, tighten the prompt or add a post-processing filter. This is a crew-first principle: the coach helps with controllable presentation factors, not personal appearance.

**Cover letter + PDF export reuses existing infrastructure.** Sprint 6 built the PDF generation pipeline for profile snapshots. The cover letter PDF uses the same pipeline with a different template (letter format instead of profile format). The Pro PDF template styling (Sprint 7) applies. This keeps the implementation cost low — the main work is the GPT-5 Mini prompt and the letter-format template.

**Interview prep is the lowest-priority feature in this sprint.** If the sprint runs long, interview prep can be deferred to a future sprint without impacting the phase exit criteria. Voice onboarding and photo coach are higher-impact; cover letter is lower-effort. Interview prep is valuable but niche — it serves crew stepping up to a new role level, not the broad user base.

**Hardest technical challenge:** Voice onboarding session management. The OpenAI Realtime API maintains a WebSocket connection for the duration of the conversation. The server needs to: (1) create a session, (2) proxy the WebRTC connection between the client and OpenAI, (3) handle function calls for data extraction in real-time, (4) accumulate extracted data, (5) present the review form after the session ends. This is a stateful flow — the build plan needs to specify where session state lives (server memory? Supabase? Vercel edge function?). Vercel's serverless functions have a 30-second timeout on the free plan and 5 minutes on Pro — a 5-minute voice session needs a persistent connection that may require a dedicated server process or Supabase Edge Function.

**Next sprint picks up:** Sprint 26 introduces verified status and community moderation — the self-governance system. It replaces Sprint 17's `is_trusted_user()` heuristic with the full verified status chain of trust (D-016), adds account flag voting (D-018), and ships endorsement sentiment analysis (AI-21) for recruiter-tier depth indicators. Sprint 26 closes Phase 4 and completes the planned roadmap.
