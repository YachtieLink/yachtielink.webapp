# Visibility Toggle Clarity — What Does Each Toggle Control?

**Status:** fleshed-out
**Priority guess:** P2 (UX confusion → structural change)
**Date captured:** 2026-03-27
**Updated:** 2026-04-04 (Rally 010 walkthrough — founder direction on toggles, guidance, and LLM assist)

## Context — What Changed in Rally 010

Rally 010 made a structural change: **visibility toggles were removed from the main profile overview page and pushed into each individual edit page** (Bio edit, Skills edit, Hobbies edit, Certifications, Experience, Photos). This was done because:
- The profile overview was cluttered with toggles competing for attention with section content
- Inside the edit page there's more real estate to explain what the toggle does
- Users are in "editing mode" mentally when they're on that page — the right moment to decide visibility

**Current state (post-Rally 010):**
- `SectionVisibilityToggle` component lives on each edit page (about/edit, skills/edit, hobbies/edit, certs, attachment, photos)
- Single toggle per section with copy: "Controls whether this appears on your generated CV and public profile"
- No toggles on the profile overview anymore

This backlog captures the next evolution of this system.

---

## Part 1: Two Independent Toggles (DB change required)

**Two independent toggles per section, not one.** Users need separate control over:
1. **Show on generated CV** — whether this section appears in the auto-generated CV PDF
2. **Show on public profile** — whether this section appears on the public yachtie.link page

A single toggle that controls "both" is too blunt. A crew member might want their bio on their public profile but not on a formal CV, or vice versa.

### Data model change
- Current: `section_visibility` JSON stores `{ about: true, skills: true, ... }` (single boolean)
- New: `{ about: { cv: true, public: true }, skills: { cv: true, public: false }, ... }` or separate columns
- Migration needed: existing single booleans → default both to the current value

### Component change
- `SectionVisibilityToggle` currently shows one toggle
- Replace with two toggle rows:
  - "Show on generated CV" — toggle
  - "Show on public profile" — toggle
- Each independently controllable

### Consumers to update
- CV generation logic — read `section.cv` instead of `section` boolean (note: CV generation does NOT currently use section_visibility at all — needs wiring up)
- Public profile page (`PublicProfileContent.tsx`, `PortfolioLayout.tsx`) — read `section.public` instead of `section` boolean
- `/api/profile/section-visibility` PATCH API — accept `{ key, target: 'cv' | 'public', value: boolean }`
- `update_section_visibility` SQL RPC — update to handle nested structure

---

## Part 2: Section Guidance & Help Content

Each edit page should include **contextual guidance** that helps crew understand:
- **What this section is for** — what captains/agents look for here
- **How to write a good one** — practical tips, tone, length
- **Why it matters** — how it affects their visibility/searchability

### Per-section guidance (examples):

**Bio:**
- "Your bio is the first thing a captain reads. Keep it under 300 words."
- "Lead with your current role and experience level. Mention standout skills."
- "Avoid generic phrases like 'hard worker' — be specific about what you bring."

**Skills:**
- "Skills are searchable — captains filter by these when looking for crew."
- "Include both hard skills (welding, silver service) and certifications."
- "More specific = more discoverable. 'MIG/TIG welding' beats 'welding'."

**Hobbies:**
- "Hobbies show your personality beyond the deck. Captains want crew who fit the team."
- "Water sports, cooking, fitness — anything that shows you're active and well-rounded."

**Experience:**
- "More yachts = stronger profile. Add every vessel you've worked on."
- "Accurate dates matter — they calculate your total sea time automatically."

### Implementation
- Guidance should appear at the top of each edit page, below the page title
- Keep it brief — 2-3 bullet points max
- Could use a collapsible "Tips" card that's open by default for new users, collapsed for returning users
- Tone: helpful and encouraging, not preachy

---

## Part 3: LLM Writing Assistance

Each text-input section (especially Bio) should offer **LLM-powered writing help**:

### Minimum viable: Spellcheck & grammar
- Run the user's text through an LLM to fix spelling, grammar, and punctuation
- Button: "Fix spelling & grammar" — one-tap cleanup
- Show diff so the user can review before accepting
- Low-cost operation (Haiku-tier model)

### Stretch: Rewrite assistance
- "Help me improve this" button — LLM rewrites for clarity, professionalism, and impact
- Uses context from the user's role, department, and experience to tailor suggestions
- Shows before/after so the user stays in control
- Could offer 2-3 tone options: "Professional", "Friendly", "Concise"
- Important: never mention AI in the UI copy — frame as "polish" or "improve"

### Infrastructure
- Existing backlog item `ai-bio-writing-assist.md` covers the Bio-specific LLM assist in detail
- This should be generalised as a reusable pattern for any text field (bio, endorsement writing, skill descriptions)
- Rate limit free users, Pro users get unlimited rewrites
- See `docs/yl_llm_strategy.md` for model choices and pricing

---

## Part 4: Copy / UX Consistency

- Use consistent language everywhere: "generated CV" and "public profile" (never just "profile" or "CV")
- Add a preview link next to each toggle group: "See how your public profile looks →"
- Audit every toggle in the app for consistent language

## Scope Summary

| Part | Effort | DB change? | Description |
|------|--------|------------|-------------|
| 1. Two toggles | M | Yes | Split single boolean into cv/public per section |
| 2. Section guidance | S | No | Help content on each edit page |
| 3. Spellcheck | S | No | LLM spellcheck button on text fields |
| 3b. Rewrite assist | M | No | LLM rewrite suggestions (extend existing ai-bio backlog) |
| 4. Copy audit | S | No | Consistent language across all toggles |

## Related Backlog Items
- `ai-bio-writing-assist.md` — Bio-specific LLM writing scaffold (design complete)
- `endorsement-writing-assist.md` — Endorsement LLM writing scaffold
- `info-tooltips-platform-wide.md` — InfoTooltips on edit pages could complement guidance
