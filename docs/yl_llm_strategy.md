# LLM Strategy — YachtieLink

> Last updated: 2026-03-30

## Principles

1. **Prompt quality over model power.** If a model isn't producing correct output, fix the prompt first. Upgrading the model is the last resort, not the first.
2. **Cost matters at scale.** We're bootstrapped. Every cent per request compounds. Choose the cheapest model that produces correct output.
3. **Hard cap: gpt-5.4-mini.** If we can't get correct output from gpt-5-mini or gpt-5.4-mini, the problem is our prompt engineering, not the model. These are exceptionally capable models.
4. **No vendor lock-in assumptions.** Document model choices so we can swap providers (Gemini, Claude, etc.) if pricing or quality shifts.

## Current Models in Use

| Feature | Model | Input/M | Output/M | Est. cost/call | Why this model |
|---------|-------|---------|----------|----------------|----------------|
| CV full parse | `gpt-5-mini` | $0.25 | $2.00 | ~$0.006 | Structured JSON extraction — needs reasoning for yacht name/type/length disambiguation |
| CV personal parse | `gpt-5-mini` | $0.25 | $2.00 | ~$0.003 | Lighter extraction (name, bio, languages) — same model for consistency |

## Rate Limits

CV parsing is rate-limited per user. Worst-case abuse exposure: ~$0.10/user/day. At current pricing this is acceptable without additional safeguards.

## Prompt Engineering Standards

All LLM prompts live in `lib/cv/prompt.ts`. When output quality degrades:

1. **Inspect the prompt first.** Add explicit rules for the failure case. Examples of rules we've added:
   - "length_meters is the LOA of the VESSEL, not crew count" (parser was confusing 27 crew with 27m)
   - "Languages belong ONLY in the languages array, never in skills"
   - "Visas are travel/work permits; certifications like STCW are NOT visas"
2. **Test with 3+ real CVs** before considering a model upgrade.
3. **Log failures.** When a parse is clearly wrong (user corrects a yacht match, edits a cert category), that's signal for prompt improvement.

## Model Upgrade Path

```
gpt-5-mini ($2/M output) — current
    |
    v  (only if prompt improvements fail)
gpt-5.4-mini ($4.50/M output) — hard cap
    |
    v  (only if fundamentally blocked)
evaluate Gemini Flash or Claude Haiku — different provider entirely
```

## Future LLM Use Cases

These are planned features where LLM integration may be needed. Each should follow the same principle: cheapest model that works, prompt quality first.

| Feature | Likely model tier | Notes |
|---------|-------------------|-------|
| Endorsement writing assist | nano/mini | Draft suggestions from structured input — low reasoning needed |
| CV staleness analysis | nano | Compare dates, flag outdated sections — mostly rule-based with LLM polish |
| Skill normalization | nano | "MIG welding" → "Welding (MIG/TIG)" — simple mapping task |
| Profile bio generation | mini | Needs tone awareness and yachting context |
| Yacht name fuzzy matching assist | none | Already handled by Postgres trigram similarity — no LLM needed |
| Job description summarization | nano/mini | Condense verbose CV descriptions for profile display |

## Cost Projections

| Scale | CV parses/month | Monthly LLM cost |
|-------|-----------------|-------------------|
| 100 users | ~200 | ~$1.20 |
| 1,000 users | ~2,000 | ~$12.00 |
| 10,000 users | ~20,000 | ~$120.00 |

At gpt-5-mini pricing. If we needed gpt-5.4-mini, multiply by ~2.5x.

## Files

- `lib/cv/prompt.ts` — All CV extraction prompts (full parse + personal parse)
- `app/api/cv/parse/route.ts` — Full CV parse route (experience, certs, education, skills)
- `app/api/cv/parse-personal/route.ts` — Personal details + languages parse route
- `lib/cv/types.ts` — TypeScript interfaces for parsed output
