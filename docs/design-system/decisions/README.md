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

### 2026-04-01 — Chips visually subordinate to section headings

**Decision:** In chip-based UIs (skills, hobbies, tags), section headings must outrank chip text in visual hierarchy. Headings use `text-base font-semibold`, chips use `text-xs py-1 min-h-[28px]`. CV-parsed chips use tinted style (`bg-interactive/10 text-interactive`), not solid fills.

**Rejected:** Chips at `text-sm py-2 min-h-[36px]` with solid teal fill (`bg-interactive text-white`). These dominated the heading visually and competed for attention.

**Why:** Founder said "chips are bigger than section heading by far." Chips are data, not titles — they should scan quickly without overwhelming the structure above them.

---

### 2026-03-31 — No left border accent stripes on cards

**Decision:** Cards use border color, background tint, and shadow for visual differentiation from the page background. Never use a coloured left-edge stripe.

**Rejected:** `border-l-[3px] border-l-[var(--color-amber-400)]` left accent stripe pattern on section cards. Founder rejected immediately.

**Why:** Looks cheap and out of place. Not consistent with the design language. Cards should feel clean and elevated, not decorated with a sidebar stripe.

---

### 2026-03-30 — Mobile-first page layout patterns (Rally 006)

**Decision:** Established comprehensive page layout patterns during the CV upload/import redesign. Key principles:
1. **Thumb zone centering** — Action pages center content vertically with `min-h-[calc(100dvh-10rem)] justify-center` so the primary button sits in the natural thumb resting area on mobile.
2. **Section color wayfinding** — Every page uses the color of its navigation tab section (CV=amber, Profile=teal, Network=navy, Insights=coral, More=sand) for subtle accents. Users subconsciously know where they are.
3. **Same-page state transitions** — When a page changes state (empty→uploaded→processing), the layout evolves in place rather than jumping to a different screen. Same container, same heading position, same visual patterns.
4. **Compact lists with expand-on-tap** — For 4+ items that need review, show compact rows (2-line per item) instead of full cards. Tap to expand inline. No modals. The user stays oriented.
5. **Copy that sells** — Action pages lead with the pain point the user recognises, then the speed/value. "No more retyping your career" not "Upload your CV to populate your profile."
6. **Positive framing** — Missing data is an opportunity, not a failure. "New to YachtieLink" not "We couldn't find a match."

**Rejected:** Full-card layouts for yacht matching (too overwhelming at 8 yachts), modals for inline editing (loses context on mobile), neutral grey pages (no wayfinding signal).

**Why:** Founder drove the session live. The CV import flow is the first impression — onboarding UX must be fast, beautiful, and immediately impressive. These patterns now apply app-wide.

**Reference:** Full specification in `patterns/page-layout.md`.

---

### 2026-03-30 — LLM model selection for CV parsing (Rally 006)

**Decision:** Use `gpt-5.4-mini` for the full CV parse (experience, certs, skills) and `gpt-5-mini` for the personal parse (name, bio, languages). Hard cap at gpt-5.4-mini — if output is wrong, fix the prompt, don't upgrade the model.

**Rejected:** `gpt-4o` (5x more expensive, slower at 15.5s vs 4.4s), `gpt-5-mini` for full parse (2.5x slower at 40s, timed out on dense CVs), raw model upgrades without prompt improvement.

**Why:** gpt-5.4-mini is 3.5x faster than gpt-4o at less than half the cost. Dense 8-yacht CV parsed in 13.3s. Cost per CV: ~$0.02. Prompt quality matters more than model power — documented in `docs/yl_llm_strategy.md`.

---

### 2026-03-30 — Yacht search prefix handling (Rally 006)

**Decision:** Strip vessel type prefixes (M/Y, S/Y, MY, SY, Motor Yacht, Sailing Yacht, etc.) before trigram comparison in `search_yachts()` RPC. Use prefix as a separate type filter signal — M/Y query vs S/Y yacht gets a -0.3 penalty.

**Rejected:** Including prefixes in trigram comparison (inflates similarity — "M/Y WTR" matched "M/Y Go" at 0.36 due to shared "M/Y"), stripping prefixes from stored names (destroys identity — "M/Y Excellence V" and "S/Y Excellence V" are legally different vessels).

**Why:** Smart search, dumb storage. The intelligence is in the search function, not the stored data. Yacht proper names are never modified.

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
