# Lane 1 — BUG-01: Onboarding Name Trigger

## Objective
Fix the auth trigger that populates `full_name` from the email prefix (e.g. `john.smith@gmail.com` → `"john.smith"`). This causes the name step in onboarding to show garbage data.

## Background
- The `getStartingStep()` skip bug is already fixed (line 43 of `components/onboarding/Wizard.tsx` always returns 0)
- But the auth trigger still stuffs the email prefix into `full_name`, so the name step pre-fills with "john.smith" instead of being empty
- Users have to manually clear this and type their real name — bad UX

## Tasks

### 1. Fix the auth trigger (migration)
Create a new migration `supabase/migrations/20260401000004_fix_auth_trigger_name.sql`:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
```

The change: remove `split_part(new.email, '@', 1)` from the coalesce chain. If there's no metadata name, `full_name` stays NULL.

### 2. Verify the onboarding wizard handles null full_name
Check `components/onboarding/Wizard.tsx` — make sure the name step works when `full_name` is null:
- The input should start empty (not crash or show "null")
- Verify the step doesn't auto-advance when name is empty
- The "Continue" button should be disabled until a real name is entered

### 3. Clean up the backlog file
Update `sprints/backlog/onboarding-name-from-email.md` — change status from `idea` to `in-progress`.

## Allowed Files
- `supabase/migrations/20260401000004_fix_auth_trigger_name.sql` (NEW)
- `components/onboarding/Wizard.tsx` (if changes needed)
- `sprints/backlog/onboarding-name-from-email.md`

## Forbidden Files
- Any file not in the allowed list
- CHANGELOG.md, STATUS.md, session files

## Edge Cases
- OAuth signups (Google, etc.) will still have `raw_user_meta_data.full_name` populated — those should still work
- Existing users with email-prefix names are already in the DB — this fix is forward-only (new signups)
- Don't change the `on conflict (id) do nothing` behavior
