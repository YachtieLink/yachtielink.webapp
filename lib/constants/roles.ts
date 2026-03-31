/** Common yacht crew roles — used in role pickers and CV parsing validation */
export const YACHT_ROLES = [
  // Deck
  'Captain',
  'First Officer',
  'Second Officer',
  'Third Officer',
  'Bosun',
  'Lead Deckhand',
  'Deckhand',
  'Deck / Engineer',
  'Deck / Stew',
  // Engineering
  'Chief Engineer',
  'Second Engineer',
  'Third Engineer',
  'ETO',
  'AV/IT Officer',
  // Interior
  'Chief Stewardess',
  'Second Stewardess',
  'Third Stewardess',
  'Stewardess',
  'Purser',
  'Housekeeper',
  'Laundress',
  // Galley
  'Head Chef',
  'Sole Chef',
  'Second Chef',
  'Sous Chef',
  'Cook',
  'Cook / Stewardess',
  // Other
  'Nanny',
  'Nurse',
  'Dive Instructor',
  'Yoga Instructor',
  'Personal Trainer',
  'Security Officer',
  'Rotational Captain',
  'Rotational Engineer',
  'Rotational Chef',
  'Day Worker',
] as const

export type YachtRole = (typeof YACHT_ROLES)[number]
