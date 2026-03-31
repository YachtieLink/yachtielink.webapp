# AI Bio Writing Assist

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-31

## Summary

Many crew struggle to write professional narrative text. At the point of CV import, we already have structured data (skills chips, employment history, certifications, role) that the AI can use to draft compelling copy. A "Write for me" button would generate editable text for three fields: the personal bio (StepPersonal), the Skills Summary (StepExtras), and the Interests Blurb (StepExtras). User always reviews and edits the result.

## Scope

### In scope
- **Skills Summary generation** (StepExtras / Step 4) — uses skills chips, yacht employment history, certifications, and primary role as context to produce a compelling narrative summary (~1000 chars recommended soft limit)
- **Interests Blurb generation** (StepExtras / Step 4) — uses hobbies chips and any parsed interests to produce a short paragraph (~500 chars recommended soft limit)
- **Personal bio generation** (StepPersonal) — uses full CV text to draft a concise professional bio (~500 chars)
- New API route(s) (`/api/cv/generate-bio`, `/api/cv/generate-summary`, or a single route with a `type` param)
- Prompt(s) that take structured context and generate text — follow LLM strategy (`gpt-5-mini`, prompt quality first)
- Rate limiting (share with `aiSummary` category or its own)
- Loading state while generating
- "Write for me" button when field is empty; "Improve this" variant when field already has content

### Out of scope (for now)
- Profile edit page integration (extend later once CV wizard flow is proven)
- Tone/style presets (e.g. formal vs casual)
- Multi-language output

## Design Notes

- Should feel like an assist, not a replacement — user always edits the result
- Never mention AI in the UI copy (per brand rules). Button label: "Write for me" or "Generate summary". Improvement variant: "Improve this"
- Output is pre-filled into the textarea, not a separate modal — same-page state transition
- Soft character limits are guidance, not hard caps. Show a character count indicator near the limit
- If the parse already extracted a narrative summary, pre-fill it and show "Improve this" instead

## LLM Approach

Per `docs/yl_llm_strategy.md`:
- Model: `gpt-5-mini` (profile bio generation is listed as "mini" tier — needs tone awareness and yachting context)
- Prompt quality over model power — if output quality is poor, fix the prompt before considering `gpt-5.4-mini`
- Estimated cost per call: ~$0.002-0.004 (short structured input, short output)
- Rate limit: reuse `aiSummary` category or create a `bioAssist` category in `lib/rate-limit/helpers.ts`

## Files Likely Affected

- New API route(s) in `app/api/cv/`
- `components/cv/steps/StepExtras.tsx` — "Write for me" button for Skills Summary and Interests Blurb
- `components/cv/steps/StepPersonal.tsx` — "Write for me" button for bio
- `lib/cv/prompt.ts` — new prompt templates (or a new file `lib/cv/bio-prompts.ts`)
- `lib/rate-limit/helpers.ts` — new or shared rate limit category

## Notes

- The same pattern (structured context in, narrative text out) could extend to endorsement writing assist — see `sprints/backlog/endorsement-writing-assist.md`
- Skills Summary and Interests Blurb are the highest-value targets because users rarely write these from scratch, but the data to generate them is already captured in earlier wizard steps
- Consider batching both StepExtras fields in a single API call to reduce latency and cost
