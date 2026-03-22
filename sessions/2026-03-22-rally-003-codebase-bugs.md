# Session: Rally 003 — Full Codebase Bug Audit

**Date:** 2026-03-22
**Agent:** Claude Opus 4.6 (1M context) + 6 Sonnet subagents + 3 Sonnet challengers
**Branch:** fix/rally-003-security-sprint-1 (Sprint 1), docs/opus-deep-review-prompt (review process)

## Summary

Full codebase bug audit triggered by founder observation that early sprints (1-9) shipped without the review process that later sprints have. Ran the complete rally workflow: 6 parallel audit agents → 3 challenger agents → synthesized proposal → executed Sprint 1 (security).

## Timeline

- **Git sync:** Resolved local/remote drift — branch was 7 commits ahead, never pushed. Committed all Ralph Loop docs + pushed. Pulled main to sync.
- **Sprint 11 QA:** Founder walked through the app, identified 4 bugs + 3 feature requests. Created Sprint 11.1 (bugs) + 3 junior feature sprints.
- **Sprint 11.1 built:** CV parse fix, photo upload limit, regenerate date, button margin. Codex caught isPro fail-open bug.
- **Sprint 11.2 built:** SearchableSelect with pinned countries, contact link prefill, CV & Sharing page rework. Codex caught missing clear option.
- **Sprint 11.3 built:** Saved profiles rework with notes, filters, sorting, rich cards. Codex caught cert column name, note race condition, pagination bug.
- **WORKFLOW.md created:** Canonical execution reference for sprints and rallies. Added post-build Sonnet review prompt.
- **Rally 003 launched:** 6 parallel audit agents across schema, RLS, runtime, UX, API, performance.
- **Pass 1 complete:** 96 findings across all 6 agents.
- **Pass 2 complete:** 3 challengers verified 89/96 findings, found 15 new issues, identified 5 false positives.
- **Synthesis:** 52 unique confirmed bugs → 10 fix sprints ordered P0→P3.
- **Sprint 1 shipped:** CV path traversal, cron auth, rate limit hardening. Codex caught export route downstream impact.
- **Opus deep review prompt:** Created as final gate to replace Codex. Two-layer process: Sonnet fast pass + Opus deep review.

## Key Decisions

1. **Manual rally over /codebase-rally skill** — our custom checklists reference specific schema, known ghost columns, and lessons-learned patterns. Generic skill would miss codebase-specific bugs.
2. **3 challengers not 6** — each challenger reviews 2 pass 1 reports. Diminishing returns from 1:1 mapping.
3. **Opus for deep review, Sonnet for fast pass** — downstream caller tracing requires architectural reasoning. Sonnet catches checklist items but misses cross-file impacts.
4. **Sprint 4 hidden risk flagged** — account deletion must NOT use CASCADE because users row is anonymised, not deleted. Explicit per-table deletes instead.

## Codex Learnings (from this session)

Every Codex catch was a downstream impact bug:
- isPro defaults to false on query error (fail-mode)
- Country field can't be cleared after component swap (UX regression)
- Cert name column doesn't exist (schema mismatch)
- WORKFLOW.md removed runtime testing (doc regression)
- Export blocked by rate limit change (shared config)

All now codified in lessons-learned.md and the Opus review prompt.

## What's Left

- Rally 003 Sprints 5-10 (schema rename, data integrity, performance, UX)

## Sprints 2-4 Execution + Opus Reviewer Tuning

- **Sprint 2 (RLS):** Opus passed clean. Codex caught SECURITY DEFINER RPC bypass on analytics — RLS policy was insufficient because `record_profile_event` bypasses RLS. Fixed by adding validation inside the RPC.
- **Sprint 3 (Endorsement):** Opus passed clean. Codex passed clean (PR #65 — first clean security PR).
- **Sprint 4 (Account deletion):** Opus caught GDPR export gap (P1) and auth.deleteUser error handling (P2). Codex caught analytics export row limit. Opus had found the limit but rated P3 — severity policy updated.
- **Opus prompt iterations:**
  1. Added "Adversarial Self-Challenge" — tries to bypass its own approvals
  2. Added zero-tolerance severity policy — find it, fix it, no exceptions
  3. Replaced narrow security checklists with general adversarial thinking
  4. GDPR/legal always P1 regardless of probability
