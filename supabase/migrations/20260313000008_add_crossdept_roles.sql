-- Migration 008: Add cross-department roles
-- Deck/Stew (Deck) and Stew/Deck (Interior) for crew who split duties.
-- These are becoming less common but remain a real role type in the industry.

insert into public.roles (name, department, is_senior, sort_order) values
  ('Deck/Stew',  'Deck',     false, 110),
  ('Stew/Deck',  'Interior', false, 209);
