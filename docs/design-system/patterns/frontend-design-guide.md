# Frontend Design Guide — Rally 009

**Purpose:** All-encompassing frontend plan for making YachtieLink feel beautiful to use. Per-tab redesign specs, best practices for all pages, and a visual quality standard that build agents must follow.

**Rule:** This guide builds on 150+ existing design decisions. Nothing here overrides `docs/design-system/decisions/README.md`, `philosophy.md`, `style-guide.md`, or the grill-me decisions from 2026-04-02. When in doubt, those files win.

---

## The Quality Bar

Every page in the app should pass this test: **"Would this feel at home next to Charlotte Beaumont's public profile?"**

Charlotte's profile (`/u/test-seed-charlotte`) is the benchmark because it gets everything right:
- Full-bleed hero photo with name overlay
- Summary sentence with bold stat numbers
- Clean section cards with icon + uppercase headers
- Endorsement quotes as proper cards with author context
- Cert chips with overflow + progressive disclosure
- Photo gallery woven between content sections
- Generous whitespace throughout

If a page feels flat, sparse, or "settings-like" compared to Charlotte's profile, it needs work.

---

## Universal Principles (All Pages)

### 1. One Hero Element Per Screen

Every screen has exactly one focal point. On Profile it's the hero card. On Insights it's the top metric. On Network it's the endorsement summary. On CV it's the generated document. The user's eye should land somewhere immediately.

### 2. Section Color Is Non-Negotiable

Each tab owns its color with the same commitment as CV's amber. This is the wayfinding system — users know where they are by the color temperature of the page.

| Tab | Color | Token prefix | Applied to |
|-----|-------|-------------|-----------|
| Profile | Teal | `--color-teal-*` | Page bg (teal-50), icon accents (teal-700), edit affordances, strength ring |
| CV | Amber | `--color-amber-*` | Page bg (amber-50), upload zones, step indicators, file badges |
| Insights | Coral | `--color-coral-*` | Page bg (coral-50), chart accents, metric cards, trend indicators |
| Network | Navy | `--color-navy-*` | Page bg (navy-50), yacht cards, endorsement badges, colleague accents |
| Settings | Sand | `--color-sand-*` | Page bg (sand-50), group headers, Pro badges, row accents |

**Where to apply:** Page background, section header icons, loading spinners, status badges, chart colors, empty state illustrations.

**Where NOT to apply:** Primary buttons (always teal-700), body text (always text tokens), errors (always red), card surfaces (always surface tokens).

**Note:** `lib/section-colors.ts` maps features (not just tabs) to colors. Endorsements map to coral at the feature level even within the navy Network tab. Use `getSectionTokens()` for the correct mapping.

**Sand token caveat:** `lib/section-colors.ts` maps sand `bg50` to `--color-sand-100` (not `--color-sand-50`). Use `getSectionTokens('more').bg50` for the correct token.

### 3. Cards Have Hierarchy

Not every card should look the same. Three tiers:

| Tier | Use | Treatment |
|------|-----|-----------|
| **Hero card** | One per page — the main identity element | Larger padding (p-5), optional background tint, prominent typography |
| **Content card** | Sections, metrics, grouped info | Standard `rounded-2xl p-4 bg-surface`, subtle border |
| **Compact row** | List items within sections, settings rows | Minimal padding (py-3 px-4), divider lines, no shadow |

### 4. Progressive Disclosure Everywhere

- Collapsed state shows a meaningful summary, not just a label
- "3 yachts, 4 years at sea" is better than "Experience"
- "See all 12 positions" link when there are more than 3
- Expand inline — never navigate to a new page for detail that fits on the current one

### 5. Empty States Sell the Outcome

Every empty state follows this formula:
1. **Illustration or icon** (section-colored, warm, not generic)
2. **Benefit headline** — what the user gains ("Captains search by certifications first")
3. **One clear CTA button** — action-oriented ("Add your first certification")

Never: "No certifications yet." Always: "Add certifications to get found by captains."

### 6. Animation Is Purposeful

Use the established `lib/motion.ts` presets:
- **Entrance:** `fadeUp` for page sections, `staggerContainer` for lists (60ms stagger)
- **Interactive:** `cardHover` for tappable cards, `buttonTap` for buttons
- **Transition:** `springSnappy` for toggles, `easeGentle` for accordions
- **Celebration:** `popIn` for badges, milestone achievements

Usage types:
- **Variants** (use with `variants` prop): fadeUp, staggerContainer, popIn
- **Transitions** (use with `transition` prop): springSnappy, easeGentle
- **Prop spreads** (spread directly): cardHover ({...cardHover}), buttonTap ({...buttonTap})

Rules: spring/ease-out always (never linear). 200-300ms duration. Never block interaction. Respect `prefers-reduced-motion`.

### 7. Skeleton Loading, Never Spinners

Every page loads with content-shaped skeleton placeholders that match the actual layout. Section-colored pulse animation. The page should feel like it's materializing, not loading.

### 8. Consistent Vertical Rhythm

| Between | Gap |
|---------|-----|
| Page title → first section | `gap-4` (16px) |
| Section header → content | `gap-2` (8px) |
| Cards in a group | `gap-3` (12px) |
| Groups/sections | `gap-6` (24px) |
| Content → tab bar | `pb-24` (96px) |

### 9. Copy Standards

- Sell the feature, don't describe it
- Positive framing — missing data is an opportunity
- Never mention AI
- 75% professional, 25% personality
- Maritime feel through color naming and Salty mascot only, never decoration

---

## Per-Tab Redesign Specs

### Profile Tab (Teal)

**Current problems:** Identity editing missing, Profile Strength buried below fold, 2-column grid is a wall of identical cards, visibility toggles misunderstood, two entry points for photos.

**Target state:**

```
┌─────────────────────────────────┐
│ My Profile                 teal │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [Photo / Add photo CTA]    │ │  Hero card
│ │                             │ │
│ │ Dev QA Account    [70%]    │ │  ← Name tappable to edit
│ │ First Officer · 🇰🇷         │ │  ← Role tappable to edit
│ │ 11y 4mo · 11 yachts       │ │
│ │ yachtie.link/u/dev-qa  📋 │ │
│ │                             │ │
│ │                             │ │
│ │ "Add a photo to make it    │ │  ← Coaching prompt (inside hero)
│ │  yours" → [Add photos]     │ │
│ │                             │ │
│ │ [Preview]  [Share Profile]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ABOUT ME                        │  ← Grouped sections (4 groups)
│ ├ Bio          "Experienced..." │  ← Compact list, expand on tap
│ ├ Skills       "47 skills"      │
│ ├ Hobbies      "Surfing +9"     │
│ └ Languages    "Korean, English"│
│                                 │
│ PERSONAL DETAILS                │
│ ├ Personal Info  "Age 30, 🇰🇷"  │
│ ├ Contact & Visibility "Phone, Email" │
│ └ CV Details     "Tattoos, DL"  │  ← Moved from CV tab
│                                 │
│ CAREER                          │
│ ├ Yacht Experience "11y · 11 yachts" │  ← Anchor icon
│ ├ Shore-side Exp.  "2y marketing"    │  ← Briefcase icon
│ ├ Certifications "10 certs"     │
│ └ Sea Time     "Breakdown →"    │  ← Detailed view
│                                 │
│ MEDIA                           │
│ ├ Profile Photo  [thumbnail]    │
│ └ Work Gallery   "0 photos"     │
└─────────────────────────────────┘
```

**Key changes:**
1. **Hero card gets tap-to-edit** on name and role fields. Pencil icon affordance.
2. **Profile Strength ring inside hero card** — compact ring next to name/handle. Coaching prompt lives inside the hero too.
3. **Replace 2-column grid with single-column grouped list.** Four groups with icon + uppercase headers. Each section is a compact row showing summary + chevron. Tap to expand inline or navigate to edit.
4. **Visibility controls move inline.** Each expanded section shows an eye icon toggle with clear label "Visible on public profile." Not a separate toggle grid.
5. **Remove duplicate Photos entry.** Photo strip at top is the only entry point. No grid card.
6. **Teal wayfinding throughout.** Page background teal-50, group header icons teal-700, edit affordances teal.

**Section summary patterns:**
- Bio: First line of text, truncated
- Skills: Count ("47 skills") + first 3 as mini chips
- Experience: Sea time + yacht count
- Certifications: Count + expiry alert if any expiring
- Each row: icon (section-colored) + label + summary text + chevron

---

### CV Tab (Amber)

**Current problems:** Conflates data input with document management. "Visitor Downloads" is jargon. "Update from new CV" is dangerously ambiguous. CV Details are personal attributes, not document settings.

**Target state — output-only document hub:**

```
┌─────────────────────────────────┐
│ My CV                    amber  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ YachtieLink CV             │ │  Hero card — the document
│ │ Standard template          │ │
│ │ Last generated: 31 Mar     │ │
│ │ ⚠ Profile changed since   │ │
│ │                             │ │
│ │ [Regenerate] [Preview] [↓] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Your uploaded CV           │ │  Secondary card
│ │ Uploaded 1 Apr 2026        │ │
│ │ [Preview] [Download] [↺]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ SHARING                         │  ← Renamed from "Visitor Downloads"
│ Who can download from your      │
│ public profile?                 │
│ ○ No download                  │
│ ● YachtieLink CV               │
│ ○ Your uploaded CV             │
│                                 │
│ TEMPLATE  Standard ▸ Change     │  ← Collapsed to one line
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💡 Your CV is built from   │ │  Education card
│ │ your profile. Edit your     │ │
│ │ experience and certs on the │ │
│ │ Profile tab.  [Go to Profile]│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Update from new CV          │ │  With warning treatment
│ │ Re-parse a new CV file.     │ │
│ │ ⚠ May overwrite profile    │ │
│ │ edits you've made.          │ │
│ │ [Upload new CV]             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Key changes:**
1. **CV Details removed** — moved to Profile under Personal Details (decided in grill-me).
2. **"Visitor Downloads" renamed to "Sharing"** with plain language: "Who can download from your public profile?"
3. **Template picker collapsed** to a single line: "Standard · Change" — not a full radio group.
4. **Education card added** — links back to Profile for editing source data.
5. **"Update from new CV" gets warning treatment** — amber border, caution icon, clear copy about overwrite risk. Confirmation dialog on tap.
6. **Share link / copy URL button** added to the generated CV card.

**Data integrity on re-parse:**
- 7 fields need `trackOverwrite`: location_country, location_city, DOB, smoking_preference, appearance_notes, travel docs, languages
- Education entries must dedup on re-parse (check institution + qualification before inserting)
- Languages: merge instead of replace (dedup by name, append new)
- Travel docs: merge instead of replace (union of existing + parsed)

---

### Insights Tab (Coral)

**Current problems:** Identity crisis (analytics + cert docs + subscription). Free users see a dead tab. No trend indicators. Dashboard feels clinical not beautiful.

**Target state — Pro user:**

```
┌─────────────────────────────────┐
│ Career Insights           coral │
├─────────────────────────────────┤
│ [7d]  [30d]  [All time]        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Profile Views       ▲ 23%  │ │  Hero metric — big, bold
│ │ ████████▓▓▓  449 this month│ │  Sparkline with coral fill
│ └─────────────────────────────┘ │
│                                 │
│ ┌────────────┐ ┌──────────────┐ │
│ │ Downloads  │ │ Shares       │ │  Side-by-side stat cards
│ │ 12  ▲ 8%  │ │ 5   ▼ 2%    │ │
│ └────────────┘ └──────────────┘ │
│ ┌────────────┐ ┌──────────────┐ │
│ │ Saves      │ │ Sources      │ │  New metrics
│ │ 7  ▲ 40%  │ │ 60% direct   │ │
│ └────────────┘ └──────────────┘ │
│                                 │
│ WHO VIEWED YOU            Pro   │
│ ┌─────────────────────────────┐ │
│ │ 👤 James W. · Captain      │ │  Real viewer cards
│ │    Viewed 2 days ago       │ │
│ │ 👤 Charlotte B. · Ch Stew  │ │
│ │    Viewed 5 days ago       │ │
│ │ See all 12 viewers →       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Target state — Free user:**

```
┌─────────────────────────────────┐
│ Career Insights           coral │
├─────────────────────────────────┤
│ YOUR PROFESSIONAL FOOTPRINT     │
│ ┌────────┐ ┌────────┐ ┌──────┐ │
│ │ 11y 4m │ │   11   │ │  10  │ │  Career snapshot (always non-zero)
│ │Sea Time│ │ Yachts │ │Certs │ │
│ └────────┘ └────────┘ └──────┘ │
│                                 │
│ PROFILE STRENGTH                │
│ ┌─────────────────────────────┐ │
│ │ 70% — Standing out         │ │  Coaching widget
│ │ Next: Add a profile photo  │ │
│ │ [Add photos]               │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│ │ Profile Views      ░░░░░  │ │  Blurred real analytics
│ │ ░░░░░░░░░░░  ░░░ this mo  │ │
│ │                             │ │
│ │ Downloads ░░  Shares ░░   │ │
│ │                             │ │
│ │ WHO VIEWED YOU        🔒   │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░   │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ See who's viewing your     │ │  Upgrade CTA
│ │ profile and what's working │ │
│ │ [Upgrade to Crew Pro]      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Key changes:**
1. **Cert Manager and Subscription removed** — moved to Settings (decided).
2. **Free users get career snapshot** (sea time, yachts, certs — always non-zero) + Profile Strength coaching + blurred real analytics below. The tab is useful from day one.
3. **Trend indicators on every metric** — "▲ 23% vs last period." Numbers without context are meaningless.
4. **"Who Viewed You" in Layer 1** as Pro feature (decided). Free users see blurred teaser.
5. **Profile Saves and View Source Breakdown** added (decided).
6. **Sparkline charts with coral fill.** Metric cards with personality — not just numbers in boxes.
7. **Coral wayfinding committed** — page background, chart colors, trend indicators, section headers.

---

### Network Tab (Navy)

**Current problems:** 3-tab structure confuses. "Endorse" means the opposite. Flat lists with no visual quality. No section color. Saved Profiles buried on wrong tab.

**Target state:**

```
┌─────────────────────────────────┐
│ My Network                navy  │
│                           [🔖] │  ← Saved Profiles bookmark icon
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ENDORSEMENTS          0/5  │ │  Endorsement CTA card
│ │ You have no endorsements   │ │  Dynamic copy
│ │ yet                        │ │
│ │ ▸ Expand for details       │ │
│ │ [Request endorsement]      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚓ 3 received · 1 given    │ │  Endorsement summary (stat card)
│ │   2 pending                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ▼ M/Y Go (Nov 2025–Present)    │  ← Expanded (most recent)
│ ┌─────────────────────────────┐ │
│ │ 🚢 M/Y Go                  │ │  Rich yacht mini card
│ │ Motor Yacht · 45m          │ │  With photo if exists
│ │ Deckhand                   │ │
│ └─────────────────────────────┘ │
│ ┌───────────────────────────┐   │
│ │ 👤 Olivia Chen            │   │  Colleague rows
│ │    Purser · ★ endorsed    │   │
│ │ 👤 Kai Nakamura           │   │
│ │    ETO · [Request]        │   │  ← Renamed from "Endorse"
│ │ 👤 Not on platform        │   │
│ │    "Invite to join" →     │   │  Ghost suggestion inline
│ └───────────────────────────┘   │
│                                 │
│ ▶ Big Sky (May–Nov 2025)  4 crew│  ← Collapsed
│ ▶ TS Jade Wave (Apr 2025–) 3   │
│ ▶ Param Jamuna IV         2    │
│ ...                             │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Find a yacht            │ │  Yacht search at bottom
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Key changes:**
1. **Replace 3-tab segment** with unified accordion view (decided). Only most recent yacht expanded.
2. **Endorsement summary as stat card** at top — number-forward (decided).
3. **Endorsement CTA card** — keeps 0/5 fraction format with dynamic collapsed copy (decided).
4. **Rich yacht accordion headers** — mini yacht card with name, type, size, photo (decided).
5. **"Endorse" renamed to "Request"** — critical fix (decided).
6. **Ghost suggestions inline** within yacht groups, tagged "not on platform" (decided).
7. **"Invite former crew" CTA** per yacht section for growth (decided).
8. **Saved Profiles** accessible via bookmark icon in header → sub-page (decided).
9. **Full navy wayfinding** — page background navy-50, card accents, yacht headers, badges.
10. **Colleague rows with avatar circles** + name + role + endorsement status indicator.
11. **Beautiful endorsement quote cards** inline for received endorsements (decided).

**Endorsement reminders:** 1 reminder after 7 days, no further nudges. Crew talk — being pushy hurts reputation.

---

### Settings Tab (Sand)

**Current problems:** Identity crisis (labeled "More", titled "Settings"). Profile editing doesn't belong here. Saved Profiles doesn't belong here. Too many groups for too few items.

**Target state:**

```
┌─────────────────────────────────┐
│ Settings                  sand  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 👤 Dev QA Account          │ │  Mini profile card (context)
│ │ First Officer · ✦ Pro      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🔒 ACCOUNT                      │
│  Login & security           ▸   │
│  Cert Documents             ▸   │  ← From Insights
│  Data export (GDPR)         ▸   │  ← Renamed for clarity
│                                 │
│ 💳 PLAN                         │
│  Crew Pro · Monthly         ▸   │
│  Renews 1 Jan 2030             │
│  ┌ Pro features: 3 photos,  ┐  │  ← Shows value, not just cost
│  │ 15 gallery, analytics,   │  │
│  │ premium templates         │  │
│  └───────────────────────────┘  │
│                                 │
│ ⚙️ APP                          │
│  Appearance (dark mode)     ▸   │
│  Notifications (coming soon)    │
│                                 │
│ 💬 COMMUNITY                    │
│  Feature Roadmap & Ideas    ▸   │  ← BuddyBoss 3-tab pattern
│  Report a problem           ▸   │
│                                 │
│ 📄 LEGAL                        │
│  Terms of Service           ▸   │
│  Privacy Policy             ▸   │
│                                 │
│ Sign out                        │  ← Quiet text link
│                                 │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Delete my account           ▸   │  ← Isolated danger zone
│                                 │
│ YachtieLink · Phase 1A          │
└─────────────────────────────────┘
```

**Key changes:**
1. **Renamed from "More" to "Settings"** — honest about what the page is.
2. **"Edit profile & contact info" removed entirely** — Profile tab handles all editing (decided).
3. **Saved Profiles removed** — moved to Network (decided).
4. **Mini profile card at top** for user context (who am I, what plan am I on).
5. **Collapsed from 7 groups to 5** — Account, Plan, App, Community, Legal.
6. **Billing shows Pro value** — not just what you're paying, but what you're getting.
7. **Icons on every group header** — visual wayfinding within the page.
8. **"Download my data" renamed** to "Data export (GDPR)" — no ambiguity.
9. **Sign out demoted** to quiet text link — not a giant red button.
10. **Delete account isolated** at very bottom with visual separation.
11. **Sand wayfinding throughout** — page background sand-50, group header accents.
12. **Community section** — Feature Roadmap (3-tab BuddyBoss pattern) + Report a problem.
13. **"Send feedback" replaced** by in-app Feature Requests within the roadmap.
14. **Feature request votes are equal** regardless of plan tier — no Pro weighting.

---

## Experience Timeline Pattern

Shore-side jobs appear in the same integrated reverse-chronological timeline as yacht jobs. This gives a complete career picture and helps captains understand gaps.

- **Integrated timeline:** Shore-side and yacht positions interleaved by date, not separated into tabs or groups.
- **Icons:** Anchor icon for yacht positions, briefcase icon for shore-side positions. The icon is the only visual differentiator — both use the same card/row treatment.
- **Industry field:** Show the industry label if present (e.g. "Marketing," "Hospitality"). Do not require it — optional on input.
- **Overlap warnings:** If two positions overlap by less than 4 weeks, show an info-level note ("Positions overlap by 2 weeks"). If overlap is 4 weeks or more, show an amber warning prompting the user to check dates.
- **Sea time recalculation:** Recalculate sea time on the next profile view after a position is added/edited, not via batch job. The user sees updated sea time immediately.

---

## Photo Management Patterns

Photos are managed from a single unified page accessible from the Profile tab's MEDIA group.

- **Unified page layout:** Profile photo section on top, work gallery below. One entry point, not two.
- **AI photo enhancement:** Pro-only feature. One-tap "Enhance" button on each photo. Enhancement uses AI focal-point optimization only — no brightness, contrast, or crop adjustments.
- **Focal point only:** The enhance feature adjusts focal point for different aspect ratios. No manual brightness/contrast/crop controls.
- **Pro contextual assignment:** Pro users get 3 labeled photo slots: Avatar, Hero, and CV. Each can use a different photo. Free users get 1 photo used across all contexts.

---

## Component Best Practices

### Accordion Sections

Used in: Profile (section groups), Network (yacht accordion), CV (sharing options).

```
Collapsed: [icon] [label] [summary text ···] [count badge] [chevron ▸]
Expanded:  [icon] [label]                     [count badge] [chevron ▾]
           [full content with edit affordances]
           [visibility toggle if applicable]
```

- Chevron rotates with `easeGentle` (200ms)
- Content enters with `fadeUp` + height animation
- Collapsed summary is ALWAYS meaningful — never just a label
- Allow multiple sections open (not exclusive)
- Touch target: full header row (minimum 44px height)

### Metric Cards (Insights)

```
┌─────────────────────┐
│ Label          ▲ 8% │  ← Trend indicator (green up / red down)
│ 47                   │  ← Large number, bold
│ ████████▓▓▓          │  ← Sparkline (7 or 30 data points)
└─────────────────────┘
```

- Section-colored sparkline (coral for Insights)
- Trend arrow + percentage vs previous period
- Large number: `text-2xl font-bold`
- Label: `text-sm text-secondary`
- Side-by-side layout for secondary metrics (2-up grid)

### Colleague/Person Rows

Used in: Network accordion, endorsement request, saved profiles.

```
┌─────────────────────────────────────┐
│ [Avatar] Name                [CTA] │
│          Role · Yacht context       │
│          Status indicator           │
└─────────────────────────────────────┘
```

- Avatar: 40px circle, initials fallback with section-colored background
- Name: `text-sm font-semibold`
- Role + context: `text-xs text-secondary`
- Status: "★ endorsed" / "⏳ pending" / "not on platform"
- CTA: "Request" button (outline style, not "Endorse")

### Yacht Mini Cards (Network accordion headers)

```
┌─────────────────────────────────────┐
│ [Photo]  M/Y Go                     │
│          Motor Yacht · 45m          │
│          Deckhand · Nov 2025–Present│
│          4 colleagues               │
└─────────────────────────────────────┘
```

- Yacht photo if exists (rounded-xl, 64x64), fallback: anchor icon on navy-100 bg
- Name: `text-base font-semibold`
- Type + size: `text-sm text-secondary`
- Your role + dates: `text-sm`
- Colleague count badge

### Empty State Cards

```
┌─────────────────────────────────────┐
│              [illustration]         │
│                                     │
│    Benefit-first headline           │
│    Supporting copy (1-2 lines)      │
│                                     │
│         [Primary CTA button]        │
└─────────────────────────────────────┘
```

- Section-colored illustration/icon
- Headline sells outcome, not absence
- One CTA only
- No "you have nothing" language

---

## Interaction Patterns

### Tap-to-Edit (Profile hero card)

Name and role on the hero card become editable on tap:
1. User taps name → inline text input appears with current value
2. Small "Done" button or tap outside to save
3. Optimistic update — value changes immediately
4. Subtle save confirmation animation (checkmark fade)

### Visibility Toggles (Profile sections)

Within expanded sections, not on a separate grid:
- Small eye icon + label: "Visible on public profile"
- Toggle is inline with the section content
- When off: section has subtle dimming treatment
- Label changes: "Hidden from public profile" when off

### Back Navigation

Platform-wide rule: back button always shows WHERE you're going.
- Text link format: "← Network" / "← Profile" / "← Settings"
- Position: top-left, `text-[var(--color-interactive)]`
- Never a generic "← Back"
- Never navigates to a default page

### Pull-to-Refresh

Custom animation using section color:
- Loading indicator uses section color (coral spinner on Insights, navy on Network)
- Content skeleton placeholders match actual layout
- Refresh is fast — under 500ms perceived

---

## Dark Mode Standards

All designs must work in dark mode from day one:

- Section colors use 200-level shades (softer appearance)
- Card surfaces use Slate palette
- Primary teal works on both modes
- Text colors invert properly via CSS variable tokens
- Charts and sparklines adjust to darker backgrounds
- Blurred analytics overlay works on dark surfaces

---

## What "Beautiful" Means for Each Tab

| Tab | Beautiful means... |
|-----|--------------------|
| **Profile** | Feels like YOUR space. Warm, personal, encouraging. Not a form. Not a dashboard. A representation of who you are. |
| **CV** | Clean, professional, document-focused. Like a well-designed portfolio site. The document is the star. |
| **Insights** | Motivating, not clinical. Metrics feel like achievements. Charts have personality. Even free users feel valued. |
| **Network** | Relationship-rich. You see your people, organized by the yachts you shared. Endorsements feel like testimonials, not data points. |
| **Settings** | Calm, organized, trustworthy. You find what you need in seconds. No surprises. The page respects your time. |

---

## Build Agent Instructions

When implementing any page change:

1. **Read this guide + `patterns/page-layout.md` + `philosophy.md`** before writing code
2. **Check `decisions/README.md`** before proposing any visual change — it may have been tried and rejected
3. **Use section colors from `lib/section-colors.ts`** — never hardcode hex values
4. **Use motion presets from `lib/motion.ts`** — never write custom animation values
5. **Test at 375px mobile width first** — desktop is a bonus
6. **Compare your output to Charlotte's public profile** — is it at the same quality bar?
7. **Every card, section, and empty state must follow the patterns above**
8. **No left border accent stripes on cards** — ever (founder hard reject)
9. **Chips subordinate to headings** — `text-xs` chips, `text-base font-semibold` headings
10. **Back navigation shows destination** — "← Network" not "← Back"
