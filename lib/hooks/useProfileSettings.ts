'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

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
}

const DEFAULT_SETTINGS: ProfileSettings = {
  phone: '', whatsapp: '', contact_email: '', location_country: '', location_city: '',
  show_phone: false, show_whatsapp: false, show_email: false, show_location: true,
  dob: '', home_country: '', smoke_pref: '', appearance_note: '',
  travel_docs: [], license_info: '', show_dob: false, show_home_country: false,
}

const SETTINGS_COLUMNS = 'phone, whatsapp, email, location_country, location_city, show_phone, show_whatsapp, show_email, show_location, dob, home_country, smoke_pref, appearance_note, travel_docs, license_info, show_dob, show_home_country'

export function useProfileSettings() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select(SETTINGS_COLUMNS)
        .eq('id', user.id)
        .single()
      if (data) {
        setForm({
          phone:             data.phone             ?? '',
          whatsapp:          data.whatsapp           ?? '',
          contact_email:     data.email              ?? '',
          location_country:  data.location_country   ?? '',
          location_city:     data.location_city      ?? '',
          show_phone:        data.show_phone,
          show_whatsapp:     data.show_whatsapp,
          show_email:        data.show_email,
          show_location:     data.show_location,
          dob:               data.dob                ?? '',
          home_country:      data.home_country       ?? '',
          smoke_pref:        data.smoke_pref         ?? '',
          appearance_note:   data.appearance_note    ?? '',
          travel_docs:       data.travel_docs        ?? [],
          license_info:      data.license_info       ?? '',
          show_dob:          data.show_dob           ?? false,
          show_home_country: data.show_home_country  ?? false,
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

  return { form, set, save, loaded, saving }
}
