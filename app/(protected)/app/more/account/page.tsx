'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select } from '@/components/ui'
import { BackButton } from '@/components/ui/BackButton'
import { useToast } from '@/components/ui/Toast'
import { RESERVED_HANDLES } from '@/lib/constants/reserved-handles'

const DEPARTMENTS = [
  'Deck', 'Interior', 'Engineering', 'Galley',
  'Medical', 'Admin/Purser', 'Land-based',
]

interface Role {
  id: string
  name: string
  department: string
}

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

export default function AccountPage() {
  const router    = useRouter()
  const { toast } = useToast()
  const supabase  = createClient()

  const [loaded, setLoaded]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [userId, setUserId]         = useState('')
  const [fullName, setFullName]     = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle]         = useState('')
  const [originalHandle, setOriginalHandle] = useState('')
  const [handleStatus, setHandleStatus]     = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [departments, setDepartments] = useState<string[]>([])
  const [primaryRole, setPrimaryRole] = useState('')
  const [roles, setRoles]           = useState<Role[]>([])
  const [customRole, setCustomRole] = useState('')
  const [useCustomRole, setUseCustomRole] = useState(false)

  // Load user data + roles
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: profile }, { data: roleData }] = await Promise.all([
        supabase
          .from('users')
          .select('full_name, display_name, handle, departments, primary_role')
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
          if (found) {
            setPrimaryRole(found.id)
          } else {
            setUseCustomRole(true)
            setCustomRole(profile.primary_role)
          }
        }
      }
      if (roleData) setRoles(roleData)
      setLoaded(true)
    }
    load()
  }, [supabase])

  // Handle availability check (debounced)
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
    // Reset role if it doesn't belong to any remaining department
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
      const { error } = await supabase
        .from('users')
        .update({
          full_name:    fullName.trim(),
          display_name: displayName.trim() || null,
          handle:       handle || null,
          departments:  departments.length > 0 ? departments : null,
          primary_role: selectedRoleName || null,
        })
        .eq('id', userId)

      if (error) { toast(error.message, 'error'); return }
      toast('Account updated.', 'success')
      router.push('/app/more')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-[var(--color-surface-raised)] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const handleHint: Record<typeof handleStatus, string> = {
    idle:      '',
    checking:  'Checking…',
    available: '✓ Available',
    taken:     'Taken — choose another',
    invalid:   '3–30 chars, a-z 0-9 hyphens, no leading/trailing hyphen',
  }
  const handleHintColor: Record<typeof handleStatus, string> = {
    idle:      '',
    checking:  'text-[var(--color-text-secondary)]',
    available: 'text-green-500',
    taken:     'text-[var(--color-error)]',
    invalid:   'text-[var(--color-error)]',
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center gap-3">
        <BackButton href="/app/more" />
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Account</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Edit your name, handle, and role.
          </p>
        </div>
      </div>

      {/* ── Identity ────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          hint="How your name appears publicly. Defaults to full name."
        />
        <div>
          <Input
            label="Profile handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            hint={handleHint[handleStatus]}
          />
          {handleStatus !== 'idle' && (
            <p className={`text-xs mt-1 ${handleHintColor[handleStatus]}`}>
              {handleHint[handleStatus]}
            </p>
          )}
          {handle && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              yachtie.link/u/{handle}
            </p>
          )}
        </div>
      </div>

      {/* ── Departments ─────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5">
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Department(s)</p>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => toggleDepartment(dept)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                departments.includes(dept)
                  ? 'bg-[var(--color-interactive)] text-white'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)]/10'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* ── Role ────────────────────────────────────── */}
      {departments.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Primary role</p>

          {!useCustomRole ? (
            <>
              <Select
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
              >
                <option value="">Select role</option>
                {filteredRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
              <button
                onClick={() => { setUseCustomRole(true); setPrimaryRole('') }}
                className="text-xs text-[var(--color-interactive)] hover:underline text-left"
              >
                Not listed? Enter custom role
              </button>
            </>
          ) : (
            <>
              <Input
                label=""
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter your role"
              />
              <button
                onClick={() => { setUseCustomRole(false); setCustomRole('') }}
                className="text-xs text-[var(--color-interactive)] hover:underline text-left"
              >
                Choose from list instead
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Save ────────────────────────────────────── */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={handleStatus === 'taken' || handleStatus === 'invalid' || handleStatus === 'checking'}
          className="flex-1"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
