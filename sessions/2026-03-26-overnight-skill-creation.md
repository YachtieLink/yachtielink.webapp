---
date: 2026-03-26
agent: Claude Code (Opus 4.6)
sprint: ad-hoc (tooling)
modules_touched: [] # tooling session — skill created at ~/.claude/skills/overnight/SKILL.md (outside repo)
---

## Summary
Created the `/overnight` skill — an autonomous build orchestrator for unattended multi-unit work sessions. Iteratively refined through 8 rounds of founder feedback covering preflight, branching strategy, blocker handling, review verification, and session duration caps.

---

## Session Log

**Session start** — Founder asked what prompt to give for an overnight session to execute Phase 1 closeout Waves 3→5. Started by reading PHASE1-CLOSEOUT.md to understand scope.

**Early discussion** — Determined that a simple loop prompt wasn't sufficient — each wave is different work. Proposed a sequential chain prompt with /review → /yachtielink-review → /shipslog → commit → push per wave. Added /loop 60m as safety net.

**Skill creation** — Founder asked to formalize this as a reusable skill. Created `~/.claude/skills/overnight/SKILL.md` with:
- Mindset section (time is ally, optimize correctness not speed)
- 9-step execution loop per unit
- /loop 60m safety net
- Blocker handling

**Round 1: Blocker skip logic** — Founder requested that blockers shouldn't derail entire session. Added dependency-aware skip-ahead: check if next unit depends on blocked one, skip to independent units if possible. 20-minute blocker timeout.

**Round 2: Loop context recovery** — Concern that /loop fires fresh prompt without skill context. Added "re-read the skill file" instruction in loop prompt.

**Round 3: First audit** — Graded the skill 7.5/10. Found: stash pop bug, no test execution, no build check, double YL review, no max duration, review loop risk. Fixed all.

**Round 4: YL review chain verification** — Added explicit check that /yachtielink-review actually ran (look for PASS/WARNING/BLOCK verdict in /review output).

**Round 5: Pre-commit gate checklist** — Founder suggested self-reporting step. Added 5-checkbox gate before every commit to verify all steps ran.

**Round 6: Conditional branching** — Founder pushed back on always-chaining branches. Agreed: chain only when code files overlap, branch off main when independent. This gives PR review flexibility and avoids merge ordering dependencies.

**Round 7: Preflight phase** — Founder suggested setup phase while still awake. Added Phase 0: read specs, check codebase, test permissions, present plan, wait for "go."

**Round 8: Final audit** — Re-graded at ~8.5/10 after all fixes. Key remaining risk: inherent complexity of refactoring hotspot components unattended (~60% chance of 3 clean branches).

**Design decisions:**
- Conditional branching over always-chain (founder decision, clear reasoning about PR independence)
- 2-cycle review cap (prevents spiral, documents remaining issues)
- 6-hour max session duration (context quality degrades)
- Push failure: retry once, then commit locally and continue
- /shipslog runs per unit (one per wave, not one per session)
