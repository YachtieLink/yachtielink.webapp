# Sprint 11 — Feature Roadmap (SUPERSEDED)

> **SUPERSEDED:** This sprint has been deprioritised in favour of crew-facing polish (beautiful profiles, yacht graph, launch readiness). The feature roadmap is now a lighter deliverable inside [Sprint 13 — Launch Polish](../phase-1b/sprint-13/README.md). The build plan in this folder is still valid reference material for the roadmap tables and voting logic.

**Phase:** TBD (likely 1B)
**Status:** 🔁 Superseded → see Phase 1B Sprint 13
**Started:** —

## Goal

Add a community-driven public feature roadmap to the More tab. Pro users can vote and submit requests; free users read-only.

## Key Files

- [build_plan.md](./build_plan.md) — full implementation spec

## Scope

In: `roadmap_items`, `roadmap_votes`, `feature_requests`, `feature_request_votes` tables; API routes; full component suite; `/app/more/roadmap` route.

Out: admin CMS UI, email notifications for request status changes.

## Dependencies

- Pro subscription status on user record (Sprint 7)
- Zod validation + rate limiting (Sprint 8)
- `getProStatus()` utility in `lib/stripe/pro.ts`
- `UpgradeCTA` component

## Exit Criteria

- Roadmap visible to all users from More tab
- Pro users can vote and submit requests
- Free users see read-only view with upgrade prompt
- Admin can manage items via Supabase dashboard

## Notes

—
