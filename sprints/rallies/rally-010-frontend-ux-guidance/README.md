# Rally 010 — Frontend UX, User Guidance & Cold States

**Created:** 2026-04-02
**Type:** Full Audit → Implementation Plan
**Status:** Spec complete, ready to build after Rally 009
**Trigger:** Founder concern that users aren't guided through the platform. Audit revealed zero product tour, unused tooltip component, missing cold states, and primary CTAs in thumb-unreachable zones.

**Scope:** Everything a user sees, touches, and doesn't understand — from first login through daily use. Product tour, contextual help, cold states, thumb-zone fixes, onboarding coaching, and tooling upgrades.

---

## Context

Rally 009 focuses on making the app beautiful and feature-complete. Rally 010 makes it *usable* — ensuring users actually understand what they're looking at and can reach the buttons that matter.

**Three audits fed into this rally:**
1. **Codebase guidance audit** — what onboarding/help exists today
2. **Thumb-zone audit** — where CTAs land on a 375px mobile screen
3. **Frontend tool research** — what libraries and MCP servers can help

---

## Pass 1 Findings — What Exists Today

### Guidance That Works

| What | Where | Quality |
|------|-------|---------|
| Onboarding wizard (4-step: CV → Name → Handle → Done) | `components/onboarding/Wizard.tsx` | Good — clear steps, inline help |
| Empty states with positive framing | `components/ui/EmptyState.tsx` | Decent — used in Profile, Network, sections |
| Form hints on key fields | Input/Select/Textarea components | Sparse — only on ~30% of fields that need them |
| Endorsement banner (3-phase nudging) | `components/endorsement/EndorsementBanner.tsx` | Excellent — smart state, localStorage, celebration at 5 |
| "What to do next" on onboarding done | `components/onboarding/Wizard.tsx` (StepDone) | Good — 3 concrete next actions |
| CV import review wizard | `app/(protected)/app/cv/review/` | Good — multi-step with inline editing |

### Guidance That's Missing

| Gap | Impact | Notes |
|-----|--------|-------|
| **No product tour** | Critical | No library installed. New users get dumped into app with no walkthrough. |
| **No contextual tooltips** | High | Tooltip component built (`components/ui/tooltip.tsx`) but ZERO imports anywhere. Never used. |
| **No "what is this?" help** | High | Complex concepts (yacht graph, sea time calc, profile strength, endorsement weight) unexplained. |
| **No feature explanation cards** | High | Network tab: user has no idea what the yacht graph is. Insights tab: metrics without context. |
| **No first-visit detection** | High | Can't show different content on first vs returning visits. No per-tab "first time here?" state. |
| **No coaching beyond endorsements** | Medium | Endorsement banner pattern is great but it's the ONLY nudge system in the app. |
| **No per-field help on complex forms** | Medium | Settings page has 20+ toggles with no explanation of what each controls on the public profile. |
| **No analytics nudges** | Medium | "Your profile gets X views" / "Complete your bio for 3x more engagement" — none of this exists. |

---

## Pass 2 Findings — Thumb Zone & Cold State Audit

### Critical CTA Placement Issues

4 primary CTAs are in the **red zone** (top of screen, unreachable by thumb on mobile):

| Tab | CTA | Current Position | Problem |
|-----|-----|-----------------|---------|
| **Profile** | Coaching CTA ("Add a photo") | y=260, inside hero card | Primary completion driver unreachable |
| **CV** | [Preview] [Download] [Regenerate] | y=180, inside hero card | Entire purpose of tab unreachable |
| **Network** | [Request endorsement] | y=180, inside CTA card | Core value action unreachable |
| **CV** | [Upload new CV] (destructive) | y=620, green zone | Dangerous action EASIER to reach than safe actions |

### Cold State Failures

Every tab except Settings has cold-state problems:

| Tab | Cold State Problem |
|-----|--------------------|
| **Profile** | "0y 0mo - 0 yachts" stat line. [Preview] and [Share Profile] buttons shown on empty profile. Wall of empty section rows. |
| **CV** | No cold-state wireframe defined at all. User who skipped CV upload sees... unknown. |
| **Insights (Free)** | Stat cards may show triple zeros if CV was skipped. |
| **Insights (Pro)** | No empty analytics state. All-zero dashboard with flat sparklines. |
| **Network** | Worst cold state. Dead-end [Request endorsement] button (no colleagues). Triple-zero stat card. Empty page below. |

### Proposed Fixes (from thumb-zone audit)

**Sticky bottom bars** (shared `<StickyBottomBar>` component, z-30, above z-40 tab bar):
- **Profile:** Coaching bar with strength ring + next action + [Do it] button. Shows when Profile Strength < 80%.
- **CV:** Document action bar with [Preview] [Download] [Regenerate]. Shows when generated CV exists.
- **Network:** Endorsement request bar with progress + [Request one]. Shows when endorsements < 5 and colleagues >= 1.

**Cold state redesigns:**
- **Profile:** Hide stat line when all zeros (replace with coaching text). Suppress [Preview]/[Share] when strength < 40%. Outcome-oriented empty row summaries.
- **CV:** Full empty-state wireframe with vertically centered upload CTA.
- **Insights (Pro):** "Share your profile to start seeing analytics" with [Share link] [Copy QR] CTAs.
- **Network:** When zero yachts, replace entire page with centered "Add your first yacht" empty state. Suppress endorsement cards when yacht count = 0.

**Destructive action demotion:**
- CV "Update from new CV" → demote to text link at page bottom, opens confirmation sheet.

Full audit with wireframes: `docs/design-system/patterns/ux-thumb-zone-audit.md`

---

## Pass 3 Findings — Tooling Gaps

### What Agents Need

General Claude agents lack frontend UX awareness. They write functional code but don't consider thumb reach, cold states, or progressive disclosure unless explicitly told.

### Recommended Tooling

| Tool | Purpose | Effort |
|------|---------|--------|
| **Onborda** | Product tour library for Next.js App Router + Framer Motion | `npm install onborda`, ~2h setup |
| **Playwright MCP** | Gives agents accessibility-tree DOM understanding (not just pixels) | MCP config, replaces/augments Chrome MCP |
| **eslint-plugin-jsx-a11y** | Static a11y linting — catches missing labels, bad touch targets at build time | `npm install -D`, add to eslint config |
| **vitest-axe** | Accessibility testing in test suite — runtime a11y checks | `npm install -D`, add to component tests |
| **Figma MCP** | Design-to-code bridge if using Figma | MCP config |

**Immediate wins (< 1 hour each):**
1. Install `eslint-plugin-jsx-a11y` — catches issues at build time
2. Activate the existing unused Tooltip component — wire into confusing fields
3. Add Playwright MCP to Claude config — agents get DOM-level understanding

---

## Implementation Plan

### Session 1 — Tooling & Infrastructure (~3h, 2 lanes)

**Lane 1: Tooling Setup (Sonnet, medium)**
- Install Onborda: `npm install onborda`
- Install eslint-plugin-jsx-a11y, add to eslint config
- Install vitest-axe, add to test helpers
- Configure Playwright MCP in Claude settings
- Create `components/tour/TourProvider.tsx` wrapper for Onborda with app-level context

**Lane 2: StickyBottomBar Component (Sonnet, high)**
- Build shared `<StickyBottomBar>` component per thumb-zone audit spec:
  - `fixed bottom-20 left-0 right-0 z-30`
  - `springSnappy` enter/exit animation
  - Safe-area handling: `bottom-[calc(5rem+env(safe-area-inset-bottom))]`
  - `visible` prop for conditional rendering
  - Dark mode compatible
- Update `pb-24` → `pb-36` on Profile, CV, Network pages (pages that will have sticky bars)
- Wire into Profile page: coaching bar (strength < 80%)
- Wire into CV page: document action bar (generated CV exists)
- Wire into Network page: endorsement request bar (endorsements < 5, colleagues >= 1)

### Session 2 — Cold States (~4h, 2-3 lanes)

**Lane 1: Profile + CV Cold States (Sonnet, high)**
- Profile: Hide "0y 0mo - 0 yachts" when all zeros → replace with coaching text
- Profile: Suppress [Preview]/[Share] when Profile Strength < 40%
- Profile: Empty section row summaries ("Tell captains about yourself", "Add skills captains search for")
- CV: Build cold-state page (no CV uploaded) — centered illustration + "Upload a CV" primary CTA + "Go to Profile" secondary
- CV: Demote "Update from new CV" → text link at bottom with confirmation sheet

**Lane 2: Network + Insights Cold States (Sonnet, high)**
- Network: Full empty state when yacht count = 0 — centered illustration + "Add your first yacht" + "Upload a CV instead"
- Network: Suppress endorsement CTA card and stat card when yacht count = 0
- Network: "Add another yacht" dashed card when yacht count 1-3
- Insights (Pro): Empty analytics state — "Share your profile link to start seeing analytics" + [Share] [Copy QR]
- Insights (Free): Replace triple-zero stat cards with "Upload your CV or add experience to see your career snapshot"

**Lane 3: Shared Empty State Patterns (Sonnet, medium) — optional**
- Audit all existing empty states for positive framing consistency
- Ensure all follow the formula: illustration + benefit headline + one CTA
- Section-colored illustrations on each empty state

### Session 3 — Product Tour (~4h, 2 lanes)

**Lane 1: First-Time Tour (Opus, high)**

Build an Onborda-powered tour for first-time users (triggers after onboarding wizard completes):

**Tour steps:**
1. **Profile tab** — spotlight on hero card: "This is your profile. Tap your name or role to edit them anytime."
2. **Profile Strength** — spotlight on ring: "This tracks your progress. Follow the suggestions to stand out."
3. **Network tab** — switch tabs, spotlight on page: "Your professional network. Add yachts and we'll connect you with crew."
4. **CV tab** — switch tabs, spotlight on page: "Your generated CV. Keep your profile updated and we'll keep this fresh."
5. **Insights tab** — switch tabs, spotlight on page: "See who's viewing your profile and what's working."
6. **Settings** — brief mention: "Account settings, billing, and support live here."
7. **Done** — "You're all set! Start by completing your profile." → dismiss with confetti/celebration

**Requirements:**
- Store tour completion in localStorage (`yl_tour_complete`)
- "Skip tour" option on every step
- Mobile-optimized: spotlights must account for tab bar, sticky bars
- Framer Motion animations (Onborda uses these natively)
- Tour steps must not block the UI — user can interact after dismissing

**Lane 2: Per-Tab First-Visit Cards (Sonnet, high)**

For users who skip the tour OR return to a tab for the first time:

- **Network (first visit):** Dismissible education card: "How your network works: We connect you with crew through shared yacht history. Add a yacht → see colleagues → request endorsements."
- **Insights (first visit, free):** Card explaining: "Career Insights shows how your profile performs. Upgrade to see who's viewing you."
- **Insights (first visit, pro):** Card explaining metrics: "Views = profile page visits. Downloads = CV downloads. Shares = link shares."
- **CV (first visit):** Card explaining: "Your YachtieLink CV is built from your profile. Edit your experience on the Profile tab — the CV updates automatically."

**Requirements:**
- Store per-tab first-visit state in localStorage (`yl_first_visit_{tab}`)
- Dismissible with X button — never shows again after dismissal
- Follow design guide card hierarchy (content card tier)
- Section-colored per tab

### Session 4 — Contextual Help & Tooltips (~3h, 2 lanes)

**Lane 1: Activate Tooltips (Sonnet, medium)**

Wire the existing `components/ui/tooltip.tsx` into fields and features that need explanation:

**Profile tab:**
- Profile Strength ring: "Your profile completeness. Higher scores get more visibility."
- Visibility toggles: "Controls what appears on your public profile at yachtie.link/u/{handle}"
- Sea time stat: "Total time at sea, calculated from your yacht history. Overlapping dates are counted once."

**Network tab:**
- Endorsement count (0/5): "Profiles with 5+ endorsements get 3x more responses from captains."
- "Request" button: "Ask this colleague to write about working with you."
- Ghost profile tag: "This person isn't on YachtieLink yet. Invite them to join."

**CV tab:**
- "Sharing" section: "Controls who can download your CV from your public profile."
- Staleness warning: "Your profile has changed since this CV was generated. Regenerate to include updates."

**Insights tab:**
- Each metric card: brief tooltip explaining what it measures
- "Who Viewed You": "People who visited your public profile in the last 30 days."

**Settings:**
- Each visibility toggle: tooltip explaining what it controls on the public profile

**Lane 2: Smart Coaching Nudges (Sonnet, high)**

Extend the endorsement banner pattern to other features:

**Profile completeness coaching:**
- Component: `components/coaching/ProfileCoachingNudge.tsx`
- Triggers based on Profile Strength thresholds
- Messages rotate: "Add a photo — profiles with photos get 5x more views" → "Write a bio — tell captains who you are" → "Add certifications — captains filter by certs"
- Integrates with the sticky coaching bar from Session 1

**Analytics coaching (Pro users):**
- "Your profile views are up 23% this week" celebration toast
- "3 people saved your profile" milestone notification
- "Share your profile link to increase visibility" when views are low

**CV freshness nudge:**
- When profile has been updated but CV hasn't been regenerated in 7+ days
- Subtle banner on CV tab: "Your profile changed on {date}. Regenerate your CV to include updates."

**Requirements:**
- All nudges stored in localStorage (dismissed state)
- Rate-limited: max 1 nudge per session per category
- Never show more than 2 nudges visible on screen simultaneously
- Follow endorsement banner pattern: collapsible, dismissible, smart re-engagement

---

## Dependency Graph

```
Rally 009 (all sessions) ←── must complete first
    ↓
Session 1 (tooling + StickyBottomBar)
    ↓
Session 2 (cold states) ←── needs StickyBottomBar
    ↓
Session 3 (product tour) ←── needs Onborda from Session 1, cold states should be done
    ↓
Session 4 (tooltips + coaching) ←── can run parallel with Session 3
```

**Sessions 3 and 4 can run in parallel** — no file overlap.

**Total estimated effort:** ~14h across 4 sessions, 2-3 lanes each.

---

## Tooling Setup Checklist

Run before Session 1 build:

```bash
# Product tour
npm install onborda

# A11y linting (dev)
npm install -D eslint-plugin-jsx-a11y

# A11y testing (dev)
npm install -D vitest-axe
```

MCP config (add to Claude settings):
- Playwright MCP server for accessibility-tree DOM reads

---

## Exit Criteria

Rally 010 is complete when:
- [ ] Onborda product tour runs on first login (7 steps, skippable)
- [ ] Per-tab first-visit education cards show once per tab
- [ ] StickyBottomBar component exists and is wired to Profile, CV, Network
- [ ] All 5 tabs have explicit cold-state designs (no empty/broken first impressions)
- [ ] Profile: zero-stat treatment, button suppression, empty row summaries
- [ ] CV: cold-state page with upload CTA, destructive action demoted
- [ ] Network: empty state when 0 yachts, endorsement cards suppressed until relevant
- [ ] Insights: Pro empty state with share CTA, free zero-stat handling
- [ ] Tooltip component activated on 15+ fields/features across all tabs
- [ ] Smart coaching nudges for profile completeness, analytics milestones, CV freshness
- [ ] eslint-plugin-jsx-a11y passing with zero errors
- [ ] Playwright MCP configured for agent use
- [ ] All sticky bars coordinate (z-30, above z-40 tab bar, safe-area handling)
- [ ] No primary CTA on any tab sits in the red zone (top 270px) on 375px screen
- [ ] Every empty state follows the formula: illustration + benefit headline + one CTA

---

## Reference Files

| File | What it contains |
|------|-----------------|
| `docs/design-system/patterns/ux-thumb-zone-audit.md` | Full per-tab thumb zone analysis with wireframes |
| `docs/design-system/patterns/frontend-design-guide.md` | Per-tab redesign specs (Rally 009 scope) |
| `docs/design-system/patterns/page-layout.md` | Mobile-first layout patterns, section colors |
| `docs/design-system/philosophy.md` | Design principles |
| `sprints/rallies/rally-009-premvp-polish/grill-me-decisions-2026-04-02.md` | All 42 design decisions |
| `sprints/rallies/rally-009-premvp-polish/ux-audit-2026-04-02.md` | UX/IA audit findings |
