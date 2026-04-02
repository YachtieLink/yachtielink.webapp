/**
 * Shared types for profile query results.
 * Replaces `any[]` across public profile and CV surfaces.
 */

// ── Public Profile Data Types ──────────────────────────────────────────────

export type PublicAttachment = {
  id: string
  role_label: string | null
  started_at: string | null
  ended_at: string | null
  yachts: {
    id: string
    name: string
    yacht_type: string | null
    length_meters: number | null
    flag_state: string | null
  } | null
}

export type PublicCertification = {
  id: string
  custom_cert_name: string | null
  issued_at: string | null
  expires_at: string | null
  certification_types: {
    name: string
    category: string
  } | null
}

export type PublicEndorsement = {
  id: string
  content: string
  created_at: string
  endorser_role_label: string | null
  recipient_role_label: string | null
  is_pinned?: boolean
  endorser: {
    id: string
    display_name: string | null
    full_name: string
    handle?: string | null
    profile_photo_url: string | null
  } | null
  ghost_endorser: {
    id: string
    full_name: string
    primary_role: string | null
  } | null
  yacht: {
    id: string
    name: string
  } | null
}

export type ProfilePhoto = {
  id: string
  photo_url: string
  sort_order: number
  focal_x: number
  focal_y: number
}

export type Hobby = {
  id: string
  name: string
  emoji?: string | null
}

export type Education = {
  id: string
  institution: string
  qualification?: string | null
  field_of_study?: string | null
  started_at?: string | null
  ended_at?: string | null
}

export type Skill = {
  id: string
  name: string
  category?: string | null
}

export type GalleryItem = {
  id: string
  image_url: string
  caption?: string | null
  sort_order?: number
  yachts?: { name: string } | null
}

// ── Land Experience ───────────────────────────────────────────────────────

export type LandExperienceEntry = {
  id: string
  company: string
  role: string
  start_date: string | null
  end_date: string | null
  description: string | null
  industry: string | null
}

// ── Viewer Relationship ────────────────────────────────────────────────────

export type MutualColleague = {
  id: string
  name: string
  handle: string | null
  photoUrl: string | null
  throughYachtWithProfile: string
  throughYachtWithViewer: string
}

export type ViewerRelationship = {
  isOwnProfile: boolean
  sharedYachtIds: string[]
  mutualColleagues: MutualColleague[]
}

// ── CV Section Types (extended fields for HTML CV render) ──────────────────

export type CvAttachment = {
  id: string
  role_label: string | null
  started_at: string | null
  ended_at: string | null
  employment_type: string | null
  yacht_program: string | null
  description: string | null
  cruising_area: string | null
  yachts: {
    id: string
    name: string
    yacht_type: string | null
    length_meters: number | null
    flag_state: string | null
    builder_id: string | null
    yacht_builders: { name: string } | null
  } | null
}

export type CvCertification = {
  id: string
  custom_cert_name: string | null
  issued_at: string | null
  expires_at: string | null
  issuing_body: string | null
  certification_types: {
    name: string
    category: string
  } | null
}

export type CvEndorsement = {
  id: string
  content: string
  created_at: string
  endorser: {
    display_name: string | null
    full_name: string
  } | null
  ghost_endorser: {
    full_name: string
  } | null
  yacht: {
    name: string
  } | null
}
