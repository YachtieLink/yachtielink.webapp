# CLAUDE.md - YachtieLink Operating Manual

You are working on YachtieLink, a crew-owned professional identity network for yachting.

The current wedge is not generic profile presentation. It is portable profile infrastructure anchored to real yacht history, so crew can form a colleague graph and collect trusted references.

## Constitutional Rules

These rules override everything else:

1. Trust is the product.
2. Crew safety is asymmetric.
3. Freeze before corruption.
4. There is no market for reputation.
5. You can't pay to be more trusted. You can only pay to present yourself better.

Operational interpretation:

- Payment may improve presentation quality, workflow convenience, and later discovery efficiency.
- Payment must never affect trust creation.
- Payment must never affect trust weighting.
- Payment must never grant moderation power.
- Payment must never grant verified status.
- Payment must never change endorsement eligibility.

## Current Build Target

The current build target is Phase 1A:

- Profile
- CV import
- Employment history
- Yacht entities
- Employment attachments
- Colleague graph from shared yacht attachments
- Endorsement requests
- Endorsements
- Public profile page
- PDF snapshot
- Paid presentation upgrades

## Deferred Features

Do not build these unless the founder explicitly asks for them:

- Recruiter access
- Peer hiring
- Timeline / posts / interactions
- Messaging / contacts
- IRL connection system
- Broad search / discovery
- NLP search
- Conversational onboarding

## Canonical Docs

Read these at session start:

1. This file
2. `CHANGELOG.md`
3. `docs/yl_system_state.json`
4. `docs/yl_phase1_execution.md`
5. `docs/yl_build_plan.md`

Read these when relevant:

- `docs/yl_features.md` — feature definitions, phase assignments, constitutional notes
- `docs/yl_principles.md`
- `docs/yl_phase_scope.json`
- `docs/yl_phase1_actionables.json`
- `docs/yl_schema.md`
- `docs/yl_moderation.md`
- `docs/yl_non_goals.md`
- `docs/yl_decisions.json`

Conflict rule:

- If docs conflict, follow `docs/yl_system_state.json`, `docs/yl_phase1_execution.md`, and `docs/yl_build_plan.md` for current build scope.
- Treat older or broader future-state docs as non-canonical for implementation unless explicitly requested.

## Working Rules

- Read before changing.
- Keep scope narrow and aligned to Phase 1A.
- Prefer the yacht graph wedge over adjacent feature work.
- Update `CHANGELOG.md` at the end of every meaningful session.
- When editing planning docs, keep one consistent story across the canonical set.
- Do not silently weaken constitutional boundaries for growth or monetisation.

## Repository Map

```text
yachtielink.webapp/
├── app/                 # Next.js App Router pages and API routes
├── lib/                 # Shared utilities
├── public/              # Static assets
├── docs/                # Planning docs and architecture
├── notes/               # Brainstorming and non-canonical strategy notes
├── ops/                 # Operational and archived notes
├── AGENTS.md            # Default instructions for coding agents
├── CLAUDE.md            # This file
├── CHANGELOG.md         # Cross-agent handover log
└── package.json
```
