# Session 5 — Endorsement Flow + LLM

**Rally:** 009 Pre-MVP Polish
**Status:** BLOCKED — needs /grill-me for endorsement request redesign
**Estimated time:** ~6 hours across 2 Opus workers
**Dependencies:** Sessions 1-2 merged (tech debt clean)

---

## Lane 1: Endorsement Writing Assist + LLM Defense (Opus, high)

**Branch:** `feat/endorsement-assist`
**Objective:** Add LLM-powered draft generation to the endorsement writing form. Ship with prompt injection defense built in.

### Part A: LLM Defense Layer (build first)

Create shared LLM safety utilities that all current and future LLM features use.

**File:** `lib/llm/sanitize.ts`
- `sanitizeInput(text: string)` — strip HTML/script, normalize Unicode, remove zero-width chars, truncate to max length
- `validateOutput(text: string, constraints: OutputConstraints)` — reject outputs with code blocks, URLs, instruction patterns, or that exceed length bounds
- `wrapUserContent(text: string)` — wrap in delimiter tokens for prompt injection resistance

**File:** `lib/llm/prompt-guard.ts`
- Prompt template builder with hardened system messages
- User content always in user message (never system prompt)
- Delimiter tokens around all user-supplied content
- Output format constraints (plain text, max sentences, no markdown)

**Audit existing LLM calls:**
- `lib/cv/` — CV parsing prompts. Verify input sanitization + output validation applied.
- Any other LLM call sites.

### Part B: Endorsement Writing Assist

**API Route:** `POST /api/endorsements/assist`

```typescript
// Request
{ recipient_id: string, yacht_id: string, partial_text?: string }

// Response  
{ draft: string }
```

**Processing:**
1. Auth check (must be logged in)
2. Rate limit: 5 per endorsement session (server-side per user+recipient pair)
3. Fetch endorser's attachment (role, dates on yacht)
4. Fetch endorsee's CV text via `cv_storage_path` (re-extract, don't cache)
5. Build prompt with both-sides context (endorser role/seniority + endorsee CV/role)
6. Sanitize all inputs via `sanitizeInput()`
7. Call `gpt-4o-mini` with hardened prompt template
8. Validate output via `validateOutput()` — plain text, 1-5 sentences, no code/URLs
9. Run `moderateText()` on output
10. Return draft

**UI:** `components/endorsement/WriteEndorsementForm.tsx`
- Small text button below textarea, left-aligned
- Empty textarea: "Help me start writing"
- Has content: "Help me finish this"
- Loading state → draft inserted into textarea → cursor at end
- Hint: "Edit this to add your personal touch"
- If no CV available: button still works, generates more generic draft from attachment data only

**Allowed files:**
- `lib/llm/sanitize.ts` — new
- `lib/llm/prompt-guard.ts` — new
- `app/api/endorsements/assist/route.ts` — new
- `components/endorsement/WriteEndorsementForm.tsx` — add button
- `lib/cv/` — audit existing prompts (read + potentially add sanitization)

---

## Lane 2: Endorsement Request Redesign (Opus, high)

**Branch:** `feat/endorsement-request-redesign`
**Objective:** Restructure endorsement request page to prioritize external invites (growth) and group on-platform colleagues by yacht.

### Current State
- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` — flat colleague list
- Generic share buttons (WhatsApp, Copy Link, Share)

### Target State

```
┌──────────────────────────────────┐
│ Request an Endorsement      navy │
├──────────────────────────────────┤
│                                  │
│ INVITE A FORMER COLLEAGUE        │  ← Primary CTA (growth action)
│ ┌──────────────────────────────┐ │
│ │ Name: [                    ] │ │
│ │ Email or phone: [          ] │ │
│ │ [Send invitation]            │ │
│ │                              │ │
│ │ or share via:                │ │
│ │ [WhatsApp] [Copy Link]      │ │
│ └──────────────────────────────┘ │
│                                  │
│ YOUR COLLEAGUES                  │  ← Secondary (on-platform)
│                                  │
│ ▼ M/Y Serenity (2024-2025)     │  ← Yacht accordion
│   ├ John Smith  Chief Officer   │
│   │ Overlapped: Jan-Jun 2024   │
│   │ [Request Endorsement]      │
│   └ Jane Doe    2nd Stewardess │
│     [Request Endorsement]      │
│                                  │
│ ▶ S/Y Athena (2022-2024)  3 crew│  ← Collapsed (older)
│                                  │
│ SUGGESTED (not on YachtieLink)  │  ← Ghost profiles
│ ┌──────────────────────────────┐ │
│ │ Mike Chen — worked with you  │ │
│ │ on M/Y Serenity              │ │
│ │ [Invite to endorse]          │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Tasks

#### Task 1: External Invite Section (Top Priority)
- Name + email/phone input form
- "Send invitation" generates endorsement invite token + sends email/SMS
- Share buttons below (WhatsApp, Copy Link)
- This is the growth engine — every external invite is a signup funnel entry

#### Task 2: Yacht-Grouped Colleagues
- Reuse accordion pattern from Network tab (Session 3)
- Group colleagues by shared yacht
- Show: name, role, date overlap with requester
- One-tap "Request Endorsement" per colleague
- Most recent yacht expanded, older collapsed
- Same colleague on multiple yachts: show under each

#### Task 3: Yacht Context After Selection
- After user selects a yacht for endorsement context, show:
  - Yacht card: name, type, dates
  - Crew who overlapped with user's dates (primary targets)
  - Current crew (no end date) as secondary
- Date-overlap query: extend `get_colleagues` RPC or add new query

#### Task 4: Ghost Profile Suggestions
- Query ghost profiles created from user's yacht crew data
- Show as "Suggested — not on YachtieLink" section
- "Invite to endorse" sends claim link + endorsement request
- Ties into Ghost Profiles Wave 1 (already shipped)

**Allowed files:**
- `app/(protected)/app/endorsement/request/` — page + client component rewrite
- `components/endorsement/` — new components for yacht-grouped list
- `app/api/endorsements/` — may need new endpoint for invite
- `lib/queries/` — extend colleague query for date overlap

**Forbidden files:**
- `supabase/migrations/*` — no schema changes
- Network tab components (Session 3 territory)

---

## /Grill-Me Questions for This Session

### Endorsement Request Redesign
- **Q5.1:** External invite — should it create a ghost profile if the person isn't on the platform? Or just send a generic invite link?
- **Q5.2:** Yacht context after selection — should user pick a yacht FIRST (then see crew), or see all colleagues grouped by yacht and request from there?
- **Q5.3:** Ghost profile suggestions — how prominent? Above or below on-platform colleagues?
- **Q5.4:** Re-nudge UX — if someone was already requested and hasn't responded, show "Remind" button? How many reminders?

---

## Exit Criteria

- Endorsement writing assist generates contextual drafts in <3 seconds
- All LLM inputs sanitized, outputs validated, no injection vectors
- Endorsement request page leads with external invite (growth action)
- On-platform colleagues grouped by yacht with date overlap context
- Ghost profile suggestions surface invitable contacts
- Rate limiting on both assist API and invite sends
