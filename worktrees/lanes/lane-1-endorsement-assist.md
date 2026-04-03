---
lane: 1
branch: feat/endorsement-assist
worker: opus
priority: high
status: pending
---

# Lane 1 — Endorsement Writing Assist + LLM Defense

## Scope
Build LLM safety utilities and endorsement writing assist feature.

## Tasks
1. Create `lib/llm/sanitize.ts` — sanitizeInput, validateOutput, wrapUserContent
2. Create `lib/llm/prompt-guard.ts` — prompt template builder with hardened system messages
3. Create `app/api/endorsements/assist/route.ts` — API endpoint for generating drafts
4. Add "Help me start/finish writing" button to WriteEndorsementForm.tsx

## Allowed Files
- `lib/llm/sanitize.ts` — new
- `lib/llm/prompt-guard.ts` — new
- `app/api/endorsements/assist/route.ts` — new
- `components/endorsement/WriteEndorsementForm.tsx` — modify

## Forbidden Files
- `supabase/migrations/*`
