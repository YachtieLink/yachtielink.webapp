-- Migration 006: Reference Data Seed
-- Departments, roles, certification types, templates

-- ─────────────────────────────────────────
-- Departments
-- ─────────────────────────────────────────
insert into public.departments (name, sort_order) values
  ('Deck',         1),
  ('Interior',     2),
  ('Engineering',  3),
  ('Galley',       4),
  ('Medical',      5),
  ('Admin/Purser', 6),
  ('Land-based',   7);

-- ─────────────────────────────────────────
-- Roles (full seed list from yl_features.md)
-- ─────────────────────────────────────────
insert into public.roles (name, department, is_senior, sort_order) values
  -- Deck
  ('Captain',           'Deck', true,  100),
  ('First Officer',     'Deck', true,  101),
  ('Second Officer',    'Deck', false, 102),
  ('Third Officer',     'Deck', false, 103),
  ('Bosun',             'Deck', false, 104),
  ('Lead Deckhand',     'Deck', false, 105),
  ('Deckhand',          'Deck', false, 106),
  ('Junior Deckhand',   'Deck', false, 107),
  ('Navigator',         'Deck', false, 108),
  ('Sailing Master',    'Deck', false, 109),

  -- Interior
  ('Chief Stewardess',  'Interior', true,  200),
  ('Second Stewardess', 'Interior', false, 201),
  ('Third Stewardess',  'Interior', false, 202),
  ('Stewardess',        'Interior', false, 203),
  ('Junior Stewardess', 'Interior', false, 204),
  ('Purser',            'Interior', false, 205),
  ('Housekeeper',       'Interior', false, 206),
  ('Laundress',         'Interior', false, 207),
  ('Butler',            'Interior', false, 208),

  -- Engineering
  ('Chief Engineer',              'Engineering', true,  300),
  ('Second Engineer',             'Engineering', false, 301),
  ('Third Engineer',              'Engineering', false, 302),
  ('ETO (Electro-Technical Officer)', 'Engineering', false, 303),
  ('AV/IT Officer',               'Engineering', false, 304),
  ('Engineer',                    'Engineering', false, 305),

  -- Galley
  ('Head Chef',    'Galley', true,  400),
  ('Sous Chef',    'Galley', false, 401),
  ('Chef',         'Galley', false, 402),
  ('Cook',         'Galley', false, 403),
  ('Crew Cook',    'Galley', false, 404),
  ('Pastry Chef',  'Galley', false, 405),

  -- Medical
  ('''s Doctor', 'Medical', true,  500),
  ('Nurse',        'Medical', false, 501),
  ('Medic',        'Medical', false, 502),
  ('Paramedic',    'Medical', false, 503),

  -- Admin/Purser
  ('Purser',             'Admin/Purser', true,  600),
  ('Administrator',      'Admin/Purser', false, 601),
  ('PA to Captain',      'Admin/Purser', false, 602),
  ('Yacht Manager',      'Admin/Purser', true,  603),
  ('Fleet Manager',      'Admin/Purser', true,  604),

  -- Land-based
  ('Yacht Broker',          'Land-based', false, 700),
  ('Yacht Surveyor',        'Land-based', false, 701),
  ('Naval Architect',       'Land-based', false, 702),
  ('Marine Consultant',     'Land-based', false, 703),
  ('Crew Agent',            'Land-based', false, 704),
  ('Shore-based Manager',   'Land-based', false, 705),
  ('Dock Master',           'Land-based', false, 706),
  ('Marina Manager',        'Land-based', false, 707),
  ('Chandler',              'Land-based', false, 708),
  ('Sail Maker',            'Land-based', false, 709),
  ('Rigger',                'Land-based', false, 710),

  -- Other (cross-department)
  ('Nanny',                        'Other', false, 800),
  ('Fitness Instructor',           'Other', false, 801),
  ('Spa Therapist',                'Other', false, 802),
  ('Dive Instructor',              'Other', false, 803),
  ('Water Sports Instructor',      'Other', false, 804),
  ('Security Officer',             'Other', false, 805),
  ('Videographer/Photographer',    'Other', false, 806);

-- ─────────────────────────────────────────
-- Certification Types (full seed list from yl_features.md)
-- ─────────────────────────────────────────
insert into public.certification_types (name, short_name, category, issuing_bodies, typical_validity_years, keywords) values
  -- Safety & Sea Survival
  ('STCW Basic Safety Training',              'STCW BST',  'Safety & Sea Survival', array['MCA','RYA','USCG'], 5,    array['stcw','bst','basic','safety']),
  ('STCW Advanced Fire Fighting',             'AFF',       'Safety & Sea Survival', array['MCA','RYA'],        5,    array['stcw','aff','fire','fighting']),
  ('STCW Proficiency in Survival Craft',      'PSCRB',     'Safety & Sea Survival', array['MCA','RYA'],        5,    array['stcw','pscrb','survival','craft']),
  ('STCW Medical First Aid',                  'STCW MFA',  'Safety & Sea Survival', array['MCA'],              5,    array['stcw','medical','first','aid']),
  ('STCW Medical Care',                       'STCW MC',   'Safety & Sea Survival', array['MCA'],              5,    array['stcw','medical','care']),
  ('STCW Security Awareness',                 'STCW SA',   'Safety & Sea Survival', array['MCA'],              5,    array['stcw','security','awareness']),
  ('STCW Crowd Management',                   'STCW CM',   'Safety & Sea Survival', array['MCA'],              5,    array['stcw','crowd','management']),
  ('Personal Survival Techniques',            'PST',       'Safety & Sea Survival', array['MCA','RYA'],        5,    array['pst','survival','techniques']),
  ('Sea Survival',                            null,        'Safety & Sea Survival', array['RYA'],              5,    array['sea','survival']),

  -- Medical
  ('ENG1 (UK Seafarer Medical)',              'ENG1',      'Medical', array['MCA'],  2,    array['eng1','seafarer','medical','uk']),
  ('ML5 (UK Medical Fitness)',                'ML5',       'Medical', array['MCA'],  2,    array['ml5','medical','fitness']),
  ('First Aid at Work',                       'FAW',       'Medical', array['HSE'],  3,    array['first','aid','work','faw']),
  ('Remote Emergency Medical Technician',     'REMT',      'Medical', array['MSOS'], 3,    array['remt','remote','emergency','medical']),
  ('Automated External Defibrillator',        'AED',       'Medical', null,          null, array['aed','defibrillator']),
  ('PADI Rescue Diver',                       null,        'Medical', array['PADI'], null, array['padi','rescue','diver']),
  ('PADI Divemaster',                         null,        'Medical', array['PADI'], null, array['padi','divemaster']),

  -- Navigation & Watchkeeping
  ('Yachtmaster Coastal',                     'YM Coastal',  'Navigation & Watchkeeping', array['RYA','MCA'], null, array['yachtmaster','coastal','rya']),
  ('Yachtmaster Offshore',                    'YM Offshore', 'Navigation & Watchkeeping', array['RYA','MCA'], null, array['yachtmaster','offshore','rya']),
  ('Yachtmaster Ocean',                       'YM Ocean',    'Navigation & Watchkeeping', array['RYA','MCA'], null, array['yachtmaster','ocean','rya']),
  ('Officer of the Watch 3000 GT',            'OOW 3000',    'Navigation & Watchkeeping', array['MCA'],       5,    array['oow','officer','watch','3000','gt']),
  ('Chief Mate 3000 GT',                      'CM 3000',     'Navigation & Watchkeeping', array['MCA'],       5,    array['chief','mate','3000','gt']),
  ('Master 3000 GT',                          'Master 3000', 'Navigation & Watchkeeping', array['MCA'],       5,    array['master','3000','gt']),
  ('Master 500 GT',                           'Master 500',  'Navigation & Watchkeeping', array['MCA'],       5,    array['master','500','gt']),
  ('COLREGS',                                 null,          'Navigation & Watchkeeping', null,              null,  array['colregs','collision','regulations']),
  ('Radar/ARPA',                              null,          'Navigation & Watchkeeping', array['MCA','RYA'], 5,    array['radar','arpa']),
  ('GMDSS General Operator Certificate',      'GOC',         'Navigation & Watchkeeping', array['MCA','RYA'], null, array['gmdss','goc','general','operator']),
  ('GMDSS Restricted Operator Certificate',   'ROC',         'Navigation & Watchkeeping', array['MCA','RYA'], null, array['gmdss','roc','restricted','operator']),
  ('ECDIS',                                   null,          'Navigation & Watchkeeping', array['MCA'],       5,    array['ecdis','electronic','chart']),

  -- Engineering
  ('Approved Engine Course',                  'AEC',  'Engineering', array['MCA'], 5,    array['aec','approved','engine','course']),
  ('Y4 Engineer',                             'Y4',   'Engineering', array['MCA'], 5,    array['y4','engineer','yachtmaster']),
  ('Y3 Engineer',                             'Y3',   'Engineering', array['MCA'], 5,    array['y3','engineer']),
  ('Y2 Engineer',                             'Y2',   'Engineering', array['MCA'], 5,    array['y2','engineer']),
  ('Y1 Engineer',                             'Y1',   'Engineering', array['MCA'], 5,    array['y1','engineer']),
  ('Marine Engine Operator Licence',          'MEOL', 'Engineering', array['MCA'], 5,    array['meol','marine','engine','operator']),

  -- Hospitality & Service
  ('WSET Level 1',                            'WSET 1', 'Hospitality & Service', array['WSET'], null, array['wset','wine','level','1']),
  ('WSET Level 2',                            'WSET 2', 'Hospitality & Service', array['WSET'], null, array['wset','wine','level','2']),
  ('WSET Level 3',                            'WSET 3', 'Hospitality & Service', array['WSET'], null, array['wset','wine','level','3']),
  ('Food Safety / Food Hygiene Level 2',      null,     'Hospitality & Service', null,          3,    array['food','safety','hygiene','level','2']),
  ('Food Safety / Food Hygiene Level 3',      null,     'Hospitality & Service', null,          3,    array['food','safety','hygiene','level','3']),
  ('Barista Certification',                   null,     'Hospitality & Service', null,          null, array['barista','coffee']),
  ('Silver Service',                          null,     'Hospitality & Service', null,          null, array['silver','service']),

  -- Water Sports & Leisure
  ('RYA Powerboat Level 2',                   'PB2',  'Water Sports & Leisure', array['RYA'], null, array['rya','powerboat','level','2']),
  ('RYA Jet Ski / PWC',                       null,   'Water Sports & Leisure', array['RYA'], null, array['rya','jet','ski','pwc']),
  ('RYA VHF/SRC',                             'SRC',  'Water Sports & Leisure', array['RYA'], null, array['rya','vhf','src','radio']),
  ('PADI Open Water',                         null,   'Water Sports & Leisure', array['PADI'], null, array['padi','open','water','diver']),
  ('PADI Advanced Open Water',                null,   'Water Sports & Leisure', array['PADI'], null, array['padi','advanced','open','water']),
  ('PADI Instructor',                         'IDC',  'Water Sports & Leisure', array['PADI'], null, array['padi','instructor','idc']),
  ('RYA Dinghy Instructor',                   null,   'Water Sports & Leisure', array['RYA'],  null, array['rya','dinghy','instructor']),
  ('Kitesurf Instructor',                     'IKO',  'Water Sports & Leisure', array['IKO'],  null, array['kitesurf','instructor','iko']),
  ('Windsurf Instructor',                     null,   'Water Sports & Leisure', null,          null, array['windsurf','instructor']),
  ('Wakeboard / Waterski Instructor',         null,   'Water Sports & Leisure', null,          null, array['wakeboard','waterski','instructor']),
  ('Paddle Board Instructor',                 null,   'Water Sports & Leisure', null,          null, array['paddle','board','sup','instructor']),
  ('SSI Open Water',                          null,   'Water Sports & Leisure', array['SSI'],  null, array['ssi','open','water']),

  -- Regulatory & Flag State
  ('ISPS Ship Security Officer',              'SSO',  'Regulatory & Flag State', array['MCA'], 5,    array['isps','sso','security','officer']),
  ('Designated Person Ashore',                'DPA',  'Regulatory & Flag State', array['MCA'], null, array['dpa','designated','person','ashore']),
  ('ISM Auditor',                             null,   'Regulatory & Flag State', null,          null, array['ism','auditor']),
  ('Flag State Registration Certificate',     null,   'Regulatory & Flag State', null,          null, array['flag','state','registration']),
  ('MCA Oral Exam',                           null,   'Regulatory & Flag State', array['MCA'], null, array['mca','oral','exam']);

-- ─────────────────────────────────────────
-- Templates (PDF presentation)
-- ─────────────────────────────────────────
insert into public.templates (name, description, is_free, sort_order) values
  ('Standard',       'Clean, professional layout',           true,  0),
  ('Classic Navy',   'Traditional maritime styling',         false, 1),
  ('Modern Minimal', 'Contemporary, minimal design',         false, 2);
