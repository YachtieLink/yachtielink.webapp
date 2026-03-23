// ── Parsed CV types (AI output) ──────────────────────────

export interface ParsedPersonal {
  full_name: string | null
  primary_role: string | null
  bio: string | null
  phone: string | null
  email: string | null
  location_country: string | null
  location_city: string | null
  dob: string | null            // UF1
  home_country: string | null   // UF2
  smoke_pref: string | null     // UF3
  appearance_note: string | null // UF4
  travel_docs: string[] | null  // UF5
  license_info: string | null   // UF6
}

export interface ParsedLanguage {
  language: string
  proficiency: 'native' | 'fluent' | 'intermediate' | 'basic'
}

export interface ParsedYachtEmployment {
  yacht_name: string
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
  builder: string | null          // YF1
  role: string
  start_date: string | null
  end_date: string | null
  employment_type: string | null  // AF1
  yacht_program: string | null    // AF2
  description: string | null      // AF3
  cruising_area: string | null    // AF4
  crew_count: number | null
  guest_count: number | null
  former_names: string[] | null
}

export interface ParsedLandEmployment {
  company: string
  role: string
  start_date: string | null
  end_date: string | null
  description: string | null
}

export interface ParsedCertification {
  name: string
  category: string | null
  issued_date: string | null
  expiry_date: string | null
  issuing_body: string | null  // EF1
}

export interface ParsedEducation {
  institution: string
  qualification: string | null
  field_of_study: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
}

export interface ParsedReference {
  name: string
  role: string | null
  yacht_or_company: string | null
  phone: string | null
  email: string | null
}

export interface ParsedSocialMedia {
  instagram: string | null
  website: string | null
}

export interface ParsedCvData {
  personal: ParsedPersonal
  languages: ParsedLanguage[]
  employment_yacht: ParsedYachtEmployment[]
  employment_land: ParsedLandEmployment[]
  certifications: ParsedCertification[]
  education: ParsedEducation[]
  skills: string[]
  hobbies: string[]
  references: ParsedReference[]
  social_media: ParsedSocialMedia

  // Legacy fields for backward-compat with old sessionStorage data
  full_name?: string | null
  bio?: string | null
  location?: { country?: string | null; city?: string | null } | null
  employment_history?: Array<{
    yacht_name?: string
    yacht_type?: string | null
    length_meters?: number | null
    role?: string
    start_date?: string | null
    end_date?: string | null
    flag_state?: string | null
  }>
  primary_role?: string | null
}

// ── Confirmed import types (wizard output → save function) ──

export interface ConfirmedPersonal {
  full_name: string | null
  primary_role: string | null
  bio: string | null
  phone: string | null
  email: string | null
  location_country: string | null
  location_city: string | null
  dob: string | null
  home_country: string | null
  smoke_pref: string | null
  appearance_note: string | null
  travel_docs: string[] | null
  license_info: string | null
}

export interface ConfirmedYacht {
  yacht_name: string
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
  builder: string | null
  role: string
  start_date: string | null
  end_date: string | null
  employment_type: string | null
  yacht_program: string | null
  description: string | null
  cruising_area: string | null
}

export interface ConfirmedCert {
  name: string
  category: string | null
  issued_date: string | null
  expiry_date: string | null
  issuing_body: string | null
}

export interface ConfirmedEducation {
  institution: string
  qualification: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
}

export interface ConfirmedEndorsementRequest {
  name: string
  role: string | null
  yacht_or_company: string | null
  phone: string | null
  email: string | null
}

export interface ConfirmedImportData {
  personal: ConfirmedPersonal
  languages: ParsedLanguage[]
  yachts: ConfirmedYacht[]
  certifications: ConfirmedCert[]
  education: ConfirmedEducation[]
  skills: string[]
  hobbies: string[]
  endorsementRequests: ConfirmedEndorsementRequest[]
  socialMedia: ParsedSocialMedia
}

export interface SaveStats {
  personalUpdated: boolean
  yachtsCreated: number
  certsCreated: number
  educationCreated: number
  skillsAdded: number
  hobbiesAdded: number
  languagesUpdated: boolean
  endorsementRequestsSent: number
}
