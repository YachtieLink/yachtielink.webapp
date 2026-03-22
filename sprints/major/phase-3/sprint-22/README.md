# Sprint 22 — Notifications + Multilingual

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 3
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 21 (contacts, messaging, Supabase Realtime, conversation_read_status, moderation_reports)

## Goal

Two infrastructure upgrades that fundamentally change how crew interact with the platform. First, an in-app notification system that replaces the email-only approach used since Sprint 2 — crew see a bell icon with a badge, a notification list with all platform activity, and real-time updates via Supabase Realtime (Sprint 21's infrastructure). This retroactively improves every feature that currently sends email only: endorsement requests, endorsement received, availability reminders, position applications, contact requests. Second, multilingual profile translation (AI-10) removes the language barrier from the entire platform — crew write in their native language, readers see it in theirs. This completes the multilingual stack started with AI-03 (endorsement request translation in Sprint 16).

## Scope

**In:**
- In-app notification system: `notifications` table, bell icon with unread badge, notification list page
- Real-time notification delivery via Supabase Realtime (reuse Sprint 21 WebSocket infrastructure)
- Notification types: endorsement request received, endorsement written for you, endorsement signal on your endorsement, contact request, new message, position application received, position status change, availability expiry reminder, cert expiry reminder (Pro)
- Email + in-app dual delivery: all notifications create an in-app record; email delivery governed by notification preferences (Sprint 15)
- Notification preferences integration: Sprint 15's `notification_preferences` jsonb now controls both email AND in-app per notification type
- Mark as read: individual and mark-all-read
- AI-10 Multilingual Profile Translation: auto-translate profile content for viewers with different preferred language
- Translation caching: per (content_hash, target_language) to avoid re-translating unchanged content
- "Translated from [language]" indicator with toggle to view original
- Priority languages: English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch

**Out:**
- Push notifications (requires native app — prepare the notification model to support push tokens, but don't build the push delivery channel)
- Notification grouping or digest (future — show all individual notifications for V1)
- Rich notification content (images, actions in notification) — text + deep link is sufficient
- Notification sound or vibration (browser tab notifications only — no custom sounds)
- Full-page multilingual UI (interface translation — only profile content is translated for now)
- Endorsement text translation display inline on profiles (AI-10 translates on-demand when viewer language differs — not pre-translated and stored)
- Translation of position descriptions or message content (future — focus on profile content first)
- Language auto-detection (rely on user's `preferred_language` setting — fallback to English)

## Dependencies

- Sprint 21 complete: Supabase Realtime infrastructure operational, `conversation_read_status` pattern established
- Sprint 16 complete: `lib/ai/openai-client.ts`, `lib/ai/cost-tracker.ts`, AI content moderation, `POST /api/ai/translate` endpoint (reuse for profile translation)
- Sprint 15 complete: `notification_preferences` jsonb on users table, notification preferences UI at `/app/more/notifications`
- Sprint 14 complete: availability expiry cron (currently sends email only — now also creates in-app notification)
- All existing email notification senders: endorsement request (Sprint 5), endorsement received (Sprint 5), availability reminder (Sprint 14), position application (Sprint 18), contact request (Sprint 21)
- `preferred_language` column on users table — exists from Sprint 16 (AI-03 dependency)
- Resend email infrastructure — continues alongside in-app (email is not replaced, it's supplemented)

## Key Deliverables

### Notification Data Model

- ⬜ `notifications` table:
  - `id` uuid PK
  - `user_id` uuid FK → users (the recipient)
  - `type` text NOT NULL (e.g., 'endorsement_request', 'endorsement_received', 'contact_request', 'new_message', 'position_application', 'position_status', 'availability_reminder', 'cert_expiry', 'endorsement_signal')
  - `title` text NOT NULL (short headline, e.g., "New endorsement from Captain James")
  - `body` text (detail text, 1–2 sentences)
  - `deep_link` text (relative URL to navigate to, e.g., `/app/endorsements/[id]`, `/app/messages/[conversation_id]`)
  - `actor_id` uuid FK → users (nullable — the person who triggered the notification, if applicable)
  - `entity_id` uuid (nullable — generic FK to the relevant entity: endorsement, position, conversation, etc.)
  - `entity_type` text (nullable — 'endorsement', 'position', 'conversation', 'contact', etc.)
  - `read` boolean DEFAULT false
  - `email_sent` boolean DEFAULT false (tracks whether the companion email was dispatched)
  - `created_at` timestamptz DEFAULT now()
- ⬜ Index: `notifications(user_id, read, created_at DESC)` for notification list queries
- ⬜ Index: `notifications(user_id, created_at DESC)` for unread count
- ⬜ RLS: users can only read and update their own notifications

### Notification Creation Service

- ⬜ `lib/notifications/create-notification.ts` — central function that:
  1. Creates the `notifications` record
  2. Checks `notification_preferences` for the user and notification type
  3. If email enabled for this type: dispatch via Resend (existing email infrastructure)
  4. Sets `email_sent = true` after successful dispatch
- ⬜ All existing email notification senders refactored to call this central function instead of directly calling Resend:
  - Endorsement request received (Sprint 5)
  - Endorsement written for you (Sprint 5)
  - Availability expiry reminder (Sprint 14)
  - Position application received (Sprint 18)
  - Position status change (Sprint 18)
  - Contact request (Sprint 21)
  - New message (Sprint 21 — optional, configurable: off by default to avoid email per message)
  - Cert expiry reminder (Sprint 7, Pro)
  - Endorsement signal on your endorsement (Sprint 14)
- ⬜ Notification preferences now control dual channels: each notification type has `in_app` (always true, cannot be disabled) and `email` (user-configurable per type)

### Real-Time Delivery

- ⬜ Supabase Realtime subscription on `notifications` table filtered by `user_id`
- ⬜ On new notification insert: push to active client immediately
- ⬜ Bell icon updates badge count without page refresh
- ⬜ Reuses the same Realtime infrastructure established in Sprint 21 for messaging

### Bell Icon + Badge

- ⬜ Bell icon in app header/nav bar (persistent across all pages)
- ⬜ Unread count badge: red circle with number (max display "99+")
- ⬜ `get_notification_unread_count(p_user_id uuid)` RPC — count of `read = false` notifications
- ⬜ Badge updates in real-time via Realtime subscription
- ⬜ Tap bell → navigate to notification list

### Notification List — `/app/notifications`

- ⬜ Reverse chronological list of all notifications
- ⬜ Notification item: actor photo (if applicable), title, body snippet, timestamp, unread indicator (blue dot)
- ⬜ Tap notification → mark as read + navigate to `deep_link`
- ⬜ "Mark all as read" action in header
- ⬜ Pagination: infinite scroll or "Load more" (30 per page)
- ⬜ Empty state: "No notifications yet"
- ⬜ Grouped by date: "Today", "Yesterday", "This week", "Earlier"

### Notification Preferences Update

- ⬜ Extend Sprint 15's `/app/more/notifications` page:
  - Each notification type now shows two toggles: "In-app" (always on, greyed out) and "Email" (user-configurable)
  - New notification types added: new message email (default: off), endorsement signal (default: on), contact request (default: on)
- ⬜ Update `notification_preferences` jsonb schema to support per-type channel configuration

### AI-10 — Multilingual Profile Translation

- ⬜ Trigger: when a viewer's `preferred_language` differs from the profile owner's `preferred_language`
- ⬜ Translatable fields: bio text, endorsement text, role descriptions
- ⬜ Non-translatable fields: names, yacht names, certification names (industry-standard terms)
- ⬜ Translation flow:
  1. Server component detects language mismatch
  2. Check translation cache: `profile_translations` table keyed by (content_hash, target_language)
  3. If cached and not stale: return cached translation
  4. If not cached: call GPT-4o Mini via `POST /api/ai/translate` (Sprint 16 endpoint, reused)
  5. Store translation in cache with `content_hash` + `target_language`
  6. Return translated content
- ⬜ Cache invalidation: when profile content changes, delete cached translations for that content hash (new hash on edit means old cache entries become orphans — clean up via nightly cron)
- ⬜ `profile_translations` table:
  - `id` uuid PK
  - `content_hash` text NOT NULL (SHA-256 of original text)
  - `source_language` text NOT NULL
  - `target_language` text NOT NULL
  - `original_text` text NOT NULL
  - `translated_text` text NOT NULL
  - `created_at` timestamptz DEFAULT now()
- ⬜ Unique constraint: `profile_translations(content_hash, target_language)`
- ⬜ UI indicator: small "Translated from [language]" label below translated text
- ⬜ Toggle: "View original" link switches to original language text (client-side toggle, both versions available)
- ⬜ Priority languages (10): English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch
- ⬜ Fallback: if translation fails or language unsupported, show original text without error
- ⬜ Cost: ~EUR 0.001/profile view with translation (GPT-4o Mini)
- ⬜ Free for all users — translation benefits the entire ecosystem (D-007: improves presentation, not trust)
- ⬜ Log to `ai_usage_log` (Sprint 16)

### Endorsement Text Translation

- ⬜ Endorsements on a profile page translated alongside the bio when language mismatch is detected
- ⬜ Each endorsement text cached independently (separate content_hash per endorsement)
- ⬜ Endorsement card shows: translated text + "Translated from [language]" + "View original" toggle
- ⬜ Batch translation: when a profile has 5+ endorsements, translate in a single API call with multiple texts to reduce latency

### Database Migration

- ⬜ `CREATE TABLE notifications (id uuid PK, user_id uuid FK, type text NOT NULL, title text NOT NULL, body text, deep_link text, actor_id uuid FK, entity_id uuid, entity_type text, read boolean DEFAULT false, email_sent boolean DEFAULT false, created_at timestamptz DEFAULT now())`
- ⬜ Index: `notifications(user_id, read, created_at DESC)`
- ⬜ `CREATE TABLE profile_translations (id uuid PK, content_hash text NOT NULL, source_language text NOT NULL, target_language text NOT NULL, original_text text NOT NULL, translated_text text NOT NULL, created_at timestamptz DEFAULT now())`
- ⬜ Unique index: `profile_translations(content_hash, target_language)`
- ⬜ `get_notification_unread_count(p_user_id uuid)` RPC
- ⬜ Enable Supabase Realtime on `notifications` table
- ⬜ RLS: users read/update own notifications; profile_translations readable by all authenticated users
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `notification_created` with type, has_email (whether email was also sent)
- ⬜ `notification_tapped` with type, time_since_created (engagement latency)
- ⬜ `notifications_mark_all_read` with unread_count
- ⬜ `profile_translation_triggered` with source_language, target_language, cache_hit (bool)
- ⬜ `profile_translation_original_viewed` (user toggled to see original)
- ⬜ `endorsement_batch_translated` with endorsement_count, target_language

## Exit Criteria

- Bell icon visible in app header on all pages with accurate unread badge
- Notification list shows all notification types in reverse chronological order
- Tap notification → mark as read + navigate to relevant page
- Real-time: new notifications appear without page refresh
- All existing email notifications also create in-app notifications
- Notification preferences control email delivery per type; in-app is always on
- Profile translation: viewer sees translated bio and endorsements when language differs
- Translation cached per (content_hash, target_language) — no re-translation of unchanged content
- "Translated from [language]" indicator with "View original" toggle
- Priority 10 languages supported; others attempted with fallback to original
- Endorsement batch translation reduces latency for profiles with many endorsements
- All components work at 375px width (mobile-first)
- PostHog events firing for notification lifecycle and translation
- AI cost tracked in `ai_usage_log`; translation cost <EUR 0.001/profile view

## Estimated Effort

8–10 days

## Notes

**The notification system is retroactive infrastructure.** Every feature since Sprint 2 that sends an email now also creates an in-app notification. This is a refactoring task as much as a new feature — all existing `sendEmail()` call sites need to be replaced with `createNotification()` which handles both channels. The central notification function is the right abstraction: it ensures every future feature gets dual-channel delivery for free.

**Push notifications are architecturally prepared but not built.** The `notifications` table is designed to support push tokens in the future: add a `push_sent` boolean and a `device_tokens` table when the native app ships. The notification creation service can add a push delivery channel without changing the data model. Sprint 22 builds the plumbing; the native app plugs in later.

**AI-10 is the second half of the multilingual stack.** Sprint 16 shipped AI-03 (endorsement request email translation). Sprint 22 ships AI-10 (profile content translation for viewing). Together, they remove language barriers from the two key flows: requesting endorsements across languages, and reading profiles across languages. The next logical step (not in scope) would be message translation — but that's higher cost and lower priority.

**Translation caching is essential for cost control.** A popular profile viewed 100 times by French-speaking users should translate the bio once, not 100 times. The `content_hash` approach means the cache self-invalidates on content change (new text → new hash → cache miss → fresh translation). Stale cache entries (old hashes) can be cleaned up by a weekly cron that deletes entries with no matching current content.

**Hardest technical challenge:** Batch translation of endorsements. A profile with 10 endorsements from colleagues who wrote in English, viewed by a French speaker, needs 10 translations. Naive sequential API calls add 5–10 seconds of latency. The batch approach (send all 10 texts in a single GPT-4o Mini call) keeps latency under 2 seconds. The API prompt needs to handle multiple texts cleanly — return a JSON array of translations matched to the input order.

**Notification fatigue risk.** With in-app notifications for everything (endorsements, messages, contacts, positions, availability, certs), active users could get 20+ notifications per day. The notification preferences page is the safety valve — crew can disable email for noisy types while keeping in-app. The build plan should set sensible defaults: message email notifications OFF by default (messages have their own unread badge), endorsement signal notifications email OFF (low-priority signal), everything else email ON.

**Next sprint picks up:** Sprint 23 introduces the chronological timeline (D-030, D-031) — career milestones, network-bounded posts, and IRL connections (D-028, D-032). The notification system built in Sprint 22 provides the delivery infrastructure for timeline activity: "Your colleague posted a career milestone", "Someone confirmed your IRL connection."
