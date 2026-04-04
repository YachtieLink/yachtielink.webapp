# QA Report — Rally 010 (Full Chain)

**Tester:** Claude Code — Headless QA (via /yl-tester Skill)
**Branch:** chain/rally-010
**Chain tip:** 99ed037
**Verdict:** PASS

## Automated Tests
| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Type-check (`npx tsc --noEmit`) | PASS | Zero errors |
| 2 | Drift-check (`npm run drift-check`) | PASS | 0 new warnings |
| 3 | Copy audit — no AI/GPT/Claude/LLM mentions | PASS | Scanned all .tsx/.ts in diff |
| 4 | Copy audit — no TODO/FIXME/placeholder | PASS | Clean |
| 5 | Debug residue — no console.log/debug | PASS | Clean |
| 6 | Hardcoded values — no localhost/test123 | PASS | Clean |
| 7 | Migration safety | PASS | No new migrations in Rally 010 |
| 8 | Dependencies — onborda v1.2.5 installed | PASS | ESM-only package, bundled by Next.js |
| 9 | Dependencies — framer-motion installed | PASS | |
| 10 | All 10 new component files exist | PASS | InfoTooltip, StickyBottomBar, FirstVisitCard, TourProvider, tour-steps, ProfileCoachingNudge, CvFreshnessNudge, CvDocumentBar, EndorsementRequestBar, ProfileCoachingBar |
| 11 | InfoTooltip imports correct across 3 consumers | PASS | MetricCard, ProfileHeroCard, EndorsementSummaryCard |
| 12 | StickyBottomBar imports correct across 3 consumers | PASS | EndorsementRequestBar, CvDocumentBar, ProfileCoachingBar |
| 13 | FirstVisitCard — uses colorMap[accentColor] directly | PASS | Fixed from getSectionTokens bug |
| 14 | FirstVisitCard — all 4 usages pass valid SectionColor | PASS | amber, navy, coral, coral |
| 15 | TourProvider — startOnborda('welcome') in useEffect | PASS | Correct v1.2.5 pattern |
| 16 | TourProvider — TOUR_STORAGE_KEY read/write | PASS | 'skipped', 'complete' states |
| 17 | data-tour attributes — all 6 selectors have DOM matches | PASS | profile-hero, strength-ring, network-page, cv-page, insights-page, settings-page |
| 18 | cv-page data-tour — present on BOTH cold + warm h1 | PASS | Fixed: was missing on warm-state |
| 19 | tour-steps — step 7 has nextRoute: '/app/profile' | PASS | Fixed: tour no longer hangs |
| 20 | tour-steps — stale scaffold comments removed | PASS | Lines 9-19 cleaned up |
| 21 | ProfileCoachingNudge — no hasRole prop | PASS | Removed in review |
| 22 | ProfileCoachingNudge — useEffect deps are primitives | PASS | [hasPhoto, hasBio, hasYacht, hasCert] |
| 23 | CvFreshnessNudge — 7-day gate logic | PASS | daysSinceChange < 7 → return |
| 24 | CvFreshnessNudge — dismiss stores profileUpdatedAt | PASS | localStorage.setItem(STORAGE_KEY, profileUpdatedAt) |
| 25 | CvFreshnessNudge — has action CTA | PASS | "Regenerate now" anchor → #cv-actions |
| 26 | CvDocumentBar — #cv-actions anchor (not dead #regenerate) | PASS | Fixed from dead hash link |
| 27 | Auth middleware — protected pages redirect to /welcome | PASS | 307 → /welcome?returnTo=... |
| 28 | Public pages — /, /login, /welcome return 200 | PASS | |
| 29 | DB — users table accessible with auth token | PASS | Profile fields for coaching verified |
| 30 | section-colors — colorMap exported | PASS | Used by FirstVisitCard |

## Issues Found
| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| — | — | — | No issues found | — |

## Discovered Issues (pre-existing, for backlog)
- **[BUG]** `components/profile/ProfileSectionGroup.tsx` — passes SectionColor to getSectionTokens() which expects section names. Falls back to teal for non-teal colors. Pre-existing on main.
- **[BUG]** `components/profile/ProfileAccordion.tsx` — same getSectionTokens misuse. Pre-existing on main.
- **[BUG]** `components/ui/EmptyState.tsx` — same getSectionTokens misuse. Pre-existing on main.

## Founder Visual Checklist

Dev server: `npx next dev` (port 3000)
Login: dev@yachtie.link / jHvzEqbR7igVr8J2UeAZQP50

| # | URL | What to check | Session |
|---|-----|---------------|---------|
| 1 | /app/profile | Coaching bar visible when strength < 80%, mini ring + CTA | S1 |
| 2 | /app/cv | Document action bar when PDF exists: Preview/Download/Regenerate | S1 |
| 3 | /app/network | Endorsement request bar with progress when < 5 endorsements | S1 |
| 4 | /app/profile | Bar hides when strength >= 80% | S1 |
| 5 | /app/cv | Regenerate highlighted in amber when profile changed since CV gen | S1 |
| 6 | /app/profile (new user) | Preview/Share hidden when strength < 40%, coaching text shown | S2 |
| 7 | /app/cv (new user) | Cold state: centered layout with Upload CTA and Go to Profile | S2 |
| 8 | /app/cv (has CV) | "Update from new CV" demoted to text link at bottom | S2 |
| 9 | /app/network (0 yachts) | Centered empty state, no endorsement cards, yacht search | S2 |
| 10 | /app/network (1-3 yachts) | "Add another yacht" dashed card after last accordion | S2 |
| 11 | /app/insights (Pro, 0 stats) | Coaching state: "Share your profile to start seeing analytics" | S2 |
| 12 | /app/insights (Free, 0 stats) | Coaching card: "Upload your CV or add experience" | S2 |
| 13 | /app/profile | data-tour attributes on hero + strength ring (inspect DOM) | S3 |
| 14 | All 5 tabs | data-tour attributes present on page headers (inspect DOM) | S3 |
| 15 | /app/network | FirstVisitCard "How your network works" (navy accent) | S3 |
| 16 | /app/cv | FirstVisitCard "How your CV works" (amber accent) | S3 |
| 17 | /app/insights | FirstVisitCard (coral accent, Pro/Free variants) | S3 |
| 18 | /app/profile | Tooltip on strength ring + sea time stat | S4 |
| 19 | /app/network | Tooltip on endorsement count "received" | S4 |
| 20 | /app/insights (Pro) | Tooltips on all 4 metric card titles | S4 |
| 21 | /app/profile | ProfileCoachingNudge below hero (teal, dismissible) | S4 |
| 22 | /app/cv | CvFreshnessNudge above CvActions (amber, 7-day gate, "Regenerate now" CTA) | S4 |

Estimated time: ~10 minutes
