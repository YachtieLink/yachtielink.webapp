'use client'

import { useState } from 'react'
import { Input, Select, Button, DatePicker } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ALL_COUNTRIES, PINNED_COUNTRIES } from '@/lib/constants/countries'
import { YACHT_ROLES } from '@/lib/constants/roles'
import { Skeleton } from '@/components/ui/skeleton'
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { countryToFlag, COUNTRY_TO_ISO } from '@/lib/constants/country-iso'
import { normalizeCountry } from '@/lib/constants/country-normalize'
import type { ParsedPersonal, ParsedLanguage } from '@/lib/cv/types'

/** Format a phone string to international format, or return as-is if unparseable */
function formatPhone(raw: string): string {
  if (!raw) return raw
  const parsed = parsePhoneNumberFromString(raw.startsWith('+') ? raw : `+${raw}`)
  return parsed?.formatInternational() ?? raw
}

/** Map common languages to a representative flag */
const LANGUAGE_FLAGS: Record<string, string> = {
  english: '🇬🇧', french: '🇫🇷', spanish: '🇪🇸', german: '🇩🇪', italian: '🇮🇹',
  portuguese: '🇵🇹', dutch: '🇳🇱', russian: '🇷🇺', chinese: '🇨🇳', mandarin: '🇨🇳',
  japanese: '🇯🇵', korean: '🇰🇷', arabic: '🇸🇦', hindi: '🇮🇳', thai: '🇹🇭',
  greek: '🇬🇷', turkish: '🇹🇷', polish: '🇵🇱', swedish: '🇸🇪', norwegian: '🇳🇴',
  danish: '🇩🇰', finnish: '🇫🇮', czech: '🇨🇿', croatian: '🇭🇷', romanian: '🇷🇴',
  hungarian: '🇭🇺', bulgarian: '🇧🇬', indonesian: '🇮🇩', malay: '🇲🇾', tagalog: '🇵🇭',
  filipino: '🇵🇭', vietnamese: '🇻🇳', afrikaans: '🇿🇦', hebrew: '🇮🇱', persian: '🇮🇷',
  farsi: '🇮🇷', ukrainian: '🇺🇦', serbian: '🇷🇸', albanian: '🇦🇱', swahili: '🇰🇪',
}

function languageFlag(language: string): string {
  return LANGUAGE_FLAGS[language.toLowerCase()] ?? '🌐'
}

/** Get flag emoji from a phone number's country code */
function phoneFlagEmoji(raw: string): string {
  if (!raw) return ''
  const parsed = parsePhoneNumberFromString(raw.startsWith('+') ? raw : `+${raw}`)
  if (!parsed?.country) return ''
  return String.fromCodePoint(
    ...[...parsed.country].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

interface StepPersonalProps {
  parsed: ParsedPersonal | null
  languages: ParsedLanguage[]
  existing: Record<string, unknown>
  parsePersonalLoading: boolean
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
  // CV-parsed data wins when present — the user uploaded a CV to update their profile
  return (parsed as string) || (existing as string) || ''
}

function AddLanguageInline({ onAdd, existing }: {
  onAdd: (lang: ParsedLanguage) => void
  existing: string[]
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [proficiency, setProficiency] = useState<ParsedLanguage['proficiency']>('fluent')

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-xs text-[var(--color-interactive)] self-start"
      >
        + Add language
      </button>
    )
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed || existing.includes(trimmed.toLowerCase())) return
    onAdd({ language: trimmed, proficiency })
    setName('')
    setProficiency('fluent')
    setAdding(false)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Language name"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="flex-1 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
      />
      <select
        value={proficiency}
        onChange={(e) => setProficiency(e.target.value as ParsedLanguage['proficiency'])}
        className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
      >
        {PROFICIENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button type="button" onClick={handleAdd} className="text-sm text-[var(--color-interactive)]">Add</button>
      <button type="button" onClick={() => setAdding(false)} className="text-sm text-[var(--color-text-tertiary)]">×</button>
    </div>
  )
}

export function StepPersonal({ parsed, languages: parsedLangs, existing, parsePersonalLoading, onConfirm }: StepPersonalProps) {
  const [editing, setEditing] = useState(false)

  // Merged state
  const [fullName, setFullName] = useState(merge(existing.full_name, parsed?.full_name))
  const [primaryRole, setPrimaryRole] = useState(merge(existing.primary_role, parsed?.primary_role))
  const [bio, setBio] = useState(merge(existing.bio, parsed?.bio).slice(0, 500))
  const [phone, setPhone] = useState(() => formatPhone(merge(existing.phone, parsed?.phone)))
  const [locationCountry, setLocationCountry] = useState(normalizeCountry(merge(existing.location_country, parsed?.location_country)) ?? merge(existing.location_country, parsed?.location_country))
  const [locationCity, setLocationCity] = useState(merge(existing.location_city, parsed?.location_city))
  const [dob, setDob] = useState(merge(existing.dob, parsed?.dob))
  const [homeCountry, setHomeCountry] = useState(normalizeCountry(merge(existing.home_country, parsed?.home_country)) ?? merge(existing.home_country, parsed?.home_country))
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
    // CV-parsed data wins when present — user uploaded a CV to update their profile
    if (parsed.full_name) setFullName(parsed.full_name)
    if (parsed.primary_role) setPrimaryRole(parsed.primary_role)
    if (parsed.bio) setBio(parsed.bio.slice(0, 500))
    if (parsed.phone) setPhone(formatPhone(parsed.phone))
    if (parsed.location_country) setLocationCountry(normalizeCountry(parsed.location_country) ?? parsed.location_country)
    if (parsed.location_city) setLocationCity(parsed.location_city)
    if (parsed.dob) setDob(parsed.dob)
    if (parsed.home_country) setHomeCountry(normalizeCountry(parsed.home_country) ?? parsed.home_country)
    if (parsed.smoke_pref) setSmokePref(parsed.smoke_pref)
    if (parsed.appearance_note) setAppearanceNote(parsed.appearance_note)
    if (parsed.license_info) setLicenseInfo(parsed.license_info)
    if (parsed.travel_docs?.length) setTravelDocs(parsed.travel_docs)
    if (parsedLangs.length) setLanguages(parsedLangs)
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
  // Track fields where CV data overwrote existing profile data
  type Overwrite = { oldValue: string; restore: () => void }
  const overwrites: Record<string, Overwrite> = {}
  function trackOverwrite(label: string, existingVal: unknown, currentVal: string, restoreFn: (v: string) => void) {
    const old = (existingVal as string) || ''
    if (old && currentVal && old !== currentVal) {
      overwrites[label] = { oldValue: old, restore: () => restoreFn(old) }
    }
  }
  trackOverwrite('Name', existing.full_name, fullName, setFullName)
  trackOverwrite('Role', existing.primary_role, primaryRole, setPrimaryRole)
  trackOverwrite('Bio', existing.bio, bio, setBio)
  trackOverwrite('Nationality', existing.home_country, homeCountry, setHomeCountry)
  trackOverwrite('Phone', existing.phone, phone, (v) => setPhone(formatPhone(v)))
  trackOverwrite('License', existing.license_info, licenseInfo, setLicenseInfo)

  const displayFields: { label: string; value: string }[] = []
  if (fullName) displayFields.push({ label: 'Name', value: fullName })
  if (primaryRole) displayFields.push({ label: 'Role', value: primaryRole })
  if (bio) displayFields.push({ label: 'Bio', value: bio })
  if (homeCountry) displayFields.push({ label: 'Nationality', value: `${countryToFlag(homeCountry)} ${homeCountry}` })
  if (locationCountry || locationCity) displayFields.push({ label: 'Location', value: `${locationCountry ? countryToFlag(locationCountry) + ' ' : ''}${[locationCity, locationCountry].filter(Boolean).join(', ')}` })
  if (phone) displayFields.push({ label: 'Phone', value: `${phoneFlagEmoji(phone) ? phoneFlagEmoji(phone) + ' ' : ''}${phone}` })
  if (dob) {
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
    displayFields.push({ label: 'Age', value: `${age} yrs` })
  }
  if (smokePref) displayFields.push({ label: 'Smoking', value: SMOKE_OPTIONS.find(o => o.value === smokePref)?.label ?? smokePref.replace(/_/g, ' ') })
  if (licenseInfo) displayFields.push({ label: 'License', value: licenseInfo })
  if (travelDocs.length) displayFields.push({ label: 'Visas', value: travelDocs.join(', ') })
  if (languages.length) displayFields.push({ label: 'Languages', value: languages.map(l => `${languageFlag(l.language)} ${l.language} (${l.proficiency})`).join(', ') })

  if (editing) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl shadow-sm flex flex-col">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Edit your details</h2>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Cancel</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Identity */}
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As shown on your documents" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Primary Role</label>
            <input
              list="yacht-roles"
              value={primaryRole}
              onChange={(e) => setPrimaryRole(e.target.value)}
              placeholder="e.g. Chief Stewardess"
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)]"
            />
            <datalist id="yacht-roles">
              {YACHT_ROLES.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="A short intro — what kind of crew are you?"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)] resize-none"
            />
            {bio && <p className="text-xs text-[var(--color-text-tertiary)] text-right">{bio.length}/500</p>}
          </div>

          {/* Personal */}
          <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <span className="text-xl pb-2.5 w-8 text-center flex-shrink-0">{homeCountry ? countryToFlag(homeCountry) : '🌐'}</span>
              <div className="flex-1">
                <SearchableSelect
                  label="Nationality"
                  value={homeCountry}
                  onChange={(v) => setHomeCountry(v)}
                  options={ALL_COUNTRIES.map(c => ({ value: c, label: `${countryToFlag(c)} ${c}` }))}
                  pinnedOptions={PINNED_COUNTRIES.map(c => ({ value: c, label: `${countryToFlag(c)} ${c}` }))}
                  displayValue={homeCountry || undefined}
                  placeholder="Search..."
                  clearable
                />
              </div>
            </div>
            <div className="ml-10">
              <DatePicker label="Date of Birth" value={dob || null} onChange={(v) => setDob(v ?? '')} includeDay maxYear={new Date().getFullYear() - 16} minYear={1940} />
            </div>
          </div>

          {/* Location & Contact */}
          <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-4">
            <p className="text-xs text-[var(--color-text-tertiary)]">Where are you based right now?</p>
            <div className="flex items-end gap-2">
              <span className="text-xl pb-2.5 w-8 text-center flex-shrink-0">{locationCountry ? countryToFlag(locationCountry) : '🌐'}</span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <SearchableSelect
                  label="Country"
                  value={locationCountry}
                  onChange={(v) => setLocationCountry(v)}
                  options={ALL_COUNTRIES.map(c => ({ value: c, label: `${countryToFlag(c)} ${c}` }))}
                  pinnedOptions={PINNED_COUNTRIES.map(c => ({ value: c, label: `${countryToFlag(c)} ${c}` }))}
                  displayValue={locationCountry || undefined}
                  placeholder="Search..."
                  clearable
                />
                <Input label="City" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="e.g. Antibes" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl pb-2.5 w-8 text-center flex-shrink-0">{phone && phoneFlagEmoji(phone) ? phoneFlagEmoji(phone) : '📱'}</span>
              <div className="flex-1">
                <Input
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => { if (phone) setPhone(formatPhone(phone)) }}
                  placeholder="+44 7891 234567"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-4">
            <p className="text-xs text-[var(--color-text-tertiary)]">Captains and crew agents often filter by these — filling them in helps you get found.</p>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Smoking" value={smokePref} onChange={(e) => setSmokePref(e.target.value)}>
                {SMOKE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
              <Select label="Tattoos / Piercings" value={appearanceNote} onChange={(e) => setAppearanceNote(e.target.value)}>
                {APPEARANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <Input label="Driving License" value={licenseInfo} onChange={(e) => setLicenseInfo(e.target.value)} placeholder="e.g. UK Drivers License" />
          </div>

          {/* Languages */}
          <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Languages</p>
            {languages.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{languageFlag(l.language)} {l.language}</span>
                <select
                  value={l.proficiency}
                  onChange={(e) => setLanguages(languages.map((lang, j) => j === i ? { ...lang, proficiency: e.target.value as ParsedLanguage['proficiency'] } : lang))}
                  className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
                >
                  {PROFICIENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button type="button" onClick={() => setLanguages(languages.filter((_, j) => j !== i))} className="h-10 w-10 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors rounded-lg hover:bg-[var(--color-surface-raised)]">×</button>
              </div>
            ))}
            <AddLanguageInline
              onAdd={(lang) => setLanguages([...languages, lang])}
              existing={languages.map(l => l.language.toLowerCase())}
            />
          </div>
        </div>

        {/* Sticky done */}
        <div className="sticky bottom-0 p-5 pt-3 bg-white/90 border-t border-[var(--color-amber-100)] rounded-b-2xl">
          <Button onClick={() => { setEditing(false); handleConfirm() }} className="w-full">Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Your Details</h2>

      {parsePersonalLoading && displayFields.length === 0 ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Hang tight — we&apos;re pulling out your details.
          </p>
        </div>
      ) : (
        <>
          {displayFields.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <div className="flex gap-2 text-sm">
                <span className="text-[var(--color-text-secondary)] w-20 shrink-0">{f.label}</span>
                <span className="text-[var(--color-text-primary)]">{f.value}</span>
              </div>
              {overwrites[f.label] && (
                <div className="ml-[5.5rem] flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                  <span>was: {overwrites[f.label].oldValue}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={overwrites[f.label].restore}
                    className="text-[var(--color-interactive)] hover:underline"
                  >
                    restore
                  </button>
                </div>
              )}
            </div>
          ))}

          {displayFields.length > 0 && displayFields.length < 3 && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              We found a few details. You can add more anytime from your profile.
            </p>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={handleConfirm} className="w-full">Looks good</Button>
            <button type="button" onClick={() => setEditing(true)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2">
              Edit details
            </button>
          </div>
        </>
      )}
    </div>
  )
}
