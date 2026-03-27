---
date: 2026-03-28
agent: Claude Code (Opus 4.6)
sprint: Sprint 11 — Public Profile Rewrite (design phase)
modules_touched: []
---

## Summary

Deep design interview (/grill-me style) with founder for Sprint 11 — Public Profile Rewrite. 34 questions resolved, covering view modes, bento grid architecture, photo system, endorsement display, sub-pages, and Pro monetisation. No code written. Build plan 11a written and queued for `/sprint-start-yl` validation (founder running overnight).

---

## Session Log

**Session start** — Founder asked "where are we up to with yachtielink." Reviewed git log, sprint status, junior sprints. Summarised: Sprint 10.1 + CV-Parse-Bugfix complete, Sprint 11 next.

**Backlog triage** — Founder reviewed backlog items before starting Sprint 11:
- Safari public profile links: RESOLVED (was subdomain link issue, not a bug)
- Nationality flag: RESOLVED (already implemented)
- CV regeneration: Founder questioned why manual regeneration exists. Decision: CV should generate on demand when viewed/downloaded. Kills the regenerate button entirely.
- Inner page header: Pull into Sprint 11
- Endorsement context display: Pull into Sprint 11
- Visibility toggle: Important but complex, keep as separate junior sprint

**Design interview (34 questions)** — Systematic walkthrough of every design branch:

Question numbers below follow the live session — some were skipped or reordered as the conversation branched.

1. **View modes (Q1-Q8):** Three modes — Profile (CV-style), Portfolio (free), Rich Portfolio (Pro). Owner picks default, viewer gets two-state toggle. Toggle in hero, scrolls away. Pro can choose Portfolio or Rich Portfolio.
2. **Hero (Q10-Q12):** Single framed photo (tasteful margin, not full-bleed). Name/role/stats overlaid with gradient scrim. User-controlled scrim presets (Dark, Light, Teal, Warm) + accent colour.
3. **Content (Q11-Q17):** Contact as icon row + "View my CV" → `/u/{handle}/cv` full-screen preview. Section order locked. Endorsements capped at 3 with avatar/name/role/yacht clickable. About truncated at 3 lines in bento.
4. **Layout (Q18-Q22):** Desktop single column ~680px. Rich Portfolio is bento grid — founder pushed back on restrained interstitial photos, wanted "unapologetically beautiful." Evolved to full bento with photo+content tiles interlocking. Template-based (2 templates), auto-switches by density (full/medium/minimal). Mobile: 2-column bento.
5. **Photos (Q33-Q35):** Single hero photo (no carousel). Free: 1+3, Pro: 1+15. All photos clickable → lightbox. Focal point adjustment for all users. Photo management extends existing `/app/profile/photos`.
6. **Sub-pages (Q30):** /cv, /endorsements, /experience, /certifications, /gallery — all shareable with back-to-profile.
7. **Pro/presentation (Q26-Q28):** Profile is always light mode (user's presentation layer, dark mode for app chrome only). Pro upsell only visible to owner. Consistency backlog filed.

**Research agent** — Spawned Sonnet subagent for mobile bento best practices. Key findings: pure CSS Grid with `grid-template-areas`, no masonry library. Focal points via `object-position` with custom properties. Template data model in TypeScript.

**Design references** — Founder reviewed Cosmos.so, Glass.photo, Kinfolk, Readymag, Squarespace templates. Confirmed direction.

**Session end** — Founder will run `/sprint-start-yl 11a` overnight via terminal. Shipslog running.
