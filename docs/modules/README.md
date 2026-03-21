# Module State Files

Living documentation for each YachtieLink module. Agents update these when they touch a module.

## How to Use

- **At session start:** Read the state file(s) for modules you'll touch
- **Before committing:** Update the state file(s) you changed
- **When creating a new module:** Copy the format, add to this index

## Module Index

| Module | File | Status | Phase | Last Updated |
|--------|------|--------|-------|--------------|
| Auth | [auth.md](auth.md) | shipped | 1A | 2026-03-21 |
| Profile | [profile.md](profile.md) | shipped | 1A | 2026-03-21 |
| Employment | [employment.md](employment.md) | shipped | 1A | 2026-03-21 |
| Endorsements | [endorsements.md](endorsements.md) | shipped | 1A | 2026-03-21 |
| Onboarding | [onboarding.md](onboarding.md) | shipped | 1A | 2026-03-21 |
| Public Profile | [public-profile.md](public-profile.md) | shipped | 1A | 2026-03-21 |
| Analytics | [analytics.md](analytics.md) | — | — | — |
| Network | [network.md](network.md) | — | — | — |
| Payments | [payments.md](payments.md) | — | — | — |
| Design System | [design-system.md](design-system.md) | — | — | — |

## Update Rules

1. Update `status` in frontmatter if it changed (shipped / in-progress / planned / blocked)
2. Update `## Current State` with what you changed — mark features as working/broken/partial
3. Update `updated:` in frontmatter to today's date
4. Update `## Key Files` if you added/moved files
5. Update `## Next Steps` — check off completed items, add new ones
6. Update this README's module index if you changed a module's status or phase

## File Naming Convention

- Module state files: `{module-name}.md` (e.g., `auth.md`, `public-profile.md`)
- Decision logs: `{module-name}.decisions.md` (pre-existing files in this directory)
- Activity logs: `{module-name}.activity.md` (pre-existing files in this directory)

## Status Definitions

| Status | Meaning |
|--------|---------|
| **shipped** | Feature-complete for current phase, deployed, working |
| **in-progress** | Actively being built in current sprint |
| **planned** | Scoped and designed but not yet started |
| **blocked** | Cannot proceed due to dependency or decision needed |
