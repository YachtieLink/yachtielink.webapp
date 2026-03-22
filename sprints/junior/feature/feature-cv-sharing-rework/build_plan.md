# Build Plan — Sprint 11.2: CV & Sharing Rework + Contact Prefill + Country Picker

## Review Fixes Applied

Issues found by Sonnet reviewer — all resolved in this plan:

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| C1 | CRITICAL | Bucket name `generated-cvs` does not exist | Fixed → `pdf-exports` |
| C2 | CRITICAL | `getUserByHandle` doesn't fetch cv fields | Added explicit instructions to update query + interface |
| H1 | HIGH | CvActions prop change must be atomic with server component | Grouped as atomic change in Wave 3 |
| H2 | HIGH | `saveCvSettings` has no error handling | Added optimistic rollback + toast |
| H3 | HIGH | Can set source to `uploaded` with no uploaded CV | Added guard in API route |
| H5 | HIGH | Phone `tel:` → `sms:` is a regression on desktop | Keep `tel:` for phone, only prefill email + WhatsApp |
| M1 | MEDIUM | `Select` import removal should be definitive | Stated definitively |
| M2 | MEDIUM | `onChange` signature change needs callout | Added explicit note |
| M3 | MEDIUM | Three-way atomic change not grouped | Grouped in Wave 3 atomic section |

---

## Migration

**File:** `supabase/migrations/20260322000001_cv_sharing_settings.sql`

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cv_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS cv_public_source text DEFAULT 'generated'
    CHECK (cv_public_source IN ('generated', 'uploaded'));

COMMENT ON COLUMN users.cv_public IS 'Whether CV is downloadable from public profile';
COMMENT ON COLUMN users.cv_public_source IS 'Which CV to serve on public profile: generated PDF or uploaded file';
```

No RLS changes — these columns are on the `users` table which already has row-level policies for owner access.

---

## Wave 1 — Searchable Country Picker (standalone, no dependencies)

### New Component: `components/ui/SearchableSelect.tsx`

A reusable searchable dropdown. Props:

```typescript
interface SearchableSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  pinnedOptions?: { value: string; label: string }[]  // shown at top with divider
  placeholder?: string
  className?: string
}
```

**Behaviour:**
- Renders as an input field with a dropdown list below
- Typing filters the list (case-insensitive substring match)
- `pinnedOptions` appear at the top above a visual divider, always visible regardless of filter
- Clicking an option or pressing Enter selects it, closes dropdown
- Clicking outside or pressing Escape closes dropdown
- Shows selected value in the input when not focused
- Follows existing design tokens (`--color-surface`, `--color-border`, `--color-interactive`, etc.)
- `z-50` on dropdown to sit above other form elements

### Modify: `app/(protected)/app/profile/settings/page.tsx`

**Lines 14-39:** Extract `COUNTRIES` array into `lib/constants/countries.ts` for reuse. Add pinned countries:

```typescript
// lib/constants/countries.ts
export const PINNED_COUNTRIES = ['France', 'Italy', 'Spain', 'United States', 'United Kingdom', 'Greece', 'Croatia', 'Monaco']
export const ALL_COUNTRIES = [ /* existing sorted list */ ]
```

**Lines 247-257:** Replace native `<Select>` with `<SearchableSelect>`:

```tsx
<SearchableSelect
  label="Country"
  value={form.location_country}
  onChange={(v) => set('location_country', v)}
  options={ALL_COUNTRIES.map(c => ({ value: c, label: c }))}
  pinnedOptions={PINNED_COUNTRIES.map(c => ({ value: c, label: c }))}
  placeholder="Search countries..."
  className="flex-1"
/>
```

**Import change:** Add `import { SearchableSelect } from '@/components/ui/SearchableSelect'` and `import { ALL_COUNTRIES, PINNED_COUNTRIES } from '@/lib/constants/countries'`. Remove the `COUNTRIES` inline array (lines 14-39) and the `Select` import — `Select` is only used once on this page (for country) and is fully replaced by `SearchableSelect`.

**⚠️ Signature change:** The existing `Select` uses `onChange={(e) => set('location_country', e.target.value)}` (event-based). `SearchableSelect` uses `onChange={(v) => set('location_country', v)}` (value directly). Do not copy the old `onChange` pattern.

---

## Wave 2 — Contact Link Prefill (standalone, no dependencies)

### Modify: `components/public/PublicProfileContent.tsx`

**Lines 284-294:** Update contact links to include prefilled intro messages. Use first name only: `displayName.split(' ')[0]`.

```tsx
// Derive firstName near the top of the render function (around line 118 where displayName is set)
const firstName = displayName.split(' ')[0]

// Email — add subject + body
<a href={`mailto:${user.email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`}
   className="text-sm text-[var(--color-interactive)] hover:underline">
  {user.email}
</a>

// Phone — keep tel: (sms: breaks on desktop, and people calling is fine)
// No prefill for phone — tel: doesn't support body params
<a href={`tel:${user.phone}`}
   className="text-sm text-[var(--color-text-primary)]">
  {user.phone}
</a>

// WhatsApp — add text param
<a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink. `)}`}
   target="_blank" rel="noopener noreferrer"
   className="text-sm text-[var(--color-interactive)] hover:underline">
  WhatsApp: {user.whatsapp}
</a>
```

**Note:** `encodeURIComponent` is critical — names with special characters (e.g. accents) would break the URL otherwise.

---

## Wave 3 — CV & Sharing Page Rework

**⚠️ ATOMIC WAVE — all changes in this wave must be applied together.** The `CvActions` interface change, the `cv/page.tsx` query update, the `ShareModal` component, and the `getUserByHandle` update are interdependent. A partial apply will cause TypeScript build failures or silent feature breakage.

### Modify: `app/(protected)/app/cv/page.tsx`

Fetch additional fields: `cv_storage_path`, `cv_public`, `cv_public_source`. Pass to `CvActions`.

```typescript
const { data: profile } = await supabase
  .from('users')
  .select('id, handle, latest_pdf_path, latest_pdf_generated_at, cv_storage_path, cv_public, cv_public_source, subscription_status')
  .eq('id', authUser.id)
  .single()
```

Pass new props:
```tsx
<CvActions
  handle={profile.handle!}
  hasPdf={!!profile.latest_pdf_path}
  pdfGeneratedAt={profile.latest_pdf_generated_at}
  hasUploadedCv={!!profile.cv_storage_path}
  cvPublic={profile.cv_public ?? true}
  cvPublicSource={profile.cv_public_source ?? 'generated'}
  isPro={profile.subscription_status === 'pro'}
/>
```

### Modify: `components/cv/CvActions.tsx`

**Full restructure** of the component. New layout (top to bottom):

1. **QR Code card** — always visible, no toggle
   - Branded card with QR code, profile URL text, download QR button
   - Note: "Customisable QR coming soon"

2. **Share Profile button** — opens full-screen modal (new component)

3. **CV section** — two sub-cards
   - **Generated CV card:** status (generated/not yet), download button, regenerate with date
   - **Uploaded CV card:** filename or empty state, view button (signed URL), replace button
   - Template selector stays below (unchanged)

4. **Public download toggle** — toggle + radio sub-options
   - "Make CV downloadable from public profile" toggle
   - When on: radio for "Generated PDF" / "Uploaded CV"
   - Saves via `PATCH /api/user/cv-settings`

**New props interface:**
```typescript
interface CvActionsProps {
  handle: string
  hasPdf: boolean
  pdfGeneratedAt?: string | null
  hasUploadedCv: boolean
  cvPublic: boolean
  cvPublicSource: 'generated' | 'uploaded'
  isPro: boolean
}
```

**New state:**
```typescript
const [cvPublic, setCvPublic] = useState(props.cvPublic)
const [cvPublicSource, setCvPublicSource] = useState(props.cvPublicSource)
```

**Save function for cv settings (optimistic with rollback):**
```typescript
async function saveCvSettings(pub: boolean, source: 'generated' | 'uploaded') {
  const prevPub = cvPublic
  const prevSource = cvPublicSource
  setCvPublic(pub)
  setCvPublicSource(source)
  try {
    const res = await fetch('/api/user/cv-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv_public: pub, cv_public_source: source }),
    })
    if (!res.ok) throw new Error('Save failed')
    toast('Settings saved', 'success')
  } catch {
    setCvPublic(prevPub)
    setCvPublicSource(prevSource)
    toast('Could not save settings', 'error')
  }
}
```

### New Component: `components/cv/ShareModal.tsx`

Full-screen overlay triggered by "Share Profile" button.

```typescript
interface ShareModalProps {
  handle: string
  displayName: string
  primaryRole?: string | null
  departments?: string[] | null
  profilePhotoUrl?: string | null
  onClose: () => void
}
```

**Layout:**
- Dark overlay backdrop (`bg-black/80 backdrop-blur-sm`)
- Centered card with:
  - Close button (top right)
  - Profile photo (120px circle)
  - Name (DM Serif Display, large)
  - Role · Department (subtitle)
  - Large QR code (240px, `react-qr-code`)
  - `yachtie.link/u/{handle}` text
  - Share button → `navigator.share({ url, title })` with clipboard fallback
- Responsive: fills viewport on mobile, max-width card on desktop

**Data source:** `CvActions` doesn't have `displayName`, `primaryRole`, etc. The server component `cv/page.tsx` needs to fetch and pass these. Add to the query:

```typescript
.select('id, handle, full_name, display_name, primary_role, departments, profile_photo_url, latest_pdf_path, latest_pdf_generated_at, cv_storage_path, cv_public, cv_public_source, subscription_status')
```

Pass to CvActions:
```tsx
displayName={profile.display_name || profile.full_name}
primaryRole={profile.primary_role}
departments={profile.departments}
profilePhotoUrl={profile.profile_photo_url}
```

### New Route: `app/api/user/cv-settings/route.ts`

```typescript
// PATCH — update cv_public and cv_public_source
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { cv_public, cv_public_source } = body

  // Validate cv_public_source
  if (cv_public_source && !['generated', 'uploaded'].includes(cv_public_source)) {
    return NextResponse.json({ error: 'Invalid cv_public_source' }, { status: 400 })
  }

  // Guard: can't set source to 'uploaded' if no CV is uploaded
  if (cv_public_source === 'uploaded') {
    const { data: profile } = await supabase
      .from('users')
      .select('cv_storage_path')
      .eq('id', user.id)
      .single()
    if (!profile?.cv_storage_path) {
      return NextResponse.json({ error: 'No uploaded CV to share' }, { status: 400 })
    }
  }

  const update: Record<string, unknown> = {}
  if (typeof cv_public === 'boolean') update.cv_public = cv_public
  if (cv_public_source) update.cv_public_source = cv_public_source

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

### Modify: `components/public/PublicProfileContent.tsx`

**Add CV download button** to the public profile (conditional on `cv_public`).

**⚠️ ATOMIC CHANGE — these must all happen together or the feature silently breaks:**

1. **`lib/queries/profile.ts`** — update `getUserByHandle` select to include: `cv_public, cv_public_source, latest_pdf_path, cv_storage_path`
2. **`components/public/PublicProfileContent.tsx`** — add to `UserProfile` interface:
   ```typescript
   cv_public?: boolean
   cv_public_source?: string
   latest_pdf_path?: string | null
   cv_storage_path?: string | null
   ```
3. Then render the download button (below). If step 1 or 2 is skipped, `user.cv_public` is always `undefined` (falsy) and the button never renders — no error, just silent failure.

Render a download button in the contact section or as a standalone card:

```tsx
{user.cv_public && (user.latest_pdf_path || user.cv_storage_path) && (
  <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border-subtle)]">
    <a href={`/api/cv/public-download/${user.handle}`}
       className="flex items-center gap-2 text-sm text-[var(--color-interactive)] hover:underline">
      <Download size={16} /> Download CV
    </a>
  </div>
)}
```

### New Route: `app/api/cv/public-download/[handle]/route.ts`

Serves the correct CV (generated or uploaded) based on the user's `cv_public_source` setting. Returns a redirect to a signed URL.

```typescript
export async function GET(req: NextRequest, { params }: { params: { handle: string } }) {
  const serviceClient = createServiceClient()

  const { data: user } = await serviceClient
    .from('users')
    .select('cv_public, cv_public_source, latest_pdf_path, cv_storage_path')
    .eq('handle', params.handle)
    .single()

  if (!user || !user.cv_public) {
    return NextResponse.json({ error: 'CV not available' }, { status: 404 })
  }

  const path = user.cv_public_source === 'uploaded' ? user.cv_storage_path : user.latest_pdf_path
  if (!path) return NextResponse.json({ error: 'No CV found' }, { status: 404 })

  const bucket = user.cv_public_source === 'uploaded' ? 'cv-uploads' : 'pdf-exports'
  const { data } = await serviceClient.storage.from(bucket).createSignedUrl(path, 60)
  if (!data?.signedUrl) return NextResponse.json({ error: 'Could not generate link' }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
```

---

## Files Summary

| File | Action | Wave |
|------|--------|------|
| `supabase/migrations/20260322000001_cv_sharing_settings.sql` | Create | Pre-build |
| `lib/constants/countries.ts` | Create | 1 |
| `components/ui/SearchableSelect.tsx` | Create | 1 |
| `app/(protected)/app/profile/settings/page.tsx` | Modify (country picker) | 1 |
| `components/public/PublicProfileContent.tsx` | Modify (contact prefill + CV download) | 2 + 3 |
| `app/(protected)/app/cv/page.tsx` | Modify (fetch new fields, pass to CvActions) | 3 |
| `components/cv/CvActions.tsx` | Major rewrite (new layout, new props) | 3 |
| `components/cv/ShareModal.tsx` | Create | 3 |
| `app/api/user/cv-settings/route.ts` | Create | 3 |
| `app/api/cv/public-download/[handle]/route.ts` | Create | 3 |

---

## Exit Criteria

- [ ] Country picker: pinned countries at top, type-ahead search, works on mobile
- [ ] Contact prefill: email opens with subject + body, WhatsApp opens with text, SMS opens with body — all use first name only
- [ ] QR always visible on CV page (no toggle)
- [ ] Share modal: full-screen, photo + name + role + QR + native share + copy fallback
- [ ] Generated CV: viewable, downloadable, regenerate with updated date
- [ ] Uploaded CV: viewable, replaceable (single file)
- [ ] Public download toggle: saves to DB, persists on reload
- [ ] Sub-option (generated vs uploaded) only visible when toggle is on
- [ ] Public profile: download button appears only when `cv_public = true`
- [ ] Public download route: serves correct CV via signed URL, 404 when disabled
- [ ] Build passes, no TypeScript errors
- [ ] Responsive: works on mobile and desktop

---

## Rollback Plan

- Migration: `ALTER TABLE users DROP COLUMN cv_public, DROP COLUMN cv_public_source;`
- Revert `CvActions.tsx` to pre-rework version
- Remove new files: `ShareModal.tsx`, `SearchableSelect.tsx`, `cv-settings/route.ts`, `public-download/route.ts`, `countries.ts`
- Revert contact link changes in `PublicProfileContent.tsx`
