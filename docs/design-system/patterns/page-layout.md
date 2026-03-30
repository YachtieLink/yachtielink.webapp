# Page Layout Patterns

> Established during Rally 006 (CV upload redesign). These patterns apply to every page in the app.

---

## Mobile-First Layout

Every page is designed for 375px first. Desktop is a bonus, not the target.

### Vertical Centering for Action Pages

Pages whose primary purpose is a single action (upload, confirm, sign in) should center their content vertically in the viewport:

```tsx
<div className="p-4 flex flex-col gap-5 min-h-[calc(100dvh-10rem)] justify-center">
```

This puts the primary action in the **thumb zone** — the natural resting area for a thumb on a mobile device (roughly the middle third of the screen). Users shouldn't have to stretch to tap the main button.

**Use `100dvh` not `100vh`** — `dvh` accounts for mobile browser chrome (Safari URL bar, etc).

### Content Pages (Lists, Profiles, Settings)

Pages that scroll vertically use a simpler top-aligned layout:

```tsx
<div className="flex flex-col gap-3">
```

No vertical centering — content flows from top and the user scrolls.

---

## Section Color Wayfinding

Every page subtly uses the color of the navigation tab it belongs to. This creates subconscious wayfinding — the user knows where they are by the colour temperature of the page.

| Section | Color | CSS Token Prefix | Example Use |
|---------|-------|------------------|-------------|
| Profile | Teal | `--color-teal-*` | Edit affordances, section headers |
| CV | Amber | `--color-amber-*` | Upload zone, step indicators, file badges |
| Insights | Coral | `--color-coral-*` | Charts, Pro upgrade CTAs |
| Network | Navy | `--color-navy-*` | Colleague cards, endorsement badges |
| More / Settings | Sand | `--color-sand-*` | Settings rows, account management |

### Where to Apply Section Color

- **Upload/drop zones** — border and background tint
- **Step indicators** — numbered circles, progress badges
- **Status badges** — "New", "Verified", "Matched"
- **Icon accents** — upload arrows, checkmarks, section icons
- **Loading spinners** — border accent color

### Where NOT to Apply Section Color

- **Primary buttons** — always use `--color-interactive` (teal). The CTA color is universal.
- **Text body** — always use `--color-text-*` tokens
- **Errors** — always red, never section-colored
- **Cards/surfaces** — always use `--color-surface-*` tokens

### Implementation

```tsx
import { getSectionTokens } from '@/lib/section-colors'

const tokens = getSectionTokens('cv') // returns amber tokens
// tokens.bg50, tokens.bg100, tokens.accent500, tokens.text700
```

Or use the class map for Tailwind:

```tsx
import { getSectionClasses } from '@/lib/section-colors'

const classes = getSectionClasses('cv')
// classes.text, classes.bg, classes.bgSubtle, classes.border
```

---

## Page Transitions — Same Page, New State

When a page transitions between states (e.g., empty → uploaded → processing), the page should **evolve, not jump**. The user should feel like the same page updated, not that they navigated to a different screen.

### Rules

1. **Keep the same layout container** — same padding, same `min-h`, same `justify-center`
2. **Transform elements in place** — the upload zone becomes the file confirmation in the same position
3. **Maintain the heading position** — serif heading stays at the top, copy updates to reflect new state
4. **Reuse visual patterns** — if the pre-state has numbered steps, the post-state uses the same pattern for options

### Example: CV Upload

| Pre-upload | Post-upload |
|------------|-------------|
| "Import your CV" heading | "CV ready" heading |
| Upload zone (dashed amber border) | File confirmation (dashed amber border, checkmark) |
| "What we do for you" (numbered steps) | "Other options" (same icon + description pattern) |
| Privacy note | Privacy note |

The user's eyes don't have to re-orient. Everything is where they expect it.

---

## Information Hierarchy

### Headlines

- Use `font-serif` for page-level headlines (h1). This is the YachtieLink brand voice.
- Use `font-semibold` (sans-serif) for section headers within a page.
- Never use serif for small labels, buttons, or secondary text.

### Copy That Sells

Action pages (upload, onboarding, upgrade) should **sell the feature**, not just describe it:

**Bad:** "Upload your CV to automatically populate your profile."
**Good:** "No more retyping your career into another platform. Upload your CV and your entire profile is built in under 30 seconds."

Lead with the **pain point** they recognise, then the **speed/value** they'll get.

### Explaining What Happens

When the app does something complex behind the scenes (AI parsing, yacht matching, endorsement verification), explain it to the user in plain language. Use numbered steps with bold lead-ins:

```
1. **Read your career.** We extract every yacht, role, certification...
2. **Connect your yachts.** We match each vessel against our database...
3. **You stay in control.** Review everything before it's saved...
```

This builds trust and sets expectations. Users who understand what's happening are more patient and more impressed.

---

## Sticky Bottom Actions

For pages with a primary action that the user needs to reach after scrolling, use a sticky bottom bar:

```tsx
<div className="sticky bottom-0 bg-[var(--color-bg)] pb-safe pt-2">
  <Button className="w-full" size="lg">
    Confirm all
  </Button>
</div>
```

**Rules:**
- `pb-safe` handles the iOS safe area (home bar)
- Background matches page background to hide content scrolling behind it
- Only one sticky action per page — if you need two buttons, stack them in the sticky bar
- Disabled state should explain WHY it's disabled (e.g., "1 yacht needs your attention")

---

## Compact Lists vs Expanded Cards

When showing a list of items the user needs to review (yachts, certifications, endorsements):

### Default to Compact

Show each item as a **single row** — name, key metadata, status badge. The whole list should fit on one screen if possible.

```
★  M/Y Big Sky
   Oceanfast · 49m
   Sole Chef · May 2025 — Nov 2025
```

### Expand on Demand

Tapping a row expands it **inline** — detail panel slides open below the row. No modals, no page navigation. The user stays oriented in the list.

### When to Use Cards Instead

Use full cards (not compact rows) only when:
- Each item requires immediate action (not just review)
- The item has rich visual content (photos, charts)
- There are 3 or fewer items

For 4+ items, always use compact rows with expand-on-tap.

---

## Empty States and Positive Framing

Never make a missing state feel like a failure:

**Bad:** "We couldn't find a match. Check the details are correct before adding."
**Good:** "New to YachtieLink" (with a blue star badge — it's positive, they're pioneers)

**Bad:** "No endorsements yet."
**Good:** "Your endorsements will appear here. Request one from a crew mate to get started."

The user should never feel like they did something wrong or that the app failed. Reframe gaps as opportunities.

---

## Accessibility Minimums

- Tap targets: minimum 44px height on mobile
- Text contrast: follow `--color-text-*` tokens (already accessible)
- Interactive elements: must have visible focus states
- Buttons vs links: buttons for actions, links for navigation. Never a `<div onClick>`.
