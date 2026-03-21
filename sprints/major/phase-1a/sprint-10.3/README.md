# Sprint 10.3 — Page Layout, IA & Polish

**Phase:** 1A (final)
**Status:** Planned
**Started:** —
**Completed:** —

---

## Why This Exists

Sprint 10.2 replaced raw HTML with design system components. The plumbing works — tokens, Button, Input, section colors all correct. But the **pages themselves aren't designed.** The founder walked through every screen and flagged:

- Profile page is a settings dump — flat list, no hierarchy, no focal point
- "Preview" is a tiny emoji link in the corner
- Empty states say "Add →" as text hyperlinks
- Colleague cards aren't clickable
- Accordion font looks heavy and wrong
- More page has flat rows while everything else uses cards
- Insights blurs teaser content — hides what you're selling
- Crew Pro CTA buried below the fold
- Button hierarchy inconsistent — 3 patterns on the same page
- Photos can't be reordered or uploaded in bulk
- Native date picker is ugly, checkboxes are tiny
- Skills and hobbies pages give zero guidance
- Tab colors weren't unique (fixed)
- Dark mode is broken (sidelining it)

**Three review agents** (bug finder, UX expert, frontend layout expert) found additional issues — see `parts/review_findings.md` for the full audit.

---

## Scope: Mobile First

Desktop layout is deferred to Phase 1B. This sprint optimizes for **375px mobile**. Desktop stays acceptable (max-w-2xl centered) but gets no bespoke treatment.

---

## Design Principles

1. **Every page has one hero moment.** The eye lands somewhere intentional.
2. **Cards, not flat lists.** Every content group lives in a card.
3. **Primary action is obvious.** One prominent CTA per page. Everything else is secondary or tertiary.
4. **Empty states sell the feature.** Icon + value prop + CTA button.
5. **Clickable things look clickable.** No dead cards.
6. **Consistent visual language.** Same radius, spacing, typography on every page.

---

## Pre-work (DONE)

Already applied in this session:
- Tab colors unique: Profile=teal, CV=amber, Insights=coral, Network=navy, More=sand
- Insights title: serif → sans-serif bold
- Insights blur: removed, teaser text fully readable with inline "Pro" badge
- Crew Pro CTA: sand border removed, `md:mx-5` (full width mobile, narrower desktop)
- Full-bleed backgrounds: CV, Insights, Network use `-mx-4 px-4` hack
- Global container padding: `px-4 md:px-6` on layout

---

## Part 1: Profile Page Redesign

**Current:** Flat stack — photo strip, loose text, progress wheel, endorsement nudge, toggle list, accordion sections.
**Target:** Structured card layout with clear hierarchy.

### 1A. Profile hero card
```
┌─────────────────────────────────────────┐
│  [Photo]  ari                    [Edit] │
│           Bosun · Deck                  │
│           yachtie.link/u/aari     [Copy]│
│                                         │
│  [Preview (outline)] [Share Profile]    │
└─────────────────────────────────────────┘
```
- Photo + name + role + URL in a single card
- Share Profile = primary button, Preview = outline button
- Edit = ghost icon button (pencil) top-right
- Remove emoji from Preview
- Extract as client component (`ProfileHeroCard.tsx`) for onClick handlers

### 1B. Profile strength card
- Progress wheel + label in a proper card
- Smart CTA below: "Add profile photos" / "Request your first endorsement" / etc.
- CTA is `<Button variant="outline">` not a grey text box

### 1C. Section management grid
Replace flat toggle list with 2-col grid of section cards:
```
┌──────────┐ ┌──────────┐
│ About [✓]│ │ Exp   [✓]│
│ "Love.." │ │ 2 yachts │
│     Edit │ │     Edit │
└──────────┘ └──────────┘
```
- `grid grid-cols-1 sm:grid-cols-2 gap-2` (1-col on narrow, 2-col on 375px+)
- Toggle, summary, Edit/Add button per card
- Need to create or use existing toggle component (no `<ToggleSwitch>` exists — use shadcn Switch or build one)

### 1D. Kill all "Add →" hyperlinks
Replace with `<EmptyState>` using icon + value prop + `<Button>` CTA.

### 1E. Remove accordions from profile page
Accordions belong on the public profile only. Profile page is a dashboard — section grid cards link to edit pages.

### 1F. Teal background tint
Add `bg-[var(--color-teal-50)]` full-bleed to profile page.

---

## Part 2: Accordion Font Fix

`ProfileAccordion.tsx` line 42:
```
font-serif text-lg → text-base font-semibold
```
Serif stays only on public profile hero name.

---

## Part 3: Network Page

### 3A. Colleague cards link to `/u/{handle}`
- Add `handle` to colleague profile query + interface
- Wrap avatar + name area in `<Link>`
- Keep Endorse button outside the link

### 3B. "Write endorsement →" → `<Button variant="outline" size="sm">`

### 3C. Add page title
`<h1>Network</h1>` before the endorsement CTA card.

---

## Part 4: Insights Page

### 4A. Teaser cards — DONE
No blur, readable text, inline "Pro" badge.

### 4B. Crew Pro CTA → sticky bottom overlay
**The upgrade CTA should NOT be inline at the bottom of a scroll.** It should be a sticky bottom sheet:
- Fixed to bottom of viewport, hovers over teaser cards
- User scrolls teaser cards behind the overlay
- Upgrade button always visible without scrolling
- Compact layout: plan toggle + price + upgrade button + "Cancel any time"
- Feature list accessible via expand/swipe up
- Semi-transparent backdrop so content is visible behind
- Use `<Button>` components (currently raw `<button>`)
- Add error toast on checkout failure (currently silent)

### 4C. Bento grid (Pro analytics view)
- Profile Views = hero card (full width)
- PDF Downloads + Link Shares = side-by-side
- Cert Manager + Plan = side-by-side
- `grid grid-cols-2 gap-3` with `col-span-2` for hero

### 4D. Fix "Manage →" text link → `<Button variant="ghost" size="sm">`

---

## Part 5: CV Page

### 5A. Button hierarchy as bento
```
┌──────────────────────────┐
│    Share Profile Link    │  ← primary, full width
└──────────────────────────┘
┌────────────┐ ┌───────────┐
│ Generate   │ │ Upload CV │  ← outline, 2-col
└────────────┘ └───────────┘
┌────────────┐ ┌───────────┐
│  QR Code   │ │   Edit    │  ← ghost, 2-col
└────────────┘ └───────────┘
```
Remove orphan "Edit Profile" card at bottom.

### 5B. Template selector
- Radio button pattern with proper a11y (`role="radio"`, `aria-checked`)
- Lock icon inline for Pro templates
- "Upgrade" text link → `<Button variant="link">`
- Fix `window.location.href` → `router.push` + toast

### 5C. "Download QR" text link → `<Button variant="ghost" size="sm">`

---

## Part 6: More Page

### 6A. Card-based sections
Wrap each settings group in `rounded-2xl` card with `divide-y` rows inside. Section headers sit above.

### 6B. Add page title: `<h1>Settings</h1>`

### 6C. Sign out → `<Button variant="destructive" className="w-full">`

### 6D. "Download my data" → fetch + download via JS (not navigate to raw API endpoint)

### 6E. Sand background tint (full-bleed)

---

## Part 7: Typography

### 7A. All in-app page titles
```
text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]
```
Fix: Profile, Network (missing), More (missing).

### 7B. Section headers standardized
```
text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]
```
Fix More page `SectionHeader` (currently uses `tracking-wider` + `text-secondary`).

### 7C. Standardize page gap to `gap-4` (profile uses `gap-3`)

### 7D. Standardize card padding to `p-4` (currently mixed `p-3`/`p-4`/`p-5`)

---

## Part 8: Empty States

### 8A. Fix EmptyState component
The `<EmptyState>` CTA currently renders as a text link with "→". Change the component itself to render `<Button variant="outline" size="sm">` — this cascades to every usage.

### 8B. Profile page empty states
Replace all "No X added. Add →" with `<EmptyState>` using Lucide icons:
- About → `FileText`, Experience → `Briefcase`, Endorsements → `Star`
- Certs → `Award`, Education → `GraduationCap`, Hobbies → `Heart`
- Skills → `Wrench`, Gallery → `Camera`

### 8C. Network empty states
Upgrade to `<EmptyState>` with icon + value prop + button CTA.

---

## Part 9: Soft Card Treatment

Cards on tinted backgrounds should be semi-transparent:
```css
.card-soft {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```
Apply to: CV (amber), Insights (coral), Network (navy).
Pages on default surface (Profile, More): solid cards.
Background tints already go full-bleed via `-mx-4 px-4`.

---

## Part 10: Photo Management

### 10A. Drag-to-reorder
API exists (`PUT /api/user-photos`). Add UI with `@dnd-kit/core` + `@dnd-kit/sortable`. Touch-friendly drag, optimistic reorder, toast on save.

### 10B. Multi-photo upload
Add `multiple` to file input. Batch upload with progress. Respect limits.

### 10C. Update limits
- **Profile photos:** Free=3, Pro=9
- **Work gallery:** Free=3, Pro=15
- Update API routes, help text, and client-side limit checks

---

## Part 11: Dark Mode Sidelined

### 11A. Force light mode
Replace theme detection script with `document.documentElement.classList.remove('dark')`.

### 11B. Remove theme toggle
Remove Appearance section from More page, or replace with "Dark mode coming soon".

---

## Part 12: Bug Fixes

### 12A. `expiry_date` vs `expires_at` column mismatch — Pro cert count always 0
### 12B. `subscription_plan` vs `subscription_status` check on photo/gallery APIs
### 12C. `pt-safe-top` non-existent utility on public profile hero
### 12D. UpgradeCTA silent failure → add error toast
### 12E. "Download my data" navigates to raw API → fetch + download

---

## Part 13: Spacing Fixes

### 13A. Double bottom padding
Layout `pb-tab-bar` (64px) + page `pb-24` (96px) = 160px dead space. Fix.

### 13B. Double horizontal padding on sub-pages
Edit forms apply their own `px-4` inside layout's `px-4`. Remove redundant.

### 13C. Toast position
Hardcoded `bottom-24` → use `calc(var(--tab-bar-height) + var(--safe-area-bottom) + 1rem)`.

### 13D. Save button disabled appearance
Ensure active save buttons look clickable, not greyed out.

---

## Part 14: Date Picker & Checkboxes

### 14A. Custom month/year date picker
Replace native `<input type="date">` on ALL date fields:
- Attachment start/end dates
- Certification issued/expiry dates
- Education start/end dates
- Allow month+year only (day optional)
- Use shadcn Calendar or react-day-picker

### 14B. Checkbox tap targets
All `<input type="checkbox">` → tappable rows (min 44x44px):
- "Currently working here"
- "No expiry / lifetime certification"
- Wrap in `<label>` covering full row, style as interactive card row

---

## Part 15: Form & List Polish

### 15A. Cert category picker
Replace flat text list with icon cards:
- Engineering → `Wrench`, Hospitality → `UtensilsCrossed`, Medical → `Stethoscope`
- Navigation → `Compass`, Safety → `LifeBuoy`, Water Sports → `Waves`
- Cards layout, not flat rows

### 15B. BackButton fixes
- Replace tiny `‹` chevron with proper `<BackButton>` on ALL sub-pages
- Standardize header: `flex items-center gap-3` for BackButton + h1
- Min 44x44px tap target

### 15C. Styled file upload
Replace raw `<input type="file">` ("Choose file No file chosen") with:
- `<Button variant="outline">` that triggers hidden file input
- Show selected filename below

### 15D. Hobbies emoji auto-suggest
- Build keyword→emoji lookup map (Photography→📷, Cooking→🍳, Yoga→🧘, etc.)
- Show suggested emoji as tappable pill next to input
- Display emoji+name pills on profile
- Change placeholder: "e.g. Surfing" → "e.g. Photography"

### 15E. Skills page rework
- Add suggestion chips per category (tappable pills for common skills)
- Show added skills as grouped pills with × remove
- Explainer: "These appear on your public profile under Extra Skills"
- Fix truncated placeholder

---

## Build Order

```
FOUNDATION (do first — affects everything):
  Part 7:  Typography + spacing standardization (~0.5 day)
  Part 9:  Soft card treatment + card-soft CSS (~0.5 day)
  Part 13: Spacing fixes (double padding, toast position) (~0.5 day)
  Part 11: Dark mode sidelined (~0.5 day)

PAGES (parallel agents):
  Part 1:  Profile page redesign (~2 days)
  Part 2:  Accordion font fix (~15 min)
  Part 3:  Network page fixes (~0.5 day)
  Part 4:  Insights page + Crew Pro sticky overlay (~1.5 days)
  Part 5:  CV page hierarchy (~0.5 day)
  Part 6:  More page consistency (~0.5 day)
  Part 8:  Empty state upgrade (~0.5 day)

FEATURES:
  Part 10: Photo management — reorder + multi-upload + limits (~1 day)
  Part 14: Date picker + checkbox UX (~1 day)
  Part 15: Form polish — cert icons, file upload, hobbies emoji, skills chips (~1.5 days)

CLEANUP:
  Part 12: Bug fixes (~0.5 day)
```

**Estimated: ~12 days with parallel agents**

---

## Exit Criteria

### Automated
```bash
# Zero "Add →" links
grep -rn 'Add →\|Add →' app/ --include='*.tsx' | grep -v node_modules

# Zero font-serif in protected app
grep -rn 'font-serif' app/(protected)/ --include='*.tsx'

# Zero text-xl font titles (should all be text-[28px])
grep -rn 'text-xl.*font-serif\|text-xl.*font-semibold' app/(protected)/ --include='*.tsx'

# Photo limits correct
grep -n 'FREE_LIMIT\|PRO_LIMIT' app/api/user-photos/route.ts

# Build passes
npm run build && npx tsc --noEmit
```

### Manual (375px mobile)
- Profile: hero card, section grid, no accordions, no "Add →"
- Network: page title, colleague cards link to profile, endorsement buttons
- Insights: readable teasers, sticky Crew Pro overlay, bento grid (Pro)
- CV: Share primary, PDF/Upload secondary, QR/Edit tertiary
- More: card sections, page title, no theme toggle
- Photos: drag reorder works, multi-upload works, limits enforced
- All dates: custom picker, month/year optional day
- All checkboxes: 44px tap targets
- All sub-pages: proper BackButton with gap
- Hobbies: emoji auto-suggest
- Skills: suggestion chips
- Certs: category icons
- All backgrounds full-bleed, soft cards on tinted pages
- No dark mode activation possible

---

## Risks

- Profile page rewrite (Part 1) is the biggest change — server component with client extraction needed
- `<ToggleSwitch>` doesn't exist — need to create or use shadcn Switch
- Crew Pro sticky overlay (Part 4B) is complex — needs careful z-index layering with tab bar
- Photo drag-and-drop needs touch testing on real mobile devices
- Custom date picker is a significant UX component — test thoroughly
- `backdrop-filter` performance on older iOS Safari — fallback to solid bg if needed
