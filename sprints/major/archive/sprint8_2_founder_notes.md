# Sprint 8.2: Multilingual + Timeline Intelligence — Founder's Notes for Sonnet

## Context

Sprint 8.2 follows 8.1 and targets two features that extend the graph internationally and improve employment presentation. These are lower priority than 8.1 but high value for the international crew base.

**Timeline:** 1 week (week 19, before Phase 1B Sprint 9)

**Dependencies:** Sprint 8.1 complete. Specifically:
- Languages on Profile must be shipped (AI-03 depends on knowing user language preferences)
- AI-01 Content Moderation must be active (all AI outputs go through moderation)

---

## What Sprint 8.2 Delivers

### 1. AI-03 — Multilingual Endorsement Requests

**What:** Endorsement request emails are automatically translated into the recipient's preferred language.

**Why:** Superyacht industry = 50+ nationalities. A Filipino deckhand requesting an endorsement from a French captain shouldn't be blocked by language. This directly accelerates trust graph formation across the international crew base — the single biggest competitive moat.

**Model:** GPT-5 Nano (~EUR 0.0003/request)
**Tier:** Free (all users)

**Details:**
- Trigger: when sender and recipient have different preferred languages set in their profile
- Translates: endorsement request email body and subject line
- Does NOT translate the endorsement text itself (stored in language it was written — see AI-10 for profile translation, Phase 1B+)
- Language detection: uses recipient's profile language preference. If not set, sends in English (default)
- Priority languages (10): English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch
- Supported: all other languages GPT-5 Nano handles
- Request email includes note: "This message was automatically translated from [language]"
- No user action required — translation happens transparently on send
- Run AI-01 moderation on translated text before sending

**Files to modify:**
- Endorsement request email sending logic (add translation step)
- New API utility: `lib/ai/translate.ts`
- OpenAI integration: GPT-5 Nano prompt for translation

---

### 2. AI-12 — Yacht History Gap Analyzer

**What:** Scans employment timeline and flags gaps, short stints, or patterns a recruiter would notice — suggests how to address them.

**Why:** Recruiters scan for gaps. Many gaps have legitimate explanations (refit, travel, training, family) but if not addressed, they look like red flags. Helps crew present clean timelines before a recruiter notices.

**Model:** GPT-5 Nano (~EUR 0.0005/analysis)
**Tier:** Pro only

**Details:**
- Trigger: on-demand "Review my timeline" button in employment history section + one-time prompt after profile setup complete
- Input: all employment attachments (yacht, role, dates) in chronological order
- Output examples:
  - "You have a 6-month gap between MY Atlas (ended March 2024) and MY Coral (started September 2024). Consider adding any freelance, refit, or training work from that period."
  - "Your stint on MY Phoenix was 6 weeks — short stints are common for day work or relief roles, but you may want to note the context."
  - "Strong timeline: 4 vessels over 6 years with no significant gaps. No changes needed."
- Suggestions are advisory — does NOT add or modify attachments
- Does NOT penalise gaps or short stints — frames as presentation opportunities
- Does NOT surface gap analysis to recruiters or other users — private to crew member

**New files:**
- API route: `app/api/profile/timeline-review/route.ts`
- Component: timeline review UI in employment history section
- OpenAI integration: GPT-5 Nano prompt for timeline analysis

---

## Cost Estimate

| Feature | Model | Cost per use | Expected daily volume (at 500 users) | Daily cost |
|---------|-------|-------------|--------------------------------------|------------|
| AI-03 Multilingual requests | GPT-5 Nano | EUR 0.0003 | ~15 translated requests | EUR 0.005 |
| AI-12 Timeline analysis | GPT-5 Nano | EUR 0.0005 | ~10 analyses | EUR 0.005 |
| **Total** | | | | **~EUR 0.01/day** |

Negligible.

---

## Build Order

1. AI-03 Multilingual Endorsement Requests (higher impact — removes language barriers from graph growth)
2. AI-12 Yacht History Gap Analyzer (Pro-only, presentation polish)

---

## Success Criteria

- [ ] Endorsement request emails are translated when sender/recipient languages differ
- [ ] Translation quality is natural and professional (not robotic Google Translate output)
- [ ] "This was translated from [language]" note appears on translated emails
- [ ] Timeline review correctly identifies gaps >2 months and short stints <2 months
- [ ] Suggestions are constructive and specific to the user's actual timeline
- [ ] All AI outputs pass content moderation
- [ ] All new API routes have Zod validation and rate limiting
