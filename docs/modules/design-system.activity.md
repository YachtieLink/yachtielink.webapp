# Design System — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-04-01** — Claude Code (Opus 4.6, CV wizard Steps 4-5): ChipSelect hierarchy rework (headings > chips), chip sizing downsized to text-xs/py-1, CV chips tinted not solid, hobby chips amber-tinted for distinction. StepReview overhaul: serif title, amber wayfinding borders on review cards, tinted skill/hobby chips, M/Y/S/Y prefixes, skills/interests summary display.

**2026-03-31** — Claude Code (Opus 4.6, CV wizard walkthrough): DatePicker selector reorder to Day-Month-Year; WCAG contrast fix (amber labels → text-secondary on white backgrounds); design decision logged: no left border accent stripes on cards.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.2): New components — Button variants (outline/link/icon), Input, Select, Textarea, FormField, IconButton, SectionBadge, ProfileAvatar; section color system (teal/amber/coral/navy/sand unique tab colors).

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.2): Token migration — all hardcoded colors → CSS custom properties; dark mode tokens: 20+ variable overrides in globals.css; full-bleed backgrounds on CV, Insights, Network pages.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Typography standardized — 28px bold tracking-tight titles, section headers unified; soft card glass treatment (`card-soft`) on tinted background pages; spacing fixes (removed double bottom padding 160px → proper), toast position uses CSS vars.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Dark mode sidelined — force light mode, theme toggle replaced with "coming soon" placeholder; desktop layout deferred to Phase 1B.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 C): Animation pass — `easeGentle` + `scrollRevealViewport` added to `lib/motion.ts`; `ProfileAccordion`, `IdentityCard`, `Toast`, `BottomSheet` wired to shared presets; `fadeUp` on page wrappers, `staggerContainer` on card lists, `scrollReveal` on public profile, `cardHover` on cards, `popIn` on badge counts; `PageTransition` and `ScrollReveal` wrapper components created.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 D): DM Serif Display applied to profile names, section headings, page titles, auth pages (weight 400, no synthetic bold).

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 B): Dark mode — ProfileStrength arc colours use `--color-strength-*` CSS vars; Insights chart colours use `--chart-*` vars; SidebarNav badge uses `--color-error`.

**2026-03-18** — Cowork (Opus 4.6, Project structure): Created `docs/design-system/` — `philosophy.md` (5 deep design principles), `inspirations.md`, `style-guide.md` (moved from root), `flows/` (5 user journey maps), `patterns/` (5 component pattern docs with JSX), `decisions/` (9 seeded design decisions), `reference/salty_mascot_spec.md`.

**2026-03-17** — Claude Code (Opus 4.6, UI/UX refresh + Salty): Expanded colour palette — added coral (#E8634A), navy (#2B4C7E), amber (#E5A832) token families (50/100/200/500/700 each) to globals.css.

**2026-03-17** — Claude Code (Opus 4.6, UI/UX refresh + Salty): Added DM Serif Display font to `layout.tsx` as display/headline font alongside DM Sans.

**2026-03-17** — Claude Code (Opus 4.6, UI/UX refresh + Salty): Created `lib/motion.ts` — shared Framer Motion animation presets (fadeUp, fadeIn, staggerContainer, cardHover, buttonTap, scrollReveal, popIn, spring configs).

**2026-03-17** — Claude Code (Opus 4.6, UI/UX refresh + Salty): Updated Card.tsx — `shadow-sm` default + interactive hover lift + press animation; Button.tsx — refined press animation to `scale-[0.97]` with `transition-all duration-150`; updated chart colours to multi-colour palette (teal, coral, navy, amber).

**2026-03-17** — Claude Code (Opus 4.6, UI/UX refresh + Salty): Rewrote `yl_style_guide.md` to v2.0 — expanded colours, DM Serif Display typography, motion guidelines, Salty mascot section, bento layouts, updated brand voice; created `notes/salty_mascot_spec.md` — full mascot spec (ethereal wind/water spirit, 8 moods, 5 sizes, voice guide, feature integration map, animation spec).

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 07): Installed framer-motion; created `AnimatedCard.tsx` (stagger-in wrapper) and `ProfileCardList.tsx` (client wrapper); BottomSheet rewritten with AnimatePresence + spring slide-up; IdentityCard QR panel with AnimatePresence height animation; Toast spring entrance/exit; Button `active:scale-[0.98]` touch feedback.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 01 + cross-cutting): Comprehensive CSS var migration — all remaining `--foreground`, `--muted`, `--card`, `--destructive`, `--primary`, `--background`, `--border` replaced with design system tokens across entire codebase (18+ additional files).

**2026-03-15** — Claude Code (Opus 4.6, Brand Palette): Full brand palette swap — navy/ocean/gold → teal (#0D7377 at 700) + sand (#E8DCC8); DM Sans replacing Geist; updated globals.css with new design tokens: teal-50→950, sand-100→400; dark mode overrides.

**2026-03-15** — Claude Code (Opus 4.6, Brand Palette): Installed shadcn/ui (v4, base-nova) with teal-themed CSS variables — `--primary` → teal-700, `--secondary` → teal-50, `--accent` → sand-100, `--radius: 0.75rem`; added Dialog, Badge, Separator, Avatar, Tabs, Tooltip, Sheet, Skeleton, DropdownMenu; `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge); barrel export updated; custom YachtieLink components preserved alongside.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 3): Built base UI components — `Button.tsx` (4 variants, 3 sizes, loading spinner), `Card.tsx`, `Input.tsx`, `Toast.tsx` (ToastProvider + useToast hook, 3 types, 4s auto-dismiss), `BottomSheet.tsx` (fixed bottom drawer, backdrop, drag handle, Escape key, body scroll lock), `ProgressWheel.tsx` (SVG ring for Wheel A/B completion).

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): Established design token system in `globals.css` — navy, ocean, gold palettes, semantic CSS vars with dark overrides, dark mode via `.dark` class variant, tab bar helpers; inline dark mode init script in layout.tsx (no FOUC).
