'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

// ISO 3166-1 alpha-2 country names (abbreviated list — extend as needed)
// Full list should be fetched from a reference or bundled separately in Sprint 6+
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada',
  'Cape Verde','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
  'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti',
  'Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos',
  'Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco',
  'Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua',
  'Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau',
  'Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent',
  'Samoa','San Marino','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone',
  'Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea',
  'South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago',
  'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
].sort()

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
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('phone, whatsapp, email, location_country, location_city, show_phone, show_whatsapp, show_email, show_location')
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
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-[var(--color-surface-raised)] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Contact info</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          All fields are hidden on your public profile by default. Toggle to show.
        </p>
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
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Location</label>
            <div className="flex gap-2 mt-1.5">
              <select
                value={form.location_country}
                onChange={(e) => set('location_country', e.target.value)}
                className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              >
                <option value="">Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                value={form.location_city}
                onChange={(e) => set('location_city', e.target.value)}
                placeholder="City"
                className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              />
            </div>
          </div>
          <ToggleRow
            label="Show location on profile"
            checked={form.show_location}
            onChange={(v) => set('show_location', v)}
          />
        </div>
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
