'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { saveParsedCvData, type ParsedCvData } from '@/lib/cv/save-parsed-cv-data'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ExistingProfile {
  full_name: string | null
  bio: string | null
  primary_role: string | null
  location_country: string | null
  location_city: string | null
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

  const [data, setData] = useState<ParsedCvData | null>(null)
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

    const parsed = JSON.parse(stored) as ParsedCvData
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

    // Build overridden parsed data from the editable fields
    const overriddenData: ParsedCvData = {
      ...data,
      full_name: fullName || data.full_name,
      bio: bio || data.bio,
      primary_role: primaryRole || data.primary_role,
      location: {
        country: locationCountry || data.location?.country,
        city: locationCity || data.location?.city,
      },
    }

    const result = await saveParsedCvData(supabase, userId, overriddenData, {
      skipExistingFields: false,
    })

    if (result.ok) {
      sessionStorage.removeItem('cv_parsed_data')
      toast('CV imported successfully', 'success')
      router.push('/app/profile')
    } else {
      toast('Failed to save some data. Please check your profile.', 'error')
    }

    setSaving(false)
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
                    emp.length_meters ? `${emp.length_meters}m` : null,
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
