# Module State Files

Living documentation for each YachtieLink module. Agents update these when they touch a module.

## How to Use

- **At session start:** Read the state file(s) for modules you'll touch
- **Before committing:** Update the state file(s) you changed
- **When creating a new module:** Copy the format, add to this index

## Module Index

| Module | File | Status | Phase | Last Updated |
|--------|------|--------|-------|--------------|
| Analytics | [analytics.md](analytics.md) | shipped | 1A | 2026-03-21 |
| Auth | [auth.md](auth.md) | shipped | 1A | 2026-03-21 |
| Design System | [design-system.md](design-system.md) | shipped | 1A | 2026-03-21 |
| Employment | [employment.md](employment.md) | shipped | 1A | 2026-03-21 |
| Endorsements | [endorsements.md](endorsements.md) | shipped | 1A | 2026-03-21 |
| Infrastructure | [infrastructure.md](infrastructure.md) | shipped | 1A | 2026-03-25 |
| Network | [network.md](network.md) | shipped | 1A | 2026-03-21 |
| Onboarding | [onboarding.md](onboarding.md) | shipped | 1A | 2026-03-25 |
| Payments | [payments.md](payments.md) | shipped | 1A | 2026-03-21 |
| Profile | [profile.md](profile.md) | shipped | 1B | 2026-03-29 |
| Public Profile | [public-profile.md](public-profile.md) | shipped | 1B | 2026-03-28 |

## Update Rules

1. Update `status` in frontmatter if it changed (shipped / in-progress / planned / blocked)
2. Update `## Current State` with what you changed — mark features as working/broken/partial
3. Update `updated:` in frontmatter to today's date
4. Update `## Key Files` if you added/moved files
5. Update `## Next Steps` — check off completed items, add new ones
6. Update this README's module index if you changed a module's status or phase

## File Format

Each module has a **single consolidated file**: `{module-name}.md` (e.g., `auth.md`, `public-profile.md`).

The file contains: frontmatter → Current State → Key Files → Decisions (append-only) → Recent Activity (one-liners). No separate `.activity.md` or `.decisions.md` files — everything is in one place.

## Status Definitions

| Status | Meaning |
|--------|---------|
| **shipped** | Feature-complete for current phase, deployed, working |
| **in-progress** | Actively being built in current sprint |
| **planned** | Scoped and designed but not yet started |
| **blocked** | Cannot proceed due to dependency or decision needed |
