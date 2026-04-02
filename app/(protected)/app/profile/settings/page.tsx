'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select } from '@/components/ui'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/Toast'
import { PageTransition } from '@/components/ui/PageTransition'
import { ALL_COUNTRIES, PINNED_COUNTRIES } from '@/lib/constants/countries'
import { normalizeCountry } from '@/lib/constants/country-normalize'
import { RESERVED_HANDLES } from '@/lib/constants/reserved-handles'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { User, Phone, Mail, MapPin, Calendar, Globe, LayoutGrid, Instagram, Linkedin, Youtube, Facebook, Link2, Plus, X } from 'lucide-react'

const DEPARTMENTS = [
  'Deck', 'Interior', 'Engineering', 'Galley',
  'Medical', 'Admin/Purser', 'Land-based',
]

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

type SocialPlatform = 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'website'

interface SocialLinkItem {
  platform: SocialPlatform
  url: string
}

// Custom TikTok icon (no Lucide equivalent)
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07Z" />
    </svg>
  )
}

// Custom X (Twitter) icon
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const SOCIAL_PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: React.ReactNode; placeholder: string }> = {
  instagram: { label: 'Instagram', icon: <Instagram size={16} />, placeholder: 'https://instagram.com/yourhandle' },
  linkedin:  { label: 'LinkedIn',  icon: <Linkedin size={16} />,   placeholder: 'https://linkedin.com/in/yourname' },
  tiktok:    { label: 'TikTok',    icon: <TikTokIcon size={16} />, placeholder: 'https://tiktok.com/@yourhandle' },
  youtube:   { label: 'YouTube',   icon: <Youtube size={16} />,    placeholder: 'https://youtube.com/@yourchannel' },
  x:         { label: 'X',         icon: <XIcon size={16} />,      placeholder: 'https://x.com/yourhandle' },
  facebook:  { label: 'Facebook',  icon: <Facebook size={16} />,   placeholder: 'https://facebook.com/yourprofile' },
  website:   { label: 'Website',   icon: <Globe size={16} />,      placeholder: 'https://yourwebsite.com' },
}

const ALL_PLATFORMS: SocialPlatform[] = ['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'website']

interface Role {
  id: string
  name: string
  department: string
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 px-1">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-[var(--color-interactive)]/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
      </div>
    </div>
  )
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
    <label className="flex items-center justify-between py-1.5 cursor-pointer">
      <div>
        <span className="text-xs font-medium text-[var(--color-text-secondary)] block">{label}</span>
        {sublabel && <span className="text-[11px] text-[var(--color-text-tertiary)] block">{sublabel}</span>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors ${
          checked ? 'bg-[var(--color-interactive)]' : 'bg-[var(--color-surface-raised)]'
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  // Identity
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [originalHandle, setOriginalHandle] = useState('')
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [departments, setDepartments] = useState<string[]>([])
  const [primaryRole, setPrimaryRole] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [customRole, setCustomRole] = useState('')
  const [useCustomRole, setUseCustomRole] = useState(false)

  // Contact
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [locationCity, setLocationCity] = useState('')

  // Visibility
  const [showPhone, setShowPhone] = useState(false)
  const [showWhatsapp, setShowWhatsapp] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showLocation, setShowLocation] = useState(false)

  // Personal
  const [dob, setDob] = useState('')
  const [homeCountry, setHomeCountry] = useState('')
  const [showDob, setShowDob] = useState(false)
  const [showHomeCountry, setShowHomeCountry] = useState(false)
  const [showNationalityFlag, setShowNationalityFlag] = useState(false)

  // Social links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([])
  const [addingPlatform, setAddingPlatform] = useState<SocialPlatform | null>(null)
  const [addingUrl, setAddingUrl] = useState('')

  // View mode
  const [profileViewMode, setProfileViewMode] = useState<'profile' | 'portfolio' | 'rich_portfolio'>('portfolio')
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoaded(true); return }
      setUserId(user.id)

      const [{ data: profile }, { data: roleData }] = await Promise.all([
        supabase
          .from('users')
          .select(`
            full_name, display_name, handle, departments, primary_role,
            phone, whatsapp, email, contact_email, location_country, location_city,
            show_phone, show_whatsapp, show_email, show_location,
            dob, home_country, show_dob, show_home_country, show_nationality_flag,
            profile_view_mode, subscription_status, subscription_ends_at,
            social_links
          `)
          .eq('id', user.id)
          .single(),
        supabase
          .from('roles')
          .select('id, name, department')
          .order('department')
          .order('sort_order'),
      ])

      if (profile) {
        setFullName(profile.full_name ?? '')
        setDisplayName(profile.display_name ?? '')
        setHandle(profile.handle ?? '')
        setOriginalHandle(profile.handle ?? '')
        setDepartments(profile.departments ?? [])
        if (roleData && profile.primary_role) {
          const found = roleData.find((r) => r.name === profile.primary_role)
          if (found) setPrimaryRole(found.id)
          else { setUseCustomRole(true); setCustomRole(profile.primary_role) }
        }
        setPhone(profile.phone ?? '')
        setWhatsapp(profile.whatsapp ?? '')
        setContactEmail(profile.contact_email ?? profile.email ?? '')
        setLocationCountry(normalizeCountry(profile.location_country) ?? profile.location_country ?? '')
        setLocationCity(profile.location_city ?? '')
        setShowPhone(profile.show_phone ?? false)
        setShowWhatsapp(profile.show_whatsapp ?? false)
        setShowEmail(profile.show_email ?? false)
        setShowLocation(profile.show_location ?? false)
        setDob(profile.dob ?? '')
        setHomeCountry(normalizeCountry(profile.home_country) ?? profile.home_country ?? '')
        setShowDob(profile.show_dob ?? false)
        setShowHomeCountry(profile.show_home_country ?? false)
        setShowNationalityFlag((profile as { show_nationality_flag?: boolean | null }).show_nationality_flag ?? false)
        setProfileViewMode(profile.profile_view_mode ?? 'portfolio')
        setIsPro(isProFromRecord({
          subscription_status: profile.subscription_status ?? null,
          subscription_ends_at: profile.subscription_ends_at ?? null,
        }))
        setSocialLinks((profile.social_links as SocialLinkItem[] | null) ?? [])
      }
      if (roleData) setRoles(roleData)
      setLoaded(true)
    }
    load()
  }, [supabase])

  useEffect(() => {
    if (handle === originalHandle) { setHandleStatus('idle'); return }
    if (!handle) { setHandleStatus('idle'); return }
    if (!HANDLE_RE.test(handle)) { setHandleStatus('invalid'); return }
    if (RESERVED_HANDLES.has(handle)) { setHandleStatus('taken'); return }

    setHandleStatus('checking')
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('handle', handle)
        .neq('id', userId)
        .maybeSingle()
      setHandleStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timeout)
  }, [handle, originalHandle, userId, supabase])

  function toggleDepartment(dept: string) {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    )
    setPrimaryRole('')
    setCustomRole('')
  }

  const filteredRoles = roles.filter(
    (r) => departments.includes(r.department) || r.department === 'Other'
  )

  const selectedRoleName = useCustomRole
    ? customRole
    : roles.find((r) => r.id === primaryRole)?.name ?? ''

  async function handleSave() {
    if (!fullName.trim()) { toast('Full name is required.', 'error'); return }
    if (handle && handleStatus === 'taken') { toast('That handle is taken.', 'error'); return }
    if (handle && handleStatus === 'invalid') { toast('Handle must be 3–30 characters: a-z, 0-9, hyphens.', 'error'); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      const { error } = await supabase
        .from('users')
        .update({
          full_name:    fullName.trim(),
          display_name: displayName.trim() || null,
          handle:       handle || null,
          departments:  departments.length > 0 ? departments : null,
          primary_role: selectedRoleName || null,
          phone:            phone.trim() || null,
          whatsapp:         whatsapp.trim() || null,
          contact_email:    contactEmail.trim() || null,
          location_country: locationCountry.trim() || null,
          location_city:    locationCity.trim() || null,
          show_phone:    showPhone,
          show_whatsapp: showWhatsapp,
          show_email:    showEmail,
          show_location: showLocation,
          dob:                   dob || null,
          home_country:          homeCountry.trim() || null,
          show_dob:              showDob,
          show_home_country:     showHomeCountry,
          show_nationality_flag: showNationalityFlag,
          profile_view_mode: profileViewMode === 'rich_portfolio' && !isPro ? 'portfolio' : profileViewMode,
        })
        .eq('id', user.id)

      if (error) { toast(error.message, 'error'); return }

      // Social links go through the validated API route (Zod: url(), max 7)
      const socialRes = await fetch('/api/profile/social-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: socialLinks }),
      })
      if (!socialRes.ok) {
        const body = await socialRes.json().catch(() => ({}))
        toast((body as { error?: string }).error ?? 'Failed to save social links.', 'error')
        return
      }

      toast('Profile updated.', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  const handleHintColor: Record<typeof handleStatus, string> = {
    idle: '', checking: 'text-[var(--color-text-secondary)]',
    available: 'text-green-600', taken: 'text-[var(--color-error)]', invalid: 'text-[var(--color-error)]',
  }
  const handleHintText: Record<typeof handleStatus, string> = {
    idle: '', checking: 'Checking...', available: 'Available',
    taken: 'Taken — choose another', invalid: '3–30 chars: a-z, 0-9, hyphens',
  }

  return (
    <PageTransition className="flex flex-col gap-5 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-teal-50)]">
      <PageHeader backHref="/app/profile" title="Edit Profile" />

      {/* ── Identity ─────────────────────────────── */}
      <SectionHeader
        icon={<User size={16} className="text-[var(--color-interactive)]" />}
        title="Identity"
        subtitle="Shown on your profile, CV, and public page"
      />
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-4">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="Preferred name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} hint="What crew call you. Defaults to your full name." />

        <div>
          <Input label="Profile handle" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
          {handleStatus !== 'idle' && (
            <p className={`text-xs mt-1 font-medium ${handleHintColor[handleStatus]}`}>
              {handleHintText[handleStatus]}
            </p>
          )}
          {handle && handleStatus !== 'invalid' && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              yachtie.link/u/{handle}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Department(s)</p>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => toggleDepartment(dept)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  departments.includes(dept)
                    ? 'bg-[var(--color-interactive)] text-white shadow-sm'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-interactive)]/10'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {departments.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Primary role</p>
            {!useCustomRole ? (
              <>
                <Select value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)}>
                  <option value="">Select role</option>
                  {filteredRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
                <button onClick={() => { setUseCustomRole(true); setPrimaryRole('') }} className="text-xs text-[var(--color-interactive)] hover:underline text-left">
                  Not listed? Enter a custom role
                </button>
              </>
            ) : (
              <>
                <Input label="" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Enter your role" />
                <button onClick={() => { setUseCustomRole(false); setCustomRole('') }} className="text-xs text-[var(--color-interactive)] hover:underline text-left">
                  Choose from list instead
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Contact ──────────────────────────────── */}
      <SectionHeader
        icon={<Phone size={16} className="text-[var(--color-interactive)]" />}
        title="Contact Details"
        subtitle="Toggles control your public profile. CV always includes contact info."
      />
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" />
          <ToggleRow label="Show on profile" checked={showPhone} onChange={setShowPhone} />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-1">
          <Input label="WhatsApp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+44 7700 900000" />
          <ToggleRow label="Show on profile" checked={showWhatsapp} onChange={setShowWhatsapp} />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-1">
          <Input label="Contact email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" hint="Shown on your profile and CV. Your login email is in Account settings." />
          <ToggleRow label="Show on profile" checked={showEmail} onChange={setShowEmail} />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <SearchableSelect label="Country" value={locationCountry} onChange={setLocationCountry} options={ALL_COUNTRIES.map((c) => ({ value: c, label: c }))} pinnedOptions={PINNED_COUNTRIES.map((c) => ({ value: c, label: c }))} placeholder="Search countries..." clearable clearLabel="No country" className="flex-1" />
            <Input label="City" type="text" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="City" className="flex-1" />
          </div>
          <ToggleRow label="Show on profile" checked={showLocation} onChange={setShowLocation} />
        </div>
      </div>

      {/* ── Social Links ─────────────────────────── */}
      <SectionHeader
        icon={<Link2 size={16} className="text-[var(--color-interactive)]" />}
        title="Social & Links"
        subtitle="Show your social profiles on your public page"
      />
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
        {/* Existing links */}
        {socialLinks.length > 0 && (
          <div className="flex flex-col gap-2">
            {socialLinks.map((link) => {
              const cfg = SOCIAL_PLATFORM_CONFIG[link.platform]
              if (!cfg) return null
              return (
                <div key={link.platform} className="flex items-center gap-2 min-h-[44px]">
                  <span className="text-[var(--color-text-secondary)] shrink-0">{cfg.icon}</span>
                  <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{link.url}</span>
                  <button
                    type="button"
                    onClick={() => setSocialLinks(socialLinks.filter(l => l.platform !== link.platform))}
                    aria-label={`Remove ${cfg.label}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-error)] transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add more prompt — shown when there are still platforms to add */}
        {socialLinks.length < ALL_PLATFORMS.length && (
          <div className="flex flex-col gap-2">
            {socialLinks.length === 0 && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Add your profiles so crew can connect with you.
              </p>
            )}

            {/* Platform suggestion chips */}
            {addingPlatform === null && (
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORMS
                  .filter(p => !socialLinks.some(l => l.platform === p))
                  .slice(0, 5)
                  .map((p) => {
                    const cfg = SOCIAL_PLATFORM_CONFIG[p]
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setAddingPlatform(p); setAddingUrl('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[var(--color-interactive)]/40 text-xs font-medium text-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5 transition-colors min-h-[36px]"
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                        <Plus size={10} />
                      </button>
                    )
                  })}
              </div>
            )}

            {/* Inline URL entry for the chosen platform */}
            {addingPlatform !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-secondary)] shrink-0">
                  {SOCIAL_PLATFORM_CONFIG[addingPlatform].icon}
                </span>
                <input
                  value={addingUrl}
                  onChange={(e) => setAddingUrl(e.target.value)}
                  placeholder={SOCIAL_PLATFORM_CONFIG[addingPlatform].placeholder}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = addingUrl.trim()
                      if (url) {
                        setSocialLinks([...socialLinks, { platform: addingPlatform, url: url.startsWith('http') ? url : `https://${url}` }])
                      }
                      setAddingPlatform(null)
                      setAddingUrl('')
                    }
                    if (e.key === 'Escape') {
                      setAddingPlatform(null)
                      setAddingUrl('')
                    }
                  }}
                  className="flex-1 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = addingUrl.trim()
                    if (url) {
                      setSocialLinks([...socialLinks, { platform: addingPlatform, url: url.startsWith('http') ? url : `https://${url}` }])
                    }
                    setAddingPlatform(null)
                    setAddingUrl('')
                  }}
                  className="text-sm text-[var(--color-interactive)] font-medium px-2 min-h-[44px]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingPlatform(null); setAddingUrl('') }}
                  className="text-sm text-[var(--color-text-tertiary)] px-1 min-h-[44px]"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Personal ─────────────────────────────── */}
      <SectionHeader
        icon={<Calendar size={16} className="text-[var(--color-interactive)]" />}
        title="Personal Details"
        subtitle="Shown on your profile and CV"
      />
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <DatePicker label="Date of Birth" value={dob || null} onChange={(v) => setDob(v ?? '')} includeDay maxYear={new Date().getFullYear() - 16} minYear={1940} />
          <ToggleRow label="Show age on profile" sublabel="Calculated from date of birth" checked={showDob} onChange={setShowDob} />
        </div>

        <hr className="border-[var(--color-border)]" />

        <div className="flex flex-col gap-1">
          <SearchableSelect label="Home Country" value={homeCountry} onChange={setHomeCountry} options={ALL_COUNTRIES.map((c) => ({ value: c, label: c }))} pinnedOptions={PINNED_COUNTRIES.map((c) => ({ value: c, label: c }))} placeholder="Search countries..." clearable clearLabel="No country" />
          <ToggleRow label="Show home country on profile" checked={showHomeCountry} onChange={setShowHomeCountry} />
          <ToggleRow
            label="Show nationality flag on profile"
            sublabel={homeCountry ? 'Displays your country flag next to your name (replaces home country flag)' : 'Set a home country above to enable'}
            checked={showNationalityFlag}
            onChange={setShowNationalityFlag}
          />
        </div>
      </div>

      {/* ── Layout ───────────────────────────────── */}
      <SectionHeader
        icon={<LayoutGrid size={16} className="text-[var(--color-interactive)]" />}
        title="Profile Layout"
        subtitle="How visitors see your public profile"
      />
      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <div className="flex gap-2">
          {([
            { id: 'profile', label: 'Profile', desc: 'Clean, editorial', enabled: true },
            { id: 'portfolio', label: 'Portfolio', desc: 'Card-based sections', enabled: true },
            { id: 'rich_portfolio', label: 'Rich Portfolio', desc: 'Bento grid layout', enabled: isPro },
          ] as const).map((mode) => (
            <button
              key={mode.id}
              disabled={!mode.enabled}
              onClick={() => setProfileViewMode(mode.id)}
              className={`flex-1 rounded-xl border p-2.5 text-center transition-all flex flex-col items-center gap-1.5 ${
                profileViewMode === mode.id
                  ? 'border-[var(--color-interactive)] border-2 bg-[var(--color-interactive)]/5 shadow-sm'
                  : !mode.enabled
                  ? 'border-[var(--color-border)] opacity-40 cursor-not-allowed'
                  : 'border-[var(--color-border)] hover:border-[var(--color-interactive)]/40 hover:bg-[var(--color-surface-raised)] cursor-pointer'
              }`}
            >
              {/* Layout wireframe thumbnail */}
              {mode.id === 'profile' && (
                <svg viewBox="0 0 48 36" className="w-full max-w-[48px] h-auto" aria-hidden="true">
                  <rect x="4" y="4" width="40" height="6" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="13" width="40" height="3" rx="1" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="18" width="30" height="3" rx="1" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="24" width="40" height="3" rx="1" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="30" width="24" height="3" rx="1" fill="currentColor" className="text-[var(--color-border)]" />
                </svg>
              )}
              {mode.id === 'portfolio' && (
                <svg viewBox="0 0 48 36" className="w-full max-w-[48px] h-auto" aria-hidden="true">
                  <rect x="4" y="4" width="40" height="5" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="12" width="19" height="11" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="25" y="12" width="19" height="11" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="26" width="19" height="7" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="25" y="26" width="19" height="7" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                </svg>
              )}
              {mode.id === 'rich_portfolio' && (
                <svg viewBox="0 0 48 36" className="w-full max-w-[48px] h-auto" aria-hidden="true">
                  <rect x="4" y="4" width="24" height="14" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="30" y="4" width="14" height="6" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="30" y="12" width="14" height="6" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="4" y="21" width="9" height="12" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="15" y="21" width="19" height="12" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                  <rect x="36" y="21" width="8" height="12" rx="2" fill="currentColor" className="text-[var(--color-border)]" />
                </svg>
              )}
              <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">{mode.label}</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">{mode.desc}</p>
              {!mode.enabled && <p className="text-[10px] font-medium text-[var(--color-interactive)]">Pro</p>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Save ─────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => router.back()} className="flex-1">Cancel</Button>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={handleStatus === 'taken' || handleStatus === 'invalid' || handleStatus === 'checking'}
          className="flex-1"
        >
          Save
        </Button>
      </div>
    </PageTransition>
  )
}
