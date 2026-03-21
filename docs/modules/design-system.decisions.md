# Design System — Decisions

Append-only. Never edit existing entries. Newest at top.

When making a decision that affects this module, append it here with the date, decision ID (from yl_decisions.json if applicable, or next available D-xxx), rationale, and who made it.

---

**2026-03-17** — Dark mode via CSS variables, not Tailwind dark: prefix. Semantic CSS custom properties (`--color-surface`, `--color-text-primary`) that swap values in `.dark` class. Fewer classes, less duplication, easier to maintain — components just work without per-element dark mode logic.

**2026-03-17** — Split layout on desktop public profile. Photo sticky left (40%), content scrolling right (60%). Recruiters and captains view on desktop; the photo should be prominent and persistent.

**2026-03-17** — Salty mascot personality: knows the ropes, not AI-branded. AI is invisible infrastructure, never mentioned in branding. "AI told you to do this" undermines crew trust.

**2026-03-17** — Empty sections hidden, not shown as skeletons. A profile with 3 filled sections and 4 empty placeholders looks broken. A profile with 3 filled sections and nothing else looks complete. Own-profile page shows CTAs; public profile never does.

**2026-03-17** — Profile Strength not Profile Completion. Labels: "Getting started" (0–30%), "Looking good" (31–60%), "Standing out" (61–85%), "All squared away" (86–100%). "60% complete" feels like a failing grade; "Looking good" at 60% changes user motivation.

**2026-03-17** — Coral (#E8634A), navy (#2B4C7E), amber (#E5A832) as section accent colours alongside teal primary. Single-colour palette felt flat. Notion-style colour coding gives sections visual identity; teal remains primary.

**2026-03-17** — Framer Motion for all animation, with shared presets in `lib/motion.ts`. CSS transitions too limited for coordinated entrance animations. Framer Motion integrates cleanly with React, supports AnimatePresence, and tree-shakes well.

**2026-03-17** — DM Serif Display for headlines alongside DM Sans. DM Sans alone felt too utilitarian. Serif headlines add warmth — "professional without being corporate." Used sparingly: hero text, page titles.

**2026-03-16** — Two-pass rally pattern (R1 + challengers) for design reviews. Single-pass analysis is too shallow; challenger agents find structural issues that first-pass rationalises away.
