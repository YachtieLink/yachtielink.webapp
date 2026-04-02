# Design System — Living Reference

This is the complete visual, interaction, and brand reference for YachtieLink. **Read this first when building anything the user sees or touches.**

---

## Reading Order

Start with philosophy, then go as deep as you need for the task:

1. **[philosophy.md](./philosophy.md)** — the *why*. Five design principles, the core tension, what the app should feel like. Read this every time.

2. **[inspirations.md](./inspirations.md)** — the *who*. What products we're inspired by (Notion, Bumble, Linear, Airbnb), what to take, what to avoid. Calibration questions for design choices.

3. **[style-guide.md](./style-guide.md)** — the *how*. Complete colour palette, typography scale, animation presets, component styling, shadcn/ui mapping, CSS variable reference, dark mode, Salty mascot spec. This is the canonical style reference — token-level detail.

4. **[flows/](./flows/)** — the *where*. User journeys showing how screens connect, what state the user is in, where they came from, where they go next.

5. **[patterns/](./patterns/)** — the *what*. Component patterns with actual JSX from the codebase. Cards, forms, lists, navigation, modals.

6. **[decisions/](./decisions/)** — the *history*. Every design choice and every rejected approach, logged so you don't repeat what's been tried.

7. **[reference/screenshots/](./reference/screenshots/)** — the *now*. What the app actually looks like. Drop screenshots here during UI sessions.

---

## Folder Structure

```
design-system/
├── README.md               This file — start here
├── philosophy.md            Deep design principles and product feeling
├── inspirations.md          Reference products, calibration questions
├── style-guide.md           Colours, typography, animation, CSS tokens, components
├── flows/                   User journeys — how screens connect
│   ├── app-navigation.md       Full route map + tab structure
│   ├── onboarding.md           Welcome → signup → CV → wizard → profile
│   ├── profile-editing.md      Hub-and-spoke edit pattern
│   ├── public-profile.md       The shareable page, split layout, CTAs
│   └── endorsement.md          Trust flow, deep links, coworker verification
├── patterns/                Component patterns from the actual codebase
│   ├── page-layout.md           ★ Mobile-first layout, section colors, thumb zones, state transitions, copy standards
│   ├── frontend-design-guide.md ★ Per-tab redesign specs, component patterns, universal principles (Rally 009)
│   ├── cards.md                 4 card variants with code examples
│   ├── forms.md                 Edit page layout, inputs, save buttons
│   ├── lists.md                 Accordions, bullet lists, tags, empty states
│   ├── navigation.md            Headers, back links, tab bar clearance
│   └── modals.md                BottomSheet, Dialog, toast patterns
├── decisions/               Design choices + rejections
│   └── README.md                Running log, reverse chronological
└── reference/
    └── screenshots/         Current app state captures
```

---

## Quick Reference — Which File Answers What

| Question | File |
|----------|------|
| Why does the app look like this? | `philosophy.md` |
| What products are we inspired by? | `inspirations.md` |
| What colour / font / radius / shadow do I use? | `style-guide.md` |
| What CSS variables are available? | `style-guide.md` → File References → `globals.css` |
| How do the shadcn/ui components map to our brand? | `style-guide.md` → shadcn/ui section |
| Where does this page sit in the app? | `flows/app-navigation.md` |
| What screen comes before/after this one? | `flows/{relevant-flow}.md` |
| How should I lay out this page for mobile? | `patterns/page-layout.md` |
| What should each tab look like after redesign? | `patterns/frontend-design-guide.md` |
| How do I use section colors for wayfinding? | `patterns/page-layout.md` → Section Color Wayfinding |
| How should the page transition between states? | `patterns/page-layout.md` → Page Transitions |
| What card/form/list pattern should I use? | `patterns/{relevant-pattern}.md` |
| Has this been tried before? | `decisions/README.md` |
| What does the app actually look like right now? | `reference/screenshots/` |

---

## Keeping This Alive

**When you build something new:**
- New component pattern → add to `patterns/`
- New page or route → update `flows/app-navigation.md` + relevant flow
- Design choice or rejection → add to `decisions/`
- New inspiration discovered → add to `inspirations.md`

**When doing a UI/UX rally or junior sprint:**
- Capture screenshots and drop in `reference/screenshots/`
- Review philosophy + inspirations before proposing changes
- Review patterns before building new components

**When the founder provides design direction:**
- Log it in `decisions/` with the rationale
- If it changes a principle, update `philosophy.md`
