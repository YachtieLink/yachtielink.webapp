-- Fix: auth trigger no longer pre-populates full_name from email prefix.
--
-- Previously, handle_new_user() fell back to split_part(email, '@', 1) when
-- no name metadata was present (e.g. email signups). This caused onboarding
-- to show the email prefix in the name field (e.g. "john.smith" from
-- "john.smith@gmail.com"), and in older wizard code, skipped the name step.
--
-- Fix: use '' as the fallback so the onboarding wizard prompts the user for
-- their real name. The wizard's getStartingStep() already ignores full_name
-- when deciding the starting step (only a handle triggers skip-to-done).

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
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
