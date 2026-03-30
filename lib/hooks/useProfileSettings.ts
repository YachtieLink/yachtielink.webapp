'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { isProFromRecord } from '@/lib/stripe/pro-shared'

export interface ProfileSettings {
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
  profile_view_mode: 'profile' | 'portfolio' | 'rich_portfolio'
  scrim_preset:      'dark' | 'light' | 'teal' | 'warm'
  accent_color:      'teal' | 'coral' | 'navy' | 'amber' | 'sand'
  profile_template:  'classic' | 'bold'
}

const DEFAULT_SETTINGS: ProfileSettings = {
  phone: '', whatsapp: '', contact_email: '', location_country: '', location_city: '',
  show_phone: false, show_whatsapp: false, show_email: false, show_location: true,
  dob: '', home_country: '', smoke_pref: '', appearance_note: '',
  travel_docs: [], license_info: '', show_dob: false, show_home_country: false,
  profile_view_mode: 'portfolio', scrim_preset: 'dark', accent_color: 'teal',
  profile_template: 'classic',
}

const SETTINGS_COLUMNS = 'phone, whatsapp, email, contact_email, location_country, location_city, show_phone, show_whatsapp, show_email, show_location, dob, home_country, smoke_pref, appearance_note, travel_docs, license_info, show_dob, show_home_country, profile_view_mode, scrim_preset, accent_color, profile_template'

export function useProfileSettings() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [form, setForm] = useState<ProfileSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoaded(true); return }
      const { data } = await supabase
        .from('users')
        .select(`${SETTINGS_COLUMNS}, subscription_status, subscription_ends_at`)
        .eq('id', user.id)
        .single()
      if (data) {
        setIsPro(isProFromRecord({
          subscription_status: data.subscription_status ?? null,
          subscription_ends_at: data.subscription_ends_at ?? null,
        }))
      }
      if (data) {
        setForm({
          phone:             data.phone             ?? '',
          whatsapp:          data.whatsapp           ?? '',
          contact_email:     data.contact_email ?? data.email ?? '',
          location_country:  data.location_country   ?? '',
          location_city:     data.location_city      ?? '',
          show_phone:        data.show_phone        ?? false,
          show_whatsapp:     data.show_whatsapp     ?? false,
          show_email:        data.show_email        ?? false,
          show_location:     data.show_location     ?? false,
          dob:               data.dob                ?? '',
          home_country:      data.home_country       ?? '',
          smoke_pref:        data.smoke_pref         ?? '',
          appearance_note:   data.appearance_note    ?? '',
          travel_docs:       data.travel_docs        ?? [],
          license_info:      data.license_info       ?? '',
          show_dob:          data.show_dob           ?? false,
          show_home_country: data.show_home_country  ?? false,
          profile_view_mode: data.profile_view_mode  ?? 'portfolio',
          scrim_preset:      data.scrim_preset       ?? 'dark',
          accent_color:      data.accent_color       ?? 'teal',
          profile_template:  data.profile_template   ?? 'classic',
        })
      }
      setLoaded(true)
    }
    load()
  }, [supabase])

  function set<K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      const { error } = await supabase
        .from('users')
        .update({
          phone:             form.phone.trim()             || null,
          whatsapp:          form.whatsapp.trim()           || null,
          contact_email:     form.contact_email.trim()      || null,
          location_country:  form.location_country.trim()   || null,
          location_city:     form.location_city.trim()      || null,
          show_phone:        form.show_phone,
          show_whatsapp:     form.show_whatsapp,
          show_email:        form.show_email,
          show_location:     form.show_location,
          dob:               form.dob                       || null,
          home_country:      form.home_country.trim()       || null,
          smoke_pref:        form.smoke_pref                || null,
          appearance_note:   form.appearance_note           || null,
          travel_docs:       form.travel_docs,
          license_info:      form.license_info.trim()       || null,
          show_dob:          form.show_dob,
          show_home_country: form.show_home_country,
          profile_view_mode: form.profile_view_mode === 'rich_portfolio' && !isPro ? 'portfolio' : form.profile_view_mode,
          scrim_preset:      form.scrim_preset,
          accent_color:      form.accent_color,
          profile_template:  form.profile_template,
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

  return { form, set, save, loaded, saving, isPro }
}
