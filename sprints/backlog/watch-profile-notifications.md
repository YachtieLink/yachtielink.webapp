# Watch Profile — Push Notifications

**Status:** proposed
**Priority guess:** P4 (post-launch)
**Date captured:** 2026-03-27

## Summary
Currently "Watch" on saved profiles is just a filter flag (boolean toggle, filter by "Watching only"). No notifications are sent when a watched profile changes.

## Future Vision
When a watched profile updates, notify the watcher. Possible triggers:
- Profile updated (new experience, certs, skills)
- Availability status changed (e.g. "looking for work")
- New endorsement received
- Profile photo updated

Notification channels (in order of priority):
1. In-app notification badge (lowest effort)
2. Email digest (weekly summary of watched profile changes)
3. Push notification (highest effort, requires service worker)

## Notes
- This is post-launch. The current filter-only behaviour is fine for v1.
- Need to be careful about notification fatigue — batch changes, don't notify on every small edit
- Privacy consideration: watched users should not know they're being watched (it's a private recruiter feature)
