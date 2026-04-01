# Lane 3 — Quick Wins: Custom 404 + Nationality Flag Toggle

## Objective

Two self-contained quick wins: a branded 404 page and a nationality flag visibility toggle on the public profile.

---

## Task A: Custom 404 Page

### Spec
Replace the generic Next.js 404 with a branded YachtieLink 404.

- Copy: "Even the best navigators get lost." (founder's suggestion)
- Include: YachtieLink branding, nav bar (if logged in) or link to /welcome (if not), nautical tone
- Mobile-first layout matching design system
- Consider a compass or anchor icon from Lucide
- Match the style guide voice — professional but warm

### Implementation
1. Create `app/not-found.tsx` (Next.js app router convention)
2. Use existing design tokens and layout patterns
3. Link back to home `/` or `/app/profile` depending on auth state (use `createClient()` to check)
4. Read `docs/design-system/style-guide.md` for tone and component patterns

---

## Task B: Nationality Flag on Public Profile

### Spec
Show nationality flag next to the user's name on the public profile page. Togglable via a `show_nationality_flag` setting.

### Design Decisions (from founder)
| Decision | Choice |
|----------|--------|
| Format | **SVG library** — not emoji (some countries don't have flag emojis). Lazy-load only the needed flag. |
| Position | **Already correct on public profile** — after the name, role below. Do NOT change the public profile layout. |
| Thumbnails | **Profile page only** — don't show in search results, saved cards, or colleague lists. |

### Implementation
1. Find a lightweight flag SVG solution — either `flag-icons` CSS library (tree-shakeable) or a small utility that loads individual flag SVGs on demand. Do NOT load 200KB of flags on every page.
2. Create a `CountryFlag` component that takes a country code and renders the SVG flag (small, inline, ~16-20px)
3. The public profile hero already shows nationality after the name — add the flag icon next to it
4. Add `show_nationality_flag` boolean column to `users` table — BUT: check if a similar column already exists first. If not, create a migration.
5. Add a toggle in profile settings page (alongside existing visibility toggles)
6. Public profile: only render flag if `show_nationality_flag` is true AND `home_country` is set
7. Country code mapping: the DB stores country names (e.g. "United Kingdom"), need to map to ISO 3166-1 alpha-2 codes for the flag library

### Notes
- Check what country data format is already in the DB (`home_country` column on `users`)
- Check if there's already a country → ISO code mapping anywhere in the codebase
- The flag must not break the existing name/role layout — it's additive only

---

## Required Reading
- `docs/design-system/style-guide.md`
- `docs/design-system/patterns/page-layout.md`
- Existing public profile page: `app/(public)/u/[handle]/`

## Allowed Files
- `app/not-found.tsx` (new — 404 page)
- `components/ui/CountryFlag.tsx` (new — flag component)
- `lib/country-codes.ts` (new — country name → ISO code mapping)
- `app/(public)/u/[handle]/**` — wire flag into public profile hero (additive only)
- `app/(protected)/app/profile/settings/page.tsx` — add visibility toggle
- `supabase/migrations/` — ONE migration for `show_nationality_flag` column if needed
- `package.json` — if adding a flag library dependency

## Forbidden Files
- `components/ui/PageHeader.tsx` (Lane 1)
- Ghost profile pages (Lane 2)
- `components/endorsements/` (Lane 2)
- CHANGELOG.md, STATUS.md, sprint docs
