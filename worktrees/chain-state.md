# Chain State — Rally 010: Frontend UX & Guidance

**Skill to run:** /yl-chain (re-read this after every compaction)
**Chain branch:** chain/rally-010
**Chain tip:** 6e94acd (Session 2 merged)
**Rally spec:** sprints/rallies/rally-010-frontend-ux-guidance/README.md
**Sessions in scope:** 1 through 4
**Started:** 2026-04-04 ~22:00
**PR strategy:** Per-session PRs

## Current Position

**Session:** 3 (Product Tour)
**Step:** 2a — Writing lane files for Session 3
**Next action:** Write lane specs for Session 3 (Lane 1: First-Time Tour, Lane 2: Per-Tab First-Visit Cards). Create worktrees. Build.

### Active worktrees
(none — between sessions)

## Progress
| Session | Lanes | Build | /yl-review | /yl-tester | Docs | Merged |
|---------|-------|-------|------------|------------|------|--------|
| 1: Tooling + StickyBottomBar | 2 | ✅ L1, ✅ L2 | ✅ L1 PASS, ✅ L2 PASS | ✅ L1 PASS, ✅ L2 PASS | — | ✅ |
| 2: Cold States | 2 | ✅ L1, ✅ L2 | ✅ L1 PASS, ✅ L2 PASS (3 fixes) | ✅ L1 PASS, ✅ L2 PASS | — | ✅ |
| 3: Product Tour | 2 | — | — | — | — | — |
| 4: Tooltips + Coaching | 2 | — | — | — | — | — |

## Founder Visual Checklist (accumulating — all sessions)
| # | URL | What to check | Lane | Session |
|---|-----|---------------|------|---------|
| 1 | /app/profile | Coaching bar visible when strength < 80%, mini ring + CTA | L2 | 1 |
| 2 | /app/cv | Document action bar when PDF exists: Preview/Download/Regenerate | L2 | 1 |
| 3 | /app/network | Endorsement request bar with progress when < 5 endorsements | L2 | 1 |
| 4 | /app/profile | Bar hides when strength >= 80% | L2 | 1 |
| 5 | /app/cv | Regenerate highlighted in amber when profile changed since CV gen | L2 | 1 |
| 6 | /app/profile (new user) | Preview/Share hidden when strength < 40%, coaching text shown | L1 | 2 |
| 7 | /app/cv (new user) | Cold state: centered layout with Upload CTA and Go to Profile | L1 | 2 |
| 8 | /app/cv (has CV) | "Update from new CV" demoted to text link at bottom | L1 | 2 |
| 9 | /app/network (0 yachts) | Centered empty state, no endorsement cards, yacht search | L2 | 2 |
| 10 | /app/network (1-3 yachts) | "Add another yacht" dashed card after last accordion | L2 | 2 |
| 11 | /app/insights (Pro, 0 stats) | Coaching state: "Share your profile to start seeing analytics" | L2 | 2 |
| 12 | /app/insights (Free, 0 stats) | Coaching card: "Upload your CV or add experience" | L2 | 2 |

## Review findings fixed
- Session 1 L1: 3 findings (CRITICAL: showOnborda dead prop, MEDIUM: missing prevRoute, LOW: dead nextRoute)
- Session 1 L2: 3 findings (MEDIUM: amber-600→700, MEDIUM: silent catch→toast, LOW: pdfStale duplication)
- Session 2 L1: 0 findings (1 pre-existing noted)
- Session 2 L2: 3 findings (MEDIUM: dead EmptyState import, LOW: dead Button import, LOW: CTA label "Share"→"View")

## Blockers / Decisions needed
(none)

## Discovered issues (for backlog)
- Pre-existing: ProfileHeroCard shareProfile button renders without handle guard (Share button renders when handle=null, no-ops on click)
