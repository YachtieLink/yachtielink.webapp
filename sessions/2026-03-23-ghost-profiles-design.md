---
date: 2026-03-23
agent: Claude Code (Opus 4.6)
sprint: ad-hoc (design interview)
modules_touched: []
---

## Summary

Design interview (/grill-me) on two backlog features: Ghost Profiles & Claimable Accounts (24 decisions resolved), and Endorsement Writing Assist (12 decisions resolved). No code written — pure design work. Both specs are now complete and ready for sprint planning.

---

## Session Log

**Session start** — Reviewed sprint board. User is working on two-pass CV parse in another terminal. Asked to be grilled on Ghost Profiles.

**Ghost Profiles interview** — Walked all branches of the design:
- **Scope:** Split into Wave 1 (core ghost+claim loop) and Wave 2 (CV auto-requests, nudge emails, fraud detection)
- **Data model:** Separate `ghost_profiles` table (not `users` — FK to `auth.users` makes it impossible). Dual nullable endorser columns on endorsements with CHECK constraint. One ghost per unique contact method, dedup at claim time only. `sent_via` column on `endorsement_requests`.
- **Auth/trust:** Ghosts are writers only, can't send requests. Coworker gate bypassed for ghost endorsements (token is the trust mechanism). Fraud prevention: self-request blocking + subtle visual distinction for ghost endorsements.
- **API:** Separate `/api/endorsements/guest` route — isolated from authenticated flow for blast radius containment.
- **UX:** Three-option landing page on `/r/:token` (all CTAs lead with "write endorsement"). 3-field ghost form. CV-powered endorsement suggestions (pre-generated at request time). Signup shortcut bypasses onboarding, redirects back to endorsement. Thank you page with equal-weight "Claim" and "Done" CTAs.
- **Claim flow:** Password or OAuth only (no magic links). Auto-match ghost by email, prompt to verify additional contacts (phone). No onboarding wizard — users self-serve later via CV upload.
- **Duplicate handling:** If ghost email matches existing user, redirect to login.
- **GDPR:** Consent line above submit, manual deletion via email, 12-month retention then auto-anonymize.
- **Visibility:** Semi-visible — ghost name on endorsee profiles links to "claim this profile" page, no standalone public page.

**Endorsement Writing Assist interview** — Spun out as separate backlog item, then grilled:
- **Core idea:** "Help me start writing" button on authenticated endorsement form. LLM generates 2-3 sentence draft using both sides' context (endorsee CV + endorser role/seniority).
- **Key decisions:** Always generate on demand (never persist drafts). Adaptive button — "Help me start" when empty, "Help me finish" when partial text exists. User's partial text sent as LLM context. `gpt-4o-mini` for speed. Free for everyone. 5 generations per session (client-side counter). Works without CV (fallback to attachment data). No schema changes needed.

**Sidebar decision:** Authenticated endorsers also get "Give me a hand" — same LLM pattern, richer context since both users have profiles.

**Founder feedback captured:**
- No magic links (founder hates them)
- Don't persist generated endorsement text (creates generic recycled snippets)
- Suggestions should encourage editing/personalisation, not be final text
- GDPR deletion: manual email to support is fine, no self-serve needed

**Skills created:**
- `/grill-me` skill at `~/.claude/skills/grill-me/SKILL.md` — used twice this session (ghost profiles, endorsement assist). Works well for systematically walking design trees.
- `/log` skill at `~/.claude/skills/log/SKILL.md` — session logging in one pass across all project doc files.

**Session end** — All logging files updated. Two founder corrections added to `docs/ops/feedback.md` and Claude memory.
