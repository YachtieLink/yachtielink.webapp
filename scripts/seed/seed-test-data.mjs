#!/usr/bin/env node
/**
 * Seed script: creates 25 test users with yachts, attachments, endorsements, etc.
 *
 * All test data is tagged:
 *   - User handles:  test-seed-{firstname}
 *   - User emails:   test-seed-{firstname}@yachtie.link
 *   - Yacht names:   prefixed "TS " (Test Seed)
 *
 * Run:   node scripts/seed/seed-test-data.mjs
 * Clean: node scripts/seed/cleanup-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run with: node --env-file=.env.local scripts/seed/seed-test-data.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PROJECT_ROOT = process.cwd()
const ASSET_ROOT = path.join(PROJECT_ROOT, 'scripts/seed/assets')
const ASSET_MANIFEST_PATH = path.join(ASSET_ROOT, 'asset-manifest.json')
const TEST_SEED_PASSWORD = 'TestSeed2026!'

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}

// ── Test Data Definitions ────────────────────────────────────────────────────

const YACHTS = [
  { name: 'TS Artemis', yacht_type: 'Motor Yacht', length_meters: 65, flag_state: 'Cayman Islands', builder: 'Lürssen' },
  { name: 'TS Blue Horizon', yacht_type: 'Motor Yacht', length_meters: 52, flag_state: 'Marshall Islands', builder: 'Benetti' },
  { name: 'TS Celestia', yacht_type: 'Sailing Yacht', length_meters: 43, flag_state: 'Malta', builder: 'Oyster' },
  { name: 'TS Driftwood', yacht_type: 'Motor Yacht', length_meters: 78, flag_state: 'Bermuda', builder: 'Feadship' },
  { name: 'TS Eclipse Star', yacht_type: 'Motor Yacht', length_meters: 90, flag_state: 'Cayman Islands', builder: 'Oceanco' },
  { name: 'TS Falcon III', yacht_type: 'Sailing Yacht', length_meters: 38, flag_state: 'UK', builder: 'Baltic Yachts' },
  { name: 'TS Golden Reef', yacht_type: 'Motor Yacht', length_meters: 55, flag_state: 'Marshall Islands', builder: 'Amels' },
  { name: 'TS Harbour Light', yacht_type: 'Motor Yacht', length_meters: 48, flag_state: 'Malta', builder: 'Sanlorenzo' },
  { name: 'TS Iris', yacht_type: 'Motor Yacht', length_meters: 70, flag_state: 'Cayman Islands', builder: 'Heesen' },
  { name: 'TS Jade Wave', yacht_type: 'Sailing Yacht', length_meters: 34, flag_state: 'Netherlands', builder: 'Perini Navi' },
]

const USERS = [
  // Deck department
  { first: 'James',    last: 'Whitfield',   role: 'Captain',         dept: 'Deck',        bio: 'Master 3000GT with 15 years in the industry. Passionate about safety and crew development.', country: 'United Kingdom', smoke: 'non_smoker', dob: '1982-06-14' },
  { first: 'Sofia',    last: 'Marinova',    role: 'First Officer',   dept: 'Deck',        bio: 'OOW 3000GT, previously sailing yachts. Love celestial navigation.', country: 'Bulgaria', smoke: 'non_smoker', dob: '1990-03-22' },
  { first: 'Marcus',   last: 'Du Plessis',  role: 'Bosun',           dept: 'Deck',        bio: 'Hands-on bosun specialising in teak and paint work.', country: 'South Africa', smoke: 'social_smoker', dob: '1993-11-05' },
  { first: 'Liam',     last: 'OConnor',     role: 'Lead Deckhand',   dept: 'Deck',        bio: 'Former lifeguard turned deckhand. Dive master and water sports enthusiast.', country: 'Ireland', smoke: 'non_smoker', dob: '1996-08-17' },
  { first: 'Tyler',    last: 'Jensen',      role: 'Deckhand',        dept: 'Deck',        bio: 'Second season, keen to learn. RYA Yachtmaster Offshore.', country: 'Australia', smoke: 'non_smoker', dob: '1999-02-28' },

  // Interior department
  { first: 'Charlotte', last: 'Beaumont',   role: 'Chief Stewardess', dept: 'Interior',   bio: 'Silver service trained, 8 years on 50m+ yachts. Wine sommelier.', country: 'France', smoke: 'non_smoker', dob: '1988-12-03' },
  { first: 'Elena',    last: 'Rossi',       role: 'Second Stewardess', dept: 'Interior',  bio: 'Detail-oriented with a background in hospitality management.', country: 'Italy', smoke: 'non_smoker', dob: '1994-07-19' },
  { first: 'Mia',      last: 'Van der Berg', role: 'Stewardess',      dept: 'Interior',  bio: 'Flower arranging specialist. Fluent in four languages.', country: 'Netherlands', smoke: 'non_smoker', dob: '1997-01-11' },
  { first: 'Zara',     last: 'Okafor',      role: 'Stewardess',      dept: 'Interior',   bio: 'New to yachting, background in luxury hotels.', country: 'Nigeria', smoke: 'non_smoker', dob: '1998-05-30' },
  { first: 'Hannah',   last: 'Fischer',     role: 'Junior Stewardess', dept: 'Interior',  bio: 'First season green, eager to learn and grow in the industry.', country: 'Germany', smoke: 'non_smoker', dob: '2000-09-14' },

  // Engineering
  { first: 'David',    last: 'Kowalski',    role: 'Chief Engineer',  dept: 'Engineering', bio: 'Y4 unlimited, CAT, MTU, and Rolls-Royce engine specialist.', country: 'Poland', smoke: 'smoker', dob: '1979-04-08' },
  { first: 'Ryan',     last: 'Campbell',    role: 'Second Engineer', dept: 'Engineering', bio: 'AEC with electronics background. Hydraulics and watermakers.', country: 'New Zealand', smoke: 'non_smoker', dob: '1991-10-22' },
  { first: 'Kai',      last: 'Nakamura',    role: 'ETO (Electro-Technical Officer)', dept: 'Engineering', bio: 'AV/IT specialist with marine electronics experience.', country: 'Japan', smoke: 'non_smoker', dob: '1993-06-01' },

  // Galley
  { first: 'Pierre',   last: 'Laurent',     role: 'Head Chef',       dept: 'Galley',     bio: 'Cordon Bleu trained, 12 years in superyacht galleys. Mediterranean and Asian fusion.', country: 'France', smoke: 'social_smoker', dob: '1985-08-25' },
  { first: 'Anna',     last: 'Svensson',    role: 'Sous Chef',       dept: 'Galley',     bio: 'Pastry specialist with a passion for Nordic cuisine.', country: 'Sweden', smoke: 'non_smoker', dob: '1992-03-17' },
  { first: 'Jake',     last: 'Thompson',    role: 'Crew Cook',       dept: 'Galley',     bio: 'Keep the crew fed and happy. BBQ master.', country: 'United Kingdom', smoke: 'non_smoker', dob: '1995-12-09' },

  // Medical / Other
  { first: 'Sarah',    last: 'Adams',       role: 'Nurse',           dept: 'Medical',     bio: 'Registered nurse with wilderness and maritime medicine training.', country: 'United States', smoke: 'non_smoker', dob: '1987-11-20' },
  { first: 'Lucy',     last: 'Zhao',        role: 'Nanny',           dept: 'Other',       bio: 'Montessori trained, fluent in Mandarin and English.', country: 'Australia', smoke: 'non_smoker', dob: '1994-04-15' },
  { first: 'Tom',      last: 'Rivera',      role: 'Dive Instructor', dept: 'Other',       bio: 'PADI Master Instructor, freediving coach, and water sports lead.', country: 'Spain', smoke: 'non_smoker', dob: '1991-07-04' },

  // Admin
  { first: 'Olivia',   last: 'Chen',        role: 'Purser',          dept: 'Admin/Purser', bio: 'Financial management and crew admin for 80m+ programs.', country: 'Singapore', smoke: 'non_smoker', dob: '1989-02-14' },

  // More deck/interior to fill out crews
  { first: 'Ben',      last: 'Harris',      role: 'Deckhand',        dept: 'Deck',        bio: 'Third season, sport fishing and tender driving.', country: 'United Kingdom', smoke: 'non_smoker', dob: '1997-06-22' },
  { first: 'Chloe',    last: 'Martin',      role: 'Third Stewardess', dept: 'Interior',   bio: 'Laundry and housekeeping specialist, Silver service trained.', country: 'South Africa', smoke: 'non_smoker', dob: '1998-10-08' },
  { first: 'Finn',     last: 'Murphy',      role: 'Second Officer',  dept: 'Deck',        bio: 'EOOW, radar and ECDIS certified. Working towards Chief Mate.', country: 'Ireland', smoke: 'non_smoker', dob: '1994-01-30' },
  { first: 'Grace',    last: 'Kim',         role: 'Stewardess',      dept: 'Interior',    bio: 'Former flight attendant, five-star service background.', country: 'South Korea', smoke: 'non_smoker', dob: '1995-05-19' },
  { first: 'Hugo',     last: 'Bergström',   role: 'Engineer',        dept: 'Engineering', bio: 'Mechanical engineering degree, first season afloat.', country: 'Sweden', smoke: 'non_smoker', dob: '1998-08-11' },
]

// Which yachts each user has worked on (by yacht index) + dates
// Designed to create overlapping crews = colleagues
const CREW_ASSIGNMENTS = [
  // James (Captain) — Artemis, Driftwood, Eclipse Star
  { userIdx: 0,  yachtIdx: 0, role: 'Captain',          start: '2020-03-01', end: '2023-06-30', type: 'permanent', program: 'private', area: 'Mediterranean' },
  { userIdx: 0,  yachtIdx: 3, role: 'Captain',          start: '2023-09-01', end: null,         type: 'permanent', program: 'charter', area: 'Caribbean' },

  // Sofia (1st Officer) — Artemis, Driftwood
  { userIdx: 1,  yachtIdx: 0, role: 'First Officer',    start: '2021-01-01', end: '2023-06-30', type: 'permanent', program: 'private', area: 'Mediterranean' },
  { userIdx: 1,  yachtIdx: 3, role: 'First Officer',    start: '2023-09-01', end: null,         type: 'permanent', program: 'charter', area: 'Caribbean' },

  // Marcus (Bosun) — Artemis, Blue Horizon
  { userIdx: 2,  yachtIdx: 0, role: 'Bosun',            start: '2020-03-01', end: '2022-12-31', type: 'permanent', program: 'private', area: 'Mediterranean' },
  { userIdx: 2,  yachtIdx: 1, role: 'Bosun',            start: '2023-03-01', end: null,         type: 'seasonal',  program: 'charter', area: 'Caribbean' },

  // Liam (Lead Deckhand) — Artemis, Blue Horizon, Celestia
  { userIdx: 3,  yachtIdx: 0, role: 'Lead Deckhand',    start: '2021-04-01', end: '2022-10-31', type: 'seasonal',  program: 'private', area: 'Mediterranean' },
  { userIdx: 3,  yachtIdx: 1, role: 'Lead Deckhand',    start: '2023-03-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Caribbean' },
  { userIdx: 3,  yachtIdx: 2, role: 'Lead Deckhand',    start: '2025-01-01', end: null,         type: 'permanent', program: 'private', area: 'Pacific' },

  // Tyler (Deckhand) — Blue Horizon, Golden Reef
  { userIdx: 4,  yachtIdx: 1, role: 'Deckhand',         start: '2024-04-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 4,  yachtIdx: 6, role: 'Deckhand',         start: '2025-03-01', end: null,         type: 'seasonal',  program: 'charter', area: 'Caribbean' },

  // Charlotte (Chief Stew) — Driftwood, Eclipse Star
  { userIdx: 5,  yachtIdx: 3, role: 'Chief Stewardess', start: '2019-06-01', end: '2022-12-31', type: 'permanent', program: 'charter', area: 'Mediterranean' },
  { userIdx: 5,  yachtIdx: 4, role: 'Chief Stewardess', start: '2023-03-01', end: null,         type: 'permanent', program: 'private', area: 'Worldwide' },

  // Elena (2nd Stew) — Driftwood, Artemis
  { userIdx: 6,  yachtIdx: 3, role: 'Second Stewardess', start: '2021-04-01', end: '2023-06-30', type: 'permanent', program: 'charter', area: 'Mediterranean' },
  { userIdx: 6,  yachtIdx: 0, role: 'Second Stewardess', start: '2023-09-01', end: null,         type: 'seasonal',  program: 'private', area: 'Caribbean' },

  // Mia (Stew) — Blue Horizon, Harbour Light
  { userIdx: 7,  yachtIdx: 1, role: 'Stewardess',       start: '2023-03-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 7,  yachtIdx: 7, role: 'Stewardess',       start: '2025-01-01', end: null,         type: 'permanent', program: 'private', area: 'Southeast Asia' },

  // Zara (Stew) — Golden Reef
  { userIdx: 8,  yachtIdx: 6, role: 'Stewardess',       start: '2025-01-01', end: null,         type: 'seasonal',  program: 'charter', area: 'Caribbean' },

  // Hannah (Junior Stew) — Harbour Light
  { userIdx: 9,  yachtIdx: 7, role: 'Junior Stewardess', start: '2025-03-01', end: null,        type: 'seasonal',  program: 'private', area: 'Southeast Asia' },

  // David (Chief Eng) — Eclipse Star, Artemis
  { userIdx: 10, yachtIdx: 4, role: 'Chief Engineer',   start: '2018-01-01', end: '2022-12-31', type: 'permanent', program: 'private', area: 'Worldwide' },
  { userIdx: 10, yachtIdx: 0, role: 'Chief Engineer',   start: '2023-03-01', end: null,         type: 'permanent', program: 'private', area: 'Mediterranean' },

  // Ryan (2nd Eng) — Eclipse Star, Driftwood
  { userIdx: 11, yachtIdx: 4, role: 'Second Engineer',  start: '2020-06-01', end: '2023-02-28', type: 'permanent', program: 'private', area: 'Worldwide' },
  { userIdx: 11, yachtIdx: 3, role: 'Second Engineer',  start: '2023-09-01', end: null,         type: 'permanent', program: 'charter', area: 'Caribbean' },

  // Kai (ETO) — Eclipse Star, Iris
  { userIdx: 12, yachtIdx: 4, role: 'ETO',              start: '2021-01-01', end: '2024-06-30', type: 'permanent', program: 'private', area: 'Worldwide' },
  { userIdx: 12, yachtIdx: 8, role: 'ETO',              start: '2024-09-01', end: null,         type: 'permanent', program: 'charter', area: 'Mediterranean' },

  // Pierre (Head Chef) — Driftwood, Eclipse Star
  { userIdx: 13, yachtIdx: 3, role: 'Head Chef',        start: '2019-06-01', end: '2022-12-31', type: 'permanent', program: 'charter', area: 'Mediterranean' },
  { userIdx: 13, yachtIdx: 4, role: 'Head Chef',        start: '2023-03-01', end: null,         type: 'permanent', program: 'private', area: 'Worldwide' },

  // Anna (Sous Chef) — Golden Reef, Iris
  { userIdx: 14, yachtIdx: 6, role: 'Sous Chef',        start: '2023-04-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 14, yachtIdx: 8, role: 'Sous Chef',        start: '2025-01-01', end: null,         type: 'permanent', program: 'charter', area: 'Caribbean' },

  // Jake (Crew Cook) — Blue Horizon, Celestia
  { userIdx: 15, yachtIdx: 1, role: 'Crew Cook',        start: '2023-03-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 15, yachtIdx: 2, role: 'Crew Cook',        start: '2025-01-01', end: null,         type: 'permanent', program: 'private', area: 'Pacific' },

  // Sarah (Nurse) — Eclipse Star
  { userIdx: 16, yachtIdx: 4, role: 'Nurse',            start: '2022-06-01', end: null,         type: 'permanent', program: 'private', area: 'Worldwide' },

  // Lucy (Nanny) — Driftwood
  { userIdx: 17, yachtIdx: 3, role: 'Nanny',            start: '2023-09-01', end: null,         type: 'permanent', program: 'charter', area: 'Caribbean' },

  // Tom (Dive Instructor) — Blue Horizon, Celestia, Jade Wave
  { userIdx: 18, yachtIdx: 1, role: 'Dive Instructor',  start: '2023-04-01', end: '2024-04-30', type: 'freelance', program: 'charter', area: 'Caribbean' },
  { userIdx: 18, yachtIdx: 2, role: 'Water Sports Lead', start: '2024-06-01', end: '2025-03-31', type: 'seasonal', program: 'private', area: 'Pacific' },
  { userIdx: 18, yachtIdx: 9, role: 'Dive Instructor',  start: '2025-04-01', end: null,         type: 'freelance', program: 'charter', area: 'Maldives' },

  // Olivia (Purser) — Eclipse Star, Iris
  { userIdx: 19, yachtIdx: 4, role: 'Purser',           start: '2020-01-01', end: '2024-06-30', type: 'permanent', program: 'private', area: 'Worldwide' },
  { userIdx: 19, yachtIdx: 8, role: 'Purser',           start: '2024-09-01', end: null,         type: 'permanent', program: 'charter', area: 'Mediterranean' },

  // Ben (Deckhand) — Golden Reef, Falcon III
  { userIdx: 20, yachtIdx: 6, role: 'Deckhand',         start: '2024-04-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 20, yachtIdx: 5, role: 'Deckhand',         start: '2025-01-01', end: null,         type: 'seasonal',  program: 'private', area: 'Caribbean' },

  // Chloe (3rd Stew) — Golden Reef, Harbour Light
  { userIdx: 21, yachtIdx: 6, role: 'Third Stewardess', start: '2024-04-01', end: '2024-10-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 21, yachtIdx: 7, role: 'Third Stewardess', start: '2025-01-01', end: null,         type: 'permanent', program: 'private', area: 'Southeast Asia' },

  // Finn (2nd Officer) — Iris, Falcon III
  { userIdx: 22, yachtIdx: 8, role: 'Second Officer',   start: '2023-06-01', end: '2024-12-31', type: 'permanent', program: 'charter', area: 'Mediterranean' },
  { userIdx: 22, yachtIdx: 5, role: 'Second Officer',   start: '2025-03-01', end: null,         type: 'permanent', program: 'private', area: 'Caribbean' },

  // Grace (Stew) — Iris, Jade Wave
  { userIdx: 23, yachtIdx: 8, role: 'Stewardess',       start: '2024-01-01', end: '2024-12-31', type: 'seasonal',  program: 'charter', area: 'Mediterranean' },
  { userIdx: 23, yachtIdx: 9, role: 'Stewardess',       start: '2025-04-01', end: null,         type: 'permanent', program: 'charter', area: 'Maldives' },

  // Hugo (Engineer) — Harbour Light, Falcon III
  { userIdx: 24, yachtIdx: 7, role: 'Engineer',         start: '2025-01-01', end: null,         type: 'permanent', program: 'private', area: 'Southeast Asia' },
  { userIdx: 24, yachtIdx: 5, role: 'Engineer',         start: '2024-04-01', end: '2024-12-31', type: 'seasonal',  program: 'private', area: 'Mediterranean' },
]

const CERT_NAMES = [
  'STCW Basic Safety Training',
  'ENG1 Medical Certificate',
  'STCW Advanced Fire Fighting',
  'STCW Proficiency in Survival Craft',
  'Ship Security Officer',
  'Yacht Rating (MCA)',
  'Food Safety Level 2',
  'First Aid at Work',
  'Powerboat Level 2',
  'Personal Watercraft Proficiency',
  'VHF/SRC Radio Operator',
  'GMDSS GOC',
]

const SKILLS_BY_DEPT = {
  Deck:        ['Tender driving', 'Line handling', 'Teak maintenance', 'Paint and varnish', 'Navigation', 'Anchoring', 'Water sports', 'Rope splicing'],
  Interior:    ['Silver service', 'Flower arranging', 'Wine service', 'Housekeeping', 'Laundry care', 'Table setting', 'Event planning', 'Guest relations'],
  Engineering: ['Diesel engines', 'Hydraulics', 'Watermakers', 'Electrical systems', 'PLC programming', 'Air conditioning', 'Welding', 'AV systems'],
  Galley:      ['Menu planning', 'Dietary requirements', 'Provisioning', 'Food presentation', 'Pastry', 'BBQ and grill', 'Wine pairing', 'Crew meals'],
  Medical:     ['Triage', 'First aid', 'Medication management', 'Medical evacuations', 'CPR', 'Wound care'],
  'Admin/Purser': ['Crew admin', 'Flag state compliance', 'ISM audits', 'Budget management', 'Customs clearance', 'Port agent liaison'],
  Other:       ['PADI certification', 'Child development', 'Water sports instruction', 'Fitness training', 'Photography', 'Massage therapy'],
}

const HOBBIES = [
  { name: 'Surfing', emoji: '🏄' },
  { name: 'Diving', emoji: '🤿' },
  { name: 'Cooking', emoji: '🍳' },
  { name: 'Photography', emoji: '📷' },
  { name: 'Running', emoji: '🏃' },
  { name: 'Yoga', emoji: '🧘' },
  { name: 'Reading', emoji: '📚' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Guitar', emoji: '🎸' },
  { name: 'Hiking', emoji: '🥾' },
  { name: 'Fishing', emoji: '🎣' },
  { name: 'Sailing', emoji: '⛵' },
  { name: 'Cycling', emoji: '🚴' },
  { name: 'Gym', emoji: '💪' },
  { name: 'Painting', emoji: '🎨' },
]

const LANGUAGES = ['English', 'French', 'Spanish', 'Italian', 'German', 'Dutch', 'Portuguese', 'Mandarin', 'Japanese', 'Swedish', 'Norwegian', 'Polish', 'Russian', 'Arabic', 'Greek']

const GALLERY_ASSIGNMENTS = {
  'test-seed-james': [
    { slug: 'tender-driving', yacht: 'TS Driftwood', caption: 'Tender driving during guest shuttle operations.' },
    { slug: 'dockside-prep', yacht: 'TS Artemis', caption: 'Dockside prep during a Med turnaround.' },
  ],
  'test-seed-marcus': [
    { slug: 'deck-teak-work', yacht: 'TS Artemis', caption: 'Exterior upkeep between guest movements.' },
    { slug: 'deck-rail-cleaning', yacht: 'TS Blue Horizon', caption: 'Polishing rails before guest arrival.' },
  ],
  'test-seed-charlotte': [
    { slug: 'guest-table-setting', yacht: 'TS Eclipse Star', caption: 'Formal table setup at sunset.' },
    { slug: 'wine-service', yacht: 'TS Driftwood', caption: 'Service detail for evening guest experience.' },
  ],
  'test-seed-pierre': [
    { slug: 'galley-plating', yacht: 'TS Eclipse Star', caption: 'Galley plating before dinner service.' },
  ],
  'test-seed-david': [
    { slug: 'engine-room-rounds', yacht: 'TS Artemis', caption: 'Morning technical checks in the engine room.' },
  ],
  'test-seed-tom': [
    { slug: 'water-sports-launch', yacht: 'TS Jade Wave', caption: 'Water sports launch and guest activity setup.' },
  ],
  'test-seed-olivia': [
    { slug: 'crew-life-collage', yacht: 'TS Iris', caption: 'A snapshot of guest service, galley, and sunset programme moments.' },
  ],
  'test-seed-elena': [
    { slug: 'silver-service', yacht: 'TS Artemis', caption: 'Silver service setup before guest lunch.' },
  ],
  'test-seed-finn': [
    { slug: 'bridge-watch', yacht: 'TS Falcon III', caption: 'Bridge watch during coastal passage.' },
  ],
  'test-seed-ben': [
    { slug: 'sunrise-anchor-watch', yacht: 'TS Falcon III', caption: 'Anchor watch at first light.' },
  ],
  'test-seed-grace': [
    { slug: 'sunset-stern', yacht: 'TS Jade Wave', caption: 'Sunset guest setup on the stern deck.' },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function randomDate(yearFrom, yearTo) {
  const y = yearFrom + Math.floor(Math.random() * (yearTo - yearFrom + 1))
  const m = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')
  const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function futureDate(from) {
  const d = new Date(from)
  d.setFullYear(d.getFullYear() + 3 + Math.floor(Math.random() * 3))
  return d.toISOString().slice(0, 10)
}

async function loadAssetManifest() {
  const raw = await fs.readFile(ASSET_MANIFEST_PATH, 'utf8')
  return JSON.parse(raw)
}

function mimeTypeFor(filePath) {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function publicUrlFor(bucket, storagePath) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return `${data.publicUrl}?t=${Date.now()}`
}

function extractPublicStoragePath(publicUrl, bucket) {
  try {
    const url = new URL(publicUrl)
    const marker = `/object/public/${bucket}/`
    const index = url.pathname.indexOf(marker)
    if (index === -1) return null
    return url.pathname.slice(index + marker.length)
  } catch {
    return null
  }
}

async function uploadLocalAsset(bucket, storagePath, localPath) {
  const buffer = await fs.readFile(localPath)
  const contentType = mimeTypeFor(localPath)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true })

  if (error) {
    throw new Error(`Failed to upload ${localPath} to ${bucket}/${storagePath}: ${error.message}`)
  }
}

async function removeStoragePaths(bucket, paths) {
  const filtered = [...new Set(paths.filter(Boolean))]
  if (filtered.length === 0) return
  const { error } = await supabase.storage.from(bucket).remove(filtered)
  if (error) {
    console.error(`  ✗ Failed to remove ${bucket} objects: ${error.message}`)
  }
}

async function syncSeedAssets({ userIds, yachtIds }) {
  const manifest = await loadAssetManifest()
  const userIdByHandle = new Map(USERS.map((user, index) => [`test-seed-${user.first.toLowerCase()}`, userIds[index]]))
  const yachtIdByName = new Map(YACHTS.map((yacht, index) => [yacht.name, yachtIds[index]]))

  console.log('\nSyncing local asset pack into storage...')

  const { data: existingPhotos } = await supabase
    .from('user_photos')
    .select('user_id, photo_url')
    .in('user_id', userIds.filter(Boolean))
  await removeStoragePaths('user-photos', (existingPhotos ?? []).map((row) => extractPublicStoragePath(row.photo_url, 'user-photos')))
  await supabase.from('user_photos').delete().in('user_id', userIds.filter(Boolean))

  const { data: existingGallery } = await supabase
    .from('user_gallery')
    .select('user_id, image_url')
    .in('user_id', userIds.filter(Boolean))
  await removeStoragePaths('user-gallery', (existingGallery ?? []).map((row) => extractPublicStoragePath(row.image_url, 'user-gallery')))
  await supabase.from('user_gallery').delete().in('user_id', userIds.filter(Boolean))

  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, cv_storage_path')
    .in('id', userIds.filter(Boolean))
  await removeStoragePaths('cv-uploads', (existingUsers ?? []).map((row) => row.cv_storage_path))

  const { data: existingYachts } = await supabase
    .from('yachts')
    .select('id, cover_photo_url')
    .in('id', yachtIds.filter(Boolean))
  await removeStoragePaths('yacht-photos', (existingYachts ?? []).map((row) => extractPublicStoragePath(row.cover_photo_url, 'yacht-photos')))

  let profilePhotoCount = 0
  let galleryCount = 0
  let yachtCoverCount = 0
  let cvCount = 0

  for (const manifestUser of manifest.users) {
    const userId = userIdByHandle.get(manifestUser.handle)
    if (!userId) continue

    const profilePhotos = manifestUser.profilePhotos ?? [manifestUser.profilePhoto]
    const photoRows = []
    for (const [index, relativePath] of profilePhotos.entries()) {
      const localPath = path.join(ASSET_ROOT, relativePath)
      const ext = path.extname(localPath).toLowerCase() || '.jpg'
      const storagePath = `${userId}/seed-photo-${index + 1}${ext}`
      await uploadLocalAsset('user-photos', storagePath, localPath)
      photoRows.push({
        user_id: userId,
        photo_url: publicUrlFor('user-photos', storagePath),
        sort_order: index,
      })
      profilePhotoCount += 1
    }
    if (photoRows.length > 0) {
      await supabase.from('user_photos').insert(photoRows)
      await supabase.from('users').update({ profile_photo_url: photoRows[0].photo_url }).eq('id', userId)
    }

    const cvLocalPath = path.join(ASSET_ROOT, manifestUser.cv)
    await uploadLocalAsset('cv-uploads', `${userId}/cv.pdf`, cvLocalPath)
    await supabase
      .from('users')
      .update({
        cv_storage_path: `${userId}/cv.pdf`,
        cv_parsed_at: new Date().toISOString(),
        cv_public: true,
        cv_public_source: 'uploaded',
        latest_pdf_path: null,
        latest_pdf_generated_at: null,
      })
      .eq('id', userId)
    cvCount += 1

    const galleryAssignments = GALLERY_ASSIGNMENTS[manifestUser.handle] ?? []
    const galleryRows = []
    for (const [index, item] of galleryAssignments.entries()) {
      const localPath = path.join(ASSET_ROOT, 'gallery', `${item.slug}.jpg`)
      const storagePath = `${userId}/seed-gallery-${item.slug}.jpg`
      await uploadLocalAsset('user-gallery', storagePath, localPath)
      galleryRows.push({
        user_id: userId,
        image_url: publicUrlFor('user-gallery', storagePath),
        caption: item.caption,
        yacht_id: yachtIdByName.get(item.yacht) ?? null,
        sort_order: index,
      })
      galleryCount += 1
    }
    if (galleryRows.length > 0) {
      await supabase.from('user_gallery').insert(galleryRows)
    }
  }

  for (const manifestYacht of manifest.yachts) {
    const yachtId = yachtIdByName.get(manifestYacht.name)
    if (!yachtId) continue
    const localPath = path.join(ASSET_ROOT, manifestYacht.photo)
    await uploadLocalAsset('yacht-photos', `${yachtId}/cover.jpg`, localPath)
    await supabase
      .from('yachts')
      .update({ cover_photo_url: publicUrlFor('yacht-photos', `${yachtId}/cover.jpg`) })
      .eq('id', yachtId)
    yachtCoverCount += 1
  }

  return { profilePhotoCount, galleryCount, yachtCoverCount, cvCount }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting test data seed...\n')

  // 1. Create auth users + profiles
  console.log('Creating 25 test users...')
  const userIds = []
  for (const u of USERS) {
    const email = `test-seed-${u.first.toLowerCase()}@yachtie.link`
    const handle = `test-seed-${u.first.toLowerCase()}`
    let userId = null

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: TEST_SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `${u.first} ${u.last}` },
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        // User exists — look up their ID
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single()
        if (existing) {
          userId = existing.id
          console.log(`  ↳ ${handle} (exists, reusing)`)
        }
      } else {
        console.error(`  ✗ Failed to create ${email}: ${authError.message}`)
      }
    }

    if (!userId && authData?.user?.id) {
      userId = authData.user.id
    }

    userIds.push(userId)
    if (!userId) continue

    // Update profile
    const { error: profileError } = await supabase.from('users').update({
      full_name: `${u.first} ${u.last}`,
      display_name: u.first,
      handle,
      bio: u.bio,
      primary_role: u.role,
      departments: [u.dept],
      home_country: u.country,
      smoke_pref: u.smoke,
      dob: u.dob,
      onboarding_complete: true,
      available_for_work: Math.random() > 0.5,
      location_country: u.country,
      languages: [
        { language: 'English', proficiency: u.country === 'United Kingdom' || u.country === 'Australia' || u.country === 'Ireland' || u.country === 'United States' || u.country === 'New Zealand' ? 'native' : 'fluent' },
        ...(u.country !== 'United Kingdom' && u.country !== 'Australia' && u.country !== 'Ireland' && u.country !== 'United States' && u.country !== 'New Zealand' ? [{ language: pick(LANGUAGES.filter(l => l !== 'English'), 1)[0], proficiency: 'native' }] : []),
      ],
      section_visibility: { about: true, experience: true, endorsements: true, certifications: true, education: true, hobbies: true, skills: true, photos: true, gallery: true },
    }).eq('id', userId)

    if (profileError) console.error(`  ✗ Profile update failed for ${handle}: ${profileError.message}`)
    else console.log(`  ✓ ${handle} (${u.role})`)
  }

  // 2. Create yachts
  console.log('\nCreating 10 test yachts...')
  const yachtIds = []
  for (const y of YACHTS) {
    // Check if already exists
    const { data: existing } = await supabase.from('yachts').select('id').eq('name', y.name).single()
    if (existing) {
      yachtIds.push(existing.id)
      console.log(`  ↳ ${y.name} (exists, reusing)`)
      continue
    }

    const { data, error } = await supabase.from('yachts').insert({
      name: y.name,
      yacht_type: y.yacht_type,
      length_meters: y.length_meters,
      flag_state: y.flag_state,
      builder: y.builder,
      size_category: y.length_meters >= 70 ? 'superyacht' : y.length_meters >= 50 ? 'large' : y.length_meters >= 35 ? 'medium' : 'small',
      is_established: true,
      established_at: new Date().toISOString(),
      created_by: userIds[0],
    }).select('id').single()

    if (error) {
      console.error(`  ✗ Failed to create ${y.name}: ${error.message}`)
      yachtIds.push(null)
    } else {
      yachtIds.push(data.id)
      console.log(`  ✓ ${y.name} (${y.length_meters}m ${y.yacht_type})`)
    }
  }

  // 3. Create attachments (crew assignments)
  console.log('\nCreating crew assignments...')
  let attachmentCount = 0
  for (const a of CREW_ASSIGNMENTS) {
    const userId = userIds[a.userIdx]
    const yachtId = yachtIds[a.yachtIdx]
    if (!userId || !yachtId) continue

    const { error } = await supabase.from('attachments').insert({
      user_id: userId,
      yacht_id: yachtId,
      role_label: a.role,
      started_at: a.start,
      ended_at: a.end,
      employment_type: a.type,
      yacht_program: a.program,
      cruising_area: a.area,
    })

    if (error) {
      if (error.message?.includes('duplicate')) {
        attachmentCount++
        continue
      }
      console.error(`  ✗ Attachment failed: ${USERS[a.userIdx].first} → ${YACHTS[a.yachtIdx].name}: ${error.message}`)
    } else {
      attachmentCount++
    }
  }
  console.log(`  ✓ ${attachmentCount} crew assignments created`)

  // 4. Sync generated/manual assets into storage + profile/gallery tables
  const mediaSummary = await syncSeedAssets({ userIds, yachtIds })
  console.log(`  ✓ ${mediaSummary.profilePhotoCount} profile photos synced`)
  console.log(`  ✓ ${mediaSummary.galleryCount} gallery items synced`)
  console.log(`  ✓ ${mediaSummary.yachtCoverCount} yacht covers synced`)
  console.log(`  ✓ ${mediaSummary.cvCount} uploaded CVs synced`)

  // 5. Create certifications
  console.log('\nCreating certifications...')
  let certCount = 0
  for (let i = 0; i < USERS.length; i++) {
    const userId = userIds[i]
    if (!userId) continue
    const numCerts = 3 + Math.floor(Math.random() * 5) // 3-7 certs per user
    const certs = pick(CERT_NAMES, numCerts)

    for (const certName of certs) {
      const issuedDate = randomDate(2018, 2024)
      const { error } = await supabase.from('certifications').insert({
        user_id: userId,
        custom_cert_name: certName,
        issuing_body: pick(['MCA', 'RYA', 'USCG', 'AMSA', 'NMA'], 1)[0],
        issued_at: issuedDate,
        expires_at: Math.random() > 0.3 ? futureDate(issuedDate) : null,
      })
      if (!error) certCount++
    }
  }
  console.log(`  ✓ ${certCount} certifications created`)

  // 6. Create education
  console.log('\nCreating education records...')
  let eduCount = 0
  const INSTITUTIONS = [
    { inst: 'UKSA', qual: 'Yacht Rating Course', field: 'Maritime' },
    { inst: 'Warsash Maritime Academy', qual: 'OOW 3000GT', field: 'Navigation' },
    { inst: 'Maritime New Zealand', qual: 'Marine Engineering', field: 'Engineering' },
    { inst: 'Le Cordon Bleu', qual: 'Grand Diplôme', field: 'Culinary Arts' },
    { inst: 'University of Cape Town', qual: 'Bachelor of Commerce', field: 'Business' },
    { inst: 'University of Sydney', qual: 'Bachelor of Science', field: 'Marine Biology' },
    { inst: 'Southampton Solent University', qual: 'BSc Yacht Design', field: 'Naval Architecture' },
    { inst: 'IAMI Academy', qual: 'Interior Diploma', field: 'Hospitality' },
  ]
  for (let i = 0; i < USERS.length; i++) {
    const userId = userIds[i]
    if (!userId) continue
    const numEdu = 1 + Math.floor(Math.random() * 2) // 1-2
    const edus = pick(INSTITUTIONS, numEdu)
    for (const e of edus) {
      const startYear = 2010 + Math.floor(Math.random() * 8)
      const { error } = await supabase.from('user_education').insert({
        user_id: userId,
        institution: e.inst,
        qualification: e.qual,
        field_of_study: e.field,
        started_at: `${startYear}-09-01`,
        ended_at: `${startYear + 2 + Math.floor(Math.random() * 2)}-06-30`,
      })
      if (!error) eduCount++
    }
  }
  console.log(`  ✓ ${eduCount} education records created`)

  // 7. Create skills
  console.log('\nCreating skills...')
  let skillCount = 0
  for (let i = 0; i < USERS.length; i++) {
    const userId = userIds[i]
    if (!userId) continue
    const dept = USERS[i].dept
    const deptSkills = SKILLS_BY_DEPT[dept] || SKILLS_BY_DEPT.Other
    const userSkills = pick(deptSkills, 3 + Math.floor(Math.random() * 3))
    for (let j = 0; j < userSkills.length; j++) {
      const { error } = await supabase.from('user_skills').insert({
        user_id: userId,
        name: userSkills[j],
        category: 'other',
        sort_order: j,
      })
      if (!error) skillCount++
    }
  }
  console.log(`  ✓ ${skillCount} skills created`)

  // 8. Create hobbies
  console.log('\nCreating hobbies...')
  let hobbyCount = 0
  for (let i = 0; i < USERS.length; i++) {
    const userId = userIds[i]
    if (!userId) continue
    const userHobbies = pick(HOBBIES, 2 + Math.floor(Math.random() * 4))
    for (let j = 0; j < userHobbies.length; j++) {
      const { error } = await supabase.from('user_hobbies').insert({
        user_id: userId,
        name: userHobbies[j].name,
        emoji: userHobbies[j].emoji,
        sort_order: j,
      })
      if (!error) hobbyCount++
    }
  }
  console.log(`  ✓ ${hobbyCount} hobbies created`)

  // 9. Create endorsements (between crew who shared yachts)
  console.log('\nCreating endorsements...')
  let endorseCount = 0
  const ENDORSEMENT_TEXTS = [
    'Outstanding team member. Always reliable and professional in every situation.',
    'One of the best crew I\'ve worked with. Takes initiative and leads by example.',
    'Extremely skilled and great with guests. A true asset to any program.',
    'Hardworking and always willing to go above and beyond. Highly recommended.',
    'Brilliant attitude, fantastic work ethic. Would work with again in a heartbeat.',
    'Professional, competent, and a pleasure to work alongside. Strongly endorsed.',
    'Sets the standard for the department. Meticulous attention to detail.',
    'Great under pressure, calm and collected. Exactly who you want on your team.',
  ]

  // Create endorsements for users who shared yachts
  const endorsementPairs = [
    { from: 0, to: 1, yacht: 0 },  // James → Sofia on Artemis
    { from: 0, to: 2, yacht: 0 },  // James → Marcus on Artemis
    { from: 5, to: 6, yacht: 3 },  // Charlotte → Elena on Driftwood
    { from: 13, to: 5, yacht: 3 }, // Pierre → Charlotte on Driftwood
    { from: 10, to: 12, yacht: 4 }, // David → Kai on Eclipse Star
    { from: 1, to: 3, yacht: 0 },  // Sofia → Liam on Artemis
    { from: 11, to: 0, yacht: 3 }, // Ryan → James on Driftwood
    { from: 19, to: 16, yacht: 4 }, // Olivia → Sarah on Eclipse Star
    { from: 14, to: 12, yacht: 8 }, // Anna → Kai on Iris
    { from: 3, to: 15, yacht: 1 }, // Liam → Jake on Blue Horizon
    { from: 7, to: 3, yacht: 1 },  // Mia → Liam on Blue Horizon
    { from: 22, to: 19, yacht: 8 }, // Finn → Olivia on Iris
  ]

  for (const ep of endorsementPairs) {
    const endorserId = userIds[ep.from]
    const recipientId = userIds[ep.to]
    const yachtId = yachtIds[ep.yacht]
    if (!endorserId || !recipientId || !yachtId) continue

    const { error } = await supabase.from('endorsements').insert({
      endorser_id: endorserId,
      recipient_id: recipientId,
      yacht_id: yachtId,
      content: pick(ENDORSEMENT_TEXTS, 1)[0],
      endorser_role_label: USERS[ep.from].role,
      recipient_role_label: USERS[ep.to].role,
    })
    if (!error) endorseCount++
    else if (!error?.message?.includes('duplicate')) {
      console.error(`  ✗ Endorsement ${USERS[ep.from].first} → ${USERS[ep.to].first}: ${error?.message}`)
    }
  }
  console.log(`  ✓ ${endorseCount} endorsements created`)

  // 10. Create some endorsement requests (pending)
  console.log('\nCreating endorsement requests...')
  let requestCount = 0
  const requestPairs = [
    { from: 2, to: 3, yacht: 0 },  // Marcus → Liam on Artemis
    { from: 4, to: 7, yacht: 1 },  // Tyler → Mia on Blue Horizon
    { from: 8, to: 20, yacht: 6 }, // Zara → Ben on Golden Reef
    { from: 23, to: 22, yacht: 8 }, // Grace → Finn on Iris
  ]

  for (const rp of requestPairs) {
    const requesterId = userIds[rp.from]
    const recipientId = userIds[rp.to]
    const yachtId = yachtIds[rp.yacht]
    if (!requesterId || !recipientId || !yachtId) continue

    const { error } = await supabase.from('endorsement_requests').insert({
      requester_id: requesterId,
      recipient_user_id: recipientId,
      yacht_id: yachtId,
      status: 'pending',
    })
    if (!error) requestCount++
  }
  console.log(`  ✓ ${requestCount} endorsement requests created`)

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('✅ Seed complete!\n')
  console.log(`Users:          ${userIds.filter(Boolean).length}`)
  console.log(`Yachts:         ${yachtIds.filter(Boolean).length}`)
  console.log(`Assignments:    ${attachmentCount}`)
  console.log(`Certifications: ${certCount}`)
  console.log(`Education:      ${eduCount}`)
  console.log(`Skills:         ${skillCount}`)
  console.log(`Hobbies:        ${hobbyCount}`)
  console.log(`Profile photos: ${mediaSummary.profilePhotoCount}`)
  console.log(`Gallery items:  ${mediaSummary.galleryCount}`)
  console.log(`Yacht covers:   ${mediaSummary.yachtCoverCount}`)
  console.log(`CV uploads:     ${mediaSummary.cvCount}`)
  console.log(`Endorsements:   ${endorseCount}`)
  console.log(`Requests:       ${requestCount}`)
  console.log(`\nAll handles:    test-seed-*`)
  console.log(`All emails:     test-seed-*@yachtie.link`)
  console.log(`All yachts:     TS *`)
  console.log(`Password:       ${TEST_SEED_PASSWORD}`)
  console.log(`\nCleanup:        node --env-file=.env.local scripts/seed/cleanup-test-data.mjs`)
}

main().catch(console.error)
