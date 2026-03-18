# Sprint 8.1: Onboarding Polish + AI Assist — Founder's Notes for Sonnet

## Context

Sprint 8.1 ships immediately after Phase 1A launch. These features reduce friction in profile creation, improve endorsement quality, and make cert entry painless. All chosen because they directly improve the first-hour experience for new crew.

**Timeline:** 1–2 weeks post-launch (weeks 17–18, overlaps with early Phase 1B)

**Dependencies:** Sprint 8 complete (Phase 1A shipped). All existing profile, endorsement, and certification infrastructure in place.

---

## What Sprint 8.1 Delivers

### 1. Languages on Profile (from Profile spec — not yet built)

**What:** Multi-language selection on crew profiles with proficiency levels.

**Why:** Languages are a core part of a crew member's identity and value proposition. Charter yachts specifically hire for guest languages. This is also a prerequisite for AI-03 (Multilingual Endorsement Requests) in Sprint 8.2.

**Details:**
- Multi-select from common language list + "Other" free-text
- Proficiency level per language: Native, Fluent, Conversational, Basic
- Displayed on profile card (below role/department) and on public profile page
- Add to onboarding as optional step (after role selection) — do NOT make it required
- Extract from CV import if present (update CV parsing prompt)
- Include in PDF export
- Priority languages to seed: English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch (matches the 10 priority languages from AI-03 spec)

**Files to modify:**
- Database: add `user_languages` table (user_id, language, proficiency, created_at)
- Migration + RLS policy
- Profile page: new Languages section
- Public profile page: display languages
- Onboarding: optional language step
- CV parsing prompt: extract languages
- PDF export: include languages section

---

### 2. AI-04 — Endorsement Writing Assistant

**What:** "Help me write" button in the endorsement form. Asks 2–3 questions, generates a draft.

**Why:** Crew stare at the blank endorsement box and either write something generic or abandon. Guided drafting increases endorsement completion rate and quality — directly feeds graph density.

**Model:** GPT-5 Nano (~EUR 0.0003/endorsement)
**Tier:** Free (all users)

**Details:**
- "Help me write" button below the endorsement text field
- Opens a 2–3 question mini-flow:
  1. "What did [name] excel at in their role?" (free text, 1–2 sentences)
  2. "What stood out about working with them?" (free text, 1–2 sentences)
  3. "Would you work with them again?" (Yes / Absolutely / optional skip)
- Output: 100–300 word draft endorsement populated into text field, marked as draft
- Contextual: references the shared yacht name, recipient's role, and time period from attachment data
- No AI attribution on published endorsement — it's the endorser's words once they submit
- Guardrail: prompt instructs model to write authentically, avoid superlatives, match how real crew speak
- Run AI-01 content moderation on the generated draft before displaying

**New files:**
- API route: `app/api/endorsements/assist/route.ts`
- Component: endorsement writing assistant UI (bottom sheet or inline expansion)
- OpenAI integration: GPT-5 Nano prompt for endorsement drafting

---

### 3. AI-02 — Certification OCR & Auto-Fill

**What:** Crew photograph their certs, AI reads the details and auto-fills the certification form.

**Why:** Cert entry is the most tedious part of profile setup. 8–12 certs × manual entry = 15+ minutes. Photo-to-fields reduces to seconds per cert. Massive friction reduction.

**Model:** GPT-4o Mini Vision (~EUR 0.003/cert)
**Tier:** Pro only

**Details:**
- Input: phone camera photo or uploaded image (JPEG, PNG, WebP) of certificate
- Extracted fields: cert type (matched against seeded cert list), issue date, expiry date, issuing authority, certificate number
- Review step required: pre-filled form shown for confirmation/editing before saving (same pattern as CV import)
- Fallback: if extraction fails, skip to manual entry with helpful message
- Handles: angled photos, variable lighting, different cert layouts across flag states
- Upload the photo as cert document attachment simultaneously (saves a second upload step)
- Rate limit: 20 cert scans/day (Pro only)
- Run AI-01 moderation on uploaded images

**New files:**
- API route: `app/api/certifications/ocr/route.ts`
- Component: camera/upload trigger in certification add flow
- OpenAI integration: GPT-4o Mini Vision prompt for cert extraction

---

### 4. AI-17 — Smart Profile Suggestions

**What:** "Improve" button next to bio and text fields. AI suggests better phrasing, keywords, grammar fixes.

**Why:** Many crew write sparse or awkward bios because English isn't their first language. Low-effort polish that improves profile quality across the platform.

**Model:** GPT-5 Nano (~EUR 0.0002/request)
**Tier:** Free (all users)

**Details:**
- "Improve" button next to bio and other free-text fields
- Input: user's current text + their role, department, experience level for context
- Output: suggested revision shown inline (diff-style or side-by-side). Accept, edit, or dismiss
- Focus on: clarity, conciseness, grammar, industry-standard terminology, completeness
- Does NOT change voice or personality — improvements should feel like the user wrote them, just better
- Does NOT add false claims or embellish experience
- Guardrail: prompt preserves user's intent and tone
- Run AI-01 moderation on suggestions before displaying

**New files:**
- API route: `app/api/profile/suggest/route.ts`
- Component: inline suggestion UI (reusable for any text field)
- OpenAI integration: GPT-5 Nano prompt for profile text improvement

---

## Cost Estimate

| Feature | Model | Cost per use | Expected daily volume (at 500 users) | Daily cost |
|---------|-------|-------------|--------------------------------------|------------|
| AI-04 Endorsement assist | GPT-5 Nano | EUR 0.0003 | ~20 endorsements | EUR 0.006 |
| AI-02 Cert OCR | GPT-4o Mini Vision | EUR 0.003 | ~30 cert scans | EUR 0.09 |
| AI-17 Profile suggestions | GPT-5 Nano | EUR 0.0002 | ~50 requests | EUR 0.01 |
| **Total** | | | | **~EUR 0.11/day** |

Negligible. All OpenAI, single vendor, single bill.

---

## Build Order

1. Languages on Profile (no AI dependency, unblocks Sprint 8.2)
2. AI-04 Endorsement Writing Assistant (highest impact on graph density)
3. AI-02 Certification OCR (highest friction reduction for Pro users)
4. AI-17 Smart Profile Suggestions (polish — build last)

---

## Success Criteria

- [ ] Languages display on profile, public page, and PDF export
- [ ] CV import extracts languages when present
- [ ] "Help me write" generates contextual endorsement drafts >80% of the time
- [ ] Cert OCR correctly extracts cert type + dates from >70% of standard STCW certificates
- [ ] Profile suggestion improves bio text without changing voice
- [ ] All AI outputs pass content moderation before display
- [ ] All new API routes have Zod validation and rate limiting (carry forward from Sprint 8)
