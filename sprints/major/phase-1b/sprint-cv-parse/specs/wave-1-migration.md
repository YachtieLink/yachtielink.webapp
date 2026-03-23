# Wave 1: Schema Migration

## Scope

One migration file. 14 new columns across users/yachts/attachments. No UI changes.

## File

`supabase/migrations/20260323000001_crew_profile_fields.sql` — **already written, build passes.**

## Columns Added

### users (9 columns)

| Column | Type | Default/Constraint |
|--------|------|-------------------|
| `dob` | `date` | nullable. Column-level REVOKE from anon. |
| `home_country` | `text` | nullable |
| `smoke_pref` | `text` | CHECK: `non_smoker`, `smoker`, `social_smoker` |
| `appearance_note` | `text` | CHECK: `none`, `visible`, `non_visible`, `not_specified` |
| `travel_docs` | `text[]` | DEFAULT `'{}'` |
| `license_info` | `text` | nullable |
| `languages` | `jsonb` | DEFAULT `'[]'`. Array of `{language, proficiency}` objects. |
| `show_dob` | `boolean` | NOT NULL DEFAULT false |
| `show_home_country` | `boolean` | NOT NULL DEFAULT true |

### yachts (1 column)

| Column | Type |
|--------|------|
| `builder` | `text` nullable |

### attachments (4 columns)

| Column | Type | Constraint |
|--------|------|-----------|
| `employment_type` | `text` | CHECK: `permanent`, `seasonal`, `freelance`, `relief`, `temporary` |
| `yacht_program` | `text` | CHECK: `private`, `charter`, `private_charter` |
| `description` | `text` | `description_length` CHECK: max 2000 chars |
| `cruising_area` | `text` | nullable |

## Design Decisions

- `languages` as JSONB not `user_skills` — proficiency matters, `user_skills` has no proficiency column
- `dob` REVOKE from anon — public profile shows computed age, never the raw value
- `travel_docs` as `text[]` — small fixed set, array simpler than a join table
- `description` separate from `notes` — notes is private (500 char), description is the public job description from CV (2000 char)
- `builder` on yachts not attachments — builder is a property of the yacht, shared by all crew on it
- No new RLS policies needed — new columns inherit existing row-level policies
- No new GRANT needed — no new RPCs

## Verification

1. `supabase db push` (with founder approval)
2. Verify columns exist with SELECT queries
3. Verify CHECK constraints reject invalid values
4. Verify DOB column-level REVOKE works (anon can't read, authenticated can)
5. `npm run build` passes
