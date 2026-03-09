# AGENTS.md

This file defines the default operating instructions for coding agents working in this repository.

## Startup Sequence

Before doing any substantive work, read these files in order:

1. `CLAUDE.md`
2. The latest 3 entries in `CHANGELOG.md`
3. `docs/yl_system_state.json`
4. `docs/yl_phase1_execution.md`
5. `docs/yl_build_plan.md`

Then read any additional `docs/` files directly relevant to the task.

## Current Source Of Truth

Treat these as canonical for the current build target:

- `docs/yl_system_state.json`
- `docs/yl_phase1_execution.md`
- `docs/yl_build_plan.md`
- `docs/yl_phase_scope.json`
- `docs/yl_principles.md`

If older or secondary docs conflict with these, follow the canonical set above unless the user explicitly says otherwise.

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

Do not build these unless the user explicitly asks for them:

- Recruiter access
- Peer hiring
- Timeline / posts / interactions
- Messaging / contacts
- IRL connection system
- Broad search / discovery

## Hard Product Rules

- The yacht graph is the current wedge and primary strategic asset.
- Trust outcomes are never monetised.
- Payment may improve presentation quality, workflow convenience, and later discovery efficiency.
- Payment must never grant moderation power, verified status, trust weighting, or endorsement eligibility.
- If incentives threaten trust integrity, prefer freezing or deferring the feature.

## Working Rules

- Update `CHANGELOG.md` at the end of every meaningful session.
- Keep changes aligned with the current Phase 1A scope unless explicitly redirected.
- When editing planning docs, preserve a single clear story across `CLAUDE.md`, `CHANGELOG.md`, and the canonical docs.
- Prefer narrow, high-leverage scope over broad speculative scope.
