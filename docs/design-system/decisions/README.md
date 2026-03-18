# Design Decisions

Log every design choice and every rejected approach here. This prevents future sessions from re-proposing things that have already been considered and dismissed.

---

## How to Log

Add entries to this file in reverse chronological order. Use this format:

```
### YYYY-MM-DD — [Short title]
**Decision:** What was chosen.
**Rejected:** What was considered and dismissed.
**Why:** The reasoning.
```

---

### 2026-03-17 — DM Serif Display for headlines

**Decision:** Added DM Serif Display as the display/headline font alongside DM Sans.
**Rejected:** Staying with DM Sans for everything.
**Why:** DM Sans alone felt too utilitarian. Serif headlines add warmth and personality — "professional without being corporate." Used sparingly: hero text, page titles where impact matters.

### 2026-03-17 — Framer Motion for all animation

**Decision:** Framer Motion with shared presets in `lib/motion.ts`.
**Rejected:** CSS transitions only; GSAP; no animation.
**Why:** CSS transitions are too limited for coordinated entrance animations and gesture-driven interactions. GSAP is overkill. Framer Motion integrates cleanly with React, supports AnimatePresence for mount/unmount, and tree-shakes well.

### 2026-03-17 — Coral, navy, amber accent palette

**Decision:** Added coral (#E8634A), navy (#2B4C7E), amber (#E5A832) as section accent colours.
**Rejected:** Teal-only palette.
**Why:** Single-colour palette felt flat and monotone. Notion-style colour coding gives different sections visual identity. Used sparingly — teal remains primary, accents are supporting.

### 2026-03-17 — Profile Strength not Profile Completion

**Decision:** Meter says "Profile Strength" with labels: "Getting started" (0-30%), "Looking good" (31-60%), "Standing out" (61-85%), "All squared away" (86-100%).
**Rejected:** "Profile Completion" with percentage.
**Why:** "60% complete" after CV parse feels like a failing grade. "Looking good" at 60% feels like a strong start. The frame changes user motivation from "finish the chore" to "make something great even better."

### 2026-03-17 — Empty sections hidden, not shown as skeletons

**Decision:** If a section has no data, it doesn't render at all.
**Rejected:** Showing empty sections with "Add X" prompts.
**Why:** A profile with 3 filled sections and 4 empty placeholders looks broken. A profile with 3 filled sections and nothing else looks complete. The own-profile page shows empty state CTAs, but the public profile never does.

### 2026-03-17 — Salty mascot personality: knows the ropes, not AI-branded

**Decision:** Salty is a friendly guide. AI is invisible infrastructure, never mentioned in branding.
**Rejected:** "Powered by AI" branding, chatbot personality.
**Why:** Crew trust matters. "AI told you to do this" undermines trust. Salty just seems helpful, like a wise friend. The user never thinks about whether AI is involved.

### 2026-03-17 — Split layout on desktop public profile

**Decision:** Photo sticky left (40%), content scrolling right (60%).
**Rejected:** Single column on all viewports; centered narrow column.
**Why:** Single column wastes desktop space. Recruiters and captains view on desktop — the photo should be prominent and persistent. Bumble-style split keeps the visual identity present while content scrolls.

### 2026-03-16 — Two-pass rally pattern (R1 + challengers)

**Decision:** Every rally runs two passes — deep analysis then challenge/refine.
**Rejected:** Single-pass analysis.
**Why:** Rally 001 proved that first-pass findings are often shallow. Challenger agents found deeper structural issues (sequential queries, no responsive breakpoints) that R1 agents described as "minor improvements." The second pass catches what the first pass rationalises away.

### 2026-03-16 — Dark mode via CSS variables, not Tailwind dark: prefix

**Decision:** Semantic CSS custom properties (`--color-surface`, `--color-text-primary`) that swap values in `.dark` class.
**Rejected:** Tailwind `dark:` prefix on every element.
**Why:** Semantic tokens mean components don't need dark mode logic — they just work. Fewer classes, less duplication, easier to maintain. The `.dark` class toggles at root level.
