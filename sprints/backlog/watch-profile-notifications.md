---
title: Watch Profile — In-App Notifications + Email Digest
status: ready
source: founder (2026-03-27, grilled 2026-04-03)
priority: P4 (post-launch)
modules: [network, notifications, infrastructure]
estimated_effort: 6-8 hours (Opus, high effort — new notifications system)
grill_me_date: 2026-04-03
---

# Watch Profile — In-App Notifications + Email Digest

## Problem

"Watch" on saved profiles is just a boolean filter flag. No notifications are sent when a watched profile changes. Recruiters and captains save and watch candidates but have no way to know when something meaningful happens — they have to manually re-check profiles.

## Current State

| What | Where |
|------|-------|
| Watch toggle | Saved profiles page — boolean `is_watching` flag on `saved_profiles` table |
| Saved profiles | `app/(protected)/app/network/saved/page.tsx` |
| "Watching only" filter | Filters saved profiles by `is_watching = true` |

No notifications table, no notification UI, no email digests exist yet. This is greenfield.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | First delivery channel | **(a)** In-app notification badge first. Foundation for everything — needs notifications table + UI. Email digest as fast follow. |
| 2 | Email digest timing | Weekly summary of watched profile changes via Resend. Layers on top of in-app after it ships. |
| 3 | Notification triggers | Four: **new experience added, new certification added, new endorsement received, availability status changed.** Photo updates excluded (too minor/not actionable). |
| 4 | Notification grouping | **(a)** Batch by user per 15-minute window. CV import generates a burst — batch into one notification: "Charlotte updated their profile — 5 new certifications." Links to their profile. |
| 5 | Watcher visibility | **(a)** Watching is private. Watched users never know they're being watched. No "3 people watching your profile" metric. This is a recruiter tool. |

## Spec

### Phase 1: In-App Notifications (build first)

#### Task 1: Migration — notifications table

**File:** new migration

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'watched_profile_experience',
    'watched_profile_certification',
    'watched_profile_endorsement',
    'watched_profile_availability'
  )),
  -- The watched profile that changed
  source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Batch key: groups changes within a time window
  batch_key TEXT,
  -- Human-readable summary
  title TEXT NOT NULL,
  body TEXT,
  -- Link to the relevant page
  href TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: user read own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications: user update own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
```

#### Task 2: Notification generation logic

**File:** `lib/notifications/watch-triggers.ts` (new)

Function called after profile-changing actions:

```typescript
export async function notifyWatchers(
  supabase: SupabaseClient,
  changedUserId: string,
  changeType: 'experience' | 'certification' | 'endorsement' | 'availability',
  details?: { count?: number }
): Promise<void>
```

Logic:
1. Find all users watching this profile: `saved_profiles WHERE target_user_id = changedUserId AND is_watching = true`
2. For each watcher, check for existing unread notification from same `source_user_id` within 15 minutes (`batch_key` = `{source_user_id}:{15min_bucket}`)
3. If batch exists: update `body` to aggregate ("5 new certifications" instead of creating 5 rows)
4. If no batch: create new notification row

Title templates:
- Experience: "{Name} added a new role on {yacht}"
- Certification: "{Name} added {count} new certification(s)"
- Endorsement: "{Name} received a new endorsement"
- Availability: "{Name} is now available" / "{Name} updated their availability"

#### Task 3: Wire triggers into existing actions

Call `notifyWatchers()` from:
- `lib/cv/save-parsed-cv-data.ts` — after saving experience/certs (batch: count of items saved)
- Attachment create/edit API — when a new experience is added manually
- Certification create API — when a new cert is added manually
- Endorsement accept/create — when a new endorsement lands
- Availability status update — when the user changes their availability setting

**Important:** find the exact API routes/functions for each. Don't add to every possible write path — only the user-facing actions that represent meaningful changes.

#### Task 4: Notification bell UI

**File:** `components/notifications/NotificationBell.tsx` (new)

- Bell icon in the app header/nav
- Unread count badge (red dot with number, or just red dot if > 0)
- Tap opens a dropdown/sheet with notification list
- Each notification: avatar of the changed profile + title + relative time ("2h ago")
- Tap notification → navigates to `href`, marks as read
- "Mark all as read" action
- Empty state: "No notifications yet"

**File:** `app/api/notifications/route.ts` (new) — GET (list, paginated) + PATCH (mark read)

#### Task 5: Wire bell into app layout

**File:** `app/(protected)/app/layout.tsx` or the nav/header component

- Add `NotificationBell` to the app header, visible on all authenticated pages
- Fetch unread count on mount (lightweight query: `SELECT count(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`)

### Phase 2: Email Digest (fast follow)

#### Task 6: Weekly digest email

**File:** `lib/notifications/weekly-digest.ts` (new)

- Cron job (Vercel cron or Supabase pg_cron) runs weekly (Sunday evening)
- For each user with `is_watching = true` on any saved profile:
  - Collect all unread notifications from the past 7 days
  - Group by watched profile
  - Send one digest email via Resend: "3 profiles you're watching had updates this week"
- Only send if there are unread notifications (don't spam empty digests)
- Email links back to the app's notification list

**File:** `app/api/cron/weekly-digest/route.ts` (new) — triggered by Vercel cron

#### Task 7: Email preference

**File:** user settings or notification preferences

- Toggle: "Email me weekly updates about profiles I'm watching" (default: on)
- Stored on `users` table or a new `notification_preferences` table

## Edge Cases

- **Batch window** — 15 minutes. A CV import adding 10 certs + 5 yachts = 2 notifications (one for certs, one for experience), not 15.
- **User watches themselves** — shouldn't happen (UI prevents), but guard in the query: `WHERE target_user_id != watcher_user_id`
- **Deleted profiles** — `ON DELETE CASCADE` cleans up notifications when either user is deleted
- **High watcher count** — if a popular profile has 100 watchers, that's 100 notification inserts per change. Acceptable for MVP. If it becomes a bottleneck, move to a queue (pg_notify or background job).
- **Availability field** — need to identify where availability status lives in the schema. May be a field on `users` or a separate concept. Check before building.

## Not in scope

- Push notifications (service worker — Phase 3)
- Real-time notification updates (WebSocket/Supabase realtime — future)
- Notification preferences per trigger type (all-or-nothing for MVP)
- Watcher visibility to the watched user (private, per decision #5)
