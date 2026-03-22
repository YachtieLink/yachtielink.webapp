import { SupabaseClient } from '@supabase/supabase-js'

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedEmployment {
  yacht_name: string
  yacht_type?: string | null
  length_m?: number | null
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

// ── Main ─────────────────────────────────────────────────────────────────────

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
              length_m: emp.length_m ?? null,
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
