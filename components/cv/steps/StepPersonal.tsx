'use client'

import { useState } from 'react'
import { Input, Select, Button, DatePicker } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ALL_COUNTRIES, PINNED_COUNTRIES } from '@/lib/constants/countries'
import { Skeleton } from '@/components/ui/skeleton'
import type { ParsedPersonal, ParsedLanguage } from '@/lib/cv/types'

interface StepPersonalProps {
  parsed: ParsedPersonal | null
  languages: ParsedLanguage[]
  existing: Record<string, unknown>
  parseLoading: boolean
  onConfirm: (personal: ParsedPersonal, languages: ParsedLanguage[]) => void
}

const SMOKE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'non_smoker', label: 'Non Smoker' },
  { value: 'smoker', label: 'Smoker' },
  { value: 'social_smoker', label: 'Social Smoker' },
]

const APPEARANCE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'none', label: 'None' },
  { value: 'visible', label: 'Visible' },
  { value: 'non_visible', label: 'Non Visible' },
  { value: 'not_specified', label: 'Not Specified' },
]

const PROFICIENCY_OPTIONS = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
]

function merge(existing: unknown, parsed: unknown): string {
  return (existing as string) || (parsed as string) || ''
}

export function StepPersonal({ parsed, languages: parsedLangs, existing, parseLoading, onConfirm }: StepPersonalProps) {
  const [editing, setEditing] = useState(false)

  // Merged state
  const [fullName, setFullName] = useState(merge(existing.full_name, parsed?.full_name))
  const [primaryRole, setPrimaryRole] = useState(merge(existing.primary_role, parsed?.primary_role))
  const [bio, setBio] = useState(merge(existing.bio, parsed?.bio))
  const [phone, setPhone] = useState(merge(existing.phone, parsed?.phone))
  const [locationCountry, setLocationCountry] = useState(merge(existing.location_country, parsed?.location_country))
  const [locationCity, setLocationCity] = useState(merge(existing.location_city, parsed?.location_city))
  const [dob, setDob] = useState(merge(existing.dob, parsed?.dob))
  const [homeCountry, setHomeCountry] = useState(merge(existing.home_country, parsed?.home_country))
  const [smokePref, setSmokePref] = useState(merge(existing.smoke_pref, parsed?.smoke_pref))
  const [appearanceNote, setAppearanceNote] = useState(merge(existing.appearance_note, parsed?.appearance_note))
  const [licenseInfo, setLicenseInfo] = useState(merge(existing.license_info, parsed?.license_info))
  const [travelDocs, setTravelDocs] = useState<string[]>((existing.travel_docs as string[]) ?? parsed?.travel_docs ?? [])
  const [languages, setLanguages] = useState<ParsedLanguage[]>(
    (existing.languages as ParsedLanguage[])?.length ? (existing.languages as ParsedLanguage[]) : parsedLangs
  )

  // Re-merge when parse completes
  const [lastParsed, setLastParsed] = useState(parsed)
  if (parsed && parsed !== lastParsed) {
    setLastParsed(parsed)
    if (!existing.full_name && parsed.full_name) setFullName(parsed.full_name)
    if (!existing.primary_role && parsed.primary_role) setPrimaryRole(parsed.primary_role)
    if (!existing.bio && parsed.bio) setBio(parsed.bio)
    if (!existing.phone && parsed.phone) setPhone(parsed.phone)
    if (!existing.location_country && parsed.location_country) setLocationCountry(parsed.location_country)
    if (!existing.location_city && parsed.location_city) setLocationCity(parsed.location_city)
    if (!existing.dob && parsed.dob) setDob(parsed.dob)
    if (!existing.home_country && parsed.home_country) setHomeCountry(parsed.home_country)
    if (!existing.smoke_pref && parsed.smoke_pref) setSmokePref(parsed.smoke_pref)
    if (!existing.appearance_note && parsed.appearance_note) setAppearanceNote(parsed.appearance_note)
    if (!existing.license_info && parsed.license_info) setLicenseInfo(parsed.license_info)
    if (!(existing.travel_docs as string[])?.length && parsed.travel_docs?.length) setTravelDocs(parsed.travel_docs)
    if (!(existing.languages as ParsedLanguage[])?.length && parsedLangs.length) setLanguages(parsedLangs)
  }

  function handleConfirm() {
    onConfirm({
      full_name: fullName || null,
      primary_role: primaryRole || null,
      bio: bio || null,
      phone: phone || null,
      email: null,
      location_country: locationCountry || null,
      location_city: locationCity || null,
      dob: dob || null,
      home_country: homeCountry || null,
      smoke_pref: smokePref || null,
      appearance_note: appearanceNote || null,
      travel_docs: travelDocs,
      license_info: licenseInfo || null,
    }, languages)
  }

  // Collect display fields
  const displayFields: { label: string; value: string }[] = []
  if (fullName) displayFields.push({ label: 'Name', value: fullName })
  if (primaryRole) displayFields.push({ label: 'Role', value: primaryRole })
  if (homeCountry) displayFields.push({ label: 'Nationality', value: homeCountry })
  if (locationCountry || locationCity) displayFields.push({ label: 'Location', value: [locationCity, locationCountry].filter(Boolean).join(', ') })
  if (phone) displayFields.push({ label: 'Phone', value: phone })
  if (dob) {
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
    displayFields.push({ label: 'Age', value: `${age}` })
  }
  if (smokePref) displayFields.push({ label: 'Smoking', value: smokePref.replace(/_/g, ' ') })
  if (licenseInfo) displayFields.push({ label: 'License', value: licenseInfo })
  if (travelDocs.length) displayFields.push({ label: 'Visas', value: travelDocs.join(', ') })
  if (languages.length) displayFields.push({ label: 'Languages', value: languages.map(l => `${l.language} (${l.proficiency})`).join(', ') })

  if (editing) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Your Details</h2>
        <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Primary Role" value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)} />
        <SearchableSelect
          label="Nationality"
          value={homeCountry}
          onChange={(v) => setHomeCountry(v)}
          options={ALL_COUNTRIES.map(c => ({ value: c, label: c }))}
          pinnedOptions={PINNED_COUNTRIES.map(c => ({ value: c, label: c }))}
          placeholder="Search..."
          clearable
        />
        <DatePicker label="Date of Birth" value={dob || null} onChange={(v) => setDob(v ?? '')} includeDay maxYear={new Date().getFullYear() - 16} minYear={1940} />
        <SearchableSelect
          label="Country"
          value={locationCountry}
          onChange={(v) => setLocationCountry(v)}
          options={ALL_COUNTRIES.map(c => ({ value: c, label: c }))}
          pinnedOptions={PINNED_COUNTRIES.map(c => ({ value: c, label: c }))}
          placeholder="Search..."
          clearable
        />
        <Input label="City" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Select label="Smoking" value={smokePref} onChange={(e) => setSmokePref(e.target.value)}>
          {SMOKE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select label="Tattoos / Piercings" value={appearanceNote} onChange={(e) => setAppearanceNote(e.target.value)}>
          {APPEARANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Input label="Driving License" value={licenseInfo} onChange={(e) => setLicenseInfo(e.target.value)} />

        {/* Languages */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Languages</p>
          {languages.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{l.language}</span>
              <select
                value={l.proficiency}
                onChange={(e) => setLanguages(languages.map((lang, j) => j === i ? { ...lang, proficiency: e.target.value as ParsedLanguage['proficiency'] } : lang))}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
              >
                {PROFICIENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button type="button" onClick={() => setLanguages(languages.filter((_, j) => j !== i))} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]">×</button>
            </div>
          ))}
        </div>

        <Button onClick={() => { setEditing(false); handleConfirm() }} className="w-full">Done</Button>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Your Details</h2>

      {parseLoading && displayFields.length === 0 ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Hang tight — we&apos;re pulling out your details, experience, and qualifications.
          </p>
        </div>
      ) : (
        <>
          {displayFields.map((f) => (
            <div key={f.label} className="flex gap-2 text-sm">
              <span className="text-[var(--color-text-tertiary)] w-20 shrink-0">{f.label}</span>
              <span className="text-[var(--color-text-primary)]">{f.value}</span>
            </div>
          ))}

          {parseLoading && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-interactive)]" />
              Reading your CV for more...
            </div>
          )}

          {!parseLoading && displayFields.length > 0 && displayFields.length < 3 && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              We found a few details. You can add more anytime from your profile.
            </p>
          )}

          <div className="flex gap-2 mt-1">
            <Button onClick={handleConfirm} className="flex-1" disabled={parseLoading}>Looks good</Button>
            <Button variant="secondary" onClick={() => setEditing(true)} className="flex-1" disabled={parseLoading}>Edit details</Button>
          </div>
        </>
      )}
    </div>
  )
}
