-- Server-side enforcement: reject reserved handles at the DB level.
-- This is the authoritative gate — client-side checks are UX only.

create or replace function public.check_handle_not_reserved()
returns trigger
language plpgsql
as $$
begin
  -- Skip if handle hasn't changed (avoids self-conflict on unrelated updates)
  if TG_OP = 'UPDATE' and OLD.handle = NEW.handle then
    return NEW;
  end if;

  if NEW.handle is not null and not public.handle_available(NEW.handle) then
    raise exception 'Handle "%" is reserved or already taken', NEW.handle
      using errcode = 'check_violation';
  end if;
  return NEW;
end;
$$;

-- Drop if exists to make migration idempotent
drop trigger if exists trg_check_handle_reserved on public.users;

create trigger trg_check_handle_reserved
  before insert or update of handle on public.users
  for each row
  when (NEW.handle is not null)
  execute function public.check_handle_not_reserved();
