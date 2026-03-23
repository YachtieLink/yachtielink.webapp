import { SupabaseClient } from '@supabase/supabase-js'
import type { ConfirmedImportData, SaveStats as ImportSaveStats } from '@/lib/cv/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedEmployment {
  yacht_name: string
  yacht_type?: string | null
  length_meters?: number | null
  role: string
  start_date?: string | null
  end_date?: string | null
  flag_state?: string | null
}

interface ParsedCertification {
  name: string
  category?: string | null
  issued_date?: string | null
  expiry_date?: string | null
}

export interface ParsedCvData {
  full_name?: string | null
  bio?: string | null
  location?: { country?: string | null; city?: string | null } | null
  employment_history?: ParsedEmployment[]
  certifications?: ParsedCertification[]
  languages?: string[]
  primary_role?: string | null
}

interface SaveOptions {
  /** Extra fields to set on the user record (e.g. handle, display_name, onboarding_complete) */
  additionalUserFields?: Record<string, unknown>
  /** Only update profile fields that are currently null/empty */
  skipExistingFields?: boolean
  /** Fields to exclude from the profile update (e.g. full_name if already set) */
  excludeFields?: string[]
}

export interface SaveStats {
  yachtsCreated: number
  attachmentsCreated: number
  certificationsCreated: number
  profileFieldsUpdated: string[]
}

type SaveResult =
  | { ok: true; stats: SaveStats }
  | { ok: false; error: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert YYYY or YYYY-MM to a valid ISO date string for Supabase */
function normalizeDateToISO(dateStr: string): string {
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`
  return dateStr
}

// ── Main (legacy — used by old CvReviewClient) ──────────────────────────────

/** @deprecated Use saveConfirmedImport() from the new wizard flow */
export async function saveParsedCvData(
  supabase: SupabaseClient,
  userId: string,
  data: ParsedCvData,
  options?: SaveOptions,
): Promise<SaveResult> {
  const stats: SaveStats = {
    yachtsCreated: 0,
    attachmentsCreated: 0,
    certificationsCreated: 0,
    profileFieldsUpdated: [],
  }

  try {
    // 1. Update user profile fields
    const profileFields: Record<string, string> = {}
    const excluded = new Set(options?.excludeFields ?? [])

    if (data.full_name && !excluded.has('full_name'))
      profileFields.full_name = data.full_name
    if (data.primary_role && !excluded.has('primary_role'))
      profileFields.primary_role = data.primary_role
    if (data.bio && !excluded.has('bio'))
      profileFields.bio = data.bio
    if (data.location?.country && !excluded.has('location_country'))
      profileFields.location_country = data.location.country
    if (data.location?.city && !excluded.has('location_city'))
      profileFields.location_city = data.location.city

    // If skipExistingFields, fetch current profile and remove already-set fields
    if (options?.skipExistingFields && Object.keys(profileFields).length > 0) {
      const { data: existing } = await supabase
        .from('users')
        .select('full_name, primary_role, bio, location_country, location_city')
        .eq('id', userId)
        .single()

      if (existing) {
        for (const key of Object.keys(profileFields)) {
          if (existing[key as keyof typeof existing]) {
            delete profileFields[key]
          }
        }
      }
    }

    // Merge additional fields (handle, display_name, onboarding_complete, etc.)
    const allUpdates: Record<string, unknown> = { ...profileFields }
    if (options?.additionalUserFields) {
      Object.assign(allUpdates, options.additionalUserFields)
    }

    if (Object.keys(allUpdates).length > 0) {
      const { error } = await supabase.from('users').update(allUpdates).eq('id', userId)
      if (error) throw error
      stats.profileFieldsUpdated = Object.keys(profileFields)
    }

    // 2. Create yachts and attachments
    if (data.employment_history?.length) {
      for (const emp of data.employment_history) {
        let yachtId: string | null = null

        // Search for existing yacht
        const { data: matches } = await supabase.rpc('search_yachts', {
          p_query: emp.yacht_name,
          p_limit: 3,
        })

        if (matches && matches.length > 0) {
          const best = matches[0] as { id: string; sim: number }
          if (best.sim > 0.3) {
            yachtId = best.id
          }
        }

        // Create new yacht if no match
        if (!yachtId) {
          const { data: newYacht, error: yachtErr } = await supabase
            .from('yachts')
            .insert({
              name: emp.yacht_name,
              yacht_type: emp.yacht_type ?? null,
              length_meters: emp.length_meters ?? null,
              flag_state: emp.flag_state ?? null,
              created_by: userId,
            })
            .select('id')
            .single()

          if (yachtErr || !newYacht) continue
          yachtId = newYacht.id
          stats.yachtsCreated++
        }

        // Create attachment
        const startDate = emp.start_date ? normalizeDateToISO(emp.start_date) : null
        const endDate = emp.end_date && emp.end_date !== 'Current'
          ? normalizeDateToISO(emp.end_date)
          : null

        const { error: attErr } = await supabase.from('attachments').insert({
          user_id: userId,
          yacht_id: yachtId,
          role_label: emp.role,
          started_at: startDate,
          ended_at: endDate,
        })

        if (!attErr) stats.attachmentsCreated++
      }
    }

    // 3. Create certifications
    if (data.certifications?.length) {
      const { data: certTypes } = await supabase
        .from('certification_types')
        .select('id, name, short_name')

      for (const cert of data.certifications) {
        let certTypeId: string | null = null

        if (certTypes) {
          const match = certTypes.find(
            (ct) =>
              ct.name.toLowerCase() === cert.name.toLowerCase() ||
              ct.short_name?.toLowerCase() === cert.name.toLowerCase(),
          )
          if (match) certTypeId = match.id
        }

        const { error: certErr } = await supabase.from('certifications').insert({
          user_id: userId,
          certification_type_id: certTypeId,
          custom_cert_name: certTypeId ? null : cert.name,
          issued_at: cert.issued_date ? normalizeDateToISO(cert.issued_date) : null,
          expires_at: cert.expiry_date ? normalizeDateToISO(cert.expiry_date) : null,
        })

        if (!certErr) stats.certificationsCreated++
      }
    }

    return { ok: true, stats }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save CV data' }
  }
}

// ── New wizard save function ─────────────────────────────────────────────────

export async function saveConfirmedImport(
  supabase: SupabaseClient,
  userId: string,
  data: ConfirmedImportData,
): Promise<ImportSaveStats> {
  const stats: ImportSaveStats = {
    personalUpdated: false,
    yachtsCreated: 0,
    certsCreated: 0,
    educationCreated: 0,
    skillsAdded: 0,
    hobbiesAdded: 0,
    languagesUpdated: false,
    endorsementRequestsSent: 0,
  }

  // 1. Users UPDATE — personal + languages + social links
  try {
    const updates: Record<string, unknown> = {}
    const p = data.personal
    if (p.full_name) { updates.full_name = p.full_name; updates.display_name = p.full_name }
    if (p.primary_role) updates.primary_role = p.primary_role
    if (p.bio) updates.bio = p.bio
    if (p.phone) updates.phone = p.phone
    if (p.location_country) updates.location_country = p.location_country
    if (p.location_city) updates.location_city = p.location_city
    if (p.dob) updates.dob = p.dob
    if (p.home_country) updates.home_country = p.home_country
    if (p.smoke_pref) updates.smoke_pref = p.smoke_pref
    if (p.appearance_note) updates.appearance_note = p.appearance_note
    if (p.travel_docs?.length) updates.travel_docs = p.travel_docs
    if (p.license_info) updates.license_info = p.license_info

    if (data.languages.length > 0) {
      updates.languages = data.languages
      stats.languagesUpdated = true
    }

    // Append social links
    if (data.socialMedia?.instagram || data.socialMedia?.website) {
      const { data: currentUser } = await supabase.from('users').select('social_links').eq('id', userId).single()
      const existing = (currentUser?.social_links ?? []) as Array<{ platform: string; url: string }>
      const newLinks = [...existing]
      if (data.socialMedia.instagram && !existing.some(l => l.platform === 'instagram')) {
        newLinks.push({ platform: 'instagram', url: `https://instagram.com/${data.socialMedia.instagram}` })
      }
      if (data.socialMedia.website && !existing.some(l => l.platform === 'website')) {
        newLinks.push({ platform: 'website', url: data.socialMedia.website })
      }
      if (newLinks.length > existing.length) updates.social_links = newLinks
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', userId)
      stats.personalUpdated = true
    }
  } catch { /* partial failure OK */ }

  // 2. Create yachts + attachments
  for (const yacht of data.yachts) {
    try {
      let yachtId: string | null = null

      // Search existing
      const { data: matches } = await supabase.rpc('search_yachts', {
        p_query: yacht.yacht_name,
        p_limit: 3,
      })

      if (matches && matches.length > 0) {
        const best = matches[0] as { id: string; sim: number }
        if (best.sim > 0.3) yachtId = best.id
      }

      if (!yachtId) {
        const { data: newYacht } = await supabase.from('yachts').insert({
          name: yacht.yacht_name,
          yacht_type: yacht.yacht_type,
          length_meters: yacht.length_meters,
          flag_state: yacht.flag_state,
          builder: yacht.builder,
          created_by: userId,
        }).select('id').single()
        if (newYacht) yachtId = newYacht.id
      }

      if (yachtId) {
        const startDate = yacht.start_date ? normalizeDateToISO(yacht.start_date) : null
        const endDate = yacht.end_date && yacht.end_date !== 'Current' ? normalizeDateToISO(yacht.end_date) : null

        await supabase.from('attachments').insert({
          user_id: userId,
          yacht_id: yachtId,
          role_label: yacht.role,
          started_at: startDate,
          ended_at: endDate,
          employment_type: yacht.employment_type,
          yacht_program: yacht.yacht_program,
          description: yacht.description,
          cruising_area: yacht.cruising_area,
        })
        stats.yachtsCreated++
      }
    } catch { /* partial failure OK */ }
  }

  // 3. Certifications
  try {
    const { data: certTypes } = await supabase.from('certification_types').select('id, name, short_name')

    for (const cert of data.certifications) {
      let certTypeId: string | null = null
      if (certTypes) {
        const match = certTypes.find(ct =>
          ct.name.toLowerCase() === cert.name.toLowerCase() ||
          ct.short_name?.toLowerCase() === cert.name.toLowerCase()
        )
        if (match) certTypeId = match.id
      }

      const { error } = await supabase.from('certifications').insert({
        user_id: userId,
        certification_type_id: certTypeId,
        custom_cert_name: certTypeId ? null : cert.name,
        issued_at: cert.issued_date ? normalizeDateToISO(cert.issued_date) : null,
        expires_at: cert.expiry_date ? normalizeDateToISO(cert.expiry_date) : null,
        issuing_body: cert.issuing_body,
      })
      if (!error) stats.certsCreated++
    }
  } catch { /* partial failure OK */ }

  // 4. Education
  for (const edu of data.education) {
    try {
      const { error } = await supabase.from('user_education').insert({
        user_id: userId,
        institution: edu.institution,
        qualification: edu.qualification,
        field_of_study: edu.field_of_study,
        started_at: edu.start_date ? normalizeDateToISO(edu.start_date) : null,
        ended_at: edu.end_date ? normalizeDateToISO(edu.end_date) : null,
      })
      if (!error) stats.educationCreated++
    } catch { /* partial failure OK */ }
  }

  // 5. Skills (deduplicate)
  try {
    const { data: existingSkills } = await supabase.from('user_skills').select('name').eq('user_id', userId)
    const existingNames = new Set((existingSkills ?? []).map(s => s.name.toLowerCase()))
    const newSkills = data.skills.filter(s => !existingNames.has(s.toLowerCase()))

    for (const skill of newSkills) {
      const { error } = await supabase.from('user_skills').insert({ user_id: userId, name: skill })
      if (!error) stats.skillsAdded++
    }
  } catch { /* partial failure OK */ }

  // 6. Hobbies (deduplicate)
  try {
    const { data: existingHobbies } = await supabase.from('user_hobbies').select('name').eq('user_id', userId)
    const existingNames = new Set((existingHobbies ?? []).map(h => h.name.toLowerCase()))
    const newHobbies = data.hobbies.filter(h => !existingNames.has(h.toLowerCase()))

    for (const hobby of newHobbies) {
      const { error } = await supabase.from('user_hobbies').insert({ user_id: userId, name: hobby })
      if (!error) stats.hobbiesAdded++
    }
  } catch { /* partial failure OK */ }

  // 7. Endorsement requests — not yet implemented
  // TODO: implement endorsement request sending when ready

  return stats
}
