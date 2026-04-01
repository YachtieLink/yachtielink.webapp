---
name: Reviewer must run /yl-review skill
description: Reviewer agents skip the /yl-review slash command and do manual code reads instead — prompts must be forceful about this
type: feedback
---

Reviewer agents will take the path of least resistance — reading the diff and writing a verdict manually — unless the prompt makes the /yl-review requirement unmissable.

**Why:** Session 2026-04-01, the reviewer passed 3 lanes in ~1 minute each with manual code reads. No type-check, no drift-check, no Sonnet scan, no Opus deep review, no QA. The reviewer CLAUDE.md said "Don't skip it" but the agent did anyway.

**How to apply:** The reviewer paste prompt must include "CRITICAL INSTRUCTION" language about /yl-review being mandatory. The reviewer CLAUDE.md now has a ⚠️ block explaining that a manual code read is not a review and will be rejected. Both the prompt and the CLAUDE.md must reinforce this — agents read the prompt first and may not internalize the CLAUDE.md.
