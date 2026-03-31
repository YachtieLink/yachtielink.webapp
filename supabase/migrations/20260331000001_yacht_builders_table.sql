-- Migration: Create yacht_builders canonical table
-- Seed with top 100 yacht builders (60m+ comprehensive, 40m+ strong, 24m+ popular)
-- Part of Rally 006 — Builder Autocomplete

-- ═══════════════════════════════════════════════════════════
-- 1. Create yacht_builders table
-- ═══════════════════════════════════════════════════════════

create table public.yacht_builders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  name_normalized text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null
);

-- Index for prefix matching and trigram similarity on normalized name
create index yacht_builders_name_normalized_trgm_idx
  on public.yacht_builders using gin (name_normalized gin_trgm_ops);

create index yacht_builders_name_normalized_idx
  on public.yacht_builders (name_normalized);

-- ═══════════════════════════════════════════════════════════
-- 2. RLS policies
-- ═══════════════════════════════════════════════════════════

alter table public.yacht_builders enable row level security;

create policy "yacht_builders: public read"
  on public.yacht_builders for select
  using (true);

create policy "yacht_builders: authenticated insert"
  on public.yacht_builders for insert
  with check (auth.uid() is not null);

-- No update/delete policies — founder-only via service role

-- ═══════════════════════════════════════════════════════════
-- 3. Seed top 100 yacht builders
-- ═══════════════════════════════════════════════════════════

insert into public.yacht_builders (name, name_normalized) values
  -- 60m+ builders (comprehensive)
  ('Lürssen', 'lurssen'),
  ('Feadship', 'feadship'),
  ('Benetti', 'benetti'),
  ('Oceanco', 'oceanco'),
  ('Amels', 'amels'),
  ('Heesen', 'heesen'),
  ('CRN', 'crn'),
  ('Codecasa', 'codecasa'),
  ('Nobiskrug', 'nobiskrug'),
  ('Abeking & Rasmussen', 'abeking rasmussen'),
  ('Blohm+Voss', 'blohmvoss'),
  ('Fincantieri', 'fincantieri'),
  ('Lürssen (Blohm+Voss)', 'lurssen blohmvoss'),
  ('Golden Yachts', 'golden yachts'),
  ('Kleven', 'kleven'),
  ('Damen Yachting', 'damen yachting'),
  ('Freire', 'freire'),
  ('Admiral (The Italian Sea Group)', 'admiral the italian sea group'),
  ('Rossinavi', 'rossinavi'),
  ('Bilgin', 'bilgin'),
  ('Turquoise Yachts', 'turquoise yachts'),
  ('Hakvoort', 'hakvoort'),
  ('Perini Navi', 'perini navi'),
  ('Viareggio Superyachts (VSY)', 'viareggio superyachts vsy'),
  ('Tankoa Yachts', 'tankoa yachts'),
  ('ISA Yachts', 'isa yachts'),
  ('Columbus Yachts', 'columbus yachts'),
  ('Baglietto', 'baglietto'),
  ('Royal Huisman', 'royal huisman'),
  ('Christensen', 'christensen'),
  ('Delta Marine', 'delta marine'),
  ('Palmer Johnson', 'palmer johnson'),
  ('Westport', 'westport'),
  ('Trinity Yachts', 'trinity yachts'),
  ('Mondo Marine', 'mondo marine'),

  -- 40m+ builders (strong representation)
  ('Sanlorenzo', 'sanlorenzo'),
  ('Sunseeker', 'sunseeker'),
  ('Princess Yachts', 'princess yachts'),
  ('Azimut', 'azimut'),
  ('Ferretti', 'ferretti'),
  ('Riva', 'riva'),
  ('Mangusta (Overmarine)', 'mangusta overmarine'),
  ('Wider', 'wider'),
  ('Majesty Yachts (Gulf Craft)', 'majesty yachts gulf craft'),
  ('Horizon Yachts', 'horizon yachts'),
  ('Numarine', 'numarine'),
  ('Custom Line', 'custom line'),
  ('Moonen', 'moonen'),
  ('Mulder Shipyard', 'mulder shipyard'),
  ('Burger Boat', 'burger boat'),
  ('Cantiere delle Marche (CdM)', 'cantiere delle marche cdm'),
  ('Filippetti', 'filippetti'),
  ('Leopard (by Baglietto)', 'leopard by baglietto'),
  ('Maiora', 'maiora'),
  ('Arcadia Yachts', 'arcadia yachts'),
  ('Dominator', 'dominator'),
  ('Monte Carlo Yachts', 'monte carlo yachts'),
  ('Mondomarine', 'mondomarine'),
  ('Sunrise Yachts', 'sunrise yachts'),
  ('Icon Yachts', 'icon yachts'),
  ('Van der Valk', 'van der valk'),
  ('Bering Yachts', 'bering yachts'),
  ('Nordhavn', 'nordhavn'),
  ('Outer Reef Yachts', 'outer reef yachts'),
  ('Hatteras', 'hatteras'),
  ('Viking Yachts', 'viking yachts'),
  ('Marlow Explorer', 'marlow explorer'),
  ('Cheoy Lee', 'cheoy lee'),
  ('Oceana Yachts', 'oceana yachts'),

  -- 24m+ builders (top popular)
  ('Oyster', 'oyster'),
  ('Baltic Yachts', 'baltic yachts'),
  ('Swan (Nautor)', 'swan nautor'),
  ('Southern Wind', 'southern wind'),
  ('Wally', 'wally'),
  ('CNB (Bénéteau)', 'cnb beneteau'),
  ('Pershing', 'pershing'),
  ('Fairline', 'fairline'),
  ('Riviera', 'riviera'),
  ('Absolute', 'absolute'),
  ('Cranchi', 'cranchi'),
  ('Galeon', 'galeon'),
  ('Prestige', 'prestige'),
  ('Beneteau', 'beneteau'),
  ('Jeanneau', 'jeanneau'),
  ('Lagoon', 'lagoon'),
  ('Fountaine Pajot', 'fountaine pajot'),
  ('Leopard Catamarans', 'leopard catamarans'),
  ('Sunreef Yachts', 'sunreef yachts'),
  ('HMY (Hargrave)', 'hmy hargrave'),
  ('Broward', 'broward'),
  ('Crescent', 'crescent'),
  ('McConaghy', 'mcconaghy'),
  ('Inace', 'inace'),
  ('Alloy Yachts', 'alloy yachts'),
  ('Sensation Yachts', 'sensation yachts'),
  ('Vitters', 'vitters'),
  ('Jongert', 'jongert'),
  ('Holland Jachtbouw', 'holland jachtbouw'),
  ('Pendennis', 'pendennis'),
  ('Devonport Yachts', 'devonport yachts'),
  ('Composite Works', 'composite works'),
  ('Dixon Yacht Design', 'dixon yacht design'),
  ('Gulf Craft', 'gulf craft'),
  ('Alia Yachts', 'alia yachts'),
  ('Aegean Yachts', 'aegean yachts')
on conflict (name) do nothing;
