-- Migration 007: Fix roles unique constraint
-- Change unique(name) → unique(name, department) so the same role title
-- can exist in multiple departments (e.g. "Purser" in Interior & Admin/Purser).
-- Re-inserts Interior Purser which was excluded from seed 006 due to the old constraint.

alter table public.roles
  drop constraint roles_name_key;

alter table public.roles
  add constraint roles_name_department_key unique (name, department);

-- Re-insert Interior Purser now that the constraint allows it
insert into public.roles (name, department, is_senior, sort_order) values
  ('Purser', 'Interior', false, 205);
