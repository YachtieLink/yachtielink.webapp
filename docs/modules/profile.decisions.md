# Profile — Decisions

Append-only. Never edit existing entries. Newest at top.

When making a decision that affects this module, append it here with the date, decision ID (from yl_decisions.json if applicable, or next available D-xxx), rationale, and who made it.

---

**2026-03-29** — D-038: Auth email and contact email are separate. `contact_email` column on users table for CV/profile display; auth `email` used only for login. All public-facing read paths use `contact_email ?? email` fallback. Scrim/accent/template settings removed from UI — existing DB values preserved, to be rebuilt with live preview in a future sprint. CV-only fields (smoking, tattoos, license, travel docs) live on the CV tab, not profile settings. — Ari + Claude Code

**2026-03-08** — D-036: Current build target is Phase 1A — profile, CV import, yacht entities, employment attachments, colleague graph, endorsements, public profile, PDF snapshot, paid presentation upgrades. Recruiter access and later features deferred. — Ari

**2025-11-20** — D-007: Identity is free infrastructure; presentation is paid and cosmetic only. Paid scope is cosmetic presentation only — templates, polish, watermark removal. — Ari
