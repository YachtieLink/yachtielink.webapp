# Sprint 10.3: Page Layout & IA — Detailed Build Plan

> **Single source of truth.** All implementation details for sprint 10.3. The README.md has the what/why — this file has the how.

---

## Pre-work (DONE in this session)

These changes are already applied:

1. **Tab color uniqueness** — `lib/section-colors.ts` and `lib/nav-config.ts` updated. Each tab has a unique color: Profile=teal, CV=amber, Insights=coral, Network=navy, More=sand.
2. **Insights title font** — changed from `font-serif text-xl` to `text-[28px] font-bold tracking-tight` sans-serif.
3. **Insights blur removed** — TeaserCard no longer blurs content. Shows readable text with inline "Pro" badge.
4. **Crew Pro CTA** — sand border removed, narrowed with `mx-5`, simplified border.
5. **Full-bleed backgrounds** — CV (`-mx-4 px-4`), Insights (`-mx-4 px-4`), Network (`-mx-4 px-4`) all go edge-to-edge.
6. **Global container padding** — `px-4 md:px-6` on layout's inner div.

---

## Part 1: Profile Page Redesign

**File:** `app/(protected)/app/profile/page.tsx` (357 lines — near-complete rewrite)

### Current structure (top to bottom):
1. Title "My Profile" + "Preview →" link (emoji)
2. Photo strip (horizontal scroll)
3. Identity block (name, role, dept, URL) — loose text, not in a card
4. Profile strength (progress wheel + label)
5. "Request your first endorsement" — grey text box
6. "Profile Sections" heading + flat toggle list (About, Experience, etc.)
7. Accordion sections showing inline content previews

### Target structure:
```
┌─────────────────────────────────────────────────┐
│ My Profile                                      │
├─────────────────────────────────────────────────┤
│ ┌─ Profile Hero Card ─────────────────────────┐ │
│ │ [Photo] name          [Edit icon]           │ │
│ │         Role · Dept                         │ │
│ │         yachtie.link/u/handle      [Copy]   │ │
│ │                                             │ │
│ │ [Preview (outline)] [Share Profile (primary)]│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Profile Strength Card ─────────────────────┐ │
│ │ [75% wheel]  Profile Strength               │ │
│ │              Standing out                   │ │
│ │              [Add photos (outline button)]  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Profile Sections                                │
│ ┌──────────┐ ┌──────────┐                       │
│ │ About  ✓ │ │ Exp    ✓ │                       │
│ │ 1 line   │ │ 2 yachts │                       │
│ │     Edit │ │     Edit │                       │
│ └──────────┘ └──────────┘                       │
│ ┌──────────┐ ┌──────────┐                       │
│ │ Endorse  │ │ Certs  ✓ │                       │
│ │ 0        │ │ 1 cert   │                       │
│ │      Add │ │     Edit │                       │
│ └──────────┘ └──────────┘                       │
│ ... (2-col grid continues)                      │
└─────────────────────────────────────────────────┘
```

### 1A. Profile Hero Card

Replace the loose name/role/URL text block and the emoji "Preview →" link with a proper card:

```tsx
{/* Profile Hero Card */}
<div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
  {/* Top row: photo + identity + edit */}
  <div className="flex items-start gap-3">
    {/* Photo */}
    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-[var(--color-surface-raised)]">
      {profile.profile_photo_url ? (
        <Image src={profile.profile_photo_url} alt={displayName} width={56} height={56} className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-[var(--color-text-secondary)]">
          {displayName[0]?.toUpperCase()}
        </div>
      )}
    </div>
    {/* Name + role */}
    <div className="flex-1 min-w-0">
      <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">{displayName}</p>
      {profile.primary_role && (
        <p className="text-sm text-[var(--color-text-secondary)]">{profile.primary_role}</p>
      )}
      {departments.length > 0 && (
        <p className="text-xs text-[var(--color-text-tertiary)]">{departments.join(' · ')}</p>
      )}
    </div>
    {/* Edit icon button */}
    <Link href="/app/more/account" className="shrink-0">
      <IconButton icon={<Pencil size={16} />} label="Edit profile info" />
    </Link>
  </div>

  {/* Profile URL with copy */}
  <div className="flex items-center gap-2">
    <p className="text-sm text-[var(--color-interactive)] truncate">yachtie.link/u/{profile.handle}</p>
    <button onClick={copyUrl} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
      <Copy size={14} />
    </button>
  </div>

  {/* Action buttons */}
  <div className="flex gap-2">
    <Link href={`/u/${profile.handle}`} className="flex-1">
      <Button variant="outline" className="w-full">Preview</Button>
    </Link>
    <Button onClick={shareProfile} className="flex-1">Share Profile</Button>
  </div>
</div>
```

**Imports needed:** `Pencil`, `Copy` from `lucide-react`; `IconButton` from `@/components/ui`; `Image` from `next/image`.

**Note:** The Profile page is currently a server component. The hero card needs `onClick` for copy/share — either:
- Extract the hero card into a client component `ProfileHeroCard.tsx`
- Or keep it server and use a separate client component just for the buttons

### 1B. Profile Strength Card

Wrap the existing progress wheel in a proper card with a smart CTA:

```tsx
<div className="bg-[var(--color-surface)] rounded-2xl p-4">
  <div className="flex items-center gap-4">
    <ProgressWheel value={strengthPct} size={64} />
    <div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Profile Strength</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{strengthLabel}</p>
    </div>
  </div>
  {/* Smart CTA — shows the next thing to do */}
  {nextStep && (
    <Link href={nextStep.href} className="mt-3 block">
      <Button variant="outline" size="sm" className="w-full">{nextStep.label}</Button>
    </Link>
  )}
</div>
```

**Smart CTA logic:** Show the most impactful incomplete step:
1. No photos → "Add profile photos"
2. No bio → "Write your bio"
3. No endorsements → "Request your first endorsement"
4. No certs → "Add certifications"
5. All done → no CTA shown

### 1C. Section Management Grid

Replace the flat toggle list with a 2-column grid of section cards:

```tsx
<div>
  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Profile Sections</h2>
  <p className="text-xs text-[var(--color-text-secondary)] mb-3">Choose what shows on your public profile</p>

  <div className="grid grid-cols-2 gap-2">
    {sections.map((section) => (
      <div key={section.key} className="bg-[var(--color-surface)] rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{section.label}</span>
          <ToggleSwitch checked={section.visible} onChange={() => toggleSection(section.key)} />
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)] truncate">{section.summary}</p>
        <Link href={section.editHref}>
          <Button variant="ghost" size="sm">{section.count > 0 ? 'Edit' : 'Add'}</Button>
        </Link>
      </div>
    ))}
  </div>
</div>
```

**Section data structure:**
```ts
interface SectionItem {
  key: string
  label: string
  summary: string       // "Love yachting" or "2 entries" or "No hobbies yet"
  count: number
  visible: boolean
  editHref: string      // "/app/about/edit" etc.
}
```

### 1D. Remove "Add →" hyperlinks

**File:** `app/(protected)/app/profile/page.tsx`

Find all instances of `Add →` with `<Link>` and replace with `<EmptyState>`:

```tsx
// Before (3 instances — hobbies, skills, gallery):
<p className="text-sm text-[var(--color-text-secondary)]">No hobbies added. <Link href="/app/hobbies/edit" className="text-[var(--color-interactive)] underline">Add →</Link></p>

// After:
<EmptyState
  icon={<Heart size={20} />}
  title="No hobbies yet"
  description="Show your personality beyond the deck"
  actionLabel="Add hobbies"
  actionHref="/app/hobbies/edit"
/>
```

Icon mapping:
- Hobbies → `Heart`
- Skills → `Wrench`
- Gallery → `Camera`

### 1E. Remove accordion sections from profile page

The profile page currently renders `<ProfileAccordion>` sections inline. These should be removed — the section grid cards (1C) replace them. The accordions belong on the public profile only.

**Delete** the entire accordion rendering block (approximately lines 200-357 of the current file).

### 1F. Page background tint

Add teal tint to the profile page, full-bleed:

```tsx
<PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-teal-50)]">
```

---

## Part 2: Accordion Font Fix

**File:** `components/profile/ProfileAccordion.tsx` line 42

```tsx
// Before:
<span className="font-serif text-lg text-[var(--color-text-primary)]">{title}</span>

// After:
<span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
```

Serif stays ONLY on the public profile hero name (`text-3xl font-serif`).

---

## Part 3: Network Page Fixes

### 3A. Add `handle` to colleague query

**File:** `app/(protected)/app/network/page.tsx`

Line 12-17 — add `handle` to `UserProfile`:
```ts
interface UserProfile {
  id: string
  display_name: string | null
  full_name: string
  profile_photo_url: string | null
  primary_role: string | null
  handle: string | null  // ADD THIS
}
```

Line 79 — add `handle` to the select:
```ts
// Before:
.select('id, full_name, display_name, profile_photo_url, primary_role')
// After:
.select('id, full_name, display_name, profile_photo_url, primary_role, handle')
```

**File:** `components/audience/AudienceTabs.tsx`

Add `handle` to `ColleagueProfile` interface:
```ts
interface ColleagueProfile {
  id: string
  display_name: string | null
  full_name: string
  profile_photo_url: string | null
  primary_role: string | null
  handle: string | null  // ADD THIS
}
```

Wrap colleague card content in a `<Link>`:
```tsx
// The card becomes:
<motion.div key={entry.colleague_id} variants={fadeUp} {...cardHover}
  className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
  <div className="flex items-center gap-3 p-4">
    <Link href={profile.handle ? `/u/${profile.handle}` : '#'} className="flex items-center gap-3 flex-1 min-w-0">
      {/* avatar */}
      <ProfileAvatar name={name} src={profile.profile_photo_url} size="md" />
      <div className="min-w-0">
        <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{name}</p>
        {/* role + yacht */}
      </div>
    </Link>
    {/* Endorse button stays outside the link */}
    <Link href={`/app/endorsement/request?colleague_id=...`}>
      <Button variant="outline" size="sm">Endorse</Button>
    </Link>
  </div>
</motion.div>
```

### 3B. Endorsement action links → buttons

Replace any remaining `text-[var(--color-interactive)] underline` action links in the endorsements tab with `<Button variant="outline" size="sm">`.

---

## Part 4: Insights Page Fix

### 4A. Already done (blur removed, teaser cards readable)

### 4B. Crew Pro CTA — already done (narrowed, sand border removed)

### 4C. UpgradeCTA button conversion

**File:** `components/insights/UpgradeCTA.tsx`

Replace the two raw plan toggle `<button>` elements with proper components:

```tsx
// Before (line 67-96): two raw <button> elements
// After: use a segmented control pattern with Button variants
<div className="flex gap-2 mt-3 mb-4">
  <Button
    variant={plan === 'monthly' ? 'primary' : 'outline'}
    onClick={() => setPlan('monthly')}
    className="flex-1 flex-col h-auto py-2.5"
  >
    <span className="text-sm font-medium">Monthly</span>
    <span className="text-xs font-normal opacity-90">{monthlyPrice} / mo{monthlySaving ? ` · ${monthlySaving}` : ''}</span>
  </Button>
  <Button
    variant={plan === 'annual' ? 'primary' : 'outline'}
    onClick={() => setPlan('annual')}
    className="flex-1 flex-col h-auto py-2.5"
  >
    <span className="text-sm font-medium">Annual</span>
    <span className="text-xs font-normal opacity-90">{annualPrice} / yr · {annualSaving}</span>
  </Button>
</div>
```

Replace the raw upgrade `<button>` at the bottom:
```tsx
// Before (line 116-122):
<button onClick={handleUpgrade} disabled={loading} className="w-full py-3 rounded-xl bg-[var(--color-teal-700)]...">
// After:
<Button onClick={handleUpgrade} loading={loading} className="w-full">
  Upgrade to Crew Pro
</Button>
```

---

## Part 5: CV Page Hierarchy

### 5A. Bento layout for actions

**File:** `components/cv/CvActions.tsx`

Restructure the actions section from flat stack to prioritized grid:

```tsx
<div className="flex flex-col gap-3">
  {/* Primary: Share — full width */}
  <Button onClick={copyLink} className="w-full">Share Profile Link</Button>

  {/* Secondary: 2-col grid */}
  <div className="grid grid-cols-2 gap-2">
    <Button variant="outline" onClick={generatePdf} loading={generating}>
      {pdfReady ? 'Regenerate PDF' : 'Generate PDF'}
    </Button>
    <Link href="/app/cv/upload">
      <Button variant="outline" className="w-full">Upload CV</Button>
    </Link>
  </div>

  {/* Tertiary: QR + Edit as ghost buttons */}
  <div className="grid grid-cols-2 gap-2">
    <Button variant="ghost" onClick={() => setShowQR(!showQR)}>
      {showQR ? 'Hide QR' : 'QR Code'}
    </Button>
    <Link href="/app/profile">
      <Button variant="ghost" className="w-full">Edit Profile</Button>
    </Link>
  </div>

  {/* QR expansion */}
  {showQR && (/* existing QR render */)}

  {/* Template selector — stays full width */}
  {/* ... existing template selector ... */}
</div>
```

Remove the separate "Edit Profile" card at the bottom — it's now in the tertiary grid.

---

## Part 6: More Page Consistency

**File:** `app/(protected)/app/more/page.tsx`

### 6A. Wrap each section in a card

Currently section rows float with only `divide-y`. Wrap each group:

```tsx
// Before:
<SectionHeader title="ACCOUNT" />
<SettingsRow label="Edit name..." href="/app/more/account" />
<SettingsRow label="Contact info" href="/app/more/contact" />

// After:
<SectionHeader title="ACCOUNT" />
<div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
  <SettingsRow label="Edit name..." href="/app/more/account" />
  <SettingsRow label="Contact info" href="/app/more/contact" />
</div>
```

Apply to every section group: Appearance, Account, Privacy, Billing, Help, Legal.

### 6B. Sign out button

```tsx
// Before (line 229-234):
<button onClick={handleSignOut} className="w-full flex items-center...">Sign out</button>

// After:
<Button variant="destructive" onClick={handleSignOut} className="w-full">Sign out</Button>
```

### 6C. Sand background tint for More page

Add sand tint, full-bleed:
```tsx
// More page wrapper:
<PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-sand-100)]">
```

---

## Part 7: Global Typography

### 7A. Page title standardization

Ensure ALL in-app page titles use:
```
text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]
```

**Files to check/fix:**
- `app/(protected)/app/profile/page.tsx` — verify
- `app/(protected)/app/cv/page.tsx` — verify (already fixed)
- `app/(protected)/app/insights/page.tsx` — already fixed
- `app/(protected)/app/more/page.tsx` — check if it has a title

### 7B. No `font-serif` in protected app

```bash
grep -rn 'font-serif' app/(protected)/ --include='*.tsx'
# Expected: zero results after Part 2
```

---

## Part 8: Empty State Upgrade

### 8A. Profile page empty states

Already covered by Part 1D — all "Add →" links become proper `<EmptyState>` with icon + value prop + CTA button.

### 8B. Network endorsements empty state

**File:** `components/audience/AudienceTabs.tsx`

The endorsements empty state uses `<EmptyState>` but has a text-link-style CTA. Ensure the `actionLabel` produces a proper button appearance (may need to update `EmptyState` to render CTA as `<Button>` instead of `<Link>` with underline).

---

## Part 9: Soft Card Treatment

### 9A. Create utility class

**File:** `app/globals.css` — add after the base styles:

```css
/* Semi-transparent card for tinted page backgrounds */
.card-soft {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

### 9B. Apply to tinted pages

Replace `bg-[var(--color-surface)]` on cards within tinted pages with `card-soft`:
- CV page cards (CvActions.tsx inner cards)
- Insights page cards (TeaserCard, AnalyticsCard, UpgradeCTA)
- Network page cards (AudienceTabs.tsx inner cards)

**Do NOT apply to:** Profile page (solid cards on teal — teal-50 is very subtle), More page (cards should stay solid on sand).

**Decision point:** Test both solid and soft on Profile. The teal-50 tint is very light so soft cards might be unnecessary. Default to solid unless it looks better soft.

---

## Part 10: Bento Grid Layouts

### 10A. Profile section grid — covered in Part 1C

### 10B. Insights Pro view bento

**File:** `app/(protected)/app/insights/page.tsx` — the Pro analytics cards

```tsx
// Before: flat stack of AnalyticsCard components
// After: 2-col grid with hero card spanning 2 cols

<div className="grid grid-cols-2 gap-3">
  {/* Hero metric — full width */}
  <div className="col-span-2">
    <AnalyticsCard title="Profile Views" count={...} data={viewsData} color="var(--chart-1)" />
  </div>
  {/* Secondary metrics — side by side */}
  <AnalyticsCard title="PDF Downloads" count={...} data={downloadsData} color="var(--chart-2)" />
  <AnalyticsCard title="Link Shares" count={...} data={sharesData} color="var(--chart-3)" />
  {/* Bottom row — side by side */}
  <div className="...">Cert Document Manager</div>
  <div className="...">Plan Management</div>
</div>
```

### 10C. CV bento — covered in Part 5A (grid for secondary/tertiary buttons)

### 10D. Network colleague grid

**File:** `components/audience/AudienceTabs.tsx` — ColleaguesTab

```tsx
// Before:
<motion.div className="flex flex-col gap-3">

// After:
<motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

This makes colleague cards 2-col on wider viewports while staying 1-col on narrow mobile.

---

## Part 11: Photo Management

### 11A. Drag-to-reorder

**File:** `app/(protected)/app/profile/photos/page.tsx`

Install: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

Add drag-and-drop to the photo grid:

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable photo item wrapper:
function SortablePhoto({ photo, onDelete }: { photo: Photo; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
      <Image src={photo.photo_url} alt="Profile photo" fill className="object-cover" />
      {/* Delete button */}
      <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="absolute top-1 right-1 ...">×</button>
      {/* First photo badge */}
      {photo.sort_order === 0 && <span className="absolute bottom-1 left-1 ...">Main</span>}
    </div>
  )
}

// In the main component, wrap the grid:
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <SortablePhoto key={photo.id} photo={photo} onDelete={() => deletePhoto(photo)} />
      ))}
      {/* Add button */}
      {photos.length < maxPhotos && <AddPhotoButton />}
    </div>
  </SortableContext>
</DndContext>
```

**handleDragEnd:**
```tsx
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = photos.findIndex(p => p.id === active.id)
  const newIndex = photos.findIndex(p => p.id === over.id)
  const reordered = arrayMove(photos, oldIndex, newIndex)

  // Optimistic update
  setPhotos(reordered)

  // Persist
  const res = await fetch('/api/user-photos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo_ids: reordered.map(p => p.id) }),
  })

  if (!res.ok) {
    toast('Could not save photo order', 'error')
    setPhotos(photos) // revert
  } else {
    toast('Photo order saved', 'success')
  }
}
```

### 11B. Multi-photo upload

**File:** `app/(protected)/app/profile/photos/page.tsx`

```tsx
// Before (line 127):
<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

// After:
<input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiUpload} />
```

**handleMultiUpload:**
```tsx
async function handleMultiUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const files = Array.from(e.target.files ?? [])
  if (!files.length) return

  const remaining = maxPhotos - photos.length
  if (files.length > remaining) {
    toast(`You can add ${remaining} more photo${remaining === 1 ? '' : 's'}`, 'error')
    files.splice(remaining) // trim to fit
  }

  for (const file of files) {
    // Upload each file sequentially (reuse existing upload logic)
    await uploadSinglePhoto(file)
  }

  // Refresh photo list
  await fetchPhotos()
}
```

### 11C. Update photo and gallery limits

**Profile photos:** Free=3, Pro=9
**Work gallery:** Free=3, Pro=15

**Files:**
- `app/api/user-photos/route.ts`: `FREE_LIMIT = 3`, `PRO_LIMIT = 9`
- `app/(protected)/app/profile/photos/page.tsx` — help text: "Free: up to 3 photos · Pro: up to 9"
- `app/(protected)/app/profile/photos/page.tsx` — add-button limit: `photos.length < (isPro ? 9 : 3)`
- Gallery API route — update limits: `FREE_LIMIT = 3`, `PRO_LIMIT = 15`
- `app/(protected)/app/profile/gallery/page.tsx` — help text: "Free: up to 3 photos · Pro: up to 15"

---

## Part 12: Sideline Dark Mode

### 12A. Force light mode

**File:** `app/layout.tsx` — inline theme script

Replace the theme detection script with a hardcoded light mode:
```tsx
// Before: reads localStorage, applies dark class
// After: always set to light
<script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.remove('dark')` }} />
```

### 12B. Remove theme toggle from More page

**File:** `app/(protected)/app/more/page.tsx`

Remove the entire APPEARANCE section (Theme toggle with System/Light/Dark buttons). Or replace with:
```tsx
<SectionHeader title="APPEARANCE" />
<div className="bg-[var(--color-surface)] rounded-2xl p-4">
  <p className="text-sm text-[var(--color-text-secondary)]">Dark mode coming soon</p>
</div>
```

---

## Part 13: Bug Fixes from Three-Agent Review

### 13A. Fix `expiry_date` vs `expires_at` column mismatch
**File:** `app/(protected)/app/insights/page.tsx` — the cert expiry query uses `expiry_date` but the column may be `expires_at`. Check migration and fix whichever is wrong.

### 13B. Fix subscription status check on photo/gallery APIs
**File:** `app/api/user-photos/route.ts` and gallery equivalent — check if they use `subscription_plan === 'pro'` (wrong) instead of `subscription_status === 'pro'`. Fix to match the correct column.

### 13C. Fix `pt-safe-top` non-existent utility
**File:** `components/public/PublicProfileContent.tsx` or `HeroSection.tsx` — `pt-safe-top` doesn't exist as a Tailwind utility. Replace with `pt-[env(safe-area-inset-top,0px)]` or remove and rely on `pt-4`.

### 13D. UpgradeCTA error feedback
**File:** `components/insights/UpgradeCTA.tsx` — add toast on checkout failure:
```tsx
} catch {
  toast('Something went wrong. Please try again.', 'error')
  setLoading(false)
}
```

### 13E. "Download my data" fix
**File:** `app/(protected)/app/more/page.tsx` — the "Download my data" row links directly to `/api/account/export`, navigating the browser to a raw JSON endpoint. Change to trigger download via fetch:
```tsx
// Instead of <SettingsRow href="/api/account/export">, use onClick:
async function handleExport() {
  const res = await fetch('/api/account/export')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'yachtielink-data.json'
  a.click()
  URL.revokeObjectURL(url)
  toast('Data exported', 'success')
}
```

---

## Part 14: Spacing & Padding Fixes

### 14A. Fix double bottom padding
**Issue:** Layout applies `pb-tab-bar` (~64px) AND every page applies `pb-24` (96px) = 160px dead space.
**Fix:** Remove `pb-tab-bar` from the layout `<main>` and keep pages managing their own `pb-24`. Or reduce page padding to `pb-4` since the layout already clears the tab bar.

### 14B. Fix double horizontal padding on sub-pages
**Issue:** Sub-pages like `attachment/new/page.tsx` apply their own `px-4 pt-8` inside the layout's `px-4` = 32px total.
**Fix:** Audit all sub-pages and remove redundant `px-4`. The layout handles padding.

### 14C. Fix Toast position
**File:** `components/ui/Toast.tsx` line 62
```tsx
// Before:
className="... fixed bottom-24 ..."
// After:
className="... fixed bottom-[calc(var(--tab-bar-height)+var(--safe-area-bottom)+1rem)] ..."
```

### 14D. Standardize card padding
All standard content cards should use `p-4`. Fix:
- Profile page photo strip: `p-3` → `p-4`
- ProfileStrength: `p-5` → `p-4`
- SectionManager: `p-5` → `p-4`

### 14E. Standardize page gap
All pages should use `gap-4`. Fix profile page: `gap-3` → `gap-4`.

### 14F. Fix save button active appearance
The save button on the dates page appears greyed out even when enabled. Check if `disabled:opacity-60` is being applied incorrectly (possibly the button is disabled until a date is selected, which is the right behavior — but if it's always disabled-looking, the base button opacity or color needs fixing).

### 14G. Standardize section headers
Pick one style and apply everywhere:
```
text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]
```
Fix More page `SectionHeader` from `tracking-wider text-secondary` to match.

---

## Part 15: Date Picker & Checkbox UX

### 15A. Custom month/year date picker
Replace all `<input type="date">` with a custom date picker that:
- Shows month + year selector (dropdown or scroll wheel)
- Day is OPTIONAL — user can select "March 2024" without picking a day
- Tapping opens a proper calendar/picker UI, not the native browser date picker
- Use `react-day-picker` (already a shadcn dep) or build a simple month/year select

**Files to update:**
- `app/(protected)/app/attachment/new/page.tsx` — start date, end date
- `app/(protected)/app/attachment/[id]/edit/page.tsx` — start date, end date
- `app/(protected)/app/certification/new/page.tsx` — issued date, expiry date
- `app/(protected)/app/certification/[id]/edit/page.tsx` — issued date, expiry date
- `app/(protected)/app/education/new/page.tsx` — start date, end date
- `app/(protected)/app/education/[id]/edit/page.tsx` — start date, end date

### 15B. Checkbox tap targets
All `<input type="checkbox">` elements need min 44x44px tap targets:
- Wrap in a `<label>` that covers the full row width
- Style as a tappable row: `flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-[var(--color-surface-raised)] cursor-pointer`
- Replace the tiny native checkbox with a styled toggle or larger checkbox visual

**Instances:**
- "Currently working here" on attachment date pages
- "No expiry / lifetime certification" on cert pages

---

## Part 16: Form & List Visual Polish

### 16A. Cert category picker
Replace flat text list with icon cards:
```tsx
const CERT_CATEGORIES = [
  { id: 'engineering', label: 'Engineering', icon: Wrench },
  { id: 'hospitality', label: 'Hospitality & Service', icon: UtensilsCrossed },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'navigation', label: 'Navigation & Watchkeeping', icon: Compass },
  { id: 'regulatory', label: 'Regulatory & Flag State', icon: Scale },
  { id: 'safety', label: 'Safety & Sea Survival', icon: LifeBuoy },
  { id: 'water-sports', label: 'Water Sports & Leisure', icon: Waves },
  { id: 'other', label: 'Other / not listed', icon: Plus },
]
```
Each renders as a card with icon + label, not a flat row.

### 16B. Add missing page titles
- Network page: `<h1>Network</h1>` before the endorsement CTA
- More page: `<h1>Settings</h1>` at the top

### 16C–16E. Text link → Button fixes
- Insights "Manage →" → `<Button variant="ghost" size="sm">Manage</Button>`
- CV "Download QR" → `<Button variant="ghost" size="sm">Download QR</Button>`
- CV locked template → `router.push('/app/insights')` + toast instead of `window.location.href`

### 16F. BackButton fixes
- Replace tiny `‹` chevron with proper `<BackButton>` component on ALL sub-pages
- Min 44x44px tap target
- Standardize header: `<div className="flex items-center gap-3">` for BackButton + h1

### 16G. Styled file upload
Replace raw `<input type="file">` ("Choose file No file chosen") with:
```tsx
<Button variant="outline" onClick={() => fileInputRef.current?.click()}>
  {selectedFile ? selectedFile.name : 'Choose file'}
</Button>
<input ref={fileInputRef} type="file" className="hidden" onChange={...} />
```

### 16H. Styled checkboxes
All raw `<input type="checkbox">` elements become tappable rows (covered by Part 15B).

### 16I. Hobbies emoji auto-suggest
Build a keyword→emoji lookup map:
```ts
const HOBBY_EMOJIS: Record<string, string> = {
  photography: '📷', cooking: '🍳', yoga: '🧘', reading: '📚',
  gaming: '🎮', music: '🎵', travel: '✈️', hiking: '🥾',
  cycling: '🚴', running: '🏃', diving: '🤿', skiing: '⛷️',
  surfing: '🏄', tennis: '🎾', golf: '⛳', painting: '🎨',
  gardening: '🌱', fishing: '🎣', climbing: '🧗', dancing: '💃',
  // ... extend with 50+ common hobbies
}
```
- As user types, fuzzy-match and show suggested emoji as a tappable pill
- User can accept or tap to change
- Display emoji + name pills on profile
- Change placeholder from "e.g. Surfing" to "e.g. Photography"

### 16J. BackButton + title gap
Standardize ALL sub-page headers to `flex items-center gap-3`.

### 16K. Skills page rework
- Add suggestion chips per category (tappable pills for common skills)
- Show added skills as grouped pills with × remove
- Brief explainer: "These appear on your public profile under Extra Skills"
- Fix truncated placeholder

---

## File Change Summary

### New files:
- `components/profile/ProfileHeroCard.tsx` (client component extracted from profile page)
- `components/ui/DatePicker.tsx` (custom month/year date picker)
- `lib/hobby-emojis.ts` (keyword → emoji lookup map)

### New dependencies:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (for photo reorder)

### Modified files (~30+):
- `app/(protected)/app/profile/page.tsx` — near-complete rewrite
- `components/profile/ProfileAccordion.tsx` — font fix
- `app/(protected)/app/network/page.tsx` — add `handle` to query
- `components/audience/AudienceTabs.tsx` — colleague linking, grid layout, navy full-bleed
- `app/(protected)/app/insights/page.tsx` — bento grid, expiry_date fix
- `components/insights/UpgradeCTA.tsx` — Button components, error toast
- `components/cv/CvActions.tsx` — bento layout, button hierarchy, download QR fix
- `app/(protected)/app/more/page.tsx` — card sections, dark mode removal, page title, export fix
- `app/(protected)/app/profile/photos/page.tsx` — drag-to-reorder, multi-upload, limit
- `app/(protected)/app/profile/gallery/page.tsx` — limit updates
- `app/api/user-photos/route.ts` — photo limits 3/9
- Gallery API route — gallery limits 3/15
- `app/globals.css` — `.card-soft` utility class
- `app/layout.tsx` — force light mode
- `components/ui/Toast.tsx` — fix position
- `components/ui/EmptyState.tsx` — CTA renders as Button, not text link
- `components/profile/SectionManager.tsx` — 2-col grid
- All 6 date input pages — custom date picker
- All checkbox instances — tappable row treatment
- `app/(protected)/app/certification/new/page.tsx` — category icons
- `app/(protected)/app/hobbies/edit/page.tsx` — emoji auto-suggest, placeholder fix
- `app/(protected)/app/skills/edit/page.tsx` — suggestion chips, grouped pills
- Multiple sub-pages — BackButton fixes, header gap standardization

### Deleted: none

### New files:
- `components/profile/ProfileHeroCard.tsx` (client component extracted from profile page)

### New dependency:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (for photo reorder)

### Modified files (~15):
- `app/(protected)/app/profile/page.tsx` — near-complete rewrite (hero card, section grid, remove accordions)
- `components/profile/ProfileAccordion.tsx` — font fix (line 42)
- `app/(protected)/app/network/page.tsx` — add `handle` to query
- `components/audience/AudienceTabs.tsx` — colleague linking, grid layout
- `app/(protected)/app/insights/page.tsx` — bento grid for Pro view
- `components/insights/UpgradeCTA.tsx` — Button components, remove raw buttons
- `components/cv/CvActions.tsx` — bento layout, button hierarchy
- `app/(protected)/app/more/page.tsx` — card sections, dark mode removal
- `app/(protected)/app/profile/photos/page.tsx` — drag-to-reorder, multi-upload, limit
- `app/api/user-photos/route.ts` — FREE_LIMIT 6 → 3
- `app/globals.css` — `.card-soft` utility class
- `app/layout.tsx` — force light mode

### Deleted: none (code removed from profile page, not files)

---

## Verification Plan

### After each Part:
1. `npx tsc --noEmit` — zero errors
2. Visual check at 375px and 1280px
3. Check the specific fix (hero card renders, grid is 2-col, etc.)

### Final automated checks:
```bash
# Zero "Add →" links
grep -rn 'Add →\|Add →' app/ --include='*.tsx' | grep -v node_modules
# Expected: zero

# Zero font-serif in protected app
grep -rn 'font-serif' app/(protected)/ --include='*.tsx'
# Expected: zero

# Photo limit is 3
grep -n 'FREE_LIMIT' app/api/user-photos/route.ts
# Expected: FREE_LIMIT = 3

# Build passes
npm run build
```

### Manual checks:
- Profile page: hero card, section grid (2-col), no accordions, no "Add →" links
- Colleague cards: tapping navigates to /u/{handle}
- CV page: Share is primary, PDF/Upload are 2-col, QR/Edit are ghost
- More page: sections in cards, no theme toggle
- Insights: no blur, Pro badge inline, Crew Pro narrower
- Photos: can drag to reorder, can upload multiple, free limit is 3
- All section backgrounds are full-bleed
