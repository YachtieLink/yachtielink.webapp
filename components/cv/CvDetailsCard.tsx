'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'

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

export function CvDetailsCard() {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const [smokePref, setSmokePref] = useState('')
  const [appearanceNote, setAppearanceNote] = useState('')
  const [licenseInfo, setLicenseInfo] = useState('')
  const [travelDocs, setTravelDocs] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoaded(true); return }
      const { data } = await supabase
        .from('users')
        .select('smoke_pref, appearance_note, license_info, travel_docs')
        .eq('id', user.id)
        .single()
      if (data) {
        setSmokePref(data.smoke_pref ?? '')
        setAppearanceNote(data.appearance_note ?? '')
        setLicenseInfo(data.license_info ?? '')
        setTravelDocs(data.travel_docs ?? [])
      }
      setLoaded(true)
    }
    load()
  }, [supabase])

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }
      const { error } = await supabase
        .from('users')
        .update({
          smoke_pref:     smokePref || null,
          appearance_note: appearanceNote || null,
          license_info:   licenseInfo.trim() || null,
          travel_docs:    travelDocs,
        })
        .eq('id', user.id)
      if (error) { toast(error.message, 'error'); return }
      toast('CV details saved.', 'success')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">CV Details</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          These details appear on your generated CV only — not on your public profile.
        </p>
      </div>

      <Select label="Smoking Preference" value={smokePref} onChange={(e) => setSmokePref(e.target.value)}>
        {SMOKE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>

      <Select label="Tattoos / Piercings" value={appearanceNote} onChange={(e) => setAppearanceNote(e.target.value)}>
        {APPEARANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>

      <Input
        label="Driving License"
        type="text"
        value={licenseInfo}
        onChange={(e) => setLicenseInfo(e.target.value)}
        placeholder="e.g. Full UK, International"
      />

      {/* Travel Documents */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Visa / Travel Documents</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_TRAVEL_DOCS.map((doc) => {
            const active = travelDocs.includes(doc)
            return (
              <button
                key={doc}
                type="button"
                onClick={() => setTravelDocs(active ? travelDocs.filter((d) => d !== doc) : [...travelDocs, doc])}
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
        {travelDocs.filter((d) => !COMMON_TRAVEL_DOCS.includes(d)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {travelDocs.filter((d) => !COMMON_TRAVEL_DOCS.includes(d)).map((doc) => (
              <span key={doc} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-interactive)] text-white">
                {doc}
                <button type="button" onClick={() => setTravelDocs(travelDocs.filter((d) => d !== doc))} className="hover:opacity-70">×</button>
              </span>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const input = e.currentTarget.elements.namedItem('other_doc') as HTMLInputElement
            const val = input.value.trim()
            if (val && !travelDocs.includes(val)) {
              setTravelDocs([...travelDocs, val])
              input.value = ''
            }
          }}
          className="flex gap-2"
        >
          <Input name="other_doc" type="text" placeholder="Other document..." className="flex-1" />
          <Button type="submit" variant="secondary" className="shrink-0">Add</Button>
        </form>
      </div>

      <Button onClick={handleSave} loading={saving} className="self-end">Save CV Details</Button>
    </div>
  )
}
