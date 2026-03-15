'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

// ── Types ──────────────────────────────────────────────────────────────────────

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

interface ParsedData {
  full_name?: string | null
  bio?: string | null
  location?: { country?: string | null; city?: string | null } | null
  employment_history?: ParsedEmployment[]
  certifications?: ParsedCertification[]
  languages?: string[]
  primary_role?: string | null
}

interface ExistingProfile {
  full_name: string | null
  bio: string | null
  primary_role: string | null
  location_country: string | null
  location_city: string | null
}

interface YachtMatch {
  id: string
  name: string
  sim: number
}

interface CvReviewClientProps {
  userId: string
  existingProfile: ExistingProfile
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CvReviewClient({ userId, existingProfile }: CvReviewClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [data, setData] = useState<ParsedData | null>(null)
  const [saving, setSaving] = useState(false)

  // Editable fields — pre-populated from parsed data, respecting existing profile
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [primaryRole, setPrimaryRole] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('cv_parsed_data')
    if (!stored) {
      router.replace('/app/cv/upload')
      return
    }

    const parsed = JSON.parse(stored) as ParsedData
    setData(parsed)

    // Only set fields that are currently empty in the existing profile
    if (!existingProfile.full_name && parsed.full_name) setFullName(parsed.full_name)
    else setFullName(existingProfile.full_name ?? '')

    if (!existingProfile.bio && parsed.bio) setBio(parsed.bio)
    else setBio(existingProfile.bio ?? '')

    if (!existingProfile.primary_role && parsed.primary_role) setPrimaryRole(parsed.primary_role)
    else setPrimaryRole(existingProfile.primary_role ?? '')

    if (!existingProfile.location_country && parsed.location?.country) setLocationCountry(parsed.location.country)
    else setLocationCountry(existingProfile.location_country ?? '')

    if (!existingProfile.location_city && parsed.location?.city) setLocationCity(parsed.location.city)
    else setLocationCity(existingProfile.location_city ?? '')
  }, [existingProfile, router])

  async function handleSave() {
    if (!data) return
    setSaving(true)

    try {
      // 1. Update user profile fields (only non-empty changes)
      const updates: Record<string, string> = {}
      if (fullName && fullName !== existingProfile.full_name) updates.full_name = fullName
      if (bio && bio !== existingProfile.bio) updates.bio = bio
      if (primaryRole && primaryRole !== existingProfile.primary_role) updates.primary_role = primaryRole
      if (locationCountry && locationCountry !== existingProfile.location_country) updates.location_country = locationCountry
      if (locationCity && locationCity !== existingProfile.location_city) updates.location_city = locationCity

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('users').update(updates).eq('id', userId)
        if (error) throw error
      }

      // 2. Create yachts and attachments
      if (data.employment_history?.length) {
        for (const emp of data.employment_history) {
          // Search for existing yacht
          let yachtId: string | null = null

          const { data: matches } = await supabase.rpc('search_yachts', {
            p_query: emp.yacht_name,
            p_limit: 3,
          })

          if (matches && matches.length > 0) {
            // Use best match if similarity is reasonable
            const best = matches[0] as YachtMatch
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
          }

          // Parse dates — handle YYYY and YYYY-MM formats
          const startDate = emp.start_date ? normalizeDateToISO(emp.start_date) : null
          const endDate = emp.end_date && emp.end_date !== 'Current'
            ? normalizeDateToISO(emp.end_date)
            : null

          // Create attachment
          await supabase.from('attachments').insert({
            user_id: userId,
            yacht_id: yachtId,
            role_label: emp.role,
            started_at: startDate,
            ended_at: endDate,
          })
        }
      }

      // 3. Create certifications
      if (data.certifications?.length) {
        // Fetch cert types for matching
        const { data: certTypes } = await supabase
          .from('certification_types')
          .select('id, name, short_name')

        for (const cert of data.certifications) {
          let certTypeId: string | null = null

          // Try to match by name
          if (certTypes) {
            const match = certTypes.find(
              (ct) =>
                ct.name.toLowerCase() === cert.name.toLowerCase() ||
                ct.short_name?.toLowerCase() === cert.name.toLowerCase(),
            )
            if (match) certTypeId = match.id
          }

          await supabase.from('certifications').insert({
            user_id: userId,
            certification_type_id: certTypeId,
            custom_cert_name: certTypeId ? null : cert.name,
            issued_at: cert.issued_date ? normalizeDateToISO(cert.issued_date) : null,
            expires_at: cert.expiry_date ? normalizeDateToISO(cert.expiry_date) : null,
          })
        }
      }

      // Clean up
      sessionStorage.removeItem('cv_parsed_data')
      toast('CV imported successfully', 'success')
      router.push('/app/profile')
    } catch {
      toast('Failed to save some data. Please check your profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-interactive)]" />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
        Review Imported Data
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        We extracted the following from your CV. Review and edit before saving.
      </p>

      {/* Profile fields */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
          Profile
        </h2>
        <div className="flex flex-col gap-3">
          <Field
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            existing={existingProfile.full_name}
          />
          <Field
            label="Primary Role"
            value={primaryRole}
            onChange={setPrimaryRole}
            existing={existingProfile.primary_role}
          />
          <Field
            label="Bio"
            value={bio}
            onChange={setBio}
            existing={existingProfile.bio}
            multiline
          />
          <Field
            label="Country"
            value={locationCountry}
            onChange={setLocationCountry}
            existing={existingProfile.location_country}
          />
          <Field
            label="City"
            value={locationCity}
            onChange={setLocationCity}
            existing={existingProfile.location_city}
          />
        </div>
      </section>

      {/* Employment */}
      {data.employment_history && data.employment_history.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
            Employment History ({data.employment_history.length} entries)
          </h2>
          <div className="flex flex-col gap-2">
            {data.employment_history.map((emp, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {emp.yacht_name}
                  <span className="font-normal text-[var(--color-text-secondary)]">
                    {' — '}{emp.role}
                  </span>
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {[
                    emp.yacht_type,
                    emp.length_m ? `${emp.length_m}m` : null,
                    emp.flag_state,
                  ].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {emp.start_date ?? '?'} — {emp.end_date ?? 'Present'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
            Certifications ({data.certifications.length} entries)
          </h2>
          <div className="flex flex-col gap-2">
            {data.certifications.map((cert, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {cert.name}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {[cert.category, cert.issued_date, cert.expiry_date ? `Exp: ${cert.expiry_date}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
            Languages
          </h2>
          <p className="text-sm text-[var(--color-text-primary)]">
            {data.languages.join(', ')}
          </p>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-[var(--color-interactive)] px-4 py-3 text-sm font-medium text-[var(--color-text-inverse)] hover:bg-[var(--color-interactive-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save to Profile'}
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem('cv_parsed_data')
            router.push('/app/cv')
          }}
          className="w-full rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

// ── Editable field ─────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  existing,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  existing: string | null
  multiline?: boolean
}) {
  const isAlreadySet = !!existing
  const className = `w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]`

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
        {isAlreadySet && (
          <span className="text-xs text-[var(--color-text-tertiary)]">Already set</span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={className}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Convert YYYY or YYYY-MM to a valid ISO date string for Supabase */
function normalizeDateToISO(dateStr: string): string {
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`
  return dateStr
}
