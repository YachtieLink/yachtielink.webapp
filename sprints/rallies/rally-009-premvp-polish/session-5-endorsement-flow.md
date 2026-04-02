# Session 5 — Endorsement Flow + LLM

**Rally:** 009 Pre-MVP Polish
**Status:** Ready (all grill-me decisions resolved)
**Grill-me decisions applied:** §6 (Q6.1–Q6.4)
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
**Objective:** Restructure endorsement request page to show a colleague-first view — all colleagues grouped by yacht — with ghost suggestions inline and per-yacht invite CTAs.

### Locked Decisions (from grill-me §6)

| Q | Topic | Decision |
|---|-------|----------|
| Q6.1 | External invite | **Create ghost profile** on external invite. Pre-linked to endorsement request. Already built. |
| Q6.2 | Flow structure | **Colleague-first.** See all colleagues grouped by yacht, pick from there. |
| Q6.3 | Ghost suggestions | **Inline within yacht groups,** tagged as "not on platform." Most natural placement. |
| Q6.4 | Re-nudge limits | **1 reminder after 7 days.** Gentle, respectful. No more than one. |

### Current State
- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` — flat colleague list
- Generic share buttons (WhatsApp, Copy Link, Share)

### Target State

```
┌──────────────────────────────────┐
│ Request an Endorsement      navy │
├──────────────────────────────────┤
│                                  │
│ YOUR COLLEAGUES                  │  ← Primary view (colleague-first)
│                                  │
│ ▼ M/Y Serenity (2024-2025)     │  ← Most recent yacht expanded
│   ├ John Smith  Chief Officer   │
│   │ Overlapped: Jan-Jun 2024   │
│   │ [Request Endorsement]      │
│   ├ Jane Doe    2nd Stewardess │
│   │ [Request Endorsement]      │
│   │                             │
│   │ ── not on platform ──      │  ← Ghost suggestions inline (Q6.3)
│   ├ Mike Chen (ghost)           │
│   │ [Invite to endorse]        │
│   │                             │
│   └ [Invite someone from       │  ← Per-yacht invite CTA
│      M/Y Serenity]             │
│                                  │
│ ▶ S/Y Athena (2022-2024)  3 crew│  ← Collapsed (older)
│                                  │
│ INVITE A FORMER COLLEAGUE        │  ← Generic invite (no yacht context)
│ ┌──────────────────────────────┐ │
│ │ Name: [                    ] │ │
│ │ Email or phone: [          ] │ │
│ │ [Send invitation]            │ │  ← Creates ghost profile (Q6.1)
│ │                              │ │
│ │ or share via:                │ │
│ │ [WhatsApp] [Copy Link]      │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Tasks

#### Task 1: Yacht-Grouped Colleagues (Primary View)
- Colleague-first layout: all colleagues grouped by shared yacht (Q6.2)
- Reuse accordion pattern from Network tab (Session 3)
- Show: name, role, date overlap with requester
- One-tap "Request Endorsement" per colleague
- Most recent yacht expanded, older collapsed
- Same colleague on multiple yachts: show under each

#### Task 2: Inline Ghost Suggestions Per Yacht
- Query ghost profiles created from user's yacht crew data
- Display inline within each yacht group, below on-platform colleagues (Q6.3)
- Tagged as "not on platform" — visually distinct but not separated into own section
- "Invite to endorse" sends claim link + endorsement request
- Creates ghost profile if not already present (Q6.1)
- Ties into Ghost Profiles Wave 1 (already shipped)

#### Task 3: Per-Yacht Invite CTA
- Each yacht accordion section ends with an "Invite someone from [yacht name]" CTA
- Opens inline form (name + email/phone) pre-tagged with yacht context
- Creates ghost profile pre-linked to that yacht and endorsement request (Q6.1)

#### Task 4: Generic External Invite Section (Below Colleagues)
- Name + email/phone input form for inviting someone not tied to a specific yacht
- "Send invitation" generates endorsement invite token + sends email/SMS
- Creates ghost profile on send (Q6.1)
- Share buttons below (WhatsApp, Copy Link)

#### Task 5: Reminder Logic
- If someone was already requested and hasn't responded, show "Remind" button
- 1 reminder allowed after 7 days from original request (Q6.4)
- After reminder sent, button disabled permanently — no further nudges
- Show reminder state: "Reminded on [date]" or "Remind available in X days"

#### Task 6: Yacht Context After Selection
- After user selects a yacht for endorsement context, show:
  - Yacht card: name, type, dates
  - Crew who overlapped with user's dates (primary targets)
  - Current crew (no end date) as secondary
- Date-overlap query: extend `get_colleagues` RPC or add new query

**Allowed files:**
- `app/(protected)/app/endorsement/request/` — page + client component rewrite
- `components/endorsement/` — new components for yacht-grouped list
- `app/api/endorsements/` — may need new endpoint for invite
- `lib/queries/` — extend colleague query for date overlap

**Forbidden files:**
- `supabase/migrations/*` — no schema changes
- Network tab components (Session 3 territory)

---

## Exit Criteria

- Endorsement writing assist generates contextual drafts in <3 seconds
- All LLM inputs sanitized, outputs validated, no injection vectors
- Endorsement request page leads with colleague-first yacht-grouped view (Q6.2)
- Ghost suggestions appear inline within yacht groups, tagged "not on platform" (Q6.3)
- External invite creates ghost profile pre-linked to endorsement request (Q6.1)
- Reminder: 1 after 7 days, no more (Q6.4)
- Rate limiting on both assist API and invite sends
