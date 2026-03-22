# Feature: Saved profiles rework

**Started:** 2026-03-22
**Status:** ⚡ Planned
**Complexity:** High — new DB columns, rich card UI, notes system, relationship context

---

## Problem

Saved profiles currently shows a name and photo with no context. There's no reason to save a profile because you get nothing from it — you can't annotate, filter, or act on saved profiles in any meaningful way.

---

## What It Should Do

### 1. Rich profile cards (not just name + photo)

Each saved profile card should surface:
- Name, role, department (already have this)
- **Relationship context** — are they a colleague? Shared yacht? Mutual connection? (same logic as public profile viewer relationship)
- **Availability status** (when Sprint 14 lands — flag as "Watch for availability" placeholder for now)
- **Last active / joined date** — gives a signal on profile freshness
- **Cert highlights** — 1–2 key certs shown inline (e.g. STCW, OOW)
- **Direct link** to their public profile

### 2. Private notes

Each saved profile gets a private notes field — visible only to the saver, never to the saved person.

- Tap a note icon on the card to open a text input
- Notes saved to `saved_profiles` table (new `notes text` column)
- No character limit enforced but keep UI compact (multi-line, auto-resize)
- Use cases: "Met in Palma 2025", "Good bosun, reliable", "Follow up re: season"

### 3. Availability watch (placeholder, Sprint 14)

A "Watch for availability" toggle per saved profile.

- For now: show the toggle, save the preference (`watching boolean DEFAULT false` on `saved_profiles`)
- Sprint 14 will wire up the actual notification when the person marks themselves available
- Show a "Notify me when available" badge on the card if watching is on

### 4. Folders (already exists — improve UX)

Folders exist but are buried. Surface them better:
- Folder filter tabs at the top of the saved list
- "Move to folder" on each card (quick action)
- "Add folder" inline button

### 5. Sort + filter

- Sort: Recently saved / Name A–Z / Role
- Filter: By folder / By department / Watching only

---

## Data Changes

`saved_profiles` table — new columns:
- `notes text` — private notes
- `watching boolean DEFAULT false` — availability watch flag

API: `PATCH /api/saved-profiles/[id]` — already exists, add `notes` and `watching` to the schema/handler.

---

## UI Structure

```
[Folder tabs: All | Shortlist | Bosuns | + Add]

[Sort/filter row]

[Card]
  Photo | Name · Role
        | Dept · Colleague via SY Serenity
        | STCW · OOW 500GT
        | [Note icon] [Watch toggle] [→ Profile]
        | Private note preview (if set): "Met in Palma..."
```

---

## Out of Scope

- Sharing saved lists with others — future
- Availability notifications — Sprint 14 wires this up
- Bulk actions (select multiple, move to folder) — future

---

## Verification Checklist

- [ ] Card shows role, dept, relationship context
- [ ] Private note saves and persists per saved profile
- [ ] Note visible only to the saver (RLS check)
- [ ] Watch toggle saves to DB
- [ ] Folder tabs filter the list correctly
- [ ] Sort options work
- [ ] Direct link to public profile works from card
