'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FLAG_STATES, sizeFromLength } from '@/lib/storage/yacht'

export interface YachtOption {
  id: string
  name: string
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
}

interface Props {
  userId: string
  onSelect: (yacht: YachtOption) => void
}

type Mode = 'search' | 'create'

const DUPE_THRESHOLD = 0.45

export function YachtPicker({ userId, onSelect }: Props) {
  const supabase = createClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── search state ──────────────────────────────────────
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YachtOption[]>([])
  const [searching, setSearching] = useState(false)

  // ── create form state ─────────────────────────────────
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'Motor Yacht' | 'Sailing Yacht'>('Motor Yacht')
  const [newLength, setNewLength] = useState('')
  const [newFlag, setNewFlag] = useState('')
  const [newYear, setNewYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  // ── duplicate detection state ─────────────────────────
  const [dupeCandidates, setDupeCandidates] = useState<YachtOption[]>([])
  const [dupeSheetOpen, setDupeSheetOpen] = useState(false)

  // ── search ────────────────────────────────────────────
  async function searchYachts(q: string) {
    if (!q.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    const { data } = await supabase.rpc('search_yachts', { p_query: q, p_limit: 8 })
    setResults((data as YachtOption[]) ?? [])
    setSearching(false)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchYachts(value), 300)
  }

  // ── create with duplicate detection ──────────────────
  async function handleCreate(skipDupeCheck = false) {
    if (!newName.trim()) return
    setCreateError('')

    if (!skipDupeCheck) {
      // Run fuzzy search against the name the user typed
      const { data } = await supabase.rpc('search_yachts', {
        p_query: newName.trim(),
        p_limit: 3,
      })
      const candidates = ((data as (YachtOption & { sim: number })[]) ?? [])
        .filter((r) => r.sim >= DUPE_THRESHOLD)

      if (candidates.length > 0) {
        setDupeCandidates(candidates)
        setDupeSheetOpen(true)
        return
      }
    }

    // Log the near-miss decision (create_new chosen, no candidates above threshold)
    // or proceed directly if skipDupeCheck
    await doCreate()
  }

  async function doCreate() {
    setSaving(true)
    const lengthVal = newLength ? parseFloat(newLength) : null
    const sizeCategory = lengthVal ? sizeFromLength(lengthVal) : 'medium'

    const { data: yacht, error } = await supabase
      .from('yachts')
      .insert({
        name: newName.trim(),
        yacht_type: newType,
        size_category: sizeCategory,
        ...(lengthVal ? { length_meters: lengthVal } : {}),
        ...(newFlag ? { flag_state: newFlag } : {}),
        ...(newYear ? { year_built: parseInt(newYear) } : {}),
        created_by: userId,
      })
      .select('id, name, yacht_type, length_meters, flag_state')
      .single()

    setSaving(false)
    if (error || !yacht) {
      setCreateError('Something went wrong. Please try again.')
      return
    }
    onSelect(yacht as YachtOption)
  }

  async function handleDupeUseExisting(candidate: YachtOption) {
    setDupeSheetOpen(false)
    // Log near-miss: used_existing
    await supabase.from('yacht_near_miss_log').insert({
      search_term: newName.trim(),
      candidate_ids: dupeCandidates.map((c) => c.id),
      action: 'used_existing',
      chosen_id: candidate.id,
      created_by: userId,
    })
    onSelect(candidate)
  }

  async function handleDupeCreateNew() {
    setDupeSheetOpen(false)
    // Log near-miss: created_new
    await supabase.from('yacht_near_miss_log').insert({
      search_term: newName.trim(),
      candidate_ids: dupeCandidates.map((c) => c.id),
      action: 'created_new',
      chosen_id: null,
      created_by: userId,
    })
    await doCreate()
  }

  // ── helpers ───────────────────────────────────────────
  function yachtMeta(y: YachtOption) {
    const parts = [y.yacht_type, y.length_meters ? `${y.length_meters}m` : null, y.flag_state]
    return parts.filter(Boolean).join(' · ')
  }

  return (
    <>
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        {(['search', 'create'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-[var(--color-interactive)] text-white'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
            }`}
          >
            {m === 'search' ? 'Find yacht' : 'Add new yacht'}
          </button>
        ))}
      </div>

      {mode === 'search' ? (
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search by name…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
          />
          {searching && (
            <p className="text-xs text-[var(--color-text-secondary)] px-1">Searching…</p>
          )}
          {!searching && results.length === 0 && query.trim() && (
            <p className="text-xs text-[var(--color-text-secondary)] px-1">
              No results — try a different spelling or{' '}
              <button
                className="text-[var(--color-interactive)] underline"
                onClick={() => { setMode('create'); setNewName(query) }}
              >
                add this yacht
              </button>
              .
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="w-full text-left px-4 py-3 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] transition-colors"
            >
              <p className="font-medium text-sm text-[var(--color-text-primary)]">{r.name}</p>
              {yachtMeta(r) && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{yachtMeta(r)}</p>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Yacht name *
            </label>
            <Input
              placeholder="e.g. Lady M"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Type *
            </label>
            <div className="flex gap-2">
              {(['Motor Yacht', 'Sailing Yacht'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    newType === t
                      ? 'bg-[var(--color-interactive)] text-white'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Length (metres)
              </label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={newLength}
                onChange={(e) => setNewLength(e.target.value)}
                min="1"
                max="500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Year built
              </label>
              <Input
                type="number"
                placeholder="e.g. 2018"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                min="1900"
                max={new Date().getFullYear() + 2}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Flag state
            </label>
            <select
              value={newFlag}
              onChange={(e) => setNewFlag(e.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            >
              <option value="">Select flag state…</option>
              {FLAG_STATES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {createError && (
            <p className="text-xs text-red-500">{createError}</p>
          )}

          <Button
            onClick={() => handleCreate(false)}
            disabled={!newName.trim() || saving}
            className="w-full"
            size="lg"
          >
            {saving ? 'Creating…' : 'Add Yacht & Continue'}
          </Button>
        </div>
      )}

      {/* Duplicate detection bottom sheet */}
      <BottomSheet
        open={dupeSheetOpen}
        onClose={() => setDupeSheetOpen(false)}
        title="Similar yacht found"
      >
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          We found {dupeCandidates.length === 1 ? 'a yacht' : 'yachts'} with a similar name. Is one
          of these the vessel you worked on?
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {dupeCandidates.map((c) => (
            <button
              key={c.id}
              onClick={() => handleDupeUseExisting(c)}
              className="w-full text-left px-4 py-3 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] transition-colors"
            >
              <p className="font-medium text-sm text-[var(--color-text-primary)]">{c.name}</p>
              {yachtMeta(c) && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{yachtMeta(c)}</p>
              )}
              <p className="text-xs text-[var(--color-interactive)] mt-1 font-medium">Use this yacht →</p>
            </button>
          ))}
        </div>
        <button
          onClick={handleDupeCreateNew}
          className="w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-2 transition-colors"
        >
          No, "{newName}" is a different vessel — create new
        </button>
      </BottomSheet>
    </>
  )
}
