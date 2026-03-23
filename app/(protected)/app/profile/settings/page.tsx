'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select, DatePicker } from '@/components/ui'
import { BackButton } from '@/components/ui/BackButton'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_COUNTRIES, PINNED_COUNTRIES } from '@/lib/constants/countries'

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

const COMMON_TRAVEL_DOCS = ['B1/B2', 'Schengen', 'EU Citizen', "Seaman's Book"]

interface ContactSettings {
  phone:            string
  whatsapp:         string
  contact_email:    string
  location_country: string
  location_city:    string
  show_phone:       boolean
  show_whatsapp:    boolean
  show_email:       boolean
  show_location:    boolean
  dob:              string
  home_country:     string
  smoke_pref:       string
  appearance_note:  string
  travel_docs:      string[]
  license_info:     string
  show_dob:         boolean
  show_home_country: boolean
}

function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string
  sublabel?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
        {sublabel && <p className="text-xs text-[var(--color-text-secondary)]">{sublabel}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-interactive)]' : 'bg-[var(--color-surface-raised)]'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

export default function ProfileSettingsPage() {
  const router    = useRouter()
  const { toast } = useToast()
  const supabase  = createClient()
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ContactSettings>({
    phone:            '',
    whatsapp:         '',
    contact_email:    '',
    location_country: '',
    location_city:    '',
    show_phone:       false,
    show_whatsapp:    false,
    show_email:       false,
    show_location:    true,
    dob:              '',
    home_country:     '',
    smoke_pref:       '',
    appearance_note:  '',
    travel_docs:      [],
    license_info:     '',
    show_dob:         false,
    show_home_country: false,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('phone, whatsapp, email, location_country, location_city, show_phone, show_whatsapp, show_email, show_location, dob, home_country, smoke_pref, appearance_note, travel_docs, license_info, show_dob, show_home_country')
        .eq('id', user.id)
        .single()
      if (data) {
        setForm({
          phone:            data.phone            ?? '',
          whatsapp:         data.whatsapp         ?? '',
          contact_email:    data.email            ?? '',
          location_country: data.location_country ?? '',
          location_city:    data.location_city    ?? '',
          show_phone:       data.show_phone,
          show_whatsapp:    data.show_whatsapp,
          show_email:       data.show_email,
          show_location:    data.show_location,
          dob:              data.dob              ?? '',
          home_country:     data.home_country     ?? '',
          smoke_pref:       data.smoke_pref       ?? '',
          appearance_note:  data.appearance_note  ?? '',
          travel_docs:      data.travel_docs      ?? [],
          license_info:     data.license_info     ?? '',
          show_dob:         data.show_dob         ?? false,
          show_home_country: data.show_home_country ?? false,
        })
      }
      setLoaded(true)
    }
    load()
  }, [supabase])

  function set<K extends keyof ContactSettings>(key: K, value: ContactSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      const { error } = await supabase
        .from('users')
        .update({
          phone:            form.phone.trim()            || null,
          whatsapp:         form.whatsapp.trim()         || null,
          location_country: form.location_country.trim() || null,
          location_city:    form.location_city.trim()    || null,
          show_phone:       form.show_phone,
          show_whatsapp:    form.show_whatsapp,
          show_email:       form.show_email,
          show_location:    form.show_location,
          dob:              form.dob              || null,
          home_country:     form.home_country.trim() || null,
          smoke_pref:       form.smoke_pref       || null,
          appearance_note:  form.appearance_note  || null,
          travel_docs:      form.travel_docs,
          license_info:     form.license_info.trim() || null,
          show_dob:         form.show_dob,
          show_home_country: form.show_home_country,
        })
        .eq('id', user.id)

      if (error) { toast(error.message, 'error'); return }
      toast('Contact info saved.', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center gap-3">
        <BackButton href="/app/profile" />
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Contact info</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            All fields are hidden on your public profile by default. Toggle to show.
          </p>
        </div>
      </div>

      {/* ── Fields ─────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+44 7700 900000"
          />
          <ToggleRow
            label="Show phone on profile"
            checked={form.show_phone}
            onChange={(v) => set('show_phone', v)}
          />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-1">
          <Input
            label="WhatsApp number"
            type="tel"
            value={form.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
            placeholder="+44 7700 900000"
          />
          <ToggleRow
            label="Show WhatsApp on profile"
            checked={form.show_whatsapp}
            onChange={(v) => set('show_whatsapp', v)}
          />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-1">
          <Input
            label="Contact email"
            type="email"
            value={form.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            placeholder="you@example.com"
            hint="This is your account email. Only shown if you enable it."
            disabled
          />
          <ToggleRow
            label="Show email on profile"
            checked={form.show_email}
            onChange={(v) => set('show_email', v)}
          />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <SearchableSelect
              label="Country"
              value={form.location_country}
              onChange={(v) => set('location_country', v)}
              options={ALL_COUNTRIES.map((c) => ({ value: c, label: c }))}
              pinnedOptions={PINNED_COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="Search countries..."
              clearable
              clearLabel="No country"
              className="flex-1"
            />
            <Input
              label="City"
              type="text"
              value={form.location_city}
              onChange={(e) => set('location_city', e.target.value)}
              placeholder="City"
              className="flex-1"
            />
          </div>
          <ToggleRow
            label="Show location on profile"
            checked={form.show_location}
            onChange={(v) => set('show_location', v)}
          />
        </div>
      </div>

      {/* ── Personal Details ────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Personal Details</h2>

        <DatePicker
          label="Date of Birth"
          value={form.dob || null}
          onChange={(v) => set('dob', v ?? '')}
          includeDay
          maxYear={new Date().getFullYear() - 16}
          minYear={1940}
        />

        <SearchableSelect
          label="Home Country"
          value={form.home_country}
          onChange={(v) => set('home_country', v)}
          options={ALL_COUNTRIES.map((c) => ({ value: c, label: c }))}
          pinnedOptions={PINNED_COUNTRIES.map((c) => ({ value: c, label: c }))}
          placeholder="Search countries..."
          clearable
          clearLabel="No country"
        />

        <Select
          label="Smoking Preference"
          value={form.smoke_pref}
          onChange={(e) => set('smoke_pref', e.target.value)}
        >
          {SMOKE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        <Select
          label="Tattoos / Piercings"
          value={form.appearance_note}
          onChange={(e) => set('appearance_note', e.target.value)}
        >
          {APPEARANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        <Input
          label="Driving License"
          type="text"
          value={form.license_info}
          onChange={(e) => set('license_info', e.target.value)}
          placeholder="e.g. Full UK, International"
        />
      </div>

      {/* ── Visa / Travel Documents ──────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Visa / Travel Documents</h2>
        <div className="flex flex-wrap gap-2">
          {COMMON_TRAVEL_DOCS.map((doc) => {
            const active = form.travel_docs.includes(doc)
            return (
              <button
                key={doc}
                type="button"
                onClick={() => {
                  set('travel_docs', active
                    ? form.travel_docs.filter((d) => d !== doc)
                    : [...form.travel_docs, doc]
                  )
                }}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  active
                    ? 'bg-[var(--color-interactive)] text-white border-[var(--color-interactive)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)]'
                }`}
              >
                {doc}
              </button>
            )
          })}
        </div>
        {form.travel_docs.filter((d) => !COMMON_TRAVEL_DOCS.includes(d)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.travel_docs.filter((d) => !COMMON_TRAVEL_DOCS.includes(d)).map((doc) => (
              <span
                key={doc}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-interactive)] text-white"
              >
                {doc}
                <button
                  type="button"
                  onClick={() => set('travel_docs', form.travel_docs.filter((d) => d !== doc))}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const input = (e.currentTarget.elements.namedItem('other_doc') as HTMLInputElement)
            const val = input.value.trim()
            if (val && !form.travel_docs.includes(val)) {
              set('travel_docs', [...form.travel_docs, val])
              input.value = ''
            }
          }}
          className="flex gap-2"
        >
          <Input
            name="other_doc"
            type="text"
            placeholder="Other document..."
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="shrink-0">
            Add
          </Button>
        </form>
      </div>

      {/* ── Visibility ───────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Visibility</h2>
        <ToggleRow
          label="Show age on profile"
          sublabel="Calculated from date of birth"
          checked={form.show_dob}
          onChange={(v) => set('show_dob', v)}
        />
        <ToggleRow
          label="Show home country on profile"
          checked={form.show_home_country}
          onChange={(v) => set('show_home_country', v)}
        />
      </div>

      {/* ── Save ───────────────────────────────────── */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Save
        </Button>
      </div>
    </div>
  )
}
