# UX Audit: Cold States + Thumb Zone Mapping

**Date:** 2026-04-02
**Scope:** Every tab in the frontend design guide (Profile, CV, Insights, Network, Settings)
**Device reference:** iPhone 13/14 — 375px x 812px viewport
**Tab bar:** Fixed bottom, 64px (h-16). All content needs `pb-24` (96px) clearance.

---

## Thumb Zone Reference

On a 375x812 screen held one-handed:

| Zone | Y range | Reachability | What belongs here |
|------|---------|-------------|-------------------|
| **Red** (top) | 0-270px | Hard to reach | Back buttons, page title, hamburger, status bar, nav — things users expect at the top |
| **Yellow** (middle) | 270-540px | Stretch required | Secondary actions, content cards, informational sections |
| **Green** (bottom) | 540-748px | Easy thumb reach | Primary CTAs, confirm buttons, key actions |
| **Dead zone** | 748-812px | Occupied by tab bar | Tab bar only — nothing else can live here |

A sticky CTA bar must sit ABOVE the tab bar: `bottom-20` (80px up) or `bottom-[calc(4rem+env(safe-area-inset-bottom))]`. Content behind it needs extra padding.

---

## 1. Profile Tab (Teal)

### 1.1 Cold State Analysis

A brand-new user (post-onboarding, CV parsed or skipped) sees:

**Above the fold on 375px (first ~600px of content):**
- Page title "My Profile" (~44px)
- Hero card (~280px tall): placeholder avatar circle, name from signup, empty role field, Profile Strength ring at ~30%, "0y 0mo - 0 yachts", public link, coaching prompt "Add a photo to make it yours" + [Add photos] button, [Preview] and [Share Profile] buttons
- "ABOUT ME" group header + first 1-2 rows (Bio, Skills)

**Verdict: Mixed.** The hero card is encouraging because the Profile Strength ring gives a clear goal and the coaching prompt is action-oriented. But "0y 0mo - 0 yachts" is depressing — it's a raw zero. The [Preview] and [Share Profile] buttons make no sense when the profile is empty. Nobody wants to preview or share nothing.

**Problems:**
1. **"0y 0mo - 0 yachts"** — violates "positive framing" principle. A cold user who skipped CV upload sees zeros. Fix: hide the stat line entirely when all values are zero, or replace with "Add your experience to see your career summary here."
2. **[Preview] and [Share Profile] in hero** — useless on a cold profile. These should be suppressed or greyed with a tooltip ("Complete your profile to unlock sharing") until Profile Strength > 40%.
3. **[Add photos] is the first CTA** — good, photos are high-impact. But it's inside the hero card, which starts around y=44 and ends around y=324. The button sits at roughly **y=280-310** — solidly in the **red zone**. A new user's first meaningful action is in the hardest-to-reach area.
4. **Four empty section groups below** — ABOUT ME, PERSONAL DETAILS, CAREER, MEDIA all show rows with empty summaries. On a cold profile, this is a wall of "nothing" with chevrons. Each row needs an empty summary that sells the outcome, not just shows "—".

**First action clarity:** The coaching prompt inside the hero card ("Add a photo...") is the obvious first action. Good intent, bad placement (red zone).

### 1.2 Thumb Zone Mapping — Populated Profile

| Element | Approx Y position | Zone | Issue |
|---------|-------------------|------|-------|
| Page title "My Profile" | 0-44 | Red | Fine — title belongs here |
| Hero card (photo, name, strength ring) | 44-200 | Red | Fine — identity info belongs at top |
| Coaching prompt + [Add photos] | 200-260 | Red | PROBLEM — primary cold-state CTA in red zone |
| [Preview] [Share Profile] | 260-310 | Red/Yellow border | PROBLEM — primary actions unreachable |
| ABOUT ME group header | 330 | Yellow | Fine — content starts here |
| Bio / Skills / Hobbies / Languages rows | 330-500 | Yellow | Fine — browse content |
| PERSONAL DETAILS group | 520 | Yellow/Green border | Fine |
| CAREER group | 620+ | Green | Ironically, the most data-rich section is in the best thumb zone |
| MEDIA group | 750+ | Below fold / needs scroll | Fine — less critical |

### 1.3 Specific Button Fixes

#### Fix P1: Coaching CTA needs a sticky bottom treatment (CRITICAL)

**Current:** The Profile Strength coaching prompt lives inside the hero card with its CTA button at ~y=260 (red zone).

**Proposed:** When Profile Strength < 80%, show a **sticky coaching bar** above the tab bar:

```
┌─────────────────────────────────────┐
│ ◉ 30% — Add a photo ──── [Do it]  │  Sticky bar, bottom-20
└─────────────────────────────────────┘
```

- Position: `fixed bottom-20 left-0 right-0 z-30` (below any modals, above content, above tab bar)
- Height: 52px. Background: `bg-surface` with top border `border-t border-teal-100`
- Left side: compact strength ring (24px) + percentage + next action text
- Right side: teal primary button, compact
- Tapping the text area expands to show full coaching detail (slide-up sheet)
- Dismissible: X button or auto-hides when action is completed
- Disappears entirely at Profile Strength >= 80%

This puts the most important coaching CTA in the **green zone** at all times during scrolling.

**Priority: CRITICAL** — this is the primary driver of profile completion, and it's currently unreachable.

#### Fix P2: Suppress [Preview] and [Share Profile] on cold profiles (IMPORTANT)

**Current:** Both buttons show in the hero card regardless of profile state.

**Proposed:**
- Profile Strength < 40%: Hide both buttons entirely. Replace with subtle text: "Complete your profile to preview and share it."
- Profile Strength 40-70%: Show [Preview] only (outline style). Hide [Share Profile].
- Profile Strength > 70%: Show both.

This reduces noise on cold profiles and makes the coaching prompt the sole focus.

**Priority: IMPORTANT**

#### Fix P3: Zero-stat line treatment (IMPORTANT)

**Current:** "0y 0mo - 0 yachts" shows on a cold profile.

**Proposed:** When sea time = 0 AND yacht count = 0, replace the stat line with the next coaching action: "Add your experience to build your career summary." Style as `text-sm text-secondary italic`.

**Priority: IMPORTANT**

#### Fix P4: Empty section row summaries (NICE-TO-HAVE)

**Current:** Section rows with no data show empty or "—" summaries.

**Proposed:** Each empty row shows outcome-oriented microcopy:
- Bio: "Tell captains about yourself"
- Skills: "Add skills captains search for"
- Yacht Experience: "Add your yacht history"
- Certifications: "Captains search by certs first"

**Priority: NICE-TO-HAVE** — the sticky coaching bar (P1) handles priority sequencing already.

### 1.4 Scroll Behavior

**Should the hero collapse?** Yes. When the user scrolls past the hero card, it should collapse into a compact bar:

```
┌─────────────────────────────────────┐
│ [mini avatar] Dev QA Account  [70%] │  Compact bar, sticky top
└─────────────────────────────────────┘
```

- Triggers at scroll offset where hero card leaves viewport (~310px scroll)
- Height: 48px. Background: `bg-surface/95 backdrop-blur-sm`. `sticky top-0 z-20`.
- Shows: 28px avatar, name, strength ring percentage
- Tapping it scrolls back to top
- This keeps identity context while freeing vertical space for section browsing

**Scroll depth to primary action (populated):** On a fully populated profile, the editable sections start at ~330px (yellow zone). Reasonable — the hero provides value, and sections are reachable.

---

## 2. CV Tab (Amber)

### 2.1 Cold State Analysis

A brand-new user who has NOT uploaded a CV sees:

**What should show above the fold:**
- Page title "My CV" (~44px)
- Empty state for the YachtieLink CV card: "Your professional CV, generated from your profile" + illustration
- CTA: "Build your profile to generate a CV" or "Upload a CV to get started"

**A user who HAS uploaded a CV but not generated one yet:**
- The "Your uploaded CV" card is populated
- The "YachtieLink CV" card shows: "Generate your first YachtieLink CV from your profile data" + [Generate CV]
- SHARING section below

**Verdict: Mostly good IF the empty state exists.** The design guide wireframe only shows a populated state. There is no explicit cold-state wireframe for CV.

**Problems:**
1. **No cold-state wireframe defined.** The guide jumps straight to showing two populated document cards. A user who skipped CV upload and has an empty profile sees... what? This needs to be specified.
2. **[Regenerate] [Preview] [Download] buttons** — all three sit inside the hero card at approximately y=170-220. That's the **red zone**. On a populated CV tab, the most important actions (preview/download your document) are in the hardest place to reach.
3. **"Update from new CV" card** with its [Upload new CV] button sits at approximately y=550+ depending on content above. That's in the **green zone** — but this is a destructive/dangerous action, not the primary one. The danger action is easier to reach than the primary action. Inverted priority.

### 2.2 Cold State — What It Should Be

```
┌─────────────────────────────────────┐
│ My CV                         amber │
├─────────────────────────────────────┤
│                                     │
│        [CV illustration]            │
│                                     │
│   Your professional CV,             │
│   built from your profile           │
│                                     │
│   Upload an existing CV to          │
│   populate your profile, or build   │
│   your profile first and we'll      │
│   generate one for you.             │
│                                     │
│       [Upload a CV]                 │  ← Primary CTA
│       [Go to Profile]               │  ← Secondary link
│                                     │
└─────────────────────────────────────┘
```

The [Upload a CV] button here would land at roughly y=400 — **yellow zone**. Acceptable for a one-time action page, but ideally this page should use vertical centering (per `page-layout.md` for action pages) to push the CTA into the green zone.

Using `min-h-[calc(100dvh-10rem)] justify-center`, the CTA would center at roughly y=400-450 — upper green zone. Better.

### 2.3 Thumb Zone Mapping — Populated CV

| Element | Approx Y position | Zone | Issue |
|---------|-------------------|------|-------|
| Page title "My CV" | 0-44 | Red | Fine |
| YachtieLink CV hero card | 44-220 | Red | Fine as info display |
| [Regenerate] [Preview] [Download] | 180-220 | Red | PROBLEM — primary document actions unreachable |
| Your uploaded CV card | 240-360 | Yellow | Fine |
| [Preview] [Download] [Replace] | 320-360 | Yellow | Acceptable — secondary document |
| SHARING section | 380-500 | Yellow/Green | Fine |
| TEMPLATE row | 520 | Green | Fine |
| Education card | 540-600 | Green | Fine |
| "Update from new CV" card | 620-720 | Green | PROBLEM — destructive action in easy-reach zone |

### 2.4 Specific Button Fixes

#### Fix CV1: Sticky document action bar (CRITICAL)

**Current:** [Regenerate], [Preview], and [Download] are inside the hero card at y=180-220 (red zone).

**Proposed:** When the YachtieLink CV exists (has been generated at least once), show a **sticky bottom action bar** above the tab bar:

```
┌─────────────────────────────────────┐
│ [Preview]  [Download]  [Regenerate] │  Sticky bar, bottom-20
└─────────────────────────────────────┘
```

- Position: `fixed bottom-20 left-0 right-0 z-30`
- Height: 56px. Background: `bg-surface` with subtle top shadow
- Three buttons: [Preview] (outline), [Download] (primary/filled), [Regenerate] (outline with refresh icon)
- [Download] is the most prominent — filled teal, center or right position
- This bar only shows when a generated CV exists
- When no CV exists, the empty-state CTA is centered on the page (no sticky bar needed)

**Priority: CRITICAL** — the entire point of the CV tab is to get your document, and the buttons to do so are unreachable.

#### Fix CV2: Demote destructive re-parse action (IMPORTANT)

**Current:** "Update from new CV" card with [Upload new CV] button sits at y=620-720 — green zone, easy thumb reach.

**Proposed:**
- Move "Update from new CV" to the very bottom of the page, below the education card
- Collapse it to a single text link: "Re-import from a different CV" (not a full card with a button)
- Tapping opens a confirmation bottom sheet (per grill-me UX5 decision)
- Visually demote: `text-sm text-secondary` — not a card, not a button, just a link

This moves the destructive action further from the thumb and makes accidental taps less likely.

**Priority: IMPORTANT**

#### Fix CV3: Add cold-state wireframe to design guide (IMPORTANT)

**Current:** No cold state defined for CV tab.

**Proposed:** Add the cold-state wireframe (from section 2.2 above) to the design guide. Use vertical centering per `page-layout.md` action page pattern.

**Priority: IMPORTANT**

#### Fix CV4: "Profile changed since" alert needs action in thumb zone (NICE-TO-HAVE)

**Current:** The amber warning "Profile changed since last generation" sits inside the hero card (red zone). The [Regenerate] button to act on it is also in the red zone.

**Proposed:** When this warning is active, the sticky bottom bar (CV1) should highlight [Regenerate] as the primary action (filled teal instead of outline, with a subtle amber dot indicator).

**Priority: NICE-TO-HAVE** — handled automatically if CV1 is implemented.

### 2.5 Scroll Behavior

**Sticky bottom bar:** Yes, as described in CV1. This is the primary fix for the entire CV tab.

**Hero collapse:** Not needed. The CV hero card is short enough (~180px) that it doesn't dominate the viewport. Content below is reachable.

**Scroll depth:** On a populated CV tab, the user needs to scroll ~0px to see the hero card, but the actionable buttons are at y=180 (unreachable). With the sticky bar, zero scroll needed for primary actions.

---

## 3. Insights Tab (Coral)

### 3.1 Cold State Analysis — Free User

A brand-new free user sees:

**Above the fold on 375px:**
- Page title "Career Insights" (~44px)
- "YOUR PROFESSIONAL FOOTPRINT" header (~30px)
- Three stat cards: sea time / yachts / certs (~90px)
- "PROFILE STRENGTH" section header (~30px)
- Profile Strength coaching widget (~120px)
- Start of blurred analytics section (~100px visible)

**Total above fold: ~414px** — fits within the first screen. Good.

**Verdict: Good.** This is one of the better cold states in the app. The career snapshot stats (sea time, yachts, certs) give a new user something real to look at even before they have analytics. The Profile Strength coaching widget provides a clear next action. The blurred analytics below create aspiration without feeling gated.

**Problems:**
1. **Stat cards may show zeros** if user skipped CV upload. "0y 0m / 0 / 0" is depressing. Same positive-framing issue as Profile.
2. **[Add photos] CTA inside Profile Strength** — lands at roughly y=280-330. That's **yellow zone** border. Acceptable but not ideal.
3. **[Upgrade to Crew Pro] button** — sits below the blurred analytics, at roughly y=520-560. That's the **yellow/green border**. Actually decent placement by accident.

**First action clarity:** The Profile Strength coaching prompt is the clear first action. [Add photos] or whatever the next coaching step is. The upgrade CTA below the blur is a natural secondary.

### 3.2 Cold State Analysis — Pro User (No Views Yet)

A Pro user who just upgraded but hasn't had any profile views:

**Above the fold:**
- Time period selector [7d] [30d] [All time]
- Hero metric card: "Profile Views 0" with flat sparkline
- Side-by-side stat cards: Downloads 0, Shares 0, Saves 0, Sources —
- "WHO VIEWED YOU" section: empty state

**Verdict: Mildly depressing.** All zeros with flat lines. The analytics are technically there but meaningless.

**Problem:** The empty Pro Insights tab needs an encouraging empty state. "Your analytics will appear as people discover your profile. Share your profile link to get started." with a [Share Profile Link] CTA.

### 3.3 Thumb Zone Mapping — Free User

| Element | Approx Y position | Zone | Issue |
|---------|-------------------|------|-------|
| Page title "Career Insights" | 0-44 | Red | Fine |
| YOUR PROFESSIONAL FOOTPRINT header | 44-74 | Red | Fine |
| Three stat cards (sea time/yachts/certs) | 74-164 | Red | Fine — informational, no action needed |
| PROFILE STRENGTH header | 184 | Red | Fine |
| Coaching widget + [Add photos] CTA | 184-330 | Red/Yellow | PROBLEM — coaching CTA in stretch zone |
| Blurred analytics teaser | 330-500 | Yellow | Fine — teaser content |
| [Upgrade to Crew Pro] CTA | 520-570 | Yellow/Green | Acceptable — secondary commercial CTA |
| Bottom padding | 570-748 | Green | Empty space |

### 3.4 Thumb Zone Mapping — Pro User (Populated)

| Element | Approx Y position | Zone | Issue |
|---------|-------------------|------|-------|
| Page title | 0-44 | Red | Fine |
| Period selector [7d] [30d] [All time] | 44-84 | Red | Fine — infrequent interaction |
| Hero metric (Profile Views + sparkline) | 84-220 | Red | Fine — informational |
| 2x2 stat grid (Downloads/Shares/Saves/Sources) | 240-420 | Yellow | Fine — informational |
| WHO VIEWED YOU header | 440 | Yellow | Fine |
| Viewer cards (2-3 shown) | 440-600 | Yellow/Green | Fine — tappable list items |
| "See all 12 viewers" link | 600 | Green | Good — progressive disclosure link in thumb zone |

### 3.5 Specific Button Fixes

#### Fix I1: Free user coaching CTA needs better placement (IMPORTANT)

**Current:** Profile Strength coaching widget with CTA button sits at y=184-330 (red/yellow zone).

**Proposed:** Two options:

**Option A (preferred):** Reorder the free user layout. Move the coaching widget BELOW the blurred analytics:

```
Career Insights
YOUR PROFESSIONAL FOOTPRINT (stat cards)
[Blurred analytics teaser]
PROFILE STRENGTH (coaching widget + CTA)  ← Now at y=450-570, green zone
[Upgrade to Crew Pro]                      ← Now at y=590, green zone
```

This puts both actionable CTAs in the green zone. The stat cards (informational, no action) stay at the top where they provide context. The blurred analytics (no action, just teaser) fill the yellow zone. The actual buttons land in the green zone.

**Option B:** Keep current order but add a sticky coaching bar (same pattern as Profile P1). Less desirable because it duplicates the Profile tab's sticky bar — user would see coaching bars on multiple tabs.

**Priority: IMPORTANT**

#### Fix I2: Pro empty state needs a CTA (IMPORTANT)

**Current:** No empty state specified for Pro users with zero analytics.

**Proposed:** When all metrics are 0 for the selected period, show an encouraging empty state below the zero-value cards:

```
┌─────────────────────────────────────┐
│  Your analytics will light up as    │
│  people discover your profile.      │
│                                     │
│  [Share your profile link]          │
│  [Copy QR code]                     │
└─────────────────────────────────────┘
```

Place this at y=450+ (green zone). Gives Pro users something to DO, not just something to wait for.

**Priority: IMPORTANT**

#### Fix I3: Zero-value stat cards for free users (NICE-TO-HAVE)

**Current:** If user skipped CV upload, stat cards show "0y 0m / 0 / 0".

**Proposed:** When all three stats are zero, replace the stat cards with a single card: "Upload your CV or add your experience to see your career snapshot." Links to CV upload or Profile > Career section.

**Priority: NICE-TO-HAVE** — most users will have CV-parsed data by this point.

### 3.6 Scroll Behavior

**Sticky bar:** Not needed on Insights. There's no primary action that requires persistence — the tab is primarily read-only (viewing analytics). The coaching CTA is handled by reordering (I1).

**Hero collapse:** Not needed. The period selector is small and content below is within reach.

**Scroll depth to primary action:**
- Free user: coaching CTA at y=280 (current), y=500 (proposed after I1). Either way, within first scroll.
- Pro user: informational — no primary action needed. "See all viewers" at y=600 is in the green zone.

---

## 4. Network Tab (Navy)

### 4.1 Cold State Analysis

A brand-new user with no yacht history, no endorsements, no colleagues:

**Above the fold on 375px:**
- Page title "My Network" + bookmark icon (~44px)
- Endorsement CTA card: "ENDORSEMENTS 0/5 — You have no endorsements yet — [Request endorsement]" (~140px)
- Endorsement summary stat card: "0 received - 0 given - 0 pending" (~60px)
- Empty yacht accordion area — what shows here?

**This is the most problematic cold state in the app.** A user with no yachts has no accordion sections, no colleagues, no endorsements. The page is essentially:
1. An endorsement card that says "you have none" with a [Request endorsement] button that can't work (no colleagues to request from)
2. A stat card showing all zeros
3. Emptiness

**Verdict: Depressing.** The [Request endorsement] button is a dead end — you can't request endorsements when you have no yacht history (no colleagues). The stat card is triple-zero. There's no yacht accordion because there are no yachts. The page offers nothing.

**Problems:**
1. **[Request endorsement] is a dead-end CTA** on cold profiles. If you have no yacht history, you have no colleagues, and the request flow has nobody to request from. This button needs to be hidden or replaced when yacht count = 0.
2. **No yacht content = empty page.** The accordion area below the endorsement cards is blank. Needs a proper empty state.
3. **[Request endorsement] button position** — inside the endorsement CTA card at roughly y=180. **Red zone.** Even when it IS functional (user has colleagues), it's hard to reach.
4. **"Find a yacht" search** — per the wireframe, it sits at the very bottom of the page. On a cold profile, that's the only useful action (add a yacht to start building your network), but it's below a wall of empty content.

### 4.2 Cold State — What It Should Be

```
┌─────────────────────────────────────┐
│ My Network                    navy  │
├─────────────────────────────────────┤
│                                     │
│        [network illustration]       │
│                                     │
│   Your yacht network starts         │
│   with your experience              │
│                                     │
│   Add your yacht history and        │
│   we'll connect you with crew       │
│   you've worked with.               │
│                                     │
│       [Add your first yacht]        │  ← Primary CTA
│       [Upload a CV instead]         │  ← Secondary link
│                                     │
└─────────────────────────────────────┘
```

Use vertical centering (`justify-center`) to push the CTA into the green zone (~y=450). The endorsement cards and stat card should NOT show when there are zero yachts — they're meaningless noise.

**Show the endorsement CTA card only when:** yacht count >= 1 AND colleague count >= 1.

### 4.3 Thumb Zone Mapping — Populated Network

| Element | Approx Y position | Zone | Issue |
|---------|-------------------|------|-------|
| Page title "My Network" + bookmark | 0-44 | Red | Fine |
| Endorsement CTA card (0/5 + button) | 44-184 | Red | PROBLEM — [Request endorsement] in red zone |
| Endorsement summary stat card | 204-264 | Red/Yellow | Fine — informational |
| Most recent yacht (expanded) | 284-500 | Yellow | Fine — browsing content |
| Colleague rows within expanded yacht | 350-500 | Yellow | [Request] buttons on each row — yellow zone, acceptable |
| Collapsed yacht rows | 500-650 | Yellow/Green | Fine — tappable to expand |
| More collapsed yachts | 650+ | Green | Fine |
| "Find a yacht" search | Bottom of list | Varies | PROBLEM — unreachable without scrolling past all yachts |

### 4.4 Specific Button Fixes

#### Fix N1: [Request endorsement] needs to move to thumb zone (CRITICAL)

**Current:** Inside the endorsement CTA card at y=44-184 (red zone).

**Proposed:** Two changes:

**A) Keep the endorsement CTA card at the top as informational** (shows progress: "2/5 endorsements — Nice work! 5+ endorsements get 3x more profile views"), but **remove the button from inside the card.**

**B) Add a sticky bottom CTA bar** when endorsement count < 5 and colleague count >= 1:

```
┌─────────────────────────────────────┐
│ 2/5 endorsements  [Request one]    │  Sticky bar, bottom-20
└─────────────────────────────────────┘
```

- Position: `fixed bottom-20 left-0 right-0 z-30`
- Height: 52px. Background: `bg-surface` with top border
- Left: compact progress indicator + count
- Right: teal primary button [Request one]
- Hides when endorsement count >= 5 or when user has no colleagues

This puts the single most important network action in the green zone.

**Priority: CRITICAL** — endorsement collection is the core value of the Network tab.

#### Fix N2: "Find a yacht" / "Add a yacht" needs promotion on sparse pages (CRITICAL)

**Current:** Yacht search sits at the bottom of the page, below all accordion content.

**Proposed:**
- When yacht count = 0: use the full empty-state treatment (section 4.2 above). "Add your first yacht" is the page's only CTA, centered in viewport.
- When yacht count = 1-3: show "Add another yacht" as a dashed-border card (amber add-more pattern from page-layout.md) directly below the last accordion section. It should land in the yellow/green zone naturally.
- When yacht count > 3: keep search at the bottom (current behavior). Users with many yachts will scroll anyway.

**Priority: CRITICAL** — yacht history is the foundation of the entire Network tab.

#### Fix N3: Suppress endorsement cards on truly cold profiles (IMPORTANT)

**Current:** Endorsement CTA card and stat card always show, even with zero yachts.

**Proposed:** When yacht count = 0, hide both endorsement cards entirely. Replace the entire page with the empty state from section 4.2. The endorsement cards appear only when the user has yacht history (which means they might have colleagues to request from).

**Priority: IMPORTANT**

#### Fix N4: Inline [Request] buttons on colleague rows (NICE-TO-HAVE)

**Current:** Each colleague row has a [Request] button. These sit at varying Y positions depending on which accordion is expanded.

**Assessment:** These are actually fine. When a user expands a yacht accordion, the colleague rows within it naturally sit in the yellow zone (y=350-500). The [Request] buttons on each row are contextual — the user is already browsing that yacht's crew. No change needed, but ensure the buttons meet 44px minimum touch target.

**Priority: NICE-TO-HAVE** (validation only, no change needed)

### 4.5 Scroll Behavior

**Sticky bottom CTA:** Yes (N1) — endorsement request bar. Only shows when relevant.

**Hero collapse:** Not applicable — there's no hero card on Network. The endorsement CTA card is short enough.

**Scroll depth:** Varies dramatically by yacht count. A user with 10 yachts (only 1 expanded) has roughly:
- Endorsement cards: y=0-264
- Expanded yacht + colleagues: y=284-550
- 9 collapsed yachts: y=550-910 (40px each)
- Total: ~910px — requires one full scroll

With the sticky endorsement bar (N1), the primary CTA is always reachable regardless of scroll depth.

---

## 5. Settings Tab (Sand)

### 5.1 Cold State Analysis

Settings doesn't have a meaningful "cold state" — it's always functional. A new user sees:

**Above the fold on 375px:**
- Page title "Settings" (~44px)
- Mini profile card: name + role + plan badge (~70px)
- ACCOUNT group header + 3 rows (~150px): Login & security, Cert Documents, Data export
- PLAN group header + plan details (~140px): "Free" or "Crew Pro - Monthly", renewal date, feature list

**Total: ~404px.** First two groups fit above fold. Good.

**Verdict: Good.** Settings is inherently not a cold-state problem. Every row is functional from day one. The mini profile card at top gives context. The plan section tells you what you have.

**Problems:**
1. **Free user: "Upgrade to Crew Pro" CTA position.** On a free plan, the PLAN section should show an upgrade CTA. Based on the wireframe, this would sit at roughly y=330-400. That's **yellow zone** — reachable but not ideal for a commercial CTA.
2. **No primary CTA on this page.** Settings is a list of navigation rows. There's no single action to optimize for. This is fine — the tab bar handles navigation, and each row leads to its own sub-page.

### 5.2 Thumb Zone Mapping

| Element | Approx Y position | Zone | Issue |
|---------|-------------------|------|-------|
| Page title "Settings" | 0-44 | Red | Fine |
| Mini profile card | 44-114 | Red | Fine — identity context |
| ACCOUNT group (3 rows) | 134-284 | Red/Yellow | Fine — settings rows, infrequent taps |
| PLAN group | 304-444 | Yellow | Fine — infrequent interaction |
| APP group (2 rows) | 464-544 | Yellow/Green | Fine |
| COMMUNITY group (2 rows) | 564-644 | Green | Fine |
| LEGAL group (2 rows) | 664-744 | Green | Fine |
| Sign out | 764 | Near tab bar | Fine — infrequent, deliberate action |
| Delete account | 810+ | Below fold / scroll | Fine — should be hard to reach |

### 5.3 Specific Button Fixes

#### Fix S1: Free user upgrade CTA placement (IMPORTANT)

**Current:** "Crew Pro" upgrade CTA lives in the PLAN section at y=304-444 (yellow zone).

**Proposed:** For free users, add a subtle upgrade banner between the mini profile card and the ACCOUNT group:

```
┌─────────────────────────────────────┐
│ ✦ See who's viewing your profile   │
│   Upgrade to Crew Pro →            │  y=120-180, red zone BUT...
└─────────────────────────────────────┘
```

Wait — this puts it in the red zone. Actually, the PLAN section at y=330 (yellow zone) is probably the right place. Settings isn't a page you optimize for conversion — users come here intentionally.

**Alternative:** Keep the upgrade CTA in the PLAN section but make it more prominent (full-width teal button instead of a row). No position change needed.

**Priority: NICE-TO-HAVE** — Settings isn't a conversion page. Users who want to upgrade will find it.

#### Fix S2: "Sign out" and "Delete account" placement is actually correct (NO CHANGE)

**Current:** Sign out at y=764 (near tab bar), Delete account at y=810+ (below fold).

**Assessment:** This is perfect. Sign out is accessible but not prominent. Delete account requires deliberate scrolling. Destructive actions should be hard to reach. No change needed.

### 5.4 Scroll Behavior

**Sticky bar:** Not needed. Settings is a navigation page with no persistent action.

**Hero collapse:** Not applicable.

**Scroll depth:** Total content is roughly 850px. On a 748px viewport (812 - 64 tab bar), this requires minimal scrolling. Sign out and Delete are the only below-fold items, which is intentional.

---

## 6. Cross-Tab Summary

### Critical Fixes (must do before launch)

| # | Tab | Fix | Issue |
|---|-----|-----|-------|
| P1 | Profile | Sticky coaching bar above tab bar | Primary completion CTA in red zone |
| CV1 | CV | Sticky document action bar above tab bar | [Preview]/[Download]/[Regenerate] all in red zone |
| N1 | Network | Sticky endorsement request bar above tab bar | [Request endorsement] in red zone |
| N2 | Network | Promote "Add yacht" on empty/sparse pages | Only useful cold-state action is at page bottom |

### Important Fixes

| # | Tab | Fix | Issue |
|---|-----|-----|-------|
| P2 | Profile | Suppress [Preview]/[Share] on cold profiles | Useless buttons add noise on empty profiles |
| P3 | Profile | Replace zero stat line with coaching text | "0y 0mo - 0 yachts" is depressing |
| CV2 | CV | Demote destructive re-parse to text link | Dangerous action is easier to reach than primary action |
| CV3 | CV | Add cold-state wireframe to design guide | No specification for empty CV tab |
| I1 | Insights | Reorder free user layout (coaching below blur) | Coaching CTA in red/yellow zone |
| I2 | Insights | Add Pro empty state with share CTA | Pro user with zero views has nothing to do |
| N3 | Network | Suppress endorsement cards when yacht count = 0 | Dead-end CTA wastes space on truly cold profiles |
| S1 | Settings | Make upgrade CTA more prominent in PLAN section | Minor — upgrade button is just a row |

### Nice-to-Have

| # | Tab | Fix | Issue |
|---|-----|-----|-------|
| P4 | Profile | Outcome-oriented empty row summaries | Minor copy improvement |
| CV4 | CV | Highlight [Regenerate] when profile changed | Handled automatically by CV1 |
| I3 | Insights | Replace zero stat cards with coaching | Edge case for users who skip everything |
| N4 | Network | Validate [Request] button touch targets | Probably fine already |

---

## 7. Sticky Bar Coordination

Three tabs may show sticky bars above the tab bar: Profile, CV, and Network. These bars must not conflict.

### Rules

1. **Only one sticky bar per page.** Each tab has its own bar or no bar.
2. **Z-index:** `z-30` for all sticky bars. Tab bar is `z-40`. Modals/sheets are `z-50`.
3. **Position:** `fixed bottom-20 left-0 right-0`. The `bottom-20` (80px) clears the 64px tab bar + 16px breathing room. On devices with safe area (home bar), use `bottom-[calc(5rem+env(safe-area-inset-bottom))]`.
4. **Content padding:** All pages with potential sticky bars need `pb-36` (144px) instead of the standard `pb-24` (96px) to clear both the tab bar and the sticky bar.
5. **Background:** `bg-[var(--color-surface-primary)]` with a subtle `shadow-[0_-1px_3px_rgba(0,0,0,0.08)]` top shadow. Must work in dark mode.
6. **Animation:** Slide up with `springSnappy` when entering, slide down when exiting. Respect `prefers-reduced-motion`.
7. **Conditional rendering:**
   - Profile: shows when Profile Strength < 80%
   - CV: shows when a generated CV exists
   - Network: shows when endorsement count < 5 AND colleague count >= 1
   - Insights: no sticky bar (uses layout reorder instead)
   - Settings: no sticky bar

### Shared Component

Build a single `<StickyBottomBar>` component:

```tsx
interface StickyBottomBarProps {
  children: React.ReactNode
  visible: boolean
  className?: string
}
```

- Handles positioning, z-index, safe area, animation
- Each tab passes its own content as children
- `visible` prop triggers enter/exit animation
- All tabs use the same component for consistency

---

## 8. Cold State Inventory — What's Missing from the Design Guide

The current design guide defines populated wireframes for every tab but is missing explicit cold-state wireframes for:

| Tab | Cold state defined? | What's needed |
|-----|-------------------|---------------|
| Profile | Partially (coaching prompt exists, but zero-stat line and useless buttons not addressed) | Zero-stat treatment, button suppression rules, empty row summaries |
| CV | Not defined | Full empty-state wireframe (upload CTA + profile link) |
| Insights (Free) | Partially (career snapshot + coaching exists) | Zero-stat edge case, layout reorder |
| Insights (Pro) | Not defined | Empty analytics state with share CTA |
| Network | Not defined | Full empty-state wireframe (add yacht CTA), endorsement card suppression rules |
| Settings | N/A (always functional) | No change needed |

**Recommendation:** Add a "Cold States" section to the design guide with wireframes for each tab. This is the single most impactful addition to the guide — every tab looks great when populated, but first impressions happen on empty profiles.

---

## 9. Page-by-Page Content Padding Summary

Updated `pb-*` values accounting for sticky bars:

| Tab | Has sticky bar? | Content padding |
|-----|----------------|-----------------|
| Profile | Yes (conditional, Profile Strength < 80%) | `pb-36` when bar visible, `pb-24` when hidden |
| CV | Yes (conditional, generated CV exists) | `pb-36` when bar visible, `pb-24` when hidden |
| Insights | No | `pb-24` (standard) |
| Network | Yes (conditional, endorsements < 5 + has colleagues) | `pb-36` when bar visible, `pb-24` when hidden |
| Settings | No | `pb-24` (standard) |

To avoid layout shifts, consider always using `pb-36` on tabs that CAN show a sticky bar, even when the bar is hidden. The extra 48px of bottom padding is invisible on most devices (content ends above it).
