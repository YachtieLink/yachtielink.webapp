# Build Plan: Settings Information Architecture

## Overview

Restructure settings across 3 pages so users always know where their data appears. Move identity fields (name/handle/role) to Profile tab. Move CV-only fields to CV tab. Strip blind customization (scrim/accent/template). Clean up More page.

## Wave 1: Rewrite Profile Settings Page

**File:** `app/(protected)/app/profile/settings/page.tsx`

Rewrite the page with these sections, in order:

### Section 1: Identity (moved from Account page)
Label: "Your identity — shown on your profile, CV, and public page"
- Full name (required)
- Display name (optional, hint: "How your name appears publicly")
- Profile handle (with availability check, URL preview)
- Department(s) multi-select chips
- Primary role (dropdown filtered by dept, or custom)

Copy the identity logic from `app/(protected)/app/more/account/page.tsx`:
- HANDLE_RE, DEPARTMENTS, roles query, availability check, toggleDepartment, filteredRoles, selectedRoleName
- Save updates `full_name, display_name, handle, departments, primary_role`

### Section 2: Contact Info
Label: "Contact details — shown on your public profile and CV"
- Phone + inline toggle "Show on profile"
- WhatsApp + inline toggle "Show on profile"
- Contact email (editable text input, NOT disabled) + inline toggle "Show on profile"
  - Hint: "The email shown on your profile and CV. Your login email is managed in Account."
  - Default value: auth email (from useProfileSettings load)
  - Save to `contact_email` column (need migration — see Wave 0)
- Location (country + city) + inline toggle "Show on profile"

### Section 3: Personal Details
Label: "Personal details — shown on your profile and CV"
- Date of birth + inline toggle "Show age on profile" (sublabel: "Calculated from date of birth")
- Home country + inline toggle "Show home country on profile"

### Section 4: View Mode
Label: "Profile layout — controls how visitors see your public profile"
- View mode selector: Profile / Portfolio / Rich Portfolio (Pro)
- Same UI as current, minus scrim/accent/template

### Remove entirely:
- "Personal Details" box with smoke_pref, appearance_note, license_info (→ CV tab)
- "Visa / Travel Documents" box (→ CV tab)
- Standalone "Visibility" section (folded inline with fields)
- "Profile Display" scrim/accent/template controls (hardcode defaults)

### Hook changes:
Split `useProfileSettings` into the fields this page needs. The hook can stay as-is for now — just don't render the CV-only fields or display settings on this page. The save function needs to also save identity fields.

Actually — simpler approach: this page manages its own state (like the account page already does) for identity fields, and uses `useProfileSettings` for the contact/visibility/view-mode fields. Two saves that run in parallel on the Save button.

## Wave 2: Add CV Details Section to CV Page

**File:** `app/(protected)/app/cv/page.tsx` (server component — need client section)

Create a new client component `components/cv/CvDetailsCard.tsx`:

Label: "CV details — these appear on your generated CV only, not your public profile"

Fields:
- Smoking preference (select: Non Smoker / Smoker / Social Smoker)
- Tattoos / Piercings (select: None / Visible / Non Visible / Not Specified)
- Driving License (text input)
- Visa / Travel Documents (chip select + custom add — reuse exact UI from current settings page)

This component manages its own state (load from users table, save to users table). Pattern: same as useProfileSettings but only for CV-only columns.

Add this card to the CV page below the h1 and above CvActions.

## Wave 3: Clean Up Account Page + More Page

### Account page (`app/(protected)/app/more/account/page.tsx`):
- Remove identity fields (name, handle, role, departments) — they moved to Profile Settings
- Keep ONLY:
  - Auth email display (read-only, shows the login email)
  - Change password link/button (or inline)
  - Hint: "This is your login email. Your contact email is managed on your Profile."
- Rename page title from "Account" to "Login & Security" or keep "Account" but update sublabel

### More page (`app/(protected)/app/more/page.tsx`):
- Account section: change "Edit name, handle & role" to "Login & security" pointing to `/app/more/account`
- Account section: change "Contact info" to "Edit profile & contact info" pointing to `/app/profile/settings`
- Privacy section: REMOVE "Contact visibility" row (it's now inline on the settings page — no duplicate link)
- Keep: Download my data, Delete my account

### Profile hero card (`components/profile/ProfileHeroCard.tsx`):
- Change pencil edit button from `/app/more/account` to `/app/profile/settings` (identity now lives there)

### PersonalDetailsCard (`components/profile/PersonalDetailsCard.tsx`):
- Change edit link from `/app/profile/settings` to `/app/cv/page` or remove the edit link (CV-only fields now live on CV tab)
- Actually: the PersonalDetailsCard shows age, nationality (profile fields) AND smoking, tattoos, license, visas (CV fields). Split the display:
  - Keep age + nationality on PersonalDetailsCard (these are profile fields, edit link → `/app/profile/settings`)
  - The CV-only fields (smoking, tattoos, license, visas) should NOT be on the profile page at all — they're CV-only. Remove them from PersonalDetailsCard display, or add a "See these on your CV tab" hint.

## Wave 0: Migration for contact_email

**File:** `supabase/migrations/20260328100000_contact_email_column.sql`

```sql
-- Separate contact email from auth email
-- Users may want a different email on their CV/profile than their login email
ALTER TABLE users ADD COLUMN contact_email text;

-- Default: populate from existing email column for all users
UPDATE users SET contact_email = email WHERE contact_email IS NULL;
```

The `contact_email` column is nullable. When null, the system falls back to `email` (auth email). This way existing users don't lose their email display, but can override it.

Update readers:
- `useProfileSettings` — read `contact_email` instead of `email`, save to `contact_email`
- `PublicProfileContent` / `HeroSection` / `ContactRow` — use `contact_email ?? email`
- `CvPreview` — use `contact_email ?? email`
- `ProfilePdfDocument` — use `contact_email ?? email`

## Build Order

1. **Wave 0** — Migration (contact_email column)
2. **Wave 1** — Rewrite profile settings page (identity + contact + personal + view mode)
3. **Wave 2** — CV details card on CV tab
4. **Wave 3** — Clean up account page, more page, hero card, personal details card
5. **Type-check + drift-check**

## Exit Criteria

- [ ] Profile settings page has identity fields (name, handle, role, dept)
- [ ] Each section has a label explaining where data appears
- [ ] Contact email is editable (not disabled), separate from auth email
- [ ] CV-only fields (smoking, tattoos, license, visas) are on the CV tab
- [ ] CV tab shows "These appear on your generated CV only" label
- [ ] Scrim/accent/template pickers are gone from settings
- [ ] More page has no duplicate "Contact visibility" link
- [ ] Account page is auth-only (login email, password, no identity fields)
- [ ] Profile hero pencil links to `/app/profile/settings`
- [ ] PersonalDetailsCard no longer shows CV-only fields
- [ ] All visibility toggles are inline with their fields (no separate section)

## Do NOT Touch

- Public profile rendering (scrim/accent/template still work with DB defaults)
- `lib/scrim-presets.ts`, `lib/accent-colors.ts` (keep files, they're still used)
- Display settings API route (keep for future use)
- `displaySettingsSchema` in validation (keep)
