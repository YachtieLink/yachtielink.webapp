# Endorsement Writing Assist ("Help Me Start Writing")

**Status:** design complete, ready for sprint planning (2026-03-23)
**Priority guess:** P2 (important) — directly improves endorsement completion rates
**Date captured:** 2026-03-23
**Source:** Spun out from Ghost Profiles design interview

## Summary

Add an always-available assist button to the endorsement writing form. When tapped, an LLM generates a 2-3 sentence draft endorsement using both sides' context: the endorsee's CV data + the endorser's role/seniority/date overlap. If the user has already started writing, the LLM builds on their partial text. Free for all users.

## Why This Matters

Writing endorsements is the highest-friction step in the endorsement flow. Even willing endorsers stall at a blank textarea. A context-aware starting point reduces time-to-submit and increases completion rates — without sacrificing authenticity, because the user edits and adds their own voice.

## Resolved Decisions (from design interview 2026-03-23)

### Data & Generation

1. **Always generate on demand.** Never persist generated endorsement text. Each tap produces a fresh draft — no library of recycled snippets. CV text re-extracted from `cv_storage_path` on each request via `extractCvText()`.

2. **Uses both sides' context.** Generation prompt includes:
   - **Endorsee (being endorsed):** CV text (re-extracted from stored file), role on yacht, dates, description/duties
   - **Endorser (writing):** Their role on the same yacht, date overlap, seniority relative to endorsee
   - The relationship between the two shapes tone — a captain endorsing a deckhand writes differently than a peer endorsing a peer.

3. **No CV fallback.** If endorsee has no `cv_storage_path`, button still works. Generation uses attachment data only (roles, yacht, dates). Output is more generic but still better than a blank textarea. No error state.

4. **Model: `gpt-4o-mini`.** Fast, cheap, already in use for CV parsing. More than capable for 2-3 sentence generation. Returns in 2-3 seconds.

### API

5. **Route: `POST /api/endorsements/assist`.** Auth required.
   ```
   Body: {
     recipient_id: string,   // endorsee
     yacht_id: string,       // shared yacht
     partial_text?: string,  // user's in-progress text, if any
   }
   Response: { draft: string }
   ```
   Steps: auth → fetch endorser's attachment (role, dates) → fetch endorsee's `cv_storage_path` → re-extract CV text → call LLM with both-sides prompt → return draft.

### UX

6. **Adaptive button copy.** Always active, never greyed out.
   - Textarea empty: "Help me start writing"
   - Textarea has content: "Help me finish this"
   - When tapped: loading state → draft inserted into textarea → cursor at end → hint "Edit this to add your personal touch"

7. **Partial text as context.** If user has started writing, their text is sent to the LLM. Generation completes/polishes what they started rather than replacing from scratch. Builds on their voice.

8. **Button placement.** Small text button below the textarea, left-aligned, before the character count area. Unobtrusive but discoverable.

### Cost & Limits

9. **Free for everyone.** Cost per generation is fractions of a cent. Platform-level value of more completed endorsements outweighs any upsell opportunity. Don't gate the viral loop.

10. **Rate limit: 5 per endorsement session.** Client-side counter in component state. After 5 taps for the same recipient+yacht, button disables: "No more suggestions available." Resets on page refresh. No DB-backed rate limiting needed.

### Integration

11. **No schema changes required.** No new tables or columns. CV text re-extracted from existing `cv_storage_path`. Assist route is a new file alongside existing endorsement routes.

12. **Content moderation unchanged.** `moderateText()` still runs on the final submitted endorsement regardless of whether assist was used. The assist generates a draft — the user owns the final text.

## Files Affected

- `components/endorsement/WriteEndorsementForm.tsx` — add adaptive assist button below textarea
- `app/api/endorsements/assist/route.ts` — new route for on-demand LLM generation
- `lib/endorsement/assist-prompt.ts` — generation prompt using both-sides context

## Relationship to Ghost Profiles

Ghost profile suggestions use a similar generation pattern but are pre-generated at request-send time (stored on `endorsement_requests.suggested_endorsements`) because ghost endorsers are expected to be quick, low-friction interactions. This feature is the authenticated equivalent — richer context, on-demand generation, incorporates partial user text. Shares prompt logic but different invocation pattern. Ships independently.
