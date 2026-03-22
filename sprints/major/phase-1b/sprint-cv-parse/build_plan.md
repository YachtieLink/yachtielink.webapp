# Sprint CV-Parse — Build Plan

## Current State

The CV parse chain works like this today:
1. User uploads PDF/DOCX → stored in `cv-uploads` bucket
2. `POST /api/cv/parse` downloads file, extracts text (pdf-parse or mammoth), sends to OpenAI gpt-4o-mini
3. AI returns structured JSON with: full_name, bio, location, employment_history[], certifications[], languages[], primary_role
4. Client stores parsed data in `sessionStorage`, navigates to `/app/cv/review`
5. CvReviewClient shows editable profile fields + read-only employment/cert/language lists
6. User clicks "Save to Profile" → `saveParsedCvData()` runs:
   - Updates user profile fields (name, role, bio, location)
   - For each employment: searches yachts by name similarity, creates if no match, creates attachment
   - For each certification: matches against certification_types, creates cert record
7. Done — user redirected to profile

### What's Missing

**No user confirmation on yachts, certs, or education:**
- Yachts are auto-matched or auto-created with zero user input
- Certs are auto-matched to cert types with zero confirmation
- Employment entries are read-only in the review screen — no editing, no removing
- No duplicate checking against existing attachments/certs

**No "upload only" mode:**
- Every upload triggers AI parsing
- Users who just want their CV downloadable must go through the full parse flow

**No overwrite protection:**
- Established users risk having their curated profile fields replaced
- The `skipExistingFields` option exists but isn't exposed in the UI

**AI extraction gaps:**
- No education extraction (schools, qualifications)
- No skills extraction
- No hobbies extraction
- Languages extracted but never saved anywhere
- Prompt doesn't extract phone, email, social links

---

## Target State: CV Import Wizard

Replace the current "dump and save" flow with a **step-by-step guided wizard** where the user confirms each piece of extracted data before it touches the database.

### Upload Page (Step 0)

After file upload, two clear paths:

```
┌─────────────────────────────────┐
│  CV uploaded successfully ✓     │
│                                 │
│  [Upload & populate profile]    │  ← Primary: starts the wizard
│  [Just upload my CV]            │  ← Secondary: stores file, done
│                                 │
└─────────────────────────────────┘
```

**"Just upload my CV"** — stores file, updates `cv_storage_path`, shows success toast, returns to CV page. No AI, no parsing, 2 seconds.

**"Upload & populate profile"** — triggers AI parse, enters the wizard.

### Wizard Steps

After AI extraction, the user walks through each section. Each step shows what was extracted, lets them edit/confirm/skip, and nothing is saved until the final confirmation.

#### Step 1: Profile Fields

```
┌─────────────────────────────────┐
│  Your Details                   │
│                                 │
│  Full Name    [Ari Steele    ]  │  ← editable, shows "Already set" if existing
│  Primary Role [2nd Stewardess]  │
│  Bio          [textarea      ]  │
│  Country      [France        ]  │
│  City         [Antibes       ]  │
│                                 │
│  ⚠ These fields will update     │  ← warning only when profile has data
│    your existing profile data   │
│                                 │
│            [Next →]             │
└─────────────────────────────────┘
```

- Each field has a toggle: "Use CV value" / "Keep current" (when existing data differs)
- Fields with no existing data just show the CV value, pre-filled
- Fields where CV extracted nothing show the existing value or empty

#### Step 2: Yachts & Employment

This is the most critical step. For each employment entry:

```
┌─────────────────────────────────┐
│  Yacht 1 of 5                   │
│                                 │
│  From your CV: "M/Y Eclipse"   │
│                                 │
│  ┌─ Match found ──────────────┐ │
│  │ 🛥 M/Y Eclipse             │ │  ← from search_yachts
│  │ Motor Yacht · 162m · 🇲🇹   │ │
│  │ [This is my yacht ✓]       │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Similar yachts ───────────┐ │  ← other matches from search
│  │ M/Y Eclipze (55m, 🇬🇧)    │ │
│  │ [This one instead]         │ │
│  └────────────────────────────┘ │
│                                 │
│  [None of these — create new]   │
│                                 │
│  Role:  [2nd Stewardess   ]     │  ← editable
│  From:  [2022-03    ]           │  ← editable
│  To:    [2023-11    ]           │  ← editable
│                                 │
│  [Skip this yacht]  [Confirm →] │
└─────────────────────────────────┘
```

Key behaviors:
- `search_yachts` RPC returns top 3 matches with similarity scores
- Best match shown prominently, others as alternatives
- "Create new" pre-fills the yacht creation form with CV data
- User can edit role, dates before confirming
- "Skip" removes this entry entirely
- Duplicate check: if user already has an attachment for this yacht, show "You already have this yacht on your profile" with option to update or skip

**Colleague discovery & endorsement requests:**

When a yacht is confirmed (matched to an existing yacht in the DB), query for other crew who have attachments on that yacht. If any are YachtieLink users, surface them as endorsement opportunities:

```
┌─────────────────────────────────┐
│  Crew on YachtieLink:           │
│  ┌────────────────────────────┐ │
│  │ 👤 James Ward              │ │
│  │ Chief Officer · 2021-2023  │ │
│  │ [Request endorsement]      │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 👤 Sophie Chen             │ │
│  │ Chief Stewardess · 2022-23 │ │
│  │ [Request endorsement]      │ │
│  └────────────────────────────┘ │
│  2 former colleagues found      │
└─────────────────────────────────┘
```

- Query: `SELECT * FROM attachments WHERE yacht_id = :yachtId AND user_id != :currentUser` joined with `users` for name/photo
- Filter by overlapping date ranges with the user's dates on that yacht (actual colleagues, not just same yacht different years)
- "Request endorsement" queues an endorsement request (doesn't send immediately — batched at the end of the wizard)
- Endorsement requests are collected across all yacht steps and shown in the summary: "Send 4 endorsement requests to former colleagues?"
- User can deselect any before the final confirm
- Uses the existing endorsement request system (`POST /api/endorsement-requests`)
- This is the single biggest growth lever in the app — every CV upload can generate 3-10 warm endorsement requests automatically

**References & contacts from the CV (people NOT on YachtieLink):**

Many yachtie CVs include a references section with names, roles, yachts, and contact details (email/phone). The AI prompt should extract these:

```json
"references": [
  {
    "name": "Captain Mike Davis",
    "role": "Captain",
    "yacht_name": "M/Y Serenity",
    "email": "mike@example.com",
    "phone": "+33612345678",
    "relationship": "reference"
  }
]
```

For each reference:
1. Check if they're already on YachtieLink (match by email or phone)
2. If yes → show as colleague (same as above)
3. If no → offer to send an endorsement request via their contact method:

```
┌─────────────────────────────────┐
│  References from your CV:       │
│  ┌────────────────────────────┐ │
│  │ 👤 Capt. Mike Davis        │ │
│  │ Captain · M/Y Serenity     │ │
│  │ mike@example.com           │ │
│  │ Not on YachtieLink yet     │ │
│  │ ☑ Invite & request         │ │
│  │   endorsement via email    │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 👤 Sarah Miller            │ │
│  │ Chief Stew · M/Y Azzura    │ │
│  │ +33 6 12 34 56 78          │ │
│  │ Not on YachtieLink yet     │ │
│  │ ☑ Invite & request         │ │
│  │   endorsement via WhatsApp │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

- Uses the existing shareable endorsement request flow (creates a request with `recipient_email` or `recipient_phone`, sends via the endorsement request email/SMS system)
- The invite message: "Hey {name}, {userName} listed you as a reference on YachtieLink. Write a quick endorsement for them?"
- This is the viral growth loop: every CV upload can invite 3-10 industry contacts to the platform through warm, personal endorsement requests
- User has full control — checkbox per reference, can deselect any

#### Step 3: Certifications

For each certification:

```
┌─────────────────────────────────┐
│  Certification 1 of 8          │
│                                 │
│  From your CV: "STCW 95"       │
│                                 │
│  ┌─ Matched type ─────────────┐ │
│  │ 📋 STCW Basic Safety       │ │  ← from certification_types
│  │ Category: Safety & Sea      │ │
│  │ [Correct ✓]                 │ │
│  └────────────────────────────┘ │
│                                 │
│  Or search:  [type to search ]  │  ← searchable cert type picker
│                                 │
│  Issued:  [2020-06    ]         │  ← editable
│  Expires: [2025-06    ]         │  ← editable
│                                 │
│  [Skip]  [Confirm →]           │
└─────────────────────────────────┘
```

Key behaviors:
- Auto-match against `certification_types` by name + short_name (fuzzy)
- If no match: show searchable picker + "Add as custom certification" option
- Duplicate check: if user already has this cert type, show "You already have this certification" with option to update dates or skip
- Expiry date highlighting if cert is expired or expiring soon

#### Step 4: Education (NEW — not currently extracted)

```
┌─────────────────────────────────┐
│  Education 1 of 2               │
│                                 │
│  Institution  [UKSA           ] │  ← editable
│  Qualification [Yachtmaster   ] │  ← editable
│  Field        [Maritime       ] │  ← editable
│  From:  [2019-09]  To: [2020-06]│
│                                 │
│  [Skip]  [Confirm →]           │
└─────────────────────────────────┘
```

- New extraction field in AI prompt
- Maps to `user_education` table
- Simple editable form, no matching needed

#### Step 5: Skills & Languages (NEW)

```
┌─────────────────────────────────┐
│  Skills & Languages             │
│                                 │
│  Skills from your CV:           │
│  [x] Silver Service             │
│  [x] Wine Knowledge             │
│  [x] Flower Arranging           │
│  [ ] Microsoft Office (remove?) │
│  [+ Add more]                   │
│                                 │
│  Languages:                     │
│  [x] English (native)           │
│  [x] French (conversational)    │
│  [+ Add more]                   │
│                                 │
│            [Next →]             │
└─────────────────────────────────┘
```

- Skills map to `user_skills` table
- Languages map to `user_skills` with `category: 'language'` (or a dedicated field if schema supports)
- Checkbox to include/exclude each item

#### Step 6: Summary & Confirm

```
┌─────────────────────────────────┐
│  Ready to import                │
│                                 │
│  Profile fields:  5 updated     │
│  Yachts:          3 matched,    │
│                   1 new         │
│  Certifications:  6 matched,    │
│                   2 custom      │
│  Education:       2 entries     │
│  Skills:          8 added       │
│  Languages:       2 added       │
│                                 │
│  Endorsement requests:          │
│  ☑ James Ward (M/Y Serenity)   │
│  ☑ Sophie Chen (M/Y Serenity)  │
│  ☐ Tom Blake (M/Y Azzura)      │  ← user unchecked this one
│  → Send 2 requests             │
│                                 │
│  [← Back to edit]               │
│  [Import to Profile]            │
│                                 │
│  ⚠ This will update your       │
│    profile. You can edit any    │
│    field later from Settings.   │
└─────────────────────────────────┘
```

---

## AI Prompt Updates

Add to `lib/cv/prompt.ts`:

```json
{
  "education": [
    {
      "institution": "string",
      "qualification": "string or null",
      "field_of_study": "string or null",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or null"
    }
  ],
  "skills": ["string — professional skills mentioned"],
  "hobbies": ["string — hobbies/interests if mentioned"]
}
```

Update rules:
- "Extract education institutions, qualifications, and dates"
- "Extract professional skills — focus on yachting-relevant skills (silver service, wine knowledge, water sports, etc.)"
- "Extract hobbies only if explicitly listed in a hobbies/interests section"

---

## Data Flow

```
Upload → AI Parse → Build wizard state → User walks through steps
                                          ↓
                              Each step: confirm / edit / skip
                                          ↓
                              Final confirmation screen
                                          ↓
                              saveParsedCvData() with user-approved data only
                                          ↓
                              Success → redirect to profile
```

The key change: `saveParsedCvData()` only receives data the user explicitly confirmed. Skipped yachts aren't in the array. Edited fields have the user's values. Nothing auto-saves.

---

## Technical Changes

### New Files
- `components/cv/CvImportWizard.tsx` — the multi-step wizard (replaces CvReviewClient for the populate flow)
- `components/cv/steps/StepProfile.tsx` — profile field confirmation
- `components/cv/steps/StepYachts.tsx` — yacht matching + confirmation
- `components/cv/steps/StepCerts.tsx` — cert matching + confirmation
- `components/cv/steps/StepEducation.tsx` — education confirmation
- `components/cv/steps/StepSkills.tsx` — skills + languages confirmation
- `components/cv/steps/StepSummary.tsx` — final review before saving

### Modified Files
- `lib/cv/prompt.ts` — add education, skills, hobbies extraction
- `lib/cv/save-parsed-cv-data.ts` — accept pre-resolved yacht IDs (user already confirmed matches), add education/skills/hobbies saving, batch operations
- `components/cv/CvUploadClient.tsx` — add "Just upload" vs "Upload & populate" split
- `app/(protected)/app/cv/review/page.tsx` — render CvImportWizard instead of CvReviewClient

### Performance Fixes (from Rally 003)
- Batch yacht lookups (single RPC with array input) instead of N sequential calls
- Batch attachment inserts
- Batch certification inserts
- Pre-fetch all certification_types once, match in JS

---

## Migration

```sql
-- No schema changes needed — all tables already exist:
-- users (profile fields)
-- yachts (yacht records)
-- attachments (user ↔ yacht)
-- certifications (user certs)
-- user_education (education entries)
-- user_skills (skills)
-- user_hobbies (hobbies)
-- Languages: stored in user_skills with category = 'language'
```

---

## Testing Checklist

- [ ] Upload PDF → "Just upload" → CV stored, no parsing, appears on CV page
- [ ] Upload PDF → "Populate" → AI extracts data → wizard opens
- [ ] Upload DOCX → same flow works
- [ ] Step 1: existing profile fields show "Keep current" option
- [ ] Step 2: yacht matching shows correct matches from search_yachts
- [ ] Step 2: "Create new" creates yacht with CV data
- [ ] Step 2: duplicate yacht detected and handled
- [ ] Step 3: cert type matching works (exact + fuzzy)
- [ ] Step 3: custom cert created when no type matches
- [ ] Step 3: duplicate cert detected and handled
- [ ] Step 4: education entries saved correctly
- [ ] Step 5: skills and languages saved correctly
- [ ] Step 6: summary shows correct counts
- [ ] Final save: only confirmed data is written
- [ ] Skipped items are not saved
- [ ] Error mid-save: user sees message, partial data doesn't corrupt profile
- [ ] Test with 5+ real yachtie CVs of varying formats
- [ ] Colleague discovery: matching yacht shows crew members on YachtieLink
- [ ] Colleague discovery: date overlap filter works (only shows actual contemporaries)
- [ ] Endorsement requests: selected colleagues receive requests after final confirm
- [ ] Endorsement requests: deselected colleagues do NOT receive requests
- [ ] Endorsement requests: no duplicate requests sent for existing pending requests
- [ ] Mobile layout works for all wizard steps
- [ ] Build passes, `/review` clean
