import { SupabaseClient } from '@supabase/supabase-js'
import type { ParsedCvData, ConfirmedImportData, SaveStats } from '@/lib/cv/types'
import { normalizeCountry } from '@/lib/constants/country-normalize'
import { resolveOrCreateBuilder } from '@/lib/yacht/resolve-builder'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert YYYY or YYYY-MM to a valid ISO date string for Supabase */
function normalizeDateToISO(dateStr: string): string {
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`
  return dateStr
}

// ── D1: Cert dedup helpers ──────────────────────────────────────────────────

/** Maritime certification alias map — normalizes common variants to canonical names */
const CERT_ALIASES: Record<string, string> = {
  // STCW variants
  'stcw': 'STCW Basic Safety',
  'stcw95': 'STCW Basic Safety',
  'stcw 95': 'STCW Basic Safety',
  'stcw10': 'STCW Basic Safety',
  'stcw 2010': 'STCW Basic Safety',
  'stcw basic safety': 'STCW Basic Safety',
  'stcw basic safety training': 'STCW Basic Safety',
  'basic safety training': 'STCW Basic Safety',
  'bst': 'STCW Basic Safety',
  // Medical
  'eng1': 'ENG1 Medical',
  'eng 1': 'ENG1 Medical',
  'eng1 medical': 'ENG1 Medical',
  'mca medical': 'ENG1 Medical',
  'maritime medical': 'ENG1 Medical',
  'seafarer medical': 'ENG1 Medical',
  // GMDSS
  'gmdss': 'GMDSS GOC',
  'gmdss goc': 'GMDSS GOC',
  'goc': 'GMDSS GOC',
  'general operators certificate': 'GMDSS GOC',
  'gmdss sroc': 'GMDSS SRC',
  'src': 'GMDSS SRC',
  'short range certificate': 'GMDSS SRC',
  // Proficiency in Survival Craft
  'psc': 'Proficiency in Survival Craft',
  'pscrb': 'Proficiency in Survival Craft',
  'proficiency in survival craft': 'Proficiency in Survival Craft',
  'proficiency in survival craft and rescue boats': 'Proficiency in Survival Craft',
  // Powerboat
  'powerboat level 2': 'RYA Powerboat Level 2',
  'rya powerboat': 'RYA Powerboat Level 2',
  'rya powerboat level 2': 'RYA Powerboat Level 2',
  // Food safety / ship's cook
  'food safety level 2': 'Food Safety Level 2',
  'food hygiene': 'Food Safety Level 2',
  'food hygiene level 2': 'Food Safety Level 2',
  'ships cook': "Ship's Cook Certificate",
  "ship's cook": "Ship's Cook Certificate",
  "ship's cook certificate": "Ship's Cook Certificate",
}

/** Normalize a cert name through the alias map */
function normalizeCertName(name: string): string {
  return CERT_ALIASES[name.toLowerCase().trim()] ?? name.trim()
}

/** Levenshtein edit distance between two strings */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

/** Check if two cert names match via alias normalization + fuzzy match (D1) */
function certNamesMatch(a: string, b: string): boolean {
  const normA = normalizeCertName(a).toLowerCase()
  const normB = normalizeCertName(b).toLowerCase()

  // Exact match after normalization
  if (normA === normB) return true

  // Fuzzy match only for strings long enough to avoid false positives
  // (e.g. "GMDSS GOC" vs "GMDSS SRC" are Levenshtein 2 but distinct certs)
  const minLen = Math.min(normA.length, normB.length)
  if (minLen < 12) return false

  const dist = levenshtein(normA, normB)

  // Levenshtein ≤ 2
  if (dist <= 2) return true

  // Normalized similarity ≥ 0.85
  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen > 0 && (1 - dist / maxLen) >= 0.85) return true

  return false
}

// ── D2: Date overlap helpers ────────────────────────────────────────────────

/** Calculate overlap in months between two date ranges. Returns 0 if no overlap. */
function overlapMonths(
  startA: string | null, endA: string | null,
  startB: string | null, endB: string | null,
): number {
  if (!startA || !startB) return 0

  const a0 = new Date(normalizeDateToISO(startA))
  const a1 = endA && endA !== 'Current' ? new Date(normalizeDateToISO(endA)) : new Date()
  const b0 = new Date(normalizeDateToISO(startB))
  const b1 = endB && endB !== 'Current' ? new Date(normalizeDateToISO(endB)) : new Date()

  const overlapStart = a0 > b0 ? a0 : b0
  const overlapEnd = a1 < b1 ? a1 : b1

  if (overlapStart >= overlapEnd) return 0

  const diffMs = overlapEnd.getTime() - overlapStart.getTime()
  return diffMs / (1000 * 60 * 60 * 24 * 30.44) // approximate months
}

// ── Converter: ParsedCvData → ConfirmedImportData ────────────────────────────

/** Convert AI parse output into the shape expected by saveConfirmedImport() */
export function parsedToConfirmedImport(parsed: ParsedCvData): ConfirmedImportData {
  return {
    personal: { ...parsed.personal },
    languages: parsed.languages,
    yachts: (parsed.employment_yacht ?? []).map(
      // Drop runtime-only AI fields not stored in attachments
      ({ crew_count: _, guest_count: _g, former_names: _f, ...rest }) => rest,
    ),
    landJobs: parsed.employment_land ?? [],
    certifications: parsed.certifications,
    education: (parsed.education ?? []).map(
      ({ location: _, ...rest }) => rest,
    ),
    skills: parsed.skills ?? [],
    hobbies: parsed.hobbies ?? [],
    skillsSummary: parsed.skills_summary ?? null,
    interestsSummary: parsed.interests_summary ?? null,
    endorsementRequests: [],
    socialMedia: parsed.social_media ?? { instagram: null, linkedin: null, tiktok: null, website: null },
  }
}

// ── Canonical save function ──────────────────────────────────────────────────

export async function saveConfirmedImport(
  supabase: SupabaseClient,
  userId: string,
  data: ConfirmedImportData,
): Promise<SaveStats> {
  const stats: SaveStats = {
    personalUpdated: false,
    yachtsCreated: 0,
    certsCreated: 0,
    certsSkippedDuplicate: 0,
    attachmentsEnriched: 0,
    dateOverlaps: 0,
    educationCreated: 0,
    landExperienceCreated: 0,
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
    if (p.location_country) updates.location_country = normalizeCountry(p.location_country) ?? p.location_country
    if (p.location_city) updates.location_city = p.location_city
    if (p.dob) updates.dob = p.dob
    if (p.home_country) updates.home_country = normalizeCountry(p.home_country) ?? p.home_country
    if (p.smoke_pref) updates.smoke_pref = p.smoke_pref
    if (p.appearance_note) updates.appearance_note = p.appearance_note
    // UX6d: Travel docs merge — union of existing + parsed, dedup by document name, never remove
    if (p.travel_docs?.length) {
      const { data: currentUserDocs } = await supabase.from('users').select('travel_docs').eq('id', userId).single()
      const existingDocs = (currentUserDocs?.travel_docs ?? []) as string[]
      const existingDocsLower = new Set(existingDocs.map(d => d.toLowerCase().trim()))
      const newDocs = p.travel_docs.filter(d => !existingDocsLower.has(d.toLowerCase().trim()))
      if (newDocs.length > 0) {
        updates.travel_docs = [...existingDocs, ...newDocs]
      }
    }
    if (p.license_info) updates.license_info = p.license_info

    // UX6c: Languages merge — dedup by language name (case-insensitive), never remove existing
    if (data.languages.length > 0) {
      const { data: currentUser } = await supabase.from('users').select('languages').eq('id', userId).single()
      const existingLangs = (currentUser?.languages ?? []) as Array<{ language: string; proficiency: string }>
      const existingLangNames = new Set(existingLangs.map(l => l.language.toLowerCase().trim()))
      const newLangs = data.languages.filter(l => !existingLangNames.has(l.language.toLowerCase().trim()))
      if (newLangs.length > 0) {
        updates.languages = [...existingLangs, ...newLangs]
        stats.languagesUpdated = true
      }
    }

    // Skills & interests summaries
    if (data.skillsSummary) updates.skills_summary = data.skillsSummary
    if (data.interestsSummary) updates.interests_summary = data.interestsSummary

    // Append social links
    const sm = data.socialMedia
    if (sm?.instagram || sm?.linkedin || sm?.tiktok || sm?.website) {
      const { data: currentUser } = await supabase.from('users').select('social_links').eq('id', userId).single()
      const existing = (currentUser?.social_links ?? []) as Array<{ platform: string; url: string }>
      const newLinks = [...existing]
      if (sm.instagram && !existing.some(l => l.platform === 'instagram')) {
        newLinks.push({ platform: 'instagram', url: sm.instagram.startsWith('http') ? sm.instagram : `https://instagram.com/${sm.instagram}` })
      }
      if (sm.linkedin && !existing.some(l => l.platform === 'linkedin')) {
        newLinks.push({ platform: 'linkedin', url: sm.linkedin.startsWith('http') ? sm.linkedin : `https://linkedin.com/in/${sm.linkedin}` })
      }
      if (sm.tiktok && !existing.some(l => l.platform === 'tiktok')) {
        newLinks.push({ platform: 'tiktok', url: sm.tiktok.startsWith('http') ? sm.tiktok : `https://tiktok.com/@${sm.tiktok}` })
      }
      if (sm.website && !existing.some(l => l.platform === 'website')) {
        newLinks.push({ platform: 'website', url: sm.website.startsWith('http') ? sm.website : `https://${sm.website}` })
      }
      if (newLinks.length > existing.length) updates.social_links = newLinks
    }

    if (Object.keys(updates).length > 0) {
      const { error: userErr } = await supabase.from('users').update(updates).eq('id', userId)
      if (userErr) console.error('[saveConfirmedImport] users update error:', userErr.message)
      else stats.personalUpdated = true
    }
  } catch (err) { console.error('[saveConfirmedImport] personal section error:', err) }

  // 2. Create yachts + attachments (D8: upsert on user+yacht+role, D2: overlap detection)
  // Fetch existing attachments for dedup and overlap checks
  const { data: existingAttachments } = await supabase
    .from('attachments')
    .select('id, yacht_id, role_label, started_at, ended_at, employment_type, yacht_program, description, cruising_area')
    .eq('user_id', userId)
    .is('deleted_at', null)

  // Cache resolved builder IDs to avoid redundant lookups + race conditions
  const builderCache = new Map<string, string>()

  for (const yacht of data.yachts) {
    try {
      let yachtId: string | null = null

      // Use pre-matched yacht ID if the user confirmed it in StepExperience
      if (yacht.matched_yacht_id) {
        yachtId = yacht.matched_yacht_id
      } else {
        // Fallback: search by name (legacy path + non-wizard saves)
        const { data: matches } = await supabase.rpc('search_yachts', {
          p_query: yacht.yacht_name,
          p_limit: 3,
        })

        if (matches && matches.length > 0) {
          const best = matches[0] as { id: string; sim: number }
          if (best.sim > 0.3) yachtId = best.id
        }
      }

      if (!yachtId) {
        // Resolve builder name to yacht_builders FK (cached per import batch)
        let builderId: string | null = null
        if (yacht.builder) {
          const builderKey = yacht.builder.trim().toLowerCase()
          if (builderCache.has(builderKey)) {
            builderId = builderCache.get(builderKey)!
          } else {
            const resolved = await resolveOrCreateBuilder(yacht.builder, supabase, userId)
            if (resolved) {
              builderId = resolved.id
              builderCache.set(builderKey, builderId)
            }
          }
        }

        const { data: newYacht, error: yachtErr } = await supabase.from('yachts').insert({
          name: yacht.yacht_name,
          yacht_type: yacht.yacht_type,
          length_meters: yacht.length_meters,
          flag_state: normalizeCountry(yacht.flag_state) ?? yacht.flag_state,
          builder_id: builderId,
          created_by: userId,
        }).select('id').single()
        if (yachtErr || !newYacht) continue
        yachtId = newYacht.id
      }

      const startDate = yacht.start_date ? normalizeDateToISO(yacht.start_date) : null
      const endDate = yacht.end_date && yacht.end_date !== 'Current' ? normalizeDateToISO(yacht.end_date) : null

      // attachments.started_at is NOT NULL — skip if no start date parsed
      if (!startDate) {
        console.warn(`[saveConfirmedImport] skipping yacht "${yacht.yacht_name}" (${yacht.role}) — no start date parsed`)
        continue
      }

      // D8: Check for existing attachment with same user+yacht+role
      const existingMatch = (existingAttachments ?? []).find(ea =>
        ea.yacht_id === yachtId &&
        ea.role_label?.toLowerCase() === yacht.role?.toLowerCase()
      )

      if (existingMatch) {
        // Upsert — enrich existing attachment only where currently empty
        const enrichFields: Record<string, unknown> = {}
        if (!existingMatch.employment_type && yacht.employment_type) enrichFields.employment_type = yacht.employment_type
        if (!existingMatch.yacht_program && yacht.yacht_program) enrichFields.yacht_program = yacht.yacht_program
        if (!existingMatch.description && yacht.description) enrichFields.description = yacht.description
        if (!existingMatch.cruising_area && yacht.cruising_area) enrichFields.cruising_area = yacht.cruising_area
        if (!existingMatch.started_at && startDate) enrichFields.started_at = startDate
        if (!existingMatch.ended_at && endDate) enrichFields.ended_at = endDate

        if (Object.keys(enrichFields).length > 0) {
          await supabase.from('attachments').update(enrichFields).eq('id', existingMatch.id)
          stats.attachmentsEnriched++
        }
      } else {
        // D2: Check date overlaps against existing attachments before insert
        for (const ea of existingAttachments ?? []) {
          const months = overlapMonths(startDate, endDate, ea.started_at, ea.ended_at)
          if (months > 0) {
            stats.dateOverlaps++
            if (months > 1) {
              console.warn(`[saveConfirmedImport] date overlap >1 month: "${yacht.yacht_name}" (${yacht.role}) overlaps existing attachment ${ea.id} by ${months.toFixed(1)} months`)
            }
          }
        }

        const { error: attErr } = await supabase.from('attachments').insert({
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
        if (attErr) {
          console.error(`[saveConfirmedImport] attachment insert error for "${yacht.yacht_name}" (${yacht.role}):`, attErr.message)
        } else {
          stats.yachtsCreated++
          // Track new attachment for overlap checks within same batch
          existingAttachments?.push({
            id: 'new', yacht_id: yachtId, role_label: yacht.role,
            started_at: startDate, ended_at: endDate,
            employment_type: yacht.employment_type, yacht_program: yacht.yacht_program,
            description: yacht.description, cruising_area: yacht.cruising_area,
          })
        }
      }
    } catch (err) {
      console.error(`[saveConfirmedImport] yacht error:`, err)
    }
  }

  // 3. Certifications (D1: dedup via alias map + fuzzy match)
  try {
    const [{ data: certTypes }, { data: existingCerts }] = await Promise.all([
      supabase.from('certification_types').select('id, name, short_name'),
      supabase.from('certifications').select('id, certification_type_id, custom_cert_name, certification_types(name)').eq('user_id', userId),
    ])

    // Build list of existing cert names for dedup
    const existingCertNames: string[] = (existingCerts ?? []).map(ec => {
      const ct = ec.certification_types as unknown as { name: string } | null
      const typeName = ct?.name
      return typeName ?? ec.custom_cert_name ?? ''
    }).filter(Boolean)

    for (const cert of data.certifications) {
      // Check if this cert already exists (D1: normalize + fuzzy)
      const isDuplicate = existingCertNames.some(existing => certNamesMatch(existing, cert.name))
      if (isDuplicate) {
        stats.certsSkippedDuplicate++
        continue
      }

      let certTypeId: string | null = null
      if (certTypes) {
        // Also try alias-normalized name for type matching
        const normalizedName = normalizeCertName(cert.name)
        const match = certTypes.find(ct =>
          ct.name.toLowerCase() === cert.name.toLowerCase() ||
          ct.short_name?.toLowerCase() === cert.name.toLowerCase() ||
          ct.name.toLowerCase() === normalizedName.toLowerCase() ||
          ct.short_name?.toLowerCase() === normalizedName.toLowerCase()
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
      if (!error) {
        stats.certsCreated++
        existingCertNames.push(normalizeCertName(cert.name)) // prevent dups within same import batch
      } else {
        console.error(`[saveConfirmedImport] cert insert error for "${cert.name}":`, error.message)
      }
    }
  } catch (err) { console.error('[saveConfirmedImport] certifications section error:', err) }

  // 4. Education (UX6b: dedup on institution + qualification, case-insensitive)
  try {
    const { data: existingEducation } = await supabase
      .from('user_education')
      .select('id, institution, qualification')
      .eq('user_id', userId)

    for (const edu of data.education) {
      const existingMatch = (existingEducation ?? []).find(ee =>
        ee.institution?.toLowerCase().trim() === edu.institution?.toLowerCase().trim() &&
        (ee.qualification ?? '').toLowerCase().trim() === (edu.qualification ?? '').toLowerCase().trim()
      )

      if (existingMatch) {
        // Update existing entry only where currently empty
        const enrichFields: Record<string, unknown> = {}
        if (!existingMatch.qualification && edu.qualification) enrichFields.qualification = edu.qualification
        if (edu.field_of_study) enrichFields.field_of_study = edu.field_of_study
        if (edu.start_date) enrichFields.started_at = normalizeDateToISO(edu.start_date)
        if (edu.end_date) enrichFields.ended_at = normalizeDateToISO(edu.end_date)
        if (Object.keys(enrichFields).length > 0) {
          await supabase.from('user_education').update(enrichFields).eq('id', existingMatch.id)
        }
      } else {
        const { error } = await supabase.from('user_education').insert({
          user_id: userId,
          institution: edu.institution,
          qualification: edu.qualification,
          field_of_study: edu.field_of_study,
          started_at: edu.start_date ? normalizeDateToISO(edu.start_date) : null,
          ended_at: edu.end_date ? normalizeDateToISO(edu.end_date) : null,
        })
        if (!error) {
          stats.educationCreated++
          // Track for dedup within same batch
          existingEducation?.push({ id: 'new', institution: edu.institution, qualification: edu.qualification ?? null })
        } else {
          console.error(`[saveConfirmedImport] education insert error for "${edu.institution}":`, error.message)
        }
      }
    }
  } catch (err) { console.error('[saveConfirmedImport] education section error:', err) }

  // 5. Skills (deduplicate)
  try {
    const { data: existingSkills } = await supabase.from('user_skills').select('name').eq('user_id', userId)
    const existingNames = new Set((existingSkills ?? []).map(s => s.name.toLowerCase()))
    const newSkills = data.skills.filter(s => !existingNames.has(s.toLowerCase()))

    for (const skill of newSkills) {
      const { error } = await supabase.from('user_skills').insert({ user_id: userId, name: skill })
      if (!error) stats.skillsAdded++
      else console.error(`[saveConfirmedImport] skill insert error for "${skill}":`, error.message)
    }
  } catch (err) { console.error('[saveConfirmedImport] skills section error:', err) }

  // 6. Hobbies (deduplicate)
  try {
    const { data: existingHobbies } = await supabase.from('user_hobbies').select('name').eq('user_id', userId)
    const existingNames = new Set((existingHobbies ?? []).map(h => h.name.toLowerCase()))
    const newHobbies = data.hobbies.filter(h => !existingNames.has(h.toLowerCase()))

    for (const hobby of newHobbies) {
      const { error } = await supabase.from('user_hobbies').insert({ user_id: userId, name: hobby })
      if (!error) stats.hobbiesAdded++
      else console.error(`[saveConfirmedImport] hobby insert error for "${hobby}":`, error.message)
    }
  } catch (err) { console.error('[saveConfirmedImport] hobbies section error:', err) }

  // 7. Land experience (shore-side employment) — dedup on company + role (case-insensitive)
  try {
    const { data: existingLandExp } = await supabase
      .from('land_experience')
      .select('id, company, role')
      .eq('user_id', userId)

    for (const job of data.landJobs ?? []) {
      const existingMatch = (existingLandExp ?? []).find(el =>
        el.company?.toLowerCase().trim() === job.company?.toLowerCase().trim() &&
        el.role?.toLowerCase().trim() === job.role?.toLowerCase().trim()
      )

      if (existingMatch) {
        // Enrich existing entry only where currently empty
        const enrichFields: Record<string, unknown> = {}
        if (job.start_date) enrichFields.start_date = normalizeDateToISO(job.start_date)
        if (job.end_date) enrichFields.end_date = normalizeDateToISO(job.end_date)
        if (job.description) enrichFields.description = job.description
        if (job.industry) enrichFields.industry = job.industry
        if (Object.keys(enrichFields).length > 0) {
          await supabase.from('land_experience').update(enrichFields).eq('id', existingMatch.id)
        }
      } else {
        const { error } = await supabase.from('land_experience').insert({
          user_id: userId,
          company: job.company,
          role: job.role,
          start_date: job.start_date ? normalizeDateToISO(job.start_date) : null,
          end_date: job.end_date ? normalizeDateToISO(job.end_date) : null,
          description: job.description ?? '',
          industry: job.industry ?? '',
        })
        if (!error) {
          stats.landExperienceCreated++
          existingLandExp?.push({ id: 'new', company: job.company, role: job.role })
        } else {
          console.error(`[saveConfirmedImport] land experience insert error for "${job.company}":`, error.message)
        }
      }
    }
  } catch (err) { console.error('[saveConfirmedImport] land experience section error:', err) }

  // 8. Endorsement requests — not yet implemented
  // TODO: implement endorsement request sending when ready

  console.debug('[saveConfirmedImport] stats:', JSON.stringify(stats))
  return stats
}
