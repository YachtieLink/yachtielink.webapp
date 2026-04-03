# Lane 2 QA Report — Roadmap + Feedback

**Tester:** Chain agent (Opus 4.6, CLI headless)
**Date:** 2026-04-03
**Branch:** feat/roadmap-feedback (yl-wt-2)
**Verdict:** PASS

---

## Automated Checks

| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | PASS | Zero errors |
| `npm run drift-check` | PASS | 2 warnings (585 LOC hotspot, auth-refetch) — both acknowledged and justified in worker report |
| Dev server (port 3002) | PASS | Both `/app/more/roadmap` and `/app/more/roadmap/suggest` return 307 to `/welcome` (correct — protected routes behind auth middleware) |

## File Inventory

| File | Lines | Type | Lane Compliant |
|------|-------|------|----------------|
| `app/(protected)/app/more/roadmap/page.tsx` | 584 | Rewrite | Yes (allowed) |
| `app/(protected)/app/more/roadmap/layout.tsx` | 5 | New | Yes (reasonable — extracts metadata from 'use client' page) |
| `app/(protected)/app/more/roadmap/suggest/page.tsx` | 163 | New | Yes (allowed) |
| `supabase/migrations/20260403200001_feature_suggestions_votes.sql` | 103 | New | Yes (allowed) |

**No forbidden files touched.** No changes to profile, network, insights, CV tabs, endorsement components, or settings pages.

## Copy Audit

| Check | Result |
|-------|--------|
| AI/LLM mentions in user-facing copy | NONE (clean) |
| Placeholder/TODO/FIXME/HACK in code | NONE (the word "placeholder" only appears as HTML `placeholder` attrs on form inputs — correct usage) |
| Dev jargon in user-facing copy | NONE |
| Border-l accent stripes | NONE |
| "AI profile enhancement" → "Profile enhancement" | CORRECT — AI removed per project rules |
| Copy tone: positive framing | YES — "Have an idea? We build what the community wants.", "The best ideas come from crew who use the platform every day." |
| Copy tone: sell the feature | YES — roadmap descriptions lead with value/pain, not implementation |

## Review Fixes Verification

All 18 reviewer findings from `lane-2-review.md` were addressed. Key verifications:

1. **SECURITY DEFINER + SET search_path** — Confirmed in migration line 98: `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;`
2. **DELETE policy on suggestions** — Confirmed in migration lines 33-36
3. **Auto-vote error handling** — Confirmed in suggest/page.tsx line 89: `if (voteError) console.error('Auto-vote failed:', voteError)`
4. **Semantic tokens on Shipped badge** — Confirmed in page.tsx line 572: `bg-[var(--color-success)]/10 text-[var(--color-success)]`
5. **loadSuggestions error toast** — Confirmed in page.tsx line 200: `toast('Failed to load requests', 'error')`
6. **Math.max(0) on vote count** — Confirmed in page.tsx lines 236 and 265
7. **Rate limiting** — Confirmed in suggest/page.tsx lines 59-68: 5/hour limit
8. **Post-submit redirect to requests tab** — Confirmed in suggest/page.tsx line 93: `router.push('/app/more/roadmap?tab=requests')`
9. **PageTransition wrappers** — Confirmed on both pages (page.tsx line 294, suggest/page.tsx line 102)
10. **Vote button disabled state** — Confirmed in page.tsx line 506: `disabled={!userId || isVoting}`
11. **Description trim validation** — Confirmed in suggest/page.tsx line 41: `description.trim().length > 1000`
12. **timeAgo "just now"** — Confirmed in page.tsx line 147: `if (minutes < 1) return 'just now'`
13. **Submit button disabled** — Confirmed in suggest/page.tsx line 157: `disabled={!titleValid || submitting}`
14. **iconClassName field** — Confirmed in page.tsx lines 115-133
15. **Query limit** — Confirmed in page.tsx line 186: `.limit(50)`
16. **Explicit .select() columns** — Confirmed in page.tsx line 183

## Code Quality Notes

- Sand section color used throughout (CTA card: `color-sand-100/200`, sort pills: `color-sand-200`) — correct for More tab
- Uses existing project patterns: `PageHeader`, `PageTransition`, `staggerContainer`, `fadeUp`, `useToast`, `Input`, `Textarea`, `Button`
- Optimistic UI with proper revert on error
- Loading skeleton matches codebase pattern
- Empty state has encouraging copy
- useSearchParams for tab deep-linking
- useRef pattern for stable callback closure (avoids stale closure in toggleVote)

## Drift-Check Warnings (Justified)

1. **585 LOC hotspot** — Three colocated tab components (RoadmapTab, RequestsTab, ReleasedTab) in one file. Single-concern page with shared types and state. Splitting would add complexity without benefit. Acceptable.
2. **auth-refetch** — Client component needs `userId` for voting logic. Same pattern as endorsement client components. The protected layout owns auth for server rendering; this additional client-side call is necessary for interactive features.

## Founder Visual Checklist

- [ ] 3-tab segment control: "Roadmap / Requests / Released" — tabs switch cleanly, active state visible
- [ ] Roadmap tab: items grouped by stage (In Progress / Next / Committed) with correct stage badges
- [ ] Feature Requests tab: CTA card with sand background, "Submit a request" button visible
- [ ] Feature Requests tab: vote button toggles color (interactive/teal when voted, surface-raised when not)
- [ ] Feature Requests tab: sort toggle "Most Voted / Newest" switches correctly
- [ ] Feature Requests tab: empty state message when no suggestions exist
- [ ] Released tab: shipped items with green "Shipped" badge using semantic success color
- [ ] Suggest page: back nav "Feature Roadmap", form with title/description/category/submit
- [ ] Suggest page: category pill selector (Profile/Network/CV/Insights/General) toggles visibly
- [ ] Suggest page: submit disabled until title >= 5 chars
- [ ] Post-submit: redirects to Requests tab (not Roadmap tab)
- [ ] No AI mention anywhere in user-facing copy
- [ ] Sand section color visible on CTA card and interactive elements
