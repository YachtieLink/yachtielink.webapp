# Reporting & Flagging — Trust Infrastructure

**Status:** idea
**Priority guess:** P2 (important — grows more urgent as graph becomes visible)
**Date captured:** 2026-03-22

## Summary

Users need a way to flag fake profiles, false yacht attachments, and other trust violations. Even without building the admin review UI, the database tables should exist so the feature can be added without a migration sprint.

Sprint 12 makes the yacht graph browsable — once users can see everyone on a yacht page, fake attachments become both noticeable and annoying. Having the reporting foundation ready means we can ship the "Flag" button quickly when needed.

## Scope

### Build (when ready)
- "Flag" action on profiles, attachments, and yacht pages
- Report form: target + reason (free text or category picker)
- Reports table stores all flags for admin review
- Admin dashboard to review, dismiss, or action reports (could be Supabase dashboard initially)

### Don't Build Yet
- Automated moderation / threshold-based actions
- Community voting / crew verification ("confirm this colleague worked here")
- Appeal process for actioned reports
- Email notifications to reporter on resolution

## Database (prework shipping in Sprint 12)

```sql
reports
├── id (uuid, PK)
├── reporter_id (FK to auth.users)
├── reported_at (timestamptz, default now())
├── target_type (text — 'attachment' | 'profile' | 'yacht')
├── target_id (uuid — polymorphic reference)
├── reason (text)
├── status (text — 'pending' | 'reviewed' | 'dismissed' | 'actioned')
├── reviewed_by (uuid, nullable — admin who reviewed)
└── reviewed_at (timestamptz, nullable)
```

Table created in Sprint 12 migration (empty, no UI).

## Future Considerations

- **Crew verification:** Lightweight "confirm this colleague" mechanism where crew on a yacht can vouch for each other. Different from endorsements — this is binary confirmation, not a written recommendation. Could reduce fake attachment problem.
- **Quorum-based yacht merge:** If 3+ crew from Yacht A say it's the same as Yacht B, auto-propose a merge. More robust than admin-only merging. Depends on having enough active users.
- **Role disputes:** Probably not worth solving directly. Endorsements are the natural credibility signal — a captain endorsed by 5 crew is more credible than one endorsed by nobody.

## Files Likely Affected

- `supabase/migrations/` — `reports` table (Sprint 12 prework)
- `app/api/report/route.ts` — new API route
- `components/ui/ReportButton.tsx` — reusable flag button
- Various pages — add ReportButton to profile, yacht detail, attachment views
