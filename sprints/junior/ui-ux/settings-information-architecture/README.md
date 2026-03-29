# Junior Sprint: Settings Information Architecture

**Status:** 🔧 Built — awaiting commit
**Priority:** High
**Filed:** 2026-03-28
**Type:** ui-ux

## Problem

The settings page (`/app/profile/settings`) is a dumping ground mixing:
- Contact info (phone, WhatsApp, email, location) — shown on **public profile + CV**
- Personal details (DOB, home country) — shown on **both**
- CV-only fields (smoking, tattoos, license, travel docs) — shown on **generated CV only**
- Visibility toggles — duplicated (inline + separate section)
- Profile display settings (scrim, accent, template) — **public profile only**, no preview, bad UX
- Page title says "Contact info" but contains 6 unrelated sections

Additionally, name/handle/role editing is buried in Account (`/app/more/account`) — but these ARE the product (the CV/profile). They shouldn't be hidden behind "More > Account".

Auth email (for login) and contact email (shown on CV/profile) are conflated — the settings page shows the auth email as "Contact email" with a disabled field and hint "This is your account email."

## Solution

### New page structure

**Profile tab** — identity + contact + visibility (things that appear on public profile):
- Name, display name, handle, department, role (move FROM account page)
- Contact info: phone, WhatsApp, contact email (editable, separate from auth email), location
- Each field's visibility toggle inline
- DOB + show_dob, home country + show_home_country
- View mode selector (Profile/Portfolio/Rich Portfolio)
- Label each section: "Shown on your public profile" or "Shown on profile and CV"

**CV tab** — CV-specific fields (things that ONLY appear on generated CV):
- Smoking preference
- Tattoos/piercings
- Driving license
- Travel documents / visas
- Label: "These details appear on your generated CV only"

**Account page** (stays in More tab) — auth-only:
- Auth email (for login — not editable here, or change-email flow)
- Password management
- Delete account
- NOT name/handle/role — those move to Profile

### Remove from settings page
- Scrim preset, accent colour, template picker — remove entirely. Hardcode defaults (dark scrim, teal accent, classic template). Revisit when there's a proper preview experience.
- The separate "Visibility" section at the bottom — fold show_dob and show_home_country inline with their fields

### Contact email separation
- Add a `contact_email` column to users (or use existing if present) that defaults to auth email but is independently editable
- Settings page hint: "This is the email shown on your profile and CV. Your login email is managed in Account settings."

## Files to modify

| File | Change |
|------|--------|
| `app/(protected)/app/profile/settings/page.tsx` | Rewrite — profile-facing fields only, with context labels |
| `app/(protected)/app/more/account/page.tsx` | Strip name/handle/role/dept (move to profile settings). Keep auth email, password, delete. |
| `app/(protected)/app/cv/page.tsx` | Add CV-specific fields section (smoking, tattoos, license, travel docs) |
| `lib/hooks/useProfileSettings.ts` | Split: profile fields vs CV fields |
| `app/(protected)/app/profile/page.tsx` | Update link to settings (may need to point to new location) |

## Out of scope
- Live preview for scrim/accent/template (future work, needs proper design)
- Separate contact_email column migration (if not already separate — check first)
