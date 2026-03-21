# Sprint 10.3 — Three-Agent Review Findings

> Findings from Bug Finder, UX/UI Expert, and Frontend Layout Expert.
> Items marked **ADDED** are being added to the build plan. Items marked **DEFERRED** are out of scope for 10.3.

---

## Critical Bugs (Bug Finder)

| # | Issue | Action |
|---|-------|--------|
| B1 | `expiry_date` vs `expires_at` column mismatch on insights/certs — Pro users never see expiring cert counts | **ADDED to Part 13** |
| B2 | Profile page is server component but spec adds onClick handlers — needs client component extraction | **Already noted in build plan Part 1A** |
| B3 | Spec references `<ToggleSwitch>` component that doesn't exist | **ADDED to Part 1C** — use existing toggle or create one |
| B4 | Section grid needs client component for toggle interactivity | **Already noted** |
| B5 | `subscription_plan === 'pro'` check on photo/gallery APIs is wrong — should be `subscription_status === 'pro'` | **ADDED to Part 13** |

---

## UX/UI Issues (UX Expert)

### Added to sprint:
| # | Issue | Part |
|---|-------|------|
| U24 | Network page has NO page title | **ADDED to Part 7A** |
| U32 | More page has NO page title | **ADDED to Part 7A** |
| U29 | EmptyState CTA renders as text link "Add →", not a Button | **ADDED to Part 8** — fix in EmptyState component itself |
| U16 | Locked template uses `window.location.href` instead of router | **ADDED to Part 5** |
| U20 | UpgradeCTA catch block has no error feedback | **ADDED to Part 4C** |
| U14 | "Download QR" is a raw text link | **ADDED to Part 5** |
| U33 | "Download my data" navigates to raw API endpoint | **ADDED to Part 6** |
| U48 | "Manage →" on Insights cert manager is text link | **ADDED to Part 4** |

### Deferred (good ideas, but scope creep for 10.3):
| # | Issue | Why deferred |
|---|-------|-------------|
| U1-3 | Welcome page has no visual identity, no social proof, raw buttons | Auth pages are out of scope — Sprint 11 |
| U4-5 | Login error messages expose raw Supabase strings, no success state | Sprint 11 |
| U18 | Teaser cards should be tappable → scroll to upgrade CTA | Nice-to-have, not blocking |
| U19 | Profile completeness gate should show visual checklist | Nice-to-have |
| U23 | Time range selector causes full page reload | Requires architectural change |
| U28 | Saved tab is a dead-end redirect card | Needs redesign of saved profiles |
| U38 | Delete photo uses `window.confirm()` | Nice-to-have |
| U42 | No "Endorse" CTA on public profile for logged-in colleagues | Feature addition, not layout fix |
| U43 | Non-logged-in public profile CTA is generic | Copy improvement, Sprint 11 |
| U44-47 | Skeleton loading, microinteractions, onboarding tour, error boundaries | Separate sprint |

---

## Frontend Layout Issues (Layout Expert)

### Added to sprint:
| # | Issue | Part |
|---|-------|------|
| L1 | Inconsistent page-level gap: profile=gap-3, others=gap-4 | **ADDED to Part 7** — standardize to gap-4 |
| L2 | Card padding inconsistent: p-3 vs p-4 vs p-5 on same page | **ADDED to Part 1** — standardize to p-4 |
| L7-8 | Network and More pages missing page titles | **ADDED to Part 7A** |
| L9 | Section header styles differ: `tracking-wider` vs `tracking-wide`, `text-secondary` vs `text-tertiary` | **ADDED to Part 7B** |
| L10 | Profile page title has `px-1` wrapper misaligning it with cards | **ADDED to Part 1** |
| L17 | Double bottom padding: layout `pb-tab-bar` (64px) + page `pb-24` (96px) = 160px dead space | **ADDED to Part 14** |
| L21 | Sub-pages (edit forms) apply their own `px-4` on top of layout's `px-4` = double padding | **ADDED to Part 14** |
| L25 | Toast positioned at hardcoded `bottom-24`, should use CSS var for tab bar height | **ADDED to Part 14** |
| L27 | `pt-safe-top` is not a real utility class — does nothing | **ADDED to Part 13** |
| L31 | Profile section grid at 375px = 163px cards, too tight — use `grid-cols-1 sm:grid-cols-2` | **ADDED to Part 1C** |

### Noted but acceptable:
| # | Issue | Status |
|---|-------|--------|
| L4 | UpgradeCTA `mx-5` creates narrower card than siblings | Intentional per founder request |
| L12 | `max-w-2xl` too narrow for desktop | Acceptable for mobile-first app, revisit in Phase 1B |
| L13 | `-mx-4 px-4` hack is fragile | Acceptable, documented in build plan |
| L28 | `backdrop-filter` performance on iOS 15 | Test during implementation, fallback to solid bg |
| L30 | `rgba(255,255,255,0.65)` may be too transparent on navy | Tune during implementation |

---

## Founder Additions (from screenshots during this session)

| # | Issue | Part |
|---|-------|------|
| F1 | Photo limits: free=3, pro=15 (changed from 3/9) | **Part 11C** |
| F2 | Gallery limits: need to match or specify separately | **Part 11C** |
| F3 | Calendar date picker: replace native `<input type="date">` with custom calendar component allowing month+year only (no day required) | **ADDED to Part 15** |
| F4 | Work Gallery shows "Free: 12 photos · Pro: 30" — update gallery limits too | **Part 11C** |
| F5 | "Currently working here" checkbox too small to tap with a finger — needs min 44x44px tap target | **ADDED to Part 15** |
| F6 | Native `<input type="date">` calendar is ugly and forces day selection — replace with custom month/year picker that allows optional day | **ADDED to Part 15** |
| F7 | Cert category picker is a flat text list — not engaging, needs icons or visual treatment | **ADDED to Part 16** |
| F8 | Save button on dates page looks disabled/greyed out even when active | **ADDED to Part 14** |
| F9 | Back button on cert/attachment pages is a tiny `‹` chevron character — nearly invisible, too small to tap | **ADDED to Part 16** |
| F10 | Raw native file input ("Choose file No file chosen") on cert page — ugly, unstyled | **ADDED to Part 16** |
| F11 | All raw `<input type="checkbox">` elements (no expiry, currently working here) need larger tap targets and styled appearance | **ADDED to Part 15** |
| F12 | Cert category list is flat and not engaging — needs icons and cards | **ADDED to Part 16** |
| F13 | BackButton + page title have no gap between them (e.g. "Add Education" page) — needs `gap-3` in header flex row | **ADDED to Part 16F** |
| F14 | Hobbies page placeholder says "e.g. Surfing" right after asking "What do you do off the water?" — suggest a non-water hobby like "e.g. Photography" or "e.g. Cooking" | **ADDED to Part 16** |
| F15 | Hobbies emoji input is confusing — rework: auto-suggest an emoji as user types the hobby name (e.g. typing "Photography" suggests 📷, "Cooking" suggests 🍳). Show emoji pills on their profile alongside the hobby name. Makes profiles more visual and fun. | **ADDED to Part 16** |
| F17 | Crew Pro upgrade CTA is buried below the fold — should be a sticky bottom overlay/sheet that hovers over the teaser cards. User can see the feature cards behind it while scrolling, and the upgrade button is always visible. Like a persistent bottom sheet, not an inline card at the end of the page. | **ADDED to Part 4** |
| F16 | Skills page is confusing and not engaging. Problems: (1) "Category" dropdown with no explanation of what categories mean, (2) no examples of what added skills look like, (3) no suggestion chips for common skills per category, (4) truncated placeholder text. Needs: quick-add suggestion chips per category (e.g. Technical → "Welding", "Paint spraying", "Watermaker servicing"), show added skills as visual pills grouped by category, and a brief explainer of how skills appear on their public profile. | **ADDED to Part 16** |
