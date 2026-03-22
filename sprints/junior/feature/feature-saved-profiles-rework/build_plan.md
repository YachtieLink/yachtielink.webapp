# Sprint 11.3 — Saved Profiles Rework: Build Plan

## Summary

Upgrade saved profiles from a bare name+photo list to rich, actionable cards with private notes, availability watch toggle, relationship context, and sort/filter. No new tables — only 2 new columns on `saved_profiles` and richer queries.

---

## Migration

**File:** `supabase/migrations/20260322000002_saved_profiles_enrich.sql`

```sql
ALTER TABLE saved_profiles
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS watching boolean DEFAULT false;

COMMENT ON COLUMN saved_profiles.notes IS 'Private notes visible only to the saver';
COMMENT ON COLUMN saved_profiles.watching IS 'Watch for availability changes (Sprint 14 wires notifications)';
```

No RLS changes needed — existing policies already restrict saved_profiles to `user_id = auth.uid()`.

---

## API Changes

### PATCH `/api/saved-profiles/[id]/route.ts`

**Current:** Only accepts `{ folder_id }`.
**Change:** Also accept `{ notes, watching }`.

```typescript
// Update moveToFolderSchema → savedProfileUpdateSchema
export const savedProfileUpdateSchema = z.object({
  folder_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).optional(),
  watching: z.boolean().optional(),
});
```

Update the handler to merge all provided fields into the update object.

### GET `/api/saved-profiles/route.ts`

**Current query select:** `id, folder_id, created_at, saved_user:users!saved_user_id(id, display_name, full_name, handle, profile_photo_url, primary_role)`

**New select — add:**
- `notes, watching` from saved_profiles
- `departments, location_country` from joined user
- Certifications count or top 2 cert names (separate query or subselect)

**New query params:**
- `sort` — `recent` (default) | `name` | `role`
- `department` — filter by department (array contains)
- `watching_only` — boolean, filter to watching=true

### Relationship context

The saved profiles page needs to know if the viewer is a colleague of each saved user (shared yacht). Current `getViewerRelationship` runs per-profile which would be N+1.

**Solution:** Batch query — fetch all yacht_crew entries for the viewer, then for each saved user check overlap. This is a single query:

```sql
SELECT DISTINCT sc2.user_id
FROM yacht_crew sc1
JOIN yacht_crew sc2 ON sc1.yacht_id = sc2.yacht_id
WHERE sc1.user_id = $viewer_id
AND sc2.user_id = ANY($saved_user_ids)
```

Add this as `getColleagueOverlap(viewerId, userIds[])` in `lib/queries/profile.ts`.

### Top certifications

Fetch top 2 certs per saved user in a single query:

```sql
SELECT user_id, name
FROM certifications
WHERE user_id = ANY($saved_user_ids)
ORDER BY user_id, sort_order
```

Then group and slice to 2 per user in JS.

Add as `getTopCertsForUsers(userIds[])` in `lib/queries/profile.ts`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/20260322000002_saved_profiles_enrich.sql` | Migration |
| `components/network/SavedProfileCard.tsx` | Rich card component |
| `components/network/SavedProfileNoteEditor.tsx` | Inline note editor |
| `components/network/SavedProfileFilters.tsx` | Sort + filter row |

## Files to Modify

| File | Change |
|------|--------|
| `app/api/saved-profiles/[id]/route.ts` | Accept notes + watching |
| `app/api/saved-profiles/route.ts` | Add sort/filter params, enrich query |
| `app/(protected)/app/network/saved/SavedProfilesClient.tsx` | Full rewrite — use new card + filters |
| `app/(protected)/app/network/saved/page.tsx` | Pass enriched data |
| `lib/queries/profile.ts` | Add `getColleagueOverlap`, `getTopCertsForUsers`, enrich `getSavedProfiles` |
| `lib/validation/schemas.ts` | Rename moveToFolderSchema → savedProfileUpdateSchema |

---

## Component Specs

### SavedProfileCard

```typescript
interface SavedProfileCardProps {
  saved: {
    id: string
    notes: string | null
    watching: boolean
    created_at: string
    folder_id: string | null
  }
  user: {
    id: string
    display_name: string | null
    full_name: string
    handle: string
    profile_photo_url: string | null
    primary_role: string | null
    departments: string[] | null
    location_country: string | null
  }
  isColleague: boolean
  sharedYachtName?: string | null
  topCerts: string[]
  folders: Array<{ id: string; name: string; emoji?: string | null }>
  onUpdate: (id: string, patch: Partial<{ notes: string; watching: boolean; folder_id: string | null }>) => void
  onUnsave: (id: string) => void
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ [Photo]  Name · Primary Role             │
│          Dept · 🇫🇷 France               │
│          Colleague via SY Serenity  OR   │
│          STCW · OOW 500GT               │
│                                          │
│  [📝 Note] [👁 Watch] [📁 Folder ▾] [→] │
│                                          │
│  "Met in Palma 2025, good bosun..."      │  ← note preview (if set)
└──────────────────────────────────────────┘
```

### SavedProfileNoteEditor

Inline expanding textarea. Appears when note icon is clicked. Auto-saves on blur with debounce (500ms). Max 2000 chars. Controlled component with optimistic update.

### SavedProfileFilters

```
[Sort: Recently saved ▾]  [Dept ▾]  [Watching only ☐]
```

Controlled by parent, emits filter state changes.

---

## Implementation Order

1. **Migration** — add columns
2. **Validation schema** — update savedProfileUpdateSchema
3. **API routes** — update PATCH handler + GET query with sort/filter
4. **Query helpers** — getColleagueOverlap, getTopCertsForUsers
5. **SavedProfileCard** — new component
6. **SavedProfileNoteEditor** — inline editor
7. **SavedProfileFilters** — sort/filter row
8. **SavedProfilesClient** — rewrite to use new components
9. **Server page** — pass enriched data

Steps 5–7 are independent and can be built in parallel.

---

## Edge Cases

- User with no saved profiles → empty state (already exists, keep it)
- Saved user deletes their account → FK cascade removes the saved_profiles row
- Note is null vs empty string → treat both as "no note"
- Colleague check returns no shared yachts → don't show relationship line
- No certs → don't show cert line
- Sort by name → use display_name ?? full_name

---

## Testing Checklist

- [ ] Migration runs clean on fresh DB
- [ ] PATCH /api/saved-profiles/[id] accepts and persists notes
- [ ] PATCH /api/saved-profiles/[id] accepts and persists watching
- [ ] GET /api/saved-profiles returns notes, watching, departments, location
- [ ] Sort by recent/name/role works
- [ ] Department filter works
- [ ] Watching-only filter works
- [ ] Card shows relationship context for colleagues
- [ ] Card shows top 2 certs
- [ ] Note editor saves on blur
- [ ] Note is private (RLS: other users can't see it)
- [ ] Watch toggle saves immediately
- [ ] Build passes clean
