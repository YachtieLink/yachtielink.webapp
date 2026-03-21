# Sprint 6: Public Profile + CV — Detailed Build Plan for Sonnet

## Context

Sprint 6 delivers the "shareable output" layer. Everything built in Sprints 1-5 (profile, yachts, endorsements) now gets two external-facing outputs: a public profile page that anyone can view, and a downloadable PDF. Plus CV import to reduce the friction of populating profiles from existing CVs.

**Dependencies from prior sprints:**
- Profile data: name, role, department, bio, photo (Sprint 3)
- Employment history / attachments (Sprints 2-4)
- Certifications with documents (Sprint 3)
- Endorsements received (Sprint 5)
- Contact info with per-field visibility toggles (Sprint 3)
- QR code rendering via `react-qr-code` (Sprint 1, used in IdentityCard)
- Handle system (`/u/:handle`) with stubs (Sprint 1)

**What Sprint 6 delivers:**
1. Public profile page at `/u/:handle` — server-rendered, SEO-optimised, shareable
2. CV tab with public page preview + actions
3. CV upload + AI parsing → review → save to profile
4. PDF generation + download (free template with watermark, Pro templates locked)

---

## Implementation Order (7 task groups)

---

### TASK 1: Dependencies + Storage Migration

#### 1A. Install npm packages

```bash
npm install @anthropic-ai/sdk pdf-parse mammoth @react-pdf/renderer
npm install -D @types/pdf-parse
```

Packages:
- `@anthropic-ai/sdk` — Claude API client for CV parsing
- `pdf-parse` — extracts text from PDF files
- `mammoth` — converts DOCX to plain text
- `@react-pdf/renderer` — generates PDF documents from React components

#### 1B. Environment variable

Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Add to Vercel dashboard env vars (production + preview).

**CRITICAL:** This key must NEVER be exposed to the client. Only use in API routes (server-side).

#### 1C. Migration: `supabase/migrations/YYYYMMDD000NNN_sprint6_cv_storage.sql`

Use the next sequential migration number after whatever Sprint 5's last migration was.

```sql
-- 1. Storage bucket: cv-uploads (private, for raw CV files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage bucket: pdf-exports (private, for generated PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-exports',
  'pdf-exports',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for cv-uploads: owner only
CREATE POLICY "cv_uploads_owner_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "cv_uploads_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "cv_uploads_owner_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "cv_uploads_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

-- 4. RLS for pdf-exports: owner only
CREATE POLICY "pdf_exports_owner_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "pdf_exports_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "pdf_exports_owner_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "pdf_exports_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

-- 5. Add columns to users table for CV and PDF tracking
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cv_storage_path text,         -- path in cv-uploads bucket
  ADD COLUMN IF NOT EXISTS cv_parsed_at timestamptz,     -- last successful parse
  ADD COLUMN IF NOT EXISTS cv_parse_count_today integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cv_parse_count_reset_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS latest_pdf_path text,         -- path in pdf-exports bucket
  ADD COLUMN IF NOT EXISTS latest_pdf_generated_at timestamptz;

-- 6. Function to check/increment CV parse rate limit (3/day)
CREATE OR REPLACE FUNCTION public.check_cv_parse_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_reset_at timestamptz;
BEGIN
  SELECT cv_parse_count_today, cv_parse_count_reset_at
  INTO v_count, v_reset_at
  FROM public.users
  WHERE id = p_user_id;

  -- Reset counter if more than 24 hours since last reset
  IF v_reset_at IS NULL OR v_reset_at < now() - interval '1 day' THEN
    UPDATE public.users
    SET cv_parse_count_today = 1, cv_parse_count_reset_at = now()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  -- Check limit
  IF v_count >= 3 THEN
    RETURN false;
  END IF;

  -- Increment
  UPDATE public.users
  SET cv_parse_count_today = cv_parse_count_today + 1
  WHERE id = p_user_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_cv_parse_limit(uuid) TO authenticated;
```

**Path conventions:**
- `cv-uploads/{user_id}/cv.pdf` or `cv-uploads/{user_id}/cv.docx` — one file per user, overwrites previous
- `pdf-exports/{user_id}/profile-{timestamp}.pdf` — versioned, keep latest reference on user record

Apply to production.

---

### TASK 2: Public Profile Page (`/u/:handle`)

**This is the most important visual output of the entire product.** It's what crew share on docks, in marinas, via WhatsApp. It must look clean, load fast, and render correctly on mobile Safari.

#### 2A. Rewrite `app/(public)/u/[handle]/page.tsx`

This is a **server component** — must be server-rendered for SEO.

**Data fetching:**
```ts
// 1. Look up user by handle
const { data: user } = await supabase
  .from('users')
  .select(`
    id, full_name, display_name, handle, primary_role, departments,
    bio, profile_photo_url,
    phone, whatsapp, email, location_country, location_city,
    phone_visible, whatsapp_visible, email_visible, location_visible
  `)
  .eq('handle', handle)
  .single();

// If not found → Next.js notFound()

// 2. Fetch attachments (employment history)
const { data: attachments } = await supabase
  .from('attachments')
  .select('id, role_label, start_date, end_date, yacht:yachts!yacht_id(id, name, yacht_type, length_m, flag_state)')
  .eq('user_id', user.id)
  .is('deleted_at', null)
  .order('start_date', { ascending: false });

// 3. Fetch certifications
const { data: certifications } = await supabase
  .from('certifications')
  .select('id, certification_type_id, custom_cert_name, issued_date, expiry_date, cert_type:certification_types!certification_type_id(name, category)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// 4. Fetch endorsements received
const { data: endorsements } = await supabase
  .from('endorsements')
  .select('id, content, endorser_role_label, recipient_role_label, worked_together_start, worked_together_end, created_at, endorser:users!endorser_id(display_name, profile_photo_url), yacht:yachts!yacht_id(name)')
  .eq('recipient_id', user.id)
  .is('deleted_at', null)
  .order('created_at', { ascending: false });
```

Run all 4 queries in parallel with `Promise.all`.

**Layout (follow UX spec Screen U0):**

```
┌─────────────────────────────┐
│  [Photo]                    │
│  Display Name               │
│  Primary Role · Department  │
│  yachtie.link/u/handle      │
├─────────────────────────────┤
│  About                      │
│  "Bio text here..."         │
├─────────────────────────────┤
│  Contact                    │  ← only visible fields
│  +44 xxx / email            │
│  Antibes, France            │
├─────────────────────────────┤
│  Employment History         │
│  > MY Lady M — Chief Stew   │
│    Jan 2024 - Dec 2025      │
│  > SY Serenity — 2nd Stew   │
│    Mar 2022 - Nov 2023      │
├─────────────────────────────┤
│  Certifications             │
│  > STCW BST — Valid         │
│  > ENG1 — Expires Jun 2026  │
├─────────────────────────────┤
│  Endorsements               │
│  "Jane was incredible..."   │
│  — Sarah K, MY Lady M       │
│  [Read more]                │
├─────────────────────────────┤
│  [QR Code]                  │  ← bottom-left
└─────────────────────────────┘
```

**Contact info visibility:** Only show fields where the user has set the corresponding `_visible` flag to `true`. If no contact fields are visible, hide the entire Contact section.

**Endorsement display:**
- Show endorser name, yacht name, date
- Truncate content to ~150 chars with "Read more" toggle (client component needed for this)
- Collapsible expand to show full text
- No endorsement counts, no quality labels (D-013)

**QR code:** Render at bottom-left using `react-qr-code`. Encodes `https://yachtie.link/u/{handle}`.

**Important:** The public profile page must NOT have:
- Discovery rails ("People you may know")
- Browse/search functionality
- Endorsement quality labels
- Any upsell

#### 2B. `generateMetadata` for OG tags

The existing stub already has a `generateMetadata` function. Enhance it:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('full_name, display_name, primary_role, profile_photo_url, bio')
    .eq('handle', handle)
    .single();

  if (!user) return { title: 'Profile Not Found' };

  const name = user.display_name || user.full_name;
  const description = user.bio || `${name} — ${user.primary_role || 'Yacht Professional'} on YachtieLink`;

  return {
    title: `${name} — YachtieLink`,
    description,
    openGraph: {
      title: `${name} — ${user.primary_role || 'Yacht Professional'}`,
      description,
      images: user.profile_photo_url ? [{ url: user.profile_photo_url }] : [],
      type: 'profile',
      url: `https://yachtie.link/u/${handle}`,
    },
    twitter: {
      card: user.profile_photo_url ? 'summary_large_image' : 'summary',
      title: `${name} — YachtieLink`,
      description,
    },
  };
}
```

#### 2C. Endorsement collapsible component

Create `components/public/EndorsementCard.tsx` — a small client component:

```ts
'use client';
// Props: endorserName, yachtName, date, content, endorserPhoto
// State: expanded (boolean)
// Truncated view: first 150 chars + "Read more"
// Expanded view: full text + "Show less"
```

Pattern to follow: similar toggle logic to the onboarding Wizard steps.

#### 2D. Responsive design

- Mobile-first (single column, cards)
- Tablet/desktop: max-width container (~640px), centered
- Use existing CSS custom properties for colours (`var(--foreground)`, `var(--card)`, etc.)
- Dark mode must work (the public page uses the viewer's system preference, not the profile owner's)

---

### TASK 3: CV Tab (`/app/cv`)

#### 3A. Rewrite `app/(protected)/app/cv/page.tsx`

Follow UX spec Screen C0.

**Implementation:**

1. **Public View segment** (default): Fetch the same data as the public profile page and render the same components. Create a shared `PublicProfileContent` component used by both `/u/:handle` and `/app/cv`. Do NOT use an iframe — problematic on mobile Safari.

2. **Edit Profile segment**: Simply redirect/link to `/app/profile`.

3. **Actions card:**
   - "Generate PDF Snapshot" → calls `POST /api/cv/generate-pdf` → shows loading → on success, switch to "Download PDF" + "Regenerate"
   - "Upload CV" → navigates to `/app/cv/upload`
   - Template selector: show "Standard (Free)" selected. Show 2 Pro templates (Classic Navy, Modern Minimal) as locked with upgrade CTA → `/app/insights` (where the upsell lives)
   - QR code download: reuse the same SVG download logic from `IdentityCard.tsx`

4. **If PDF exists** (check `users.latest_pdf_path`):
   - Primary becomes "Download PDF" (generates signed URL from `pdf-exports` bucket)
   - Secondary: "Regenerate PDF"
   - Show generation date

#### 3B. Shared component: `components/public/PublicProfileContent.tsx`

Extract the rendering logic from the `/u/:handle` page into a reusable component:

```ts
interface PublicProfileContentProps {
  user: UserProfile
  attachments: Attachment[]
  certifications: Certification[]
  endorsements: Endorsement[]
  showQrCode?: boolean  // true on public page, false in CV preview
}
```

Both `/u/:handle/page.tsx` and `/app/cv/page.tsx` use this component with the same data. The public page adds the QR code; the CV tab omits it.

---

### TASK 4: CV Upload + AI Parsing

This is the most technically complex task in Sprint 6.

#### 4A. Page: `app/(protected)/app/cv/upload/page.tsx`

Follow UX spec Screen C1.

**Flow:**
1. Upload zone: drag-and-drop or file picker. Accept `.pdf` and `.docx` only. Max 10 MB.
2. On file select → upload to Supabase Storage `cv-uploads/{user_id}/cv.{ext}`
3. Show "Processing your CV..." with spinner
4. Call `POST /api/cv/parse` with the storage path
5. On success → navigate to review screen with parsed data
6. On failure → show "We couldn't extract data from this CV. You can enter your details manually." with CTA to `/app/profile`
7. On rate limit → show "You can try again tomorrow."

**File validation (client-side before upload):**
- MIME type: `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Size: <= 10 MB
- Show error toast if invalid

Pattern to follow: `lib/storage/upload.ts` (existing upload helpers for profile photos and cert documents).

#### 4B. API Route: `app/api/cv/parse/route.ts`

**POST /api/cv/parse**

Request body:
```ts
{ storagePath: string }  // e.g., "{user_id}/cv.pdf"
```

Implementation:
1. Auth required — get user ID from session
2. **Rate limit check:** Call `check_cv_parse_limit(user_id)` → if false, return 429
3. **Download file from storage** using service role key for server-side download
4. **Extract text:** `pdf-parse` for PDF, `mammoth.extractRawText` for DOCX
5. **Send to Claude API:** `claude-sonnet-4-6`, max_tokens 2000, with extraction prompt + CV text (truncated to 15000 chars)
6. **Timeout:** 8 seconds. If Claude doesn't respond, return parse failure.
7. **Parse Claude's response** into structured JSON
8. **Update user record:** `cv_storage_path`, `cv_parsed_at`
9. **Return parsed data** to the client

#### 4C. The extraction prompt

Store as a constant in `lib/cv/prompt.ts`:

```ts
export const CV_EXTRACTION_PROMPT = `You are extracting structured data from a yacht crew CV. Return ONLY valid JSON with no explanation.

Extract the following fields. If a field is not found in the CV, use null.

{
  "full_name": "string or null",
  "bio": "string or null — a brief professional summary if present, max 500 chars",
  "location": {
    "country": "string or null — ISO country name",
    "city": "string or null"
  },
  "employment_history": [
    {
      "yacht_name": "string",
      "yacht_type": "Motor Yacht or Sailing Yacht or null",
      "length_m": "number or null — length in metres",
      "role": "string — job title/role on this yacht",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or 'Current' or null",
      "flag_state": "string or null — country name"
    }
  ],
  "certifications": [
    {
      "name": "string — certification name",
      "category": "string or null — one of: Safety & Sea Survival, Medical, Navigation & Watchkeeping, Engineering, Hospitality & Service, Water Sports & Leisure, Regulatory & Flag State, Other",
      "issued_date": "YYYY-MM or YYYY or null",
      "expiry_date": "YYYY-MM or YYYY or null"
    }
  ],
  "languages": ["string"],
  "primary_role": "string or null — their main/most recent role title"
}

Rules:
- Yacht CVs often list vessels in reverse chronological order
- "MY" = Motor Yacht, "SY" = Sailing Yacht
- Length may be in feet — convert to metres (1 foot = 0.3048m), round to nearest whole number
- Dates may be approximate — use the best available precision
- Role names should match yachting conventions (Captain, Chief Stewardess, Bosun, Deckhand, etc.)
- If the CV mentions languages spoken, extract them
- Return valid JSON only, no markdown code fences`;
```

**Why this prompt matters for Sonnet:** The prompt does the heavy lifting. Sonnet (the executing agent) just needs to wire it up — no prompt engineering judgment calls needed.

#### 4D. Review screen: `app/(protected)/app/cv/review/page.tsx`

This page receives parsed data via session storage (simplest approach).

**On "Save to Profile":**
1. Update `users` table: `full_name`, `bio`, `location_country`, `location_city`, `primary_role` (only if currently empty — don't overwrite existing data without asking)
2. For each employment entry:
   - Search for existing yacht by name (use `search_yachts` RPC)
   - If match found → use existing yacht ID
   - If no match → create new yacht
   - Create attachment (user → yacht, role, dates)
3. For each certification:
   - Match cert name to `certification_types` seed list
   - If match → use that type ID
   - If no match → use custom_cert_name
   - Create certification record
4. Navigate to `/app/profile` with success toast: "CV imported successfully"

**CRITICAL for Sonnet:** The yacht matching in the review step MUST use the same `search_yachts` fuzzy RPC used elsewhere. Don't create duplicates. If a yacht already exists with a similar name, prefer the existing one. Show the user which yacht was matched.

**Edge case:** If the user already has data in their profile, the review screen should show which fields will be updated vs. which are already set. Don't silently overwrite.

---

### TASK 5: PDF Generation

#### 5A. API Route: `app/api/cv/generate-pdf/route.ts`

**POST /api/cv/generate-pdf**

Request body:
```ts
{ template?: 'standard' | 'classic-navy' | 'modern-minimal' }
```

Implementation:
1. Auth required
2. If template is not 'standard', check Pro subscription — return 403 if not Pro
3. Fetch all profile data (same queries as public profile page)
4. Render PDF using `@react-pdf/renderer` with `renderToBuffer`
5. Upload to `pdf-exports/{user_id}/profile-{timestamp}.pdf`
6. Update `users.latest_pdf_path` and `users.latest_pdf_generated_at`
7. Generate signed URL (1 hour) and return it

#### 5B. PDF Document Component: `components/pdf/ProfilePdfDocument.tsx`

This uses `@react-pdf/renderer` components — NOT regular React/HTML.

```tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
```

**CRITICAL for Sonnet:** `@react-pdf/renderer` has its own layout system. It does NOT use Tailwind, CSS custom properties, or standard CSS. It uses a Flexbox-based `StyleSheet.create()` API. Study the docs before writing.

**Content:** Name, photo, role, about, employment history, certifications, top 3 endorsements (truncated ~200 chars each), QR code (bottom-left), watermark on free tier.

**Endorsements on PDF:**
- Show top 3 endorsements only (most recent)
- Truncate each to ~200 chars
- After the 3 shown: "View all endorsements at yachtie.link/u/{handle}"

**QR code in PDF:**
- Generate QR code as a data URL (PNG) server-side using `qrcode` (Node.js library, NOT react-qr-code which is browser-only)
- Install: `npm install qrcode @types/qrcode`
- Generate: `const qrDataUrl = await QRCode.toDataURL('https://yachtie.link/u/' + handle, { width: 100 })`
- Embed: `<Image src={qrDataUrl} style={{ width: 60, height: 60 }} />`

**Watermark (free tier):** "Created with YachtieLink" — light grey, small font, bottom of page. Removed for Pro.

**Pro templates:** For Sprint 6, only implement "Standard". Add template prop so Sprint 7 can add "Classic Navy" and "Modern Minimal".

#### 5C. PDF Download API: `app/api/cv/download-pdf/route.ts`

**GET /api/cv/download-pdf** — auth required, fetch `users.latest_pdf_path`, generate signed URL (1 hour), return URL.

---

### TASK 6: Wire Up Actions + Share Flow

#### 6A. Share button on CV tab
Copy `https://yachtie.link/u/{handle}` to clipboard, show toast. Same pattern as `IdentityCard.tsx`.

#### 6B. Profile share button update
If Wheel A = 5/5: show "Share Profile". If not: show "Complete next step". Verify Sprint 3 implementation.

#### 6C. PDF icon in CV tab header
If PDF exists → download. If not → trigger generate flow.

---

### TASK 7: Update Storage Plan + Docs

#### 7A. Update `docs/yl_storage_plan.md`
Move `cv-uploads` and `pdf-exports` from "Future buckets" to active buckets with full documentation.

#### 7B. Add upload helper to `lib/storage/upload.ts`
Add `uploadCV(file, userId)` following the pattern of `uploadProfilePhoto` and `uploadCertDocument`.

---

## File Change Summary

### New files (12):
| File | Purpose |
|------|---------|
| `supabase/migrations/NNNN_sprint6_cv_storage.sql` | Storage buckets + user columns |
| `components/public/PublicProfileContent.tsx` | Shared public profile rendering |
| `components/public/EndorsementCard.tsx` | Collapsible endorsement display |
| `components/pdf/ProfilePdfDocument.tsx` | @react-pdf/renderer PDF layout |
| `lib/cv/prompt.ts` | Claude extraction prompt constant |
| `app/api/cv/parse/route.ts` | CV parsing API (Claude + text extraction) |
| `app/api/cv/generate-pdf/route.ts` | PDF generation API |
| `app/api/cv/download-pdf/route.ts` | PDF signed URL download |
| `app/(protected)/app/cv/upload/page.tsx` | CV upload UI |
| `app/(protected)/app/cv/review/page.tsx` | CV parse review + save |

### Modified files (6):
| File | Change |
|------|--------|
| `app/(public)/u/[handle]/page.tsx` | Rewrite from stub → full public profile |
| `app/(protected)/app/cv/page.tsx` | Rewrite from stub → CV tab with preview + actions |
| `lib/storage/upload.ts` | Add `uploadCV` helper |
| `docs/yl_storage_plan.md` | Add cv-uploads and pdf-exports documentation |
| `package.json` | New dependencies |
| `.env.local` | Add ANTHROPIC_API_KEY |

### New npm packages (5):
| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API client |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |
| `@react-pdf/renderer` | PDF generation |
| `qrcode` + `@types/qrcode` | Server-side QR code generation (for PDF) |

---

## Key Constraints for Sonnet

1. **`@react-pdf/renderer` is NOT regular React.** It has its own component set (`Document`, `Page`, `Text`, `View`, `Image`), its own `StyleSheet.create()`, and its own layout rules. It does NOT support Tailwind, CSS variables, or standard HTML.

2. **`ANTHROPIC_API_KEY` must never reach the client.** Only use in API routes. Never import `@anthropic-ai/sdk` in client components or pages.

3. **Private buckets need signed URLs.** `cv-uploads` and `pdf-exports` are private. Always generate signed URLs at render time (1-hour expiry). Never store signed URLs in the database.

4. **CV parsing is fallible.** If Claude returns malformed JSON or times out, fail gracefully. Show the user a friendly message and redirect to manual entry. Never crash.

5. **Don't overwrite existing profile data.** When saving parsed CV data, only fill in fields that are currently empty/null.

6. **Yacht deduplication on import.** When creating yachts from parsed CV data, run `search_yachts` first. If a close match exists, use the existing yacht.

7. **Top 3 endorsements on PDF.** Only include the 3 most recent. Truncate each to ~200 chars.

8. **QR code on PDF uses `qrcode` (Node.js), not `react-qr-code` (browser).** Different packages for different contexts.

9. **Dark mode on public profile.** Respect the VIEWER's system preference (not the profile owner's).

10. **No upsell on the public profile page.** The CV tab can show locked Pro templates, but the public profile page itself must be clean.

---

## Verification Plan

### Public Profile
1. Navigate to `/u/{handle}` while logged out → page renders with all sections
2. Check page source → OG meta tags present (title, description, image)
3. Share the URL on Slack/WhatsApp → preview card shows correctly
4. View profile of user with hidden contact info → Contact section not shown
5. View profile of user with visible phone → phone number appears
6. Endorsements show truncated with "Read more" → expands on tap
7. QR code visible at bottom-left → encodes correct URL
8. Page loads in <2 seconds on mobile Safari
9. Dark mode works (toggle system preference)

### CV Import
10. Upload a PDF CV → processing spinner → review screen populates
11. Upload a DOCX CV → same flow works
12. Parsed data maps correctly: yachts matched to existing records, certs categorised
13. Edit a field in review → save → profile updated
14. Upload invalid file type → error toast
15. Hit rate limit (3rd parse) → shows "try again tomorrow"
16. Upload unparseable file → friendly error → redirect to manual entry

### PDF Generation
17. Generate PDF → downloads a clean PDF document
18. PDF contains: name, photo, role, about, employment history, certs, top 3 endorsements, QR code
19. Free user PDF has "Created with YachtieLink" watermark
20. QR code on PDF scans to correct URL
21. "Download PDF" shows after generation (uses stored path)
22. "Regenerate PDF" creates fresh version

### CV Tab
23. CV tab shows public profile preview
24. Share button copies link
25. QR download works
26. Pro templates shown as locked with upgrade CTA
