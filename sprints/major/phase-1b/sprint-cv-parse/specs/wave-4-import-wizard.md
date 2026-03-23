# Wave 4: CV Import Wizard

## The Experience

Upload your CV, see your profile come to life, confirm it looks right, done.

**Four rules:**
1. **Show, don't ask.** Present the merged result as a card. "Looks good?" Yes/Edit.
2. **Never make them type.** If we didn't find something, don't show an empty input. Say "you can add this later" and move on.
3. **Never leave them wondering.** Every second has feedback. Parse runs while they review Step 1.
4. **The wizard is a fast-track, not the whole app.** Get the profile to 80% as fast as possible. They can edit everything from the normal app afterwards. The profile completer helps them close out the remaining 20%.

The wizard is a **review flow**, not a form. The user confirms batches, not fields. Every tap should feel like progress, never like homework.

---

## Files

| File | Action |
|------|--------|
| `components/cv/CvUploadClient.tsx` | MODIFY — two-button split after upload |
| `app/(protected)/app/cv/review/page.tsx` | MODIFY — render wizard, pass storagePath from URL |
| `components/cv/CvImportWizard.tsx` | CREATE — wizard shell, state management, parse trigger |
| `components/cv/ConfirmCard.tsx` | CREATE — confirm/edit card wrapper |
| `components/cv/ConflictInput.tsx` | CREATE — input with conflict highlight |
| `components/cv/ChipSelect.tsx` | CREATE — toggleable chip cloud |
| `components/cv/steps/StepPersonal.tsx` | CREATE — Step 1: personal details confirm card |
| `components/cv/steps/StepExperience.tsx` | CREATE — Step 2: yacht confirm cards |
| `components/cv/steps/StepQualifications.tsx` | CREATE — Step 3: certs + education |
| `components/cv/steps/StepExtras.tsx` | CREATE — Step 4: skills, hobbies, social |
| `components/cv/steps/StepReview.tsx` | CREATE — Step 5: summary + endorsements + import |

## CvUploadClient Changes

After file uploads, show two paths:

```
CV uploaded successfully [ok]
{filename} . {filesize}

[Build my profile from this CV]        <-- primary, full-width
We'll read your CV and walk you
through it section by section.

[Just upload, don't change my profile]  <-- text link below
```

**"Just upload"** -> `supabase.from('users').update({ cv_storage_path }).eq('id', user.id)` -> toast "CV uploaded" -> `router.push('/app/cv')`

**"Build my profile"** -> `router.push('/app/cv/review?path=${encodeURIComponent(storagePath)}')` — parse fires from wizard.

## CvImportWizard — Architecture

```tsx
interface CvImportWizardProps {
  userId: string
  storagePath: string
  existingProfile: ExistingProfileData  // typed in Wave 3
  existingAttachments: ExistingAttachment[]
  existingCerts: ExistingCert[]
  existingEducation: ExistingEducation[]
  existingSkills: string[]
  existingHobbies: string[]
}
```

### On mount:
1. Fire `/api/cv/parse` with storagePath in background
2. Show Step 1 immediately with existing profile data as a preview card
3. Show staged parse progress: "Reading your CV..." -> "Finding your experience..." -> "Done!"
4. When parse completes -> auto-merge with existing data -> all steps become confirm cards

### Step navigation:
- Header: `Step 1 of 5` with thin progress bar (fills as steps complete)
- Steps advance with slide-left animation (framer-motion, `PageTransition` pattern)
- "Back" preserves all confirmed data
- Steps 2-5 show skeleton cards until parse completes

### State persistence:
- Wizard state saved to `sessionStorage` keyed by `cv-wizard-${storagePath}`
- On mount, check for existing state -> resume where they left off
- Cleared on successful import

### Parse failure handling:
- If parse fails after retry -> don't dead-end. Show:
  ```
  We couldn't read your CV automatically.
  You can fill in your details from your profile settings,
  or try uploading a different file.

  [Go to profile]     [Try again]
  ```
- If parse returns partial data (some fields null) -> proceed normally. The confirm cards just show what we found.

---

## Step 1: Your Details

**Loads immediately — no parse wait.** Shows existing profile data as a confirm card. When parse completes, the card updates with CV data merged in.

### Before parse completes:

If the user has existing profile data, show it as a confirm card with a gentle loading indicator:

```
+-----------------------------------------+
|  Your Details                           |
|                                         |
|  {full_name}                            |
|  {role}                                 |
|  {location}                             |
|                                         |
|  [loading] Reading your CV for more...  |
|                                         |
|  [This looks right]         [Edit]      |
+-----------------------------------------+
```

If the user has NO existing data, show a warm waiting state:

```
+-----------------------------------------+
|  Reading your CV...                     |
|                                         |
|  ---- (skeleton)                        |
|  ---- (skeleton)                        |
|                                         |
|  Hang tight -- we're pulling out        |
|  your details, experience, and          |
|  qualifications.                        |
+-----------------------------------------+
```

### After parse completes:

Auto-merge runs. The card updates to show the full merged result:

```
+-----------------------------------------+
|  Your Details                           |
|                                         |
|  {full_name}                            |
|  {role} . {home_country} . {age}         |
|  {location}                             |
|  {phone}                                |
|                                         |
|  {smoke_pref_label} . {appearance_label}        |
|  {visa_badges}                          |
|  {license_label}                        |
|                                         |
|  {languages_list}                       |
|                                         |
|  [Looks good]            [Edit details] |
+-----------------------------------------+
```

**Rendering rules for the card:**
- Only show fields that have values (either existing or from CV)
- Empty fields are NOT shown on the card — don't draw attention to gaps
- If fewer than 3 fields have data, show a note: "We found a few details. You can add more anytime from your profile."
- Format fields nicely: DOB shown as age, home_country as text, visa as comma list

**"Looks good"** -> confirm all merged values -> animate to Step 2.

**"Edit details"** -> card expands into editable form. Only fields that have values are shown as inputs. At the bottom, a subtle expand: "Add more details" reveals remaining empty fields for power users who want to type.

```
+-----------------------------------------+
|  Your Details                           |
|                                         |
|  Full Name     [{full_name}           ] |
|  Primary Role  [{role}                ] |
| |Nationality   [{home_country}        v] |  <-- amber = changed by CV
| |              was: {old_value}         |
|  Date of Birth [{dob}                 ] |
|  Country       [{country}            v] |
|  City          [{city}                ] |
|  Phone         [{phone}               ] |
|  Smoke Pref        [{smoke_pref_option}      v] |
|  Appearance       [{appearance_option}      v] |
|  License       [{license}             ] |
|  Visas         [x] {visa_1} [x] {visa_2}|
|                                         |
|  {lang_1}  [{proficiency}           v] x|
|  {lang_2}  [{proficiency}           v] x|
|  [+ Add language]                       |
|                                         |
|  > Add more details                     |  <-- collapsed, for empty fields
|                                         |
|  [Done]                                 |
+-----------------------------------------+
```

---

## Step 2: Your Experience (The Hard One)

This is the most complex and most important step. Yacht matching requires real craft — the user needs to see their career history appear correctly without doing work. The logic is intricate but the UX must feel effortless.

### The Overview

All yachts from the CV shown as a scrollable list of cards. Each card is in one of four states:

| State | What the user sees | What happened behind the scenes |
|-------|-------------------|-------------------------------|
| **Matched** | Yacht card with specs, green check | `search_yachts` RPC found a confident match (similarity > 0.6) |
| **Needs pick** | Yacht name + 2-3 options to choose from | Multiple fuzzy matches found, user picks the right one |
| **New yacht** | Yacht card with "New to YachtieLink" badge | No match found, will create new yacht entry |
| **Already on profile** | Yacht card with enrichment note | Matched yacht + user already has attachment with overlapping dates |

The goal: most cards land in "Matched" or "New yacht" — zero decisions needed. "Needs pick" should be rare (fuzzy name matches). "Already on profile" is handled automatically.

### Yacht Matching Pipeline

On parse complete, before rendering Step 2, run the matching pipeline for ALL yachts in parallel:

```ts
// For each yacht from the CV
for (const cvYacht of parsedYachts) {
  // 1. Search our database
  const matches = await searchYachts(cvYacht.yacht_name)

  // 2. Score matches against CV data (name + length + type)
  const scored = scoreMatches(matches, cvYacht)

  // 3. Check if user already has this yacht
  const existingAttachment = findExistingAttachment(scored.bestMatch, userAttachments, cvYacht.dates)

  // 4. Determine card state
  if (scored.confidence > 0.6) -> "Matched" or "Already on profile"
  else if (scored.alternatives.length > 0) -> "Needs pick"
  else -> "New yacht"
}
```

**Scoring logic:** The `search_yachts` RPC returns fuzzy name matches. Score each by:
- Name similarity (from RPC, 0-1)
- Length match: if CV length matches DB length -> +0.2 boost
- Type match: if both are same type -> +0.1 boost
- Builder match: if CV builder matches DB builder -> +0.15 boost

This pipeline runs in the background while Step 1 is active. By the time the user reaches Step 2, all matching is done.

### Card Layouts

**Matched yacht (confident, no action needed):**
```
+-----------------------------------------+
|  [ok] {yacht_name}                      |
|  {length} . {builder} . {program} . {flag}|
|  {role} . {start} - {end}              |
|  {cruising_area}                        |
|                                    [Edit]|
+-----------------------------------------+
```

Clean. Confident. Green check. User glances and moves on. "Edit" is subtle — secondary text, not a button. Most users won't tap it.

**Needs pick (fuzzy match, user chooses):**
```
+-----------------------------------------+
|  Which yacht is this?                   |
|  Your CV says: "{cv_yacht_name}"        |
|                                         |
|  +-- (*) {match_1_name} --------------+ |
|  |   {length} . {builder} . {flag}    | |
|  +------------------------------------+ |
|  +-- ( ) {match_2_name} --------------+ |
|  |   {length} . {builder} . {flag}    | |
|  +------------------------------------+ |
|  +-- ( ) None of these ---------------+ |
|  |   Create "{cv_yacht_name}" as new  | |
|  +------------------------------------+ |
|                                         |
|  {role} . {start} - {end}              |
|  {cruising_area}                        |
+-----------------------------------------+
```

Radio card selection — tap the right one. Pre-selects the best match. "None of these" creates a new yacht. The role/dates/cruising area sit below the selection, not per-option.

**New yacht (no match, will be created):**
```
+-----------------------------------------+
|  [new] {yacht_name}                     |
|  {length} . {builder} . {program}       |
|  New to YachtieLink                     |
|  {role} . {start} - {end}              |
|  {cruising_area}                        |
|                                    [Edit]|
+-----------------------------------------+
```

Yacht will be created with all specs from the CV (name, type, length, builder, flag). No form to fill — the AI already extracted everything.

**Already on profile (duplicate detected):**
```
+-----------------------------------------+
|  [link] {yacht_name}                    |
|  Already on your profile                |
|                                         |
|  We found new details in your CV:       |
|  + Builder: {builder}                   |
|  + Program: {program}                   |
|  + Cruising: {cruising_area}            |
|                                         |
|  We'll add these to your existing       |
|  entry.                                 |
|                          [Sounds good]  |
+-----------------------------------------+
```

Auto-enrichment — the existing attachment gets new fields. No decisions. "Sounds good" is the only action (or skip the enrichment).

### Edit View (when "Edit" is tapped on any card)

The card expands in-place to show editable fields. Only fields with values are shown. "Add more" at the bottom reveals empty fields for power users.

```
+-----------------------------------------+
|  {yacht_name}                           |
|                                         |
|  Role         [{role}                ]  |
|  From         [{start_date}          ]  |
|  To           [{end_date}            ]  |
|  Type         [{employment_type}    v]  |
|  Program      [{yacht_program}      v]  |
|  Cruising     [{cruising_area}       ]  |
|                                         |
|  > Add description                      |  <-- collapsed, optional
|                                         |
|  [Done]                      [Cancel]   |
+-----------------------------------------+
```

### Former Yacht Names

CVs sometimes list former names: "M/Y Firebird (ex M/Y Anna I)". The AI extracts `former_names`. When searching, we search for BOTH the current name and former names. If the DB has the old name and the CV says the new name with the old name in parentheses, we match on the former name and show:

```
  [ok] {current_name} (formerly {former_name})
  {length} . {builder} . ...
```

The matched yacht in our DB may still have the old name — after import, we can optionally update `yachts.name` to the current name. But that's a separate concern from the wizard.

### The Full Step

```
+-----------------------------------------+
|  Step 2 of 5                            |
|  =============================-----     |
|                                         |
|  Your Experience                        |
|  We found {n} yachts on your CV         |
|                                         |
|  [Matched yacht card]    [ok]           |
|  [Matched yacht card]    [ok]           |
|  [Needs pick card]       [?]            |
|  [New yacht card]        [new]          |
|  [Matched yacht card]    [ok]           |
|  [Already on profile]    [link]         |
|  [Matched yacht card]    [ok]           |
|  [New yacht card]        [new]          |
|                                         |
|  -- Land-based experience ------------- |
|  We also found {n} non-yacht roles.     |
|  These won't be imported -- you can     |
|  add them later when we support it.     |
|                                         |
|  Only the "Needs pick" card above       |
|  needs your input -- the rest is        |
|  ready to go.                           |
|                                         |
|  [Confirm all]                          |
+-----------------------------------------+
```

**Key detail:** The "Confirm all" button is enabled even if "Needs pick" cards haven't been resolved — in that case, the pre-selected best match is used. The user can scroll past without deciding and it still works. Zero required decisions if the matching is good enough.

**Skip:** Any card can be skipped. Tap "Skip" -> card dims with strike-through, "Skipped" label. Tap again to undo. Skipped entries are not imported.

**Colleague discovery:** When a yacht match is confirmed, a background query finds other crew members who were on that yacht during overlapping dates. These are collected silently and shown in Step 5 as endorsement request candidates. The user never sees this work happening in Step 2.

**Empty state** (CV had no yacht experience):
```
+-----------------------------------------+
|  Your Experience                        |
|                                         |
|  We didn't find yacht experience        |
|  on your CV -- no worries! You can      |
|  add yachts anytime from your           |
|  profile.                               |
|                                         |
|  [Next ->]                              |
+-----------------------------------------+
```

---

## Step 3: Qualifications

Certs and education on one screen. Both are "qualifications" — no need for separate steps.

### Certifications section:

```
  Certifications ({n} found)

  [ok] {cert_name}
    Valid until {expiry}
    {issuing_body}

  [!] {cert_name}
    Expired {expiry} -- consider renewing

  [ok] {cert_name}
    Issued {year} . {issuing_body}

  [ok] {cert_name}
    [link] Already on your profile -- added issuing body

  ...

  [Edit certs]    (expands to editable list)
```

**"Edit certs"** -> each cert becomes an editable row: cert type (SearchableSelect), issued, expires, issuing body, remove button.

**Unmatched certs** (cert name doesn't match any `certification_types`): shown with SearchableSelect pre-open. "We're not sure about this one — pick the right cert type or add as custom."

### Education section:

```
  Education ({n} found)

  {institution}
  {qualification} . {start} - {end}

  {institution}
  {qualification} . {year}

  [Edit]
```

**Combined action:**
```
  [Looks good]
```

**Empty states** (no certs and/or no education found): same gentle pattern. "We didn't find certifications on your CV — you can add them from your profile. Most captains look for STCW at minimum."

---

## Step 4: Skills & Interests

Skills, hobbies, and social links — all lightweight, all on one screen.

```
+-----------------------------------------+
|  Skills & Interests                     |
|                                         |
|  Skills:                                |
|  [{skill_1} ok] [{skill_2} ok]         |
|  [{skill_3} ok] [{skill_4} ok]         |
|  [{skill_5} ok] [{skill_6} ok]         |
|  [+ Add]                                |
|                                         |
|  Hobbies:                               |
|  [{hobby_1} ok] [{hobby_2} ok]         |
|  [+ Add]                                |
|                                         |
|  Tap any to remove. Tap + to add.       |
|                                         |
|  Social:                                |
|  Instagram  {handle}                    |
|  [Edit]                                 |
|                                         |
|  [Looks good]                           |
+-----------------------------------------+
```

**Chips are toggleable** — tap to deselect (strike-through + dimmed), tap again to re-select. Existing skills/hobbies already on the profile are shown as non-removable (subtle "(already saved)" label).

**Empty state:** "We didn't find skills or hobbies on your CV — you can add them from your profile anytime."

---

## Step 5: Review & Import

Summary of everything about to be saved. Endorsement requests. Import button.

```
+-----------------------------------------+
|  Ready to import                        |
|                                         |
|  Here's what we'll add:                 |
|                                         |
|  [ok] {n} profile fields                |
|  [ok] {n} yachts ({n} enriched)         |
|  [ok] {n} certifications ({n} enriched) |
|  [ok] {n} education entries             |
|  [ok] {n} skills . {n} hobbies          |
|  [ok] {n} languages                     |
|                                         |
|  -- Endorsements ---------------------- |
|                                         |
|  We found people who can vouch for      |
|  you. Send them an endorsement          |
|  request?                               |
|                                         |
|  [x] {endorser_1} ({yacht_name})        |
|    Found on YachtieLink                 |
|  [x] {endorser_2} (reference)           |
|    Invite via email                     |
|  [ ] {endorser_3} ({yacht_name})        |
|    Not on YachtieLink                   |
|                                         |
|  [Import to my profile]                 |
|                                         |
|  This won't change anything you've      |
|  already saved -- only adds new data.   |
+-----------------------------------------+
```

**"Import to my profile"** -> calls `saveConfirmedImport()` (Wave 5) -> shows celebration:

```
+-----------------------------------------+
|                                         |
|          [ok] All done!                 |
|                                         |
|  Your profile is now {pct}% complete    |
|  ================------  {pct}%         |
|                                         |
|  {n} fields . {n} yachts . {n} certs   |
|  {n} endorsement requests sent          |
|                                         |
|  [View my profile]                      |
|                                         |
|  Still needed for 100%:                 |
|  . {missing_item_1}                     |
|  . {missing_item_2}                     |
|                                         |
+-----------------------------------------+
```

**The celebration screen is critical.** The user needs to feel the payoff. Show the completion percentage, what was added, and what's left. Link to profile so they can see the result.

---

## Review Page Changes

```tsx
// app/(protected)/app/cv/review/page.tsx

// Read storagePath from URL params
const params = await searchParams
const storagePath = params.path

// Fetch everything the wizard needs (parallel queries)
const [profile, attachments, certs, education, skills, hobbies] = await Promise.all([
  supabase.from('users').select('full_name, bio, primary_role, ...all new fields').eq('id', user.id).single(),
  supabase.from('attachments').select('*, yacht:yachts(*)').eq('user_id', user.id).is('deleted_at', null),
  supabase.from('certifications').select('*, type:certification_types(*)').eq('user_id', user.id),
  supabase.from('user_education').select('*').eq('user_id', user.id),
  supabase.from('user_skills').select('skill_name').eq('user_id', user.id),
  supabase.from('user_hobbies').select('name').eq('user_id', user.id),
])

return <CvImportWizard
  userId={user.id}
  storagePath={storagePath}
  existingProfile={profile.data}
  existingAttachments={attachments.data ?? []}
  existingCerts={certs.data ?? []}
  existingEducation={education.data ?? []}
  existingSkills={(skills.data ?? []).map(s => s.skill_name)}
  existingHobbies={(hobbies.data ?? []).map(h => h.name)}
/>
```

---

## Build Order

1. `ConfirmCard`, `ConflictInput`, `ChipSelect` (merge components)
2. `CvImportWizard` (shell + state + parse trigger + step navigation + sessionStorage persistence)
3. `StepPersonal` (immediate render, auto-merge on parse complete)
4. `StepExperience` (yacht cards, matching, duplicate enrichment)
5. `StepQualifications` (certs + education, matching)
6. `StepExtras` (chips for skills/hobbies, social links)
7. `StepReview` (summary + endorsement queue + save + celebration)
8. `CvUploadClient` (two-button split)
9. Review page (render wizard, fetch existing data)

---

## Verification

- [ ] "Just upload" stores file, no parse, returns to CV page
- [ ] "Build my profile" navigates to wizard with storagePath
- [ ] Step 1 renders immediately with existing data (no blank screen)
- [ ] Parse progress shown: "Reading your CV..." -> "Done!"
- [ ] Step 1 card updates when parse completes (new fields appear)
- [ ] "Looks good" on Step 1 confirms all values, advances
- [ ] "Edit details" expands to form with conflict highlights
- [ ] Empty fields NOT shown on confirm card
- [ ] Empty fields available under "Add more details" in edit view
- [ ] Step 2: all yachts shown as scrollable cards
- [ ] Step 2: yacht matching works, create new includes builder
- [ ] Step 2: duplicate detection shows "already on your profile" with enrichment
- [ ] Step 2: Skip dims the card, undo works
- [ ] Step 2: land-based entries shown as info note, not imported
- [ ] Step 3: certs + education on one screen
- [ ] Step 3: cert matching with SearchableSelect for unmatched
- [ ] Step 3: duplicate certs auto-enriched (issuing body added)
- [ ] Step 4: skills/hobbies as toggleable chips
- [ ] Step 4: existing items shown as non-removable
- [ ] Step 5: accurate summary counts
- [ ] Step 5: endorsement requests with opt-in/out checkboxes
- [ ] Step 5: "Import to my profile" calls saveConfirmedImport
- [ ] Post-import celebration: completion %, stats, next steps
- [ ] Wizard state persisted to sessionStorage (resume on refresh)
- [ ] Parse failure: graceful fallback, not dead-end
- [ ] Empty parse result: gentle notes per step, still navigable
- [ ] Back button preserves confirmed data
- [ ] Step transitions: slide animation
- [ ] Mobile: all steps work at 375px
- [ ] Build passes
