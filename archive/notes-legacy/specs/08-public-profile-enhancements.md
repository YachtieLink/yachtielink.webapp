# Spec 08 — Public Profile Enhancements

**Goal:** Make the public profile more compelling for viewers (captains, crew, recruiters) with endorser roles, contextual CTAs, dynamic OG images, and optimized share text.

---

## Enhancement 1: Display Endorser Role on EndorsementCard

**The single highest-ROI one-line fix in the codebase.**

### File: `components/public/EndorsementCard.tsx`

**Current interface (lines 5-11):**
```tsx
interface EndorsementCardProps {
  endorserName: string
  endorserPhoto?: string | null
  yachtName?: string | null
  date: string
  content: string
}
```

**Change to:**
```tsx
interface EndorsementCardProps {
  endorserName: string
  endorserRole?: string | null
  endorserPhoto?: string | null
  yachtName?: string | null
  date: string
  content: string
}
```

**Add `endorserRole` to the destructured props (line 15-21):**
```tsx
export function EndorsementCard({
  endorserName,
  endorserRole,
  endorserPhoto,
  yachtName,
  date,
  content,
}: EndorsementCardProps) {
```

**Update the endorser name display (line 50-51):**

**Current:**
```tsx
<p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
  {endorserName}
</p>
```

**Change to:**
```tsx
<p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
  {endorserName}
</p>
{endorserRole && (
  <p className="text-xs text-[var(--color-text-secondary)] truncate">
    {endorserRole}
  </p>
)}
```

And adjust the yacht/date line to avoid redundancy — move it below the role:
```tsx
<p className="text-xs text-[var(--color-text-tertiary)]">
  {yachtName && <>{yachtName} · </>}
  {formattedDate}
</p>
```

### File: `components/public/PublicProfileContent.tsx` line 314-321

**Current:**
```tsx
<EndorsementCard
  key={end.id}
  endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
  endorserPhoto={end.endorser?.profile_photo_url}
  yachtName={end.yacht?.name}
  date={end.created_at}
  content={end.content}
/>
```

**Change to:**
```tsx
<EndorsementCard
  key={end.id}
  endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
  endorserRole={end.endorser_role_label}
  endorserPhoto={end.endorser?.profile_photo_url}
  yachtName={end.yacht?.name}
  date={end.created_at}
  content={end.content}
/>
```

The `endorser_role_label` field is already selected in the query (confirmed in `getProfileSections` from spec-02, and in the current public profile page query at line 93).

---

## Enhancement 2: "Create Your Profile" CTA for Non-Logged-In Viewers

### File: `components/public/PublicProfileContent.tsx`

Add a CTA section after endorsements, visible only to non-logged-in viewers.

**Add a new prop:**
```tsx
export interface PublicProfileContentProps {
  // ... existing props ...
  isLoggedIn?: boolean
}
```

**After the endorsements section (after line 325), add:**

```tsx
{/* CTA for non-logged-in viewers */}
{!isLoggedIn && endorsements.length > 0 && (
  <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
    <p className="text-sm text-[var(--color-text-secondary)] mb-3">
      {displayName} has {endorsements.length} endorsement{endorsements.length !== 1 ? 's' : ''} from colleagues
      {attachments.length > 0 ? ` across ${attachments.length} yacht${attachments.length !== 1 ? 's' : ''}` : ''}.
    </p>
    <a
      href="/signup"
      className="inline-flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
    >
      Build your own profile — it's free
    </a>
  </section>
)}
```

**In the public profile page (`app/(public)/u/[handle]/page.tsx`), pass the prop:**
```tsx
<PublicProfileContent
  ...
  isLoggedIn={!!viewer}
/>
```

---

## Enhancement 3: "Endorse [Name]" Button for Logged-In Viewers with Shared Yachts

### File: `components/public/PublicProfileContent.tsx`

After the hero section share button (line 188), add a contextual action for logged-in colleagues:

```tsx
{/* Endorse button for logged-in colleagues */}
{isColleague && !viewerRelationship?.isOwnProfile && (
  <a
    href={`/app/endorsement/write?recipient=${user.id}&yacht=${viewerRelationship?.sharedYachtIds[0]}`}
    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--color-interactive)] px-5 py-2 text-sm font-medium text-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5 transition-colors"
  >
    Endorse {displayName.split(' ')[0]}
  </a>
)}
```

**Note:** This links to the endorsement write flow. You may need to create a route handler at `/app/endorsement/write` that accepts `recipient` and `yacht` query params and renders the `WriteEndorsementForm`. Check if this route already exists — if not, create it as a simple page:

```tsx
// app/(protected)/app/endorsement/write/page.tsx
// Read recipient_id and yacht_id from searchParams
// Fetch recipient name and yacht name
// Render WriteEndorsementForm with pre-filled data
```

---

## Enhancement 4: Dynamic OG Image for WhatsApp Previews

### Create `app/api/og/route.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { getUserByHandle } from '@/lib/queries/profile'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  if (!handle) return new Response('Missing handle', { status: 400 })

  const user = await getUserByHandle(handle)
  if (!user) return new Response('User not found', { status: 404 })

  const name = user.display_name || user.full_name

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0D7377 0%, #0a5c5f 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {user.profile_photo_url && (
          <img
            src={user.profile_photo_url}
            width={120}
            height={120}
            style={{ borderRadius: '60px', border: '4px solid rgba(255,255,255,0.3)', marginBottom: '24px' }}
          />
        )}
        <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8 }}>
          {name}
        </div>
        {user.primary_role && (
          <div style={{ fontSize: 24, opacity: 0.9, marginBottom: 24 }}>
            {user.primary_role}
          </div>
        )}
        <div style={{ fontSize: 18, opacity: 0.7 }}>
          yachtie.link/u/{user.handle}
        </div>
        <div style={{ position: 'absolute', bottom: 30, fontSize: 16, opacity: 0.5 }}>
          YachtieLink — Professional profiles for yacht crew
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

### Update public profile metadata to use dynamic OG image:

**File:** `app/(public)/u/[handle]/page.tsx` in `generateMetadata`:

**Current (line 34):**
```tsx
images: user.profile_photo_url ? [{ url: user.profile_photo_url }] : [],
```

**Change to:**
```tsx
images: [{ url: `/api/og?handle=${handle}`, width: 1200, height: 630 }],
```

This generates a branded card image instead of just the raw profile photo. Every WhatsApp share becomes a mini business card.

**Note:** The `getUserByHandle` call in the OG route uses `React.cache()`, but since this is an Edge API route (separate request), it won't share the cache with the page render. This is intentional — the OG image is requested separately by crawlers.

---

## Enhancement 5: Optimized Share Text

### File: `components/profile/IdentityCard.tsx`

**Current share text (line 32):**
```tsx
text: `Check out ${displayName}'s profile on YachtieLink`,
```

To make this dynamic based on profile strength, pass endorsement count as a prop:

**Add to IdentityCardProps:**
```tsx
interface IdentityCardProps {
  // ... existing ...
  endorsementCount?: number
  yachtCount?: number
}
```

**Update share text:**
```tsx
const shareText = endorsementCount && endorsementCount > 0
  ? `Check out my crew profile — ${endorsementCount} endorsement${endorsementCount !== 1 ? 's' : ''} from colleagues: ${profileUrl}`
  : `Check out my crew profile on YachtieLink: ${profileUrl}`

const shareData = {
  title: `${displayName} — YachtieLink`,
  text: shareText,
  url: profileUrl,
}
```

**Pass the props from profile page:**
```tsx
<IdentityCard
  ...
  endorsementCount={endorsements?.length ?? 0}
  yachtCount={attachments?.length ?? 0}
/>
```

---

## Enhancement 6: YachtieLink Branding Footer on Public Profile

### File: `components/public/PublicProfileContent.tsx`

After the QR code section (end of the component), add:

```tsx
{/* Platform footer */}
<footer className="text-center pt-4 pb-2">
  <p className="text-xs text-[var(--color-text-tertiary)]">
    <a href="/welcome" className="hover:underline">YachtieLink</a> — Professional profiles for yacht crew
  </p>
</footer>
```

---

## Verification

1. `npm run build` — no type errors
2. View a public profile with endorsements — endorser role should show below their name
3. View a public profile while logged out — "Build your own profile" CTA should appear after endorsements
4. View a colleague's public profile while logged in — "Endorse [Name]" button should appear
5. Share a profile link on WhatsApp — preview should show a branded card with photo, name, role
6. Share from IdentityCard — share text should include endorsement count if > 0
