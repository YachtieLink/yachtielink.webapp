# Onboarding — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Dark mode sidelined; Sprint 11 flagged as next sprint covering auth pages and welcome page redesign.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 01): Fixed legal page links in welcome page — `/legal/terms` → `/terms`, `/legal/privacy` → `/privacy`.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): `DeepLinkFlow.tsx` — added `mini-onboard` step for new/incomplete users writing endorsements (name, role, yacht dates); post-endorsement redirect to `/onboarding` for incomplete users.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): `SIGNUP_MODE` env var — `invite` gates `/welcome` and `/signup`; `/invite-only` static landing page created for pre-launch mode.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 3 close): Diagnosed onboarding handle step bug — `handle_available` and all other public RPC functions were missing `GRANT EXECUTE` to `anon`/`authenticated` roles, silently returning null and keeping Continue button permanently disabled. Migration `20260314000010_grant_rpc_execute.sql` applied as fix.

**2026-03-13** — Claude Code (Sonnet 4.6): Onboarding role step UX — department selection changed from multi-select to single-select; specialist roles (Nanny, Dive Instructor, etc.) moved behind collapsible "Other" toggle. Migration `20260313000008_add_crossdept_roles.sql` — added `Deck/Stew` and `Stew/Deck` roles.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): Built `app/(auth)/welcome/page.tsx` — landing/auth method selection (email only; Google/Apple commented as placeholders); onboarding wizard built as part of Sprint 2 scope.

**2026-03-13** — Claude Code (Opus 4.6): Feature spec for onboarding — email verification required for email/password accounts; department multi-select (7 departments); full seeded role list by department with "Other" tracking; CV import to be deferred to native app contacts import.

**2026-03-10** — Claude Code (Codex GUI): Restructured `AGENTS.md` — documented Sprint 2 onboarding flow: name → handle → department/role → yacht → endorsement requests → done.

## Backlog

- Cross-department roles in role step: `roles.department` is single text field; cross-department roles need `departments text[]` or join model for proper multi-dept filtering.
- Role list trim: secondary/specialist roles should be behind "Show more" toggle in onboarding; list is too long for quick onboarding flow.
