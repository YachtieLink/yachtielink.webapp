'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { YachtPicker, type YachtOption } from '@/components/yacht/YachtPicker'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { BackButton } from '@/components/ui/BackButton'

type Step = 'yacht' | 'role' | 'dates'

interface RoleRow {
  id: string
  name: string
  department: string
}

export default function AttachmentNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [userId, setUserId] = useState('')
  const [step, setStep] = useState<Step>('yacht')

  // yacht
  const [yacht, setYacht] = useState<YachtOption | null>(null)

  // role
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [roleQuery, setRoleQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  // dates
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
    supabase
      .from('roles')
      .select('id, name, department')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setRoles(data)
          const depts = Array.from(new Set(data.map((r: RoleRow) => r.department)))
          setDepartments(depts)
        }
      })
  }, [])

  // ── role filtering ──────────────────────────────────────────────
  const filteredRoles = roles.filter((r) => {
    const matchDept = !selectedDept || r.department === selectedDept
    const matchQuery = !roleQuery || r.name.toLowerCase().includes(roleQuery.toLowerCase())
    return matchDept && matchQuery
  })

  const roleLabel = useCustom ? customRole : selectedRole

  // ── submit ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!yacht || !roleLabel || !startDate) return
    setSaving(true)

    const { error } = await supabase.from('attachments').insert({
      user_id: userId,
      yacht_id: yacht.id,
      role_label: roleLabel,
      started_at: startDate,
      ended_at: isCurrent ? null : endDate || null,
    })

    setSaving(false)
    if (error) {
      toast('Failed to save attachment. Please try again.', 'error')
      return
    }
    toast('Yacht added to your profile.', 'success')
    router.push('/app/profile')
  }

  // ── step: yacht ─────────────────────────────────────────────────
  if (step === 'yacht') {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
        <div className="mb-6">
          <BackButton href="/app/profile" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Add a yacht</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Find the vessel in our database or add it if it&apos;s not there yet.
        </p>
        {userId && (
          <YachtPicker
            userId={userId}
            onSelect={(y) => {
              setYacht(y)
              setStep('role')
            }}
          />
        )}
      </div>
    )
  }

  // ── step: role ──────────────────────────────────────────────────
  if (step === 'role') {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
        <div className="mb-6">
          <button
            onClick={() => setStep('yacht')}
            className="text-sm text-[var(--color-interactive)] hover:underline"
          >
            ← {yacht?.name}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Your role</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          What was your role on {yacht?.name}?
        </p>

        {/* Department filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedDept('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedDept
                ? 'bg-[var(--color-interactive)] text-white'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
            }`}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedDept === d
                  ? 'bg-[var(--color-interactive)] text-white'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Role search */}
        <Input
          placeholder="Search roles…"
          value={roleQuery}
          onChange={(e) => { setRoleQuery(e.target.value); setUseCustom(false) }}
          className="mb-3"
        />

        {/* Role list */}
        <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] overflow-hidden mb-3">
          {filteredRoles.slice(0, 12).map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedRole(r.name); setUseCustom(false) }}
              className={`flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                selectedRole === r.name && !useCustom
                  ? 'bg-[var(--color-interactive)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              <span>{r.name}</span>
              <span className={`text-xs ${selectedRole === r.name && !useCustom ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                {r.department}
              </span>
            </button>
          ))}
        </div>

        {/* Custom role fallback */}
        {roleQuery && filteredRoles.length === 0 && (
          <button
            onClick={() => { setCustomRole(roleQuery); setUseCustom(true) }}
            className={`w-full px-4 py-3 rounded-2xl border text-sm text-left transition-colors ${
              useCustom
                ? 'border-[var(--color-interactive)] bg-[var(--color-interactive)]/10 text-[var(--color-interactive)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
            }`}
          >
            Use &ldquo;{roleQuery}&rdquo; as my role
          </button>
        )}

        <Button
          onClick={() => setStep('dates')}
          disabled={!roleLabel.trim()}
          className="w-full mt-4"
          size="lg"
        >
          Continue
        </Button>
      </div>
    )
  }

  // ── step: dates ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <div className="mb-6">
        <button
          onClick={() => setStep('role')}
          className="text-sm text-[var(--color-interactive)] hover:underline"
        >
          ← {roleLabel}
        </button>
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Dates</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        When did you work on {yacht?.name}?
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Start date *
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              End date
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="rounded"
              />
              Currently working here
            </label>
          </div>
          {!isCurrent && (
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={!startDate || saving || (!isCurrent && !endDate && false)}
          className="w-full mt-2"
          size="lg"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
