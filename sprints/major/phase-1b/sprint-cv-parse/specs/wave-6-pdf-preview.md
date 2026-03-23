# Wave 6: PDF Template + CV Preview/Viewer

## Scope

Update PDF template with all new fields. Build the in-app CV preview component for two audiences: owner previews their CV, viewer reads it on the public profile. Two render paths: generated CV as HTML, uploaded CV as embedded PDF.

## Files

| File | Action |
|------|--------|
| `components/pdf/ProfilePdfDocument.tsx` | MODIFY — add all new fields to all 3 templates |
| `app/api/cv/generate-pdf/route.ts` | MODIFY — fetch new fields |
| `components/cv/CvPreview.tsx` | CREATE — HTML CV render (owner + viewer modes) |
| `app/(protected)/app/cv/preview/page.tsx` | CREATE — owner preview route |
| `app/(public)/u/[handle]/cv/page.tsx` | CREATE — public CV viewer route |
| `components/cv/CvActions.tsx` | MODIFY — wire preview button |
| `components/public/PublicProfileContent.tsx` | MODIFY — "View CV" + "Download PDF" |

## PDF Template Updates

Add to `ProfilePdfDocument.tsx` interfaces and all 3 template variants:

**New in header:** nationality + age (from DOB)
**New section — Personal Details:** smoker, tattoo, visa types, license, languages with proficiency
**Enhanced Employment:** builder, program, description (truncated 500 chars), cruising area, length + flag (already fetched but not rendered)
**Enhanced Certs:** issuing body, issued date
**New sections:** Education, Skills, Hobbies

## PDF Generate Route Updates

Fetch new user columns: `date_of_birth, nationality, smoker, tattoo_visibility, visa_types, drivers_license, languages, show_dob`

Fetch new attachment columns: `employment_type, yacht_program, description, cruising_area`

Fetch yacht builder: update yachts join to include `builder`

Add parallel fetches for: `user_education`, `user_skills`, `user_hobbies`

## CvPreview Component

**File:** `components/cv/CvPreview.tsx`

HTML/Tailwind component — NOT react-pdf. Web-native for fast in-app viewing.

```tsx
interface CvPreviewProps {
  mode: 'owner' | 'viewer'
  user: CvUserData         // all user fields including new ones
  attachments: any[]       // with yacht join (including builder)
  certifications: any[]    // with cert_type join
  endorsements: any[]
  education: any[]
  skills: any[]
  hobbies: any[]
}
```

**Layout:** document-style container. White bg, max-w-[700px], subtle border. Styled to feel like a formatted CV within the app.

```
CHRISTIAN ARNOLD
Head Chef
British · 36 years old
Antibes, France
email · phone

Non Smoker · No Visible Tattoos
B1/B2 · Schengen · Int'l License
English (native) · French (basic)

────────────────────────
ABOUT
[bio text]

────────────────────────
EXPERIENCE
M/Y Amevi · 80m · Oceanco
Head Chef · Oct 2020 – Sep 2021
Private · Mediterranean, Maldives
[description paragraph]

[more entries...]

────────────────────────
CERTIFICATIONS
STCW10 · Valid until Jan 2027
  Romanian Naval Authority
ENG1 · Exp May 2025 ⚠️

────────────────────────
EDUCATION
Le Cordon Bleu · Culinary Arts
2010 – 2011 · Austin, TX

────────────────────────
SKILLS
Silver Service · Wine Knowledge...

────────────────────────
ENDORSEMENTS
"Great chef..." — Capt. Smith
[top 3 excerpts]
```

**Owner mode extras:**
- Missing field prompts inline: `⚠ Add smoker status` → links to edit page
- Section edit links (pencil icon)
- Bottom buttons: "Edit Profile" + "Download PDF"

**Viewer mode:**
- No edit links, no missing prompts
- Bottom: "Download PDF" + back link to profile

## Owner Preview Route

**File:** `app/(protected)/app/cv/preview/page.tsx`

Server component. Fetches all CV data for authenticated user. Renders `CvPreview mode="owner"`.

## Public CV Viewer Route

**File:** `app/(public)/u/[handle]/cv/page.tsx`

Server component. Two render paths based on `cv_public_source`:

| `cv_public_source` | What renders |
|---|---|
| `'generated'` | `CvPreview mode="viewer"` — HTML render of profile data |
| `'uploaded'` | Embedded PDF — user's own uploaded CV in `<iframe>` with signed URL |

Returns 404 if `cv_public = false`.

Back link → `/u/[handle]`. "Download PDF" at bottom for both paths.

## CvActions Updates

Wire the already-imported-but-unused Eye icon:

- Add "Preview your CV" link → `/app/cv/preview`
- Sits next to existing Generate/Download buttons

## PublicProfileContent Updates

Replace current "Download CV" link:

```tsx
// OLD: single download link
// NEW: two buttons
<Link href={`/u/${user.handle}/cv`}>View CV</Link>     // primary
<a href={`/api/cv/public-download/${user.handle}`}>↓</a> // download icon
```

## Verification

- [ ] Owner preview renders at /app/cv/preview with all fields
- [ ] Owner preview: missing field prompts with edit links
- [ ] Owner preview: "Download PDF" works
- [ ] Public CV viewer: /u/[handle]/cv renders generated CV (source = 'generated')
- [ ] Public CV viewer: /u/[handle]/cv renders uploaded PDF iframe (source = 'uploaded')
- [ ] Public CV viewer: 404 when cv_public = false
- [ ] Public profile: "View CV" button works
- [ ] Public profile: download icon works
- [ ] PDF template: all new fields render in all 3 templates
- [ ] PDF includes: age, nationality, smoker, tattoo, visa, license, languages
- [ ] PDF includes: builder, program, description, cruising area per employment
- [ ] PDF includes: issuing body per cert
- [ ] PDF includes: education, skills, hobbies sections
- [ ] Mobile: preview scrollable and readable at 375px
- [ ] Build passes
