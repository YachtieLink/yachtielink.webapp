'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { FLAG_STATES, sizeFromLength } from '@/lib/storage/yacht'
import type { YachtSearchResult } from '@/lib/cv/types'

// ── Public types ──────────────────────────────────────────────

export interface YachtOption {
  id: string
  name: string
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
  builder?: string | null
  cover_photo_url?: string | null
  crew_count?: number
  current_crew_count?: number
  is_established?: boolean
}

interface Props {
  userId: string
  onSelect: (yacht: YachtOption) => void
  /** Pre-fill search query on mount */
  initialQuery?: string
  /** Pre-fill builder on create form */
  initialBuilder?: string
  /** Pre-fill length on create form */
  initialLength?: number
  /** Pre-fill yacht type on create form */
  initialType?: 'Motor Yacht' | 'Sailing Yacht'
  /** Pre-fill flag state on create form */
  initialFlag?: string
  /** Start in 'create' mode instead of 'search' */
  initialMode?: 'search' | 'create'
}

// ── Modal wrapper ─────────────────────────────────────────────

export interface YachtPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (yacht: YachtOption) => void
  userId: string
  initialQuery?: string
  initialBuilder?: string
  initialLength?: number
  initialType?: 'Motor Yacht' | 'Sailing Yacht'
  initialFlag?: string
  /** Start in 'create' mode instead of 'search' */
  initialMode?: 'search' | 'create'
}

export function YachtPickerModal({
  isOpen,
  onClose,
  onSelect,
  userId,
  initialQuery,
  initialBuilder,
  initialLength,
  initialType,
  initialFlag,
  initialMode,
}: YachtPickerModalProps) {
  function handleSelect(yacht: YachtOption) {
    onSelect(yacht)
    onClose()
  }

  return (
    <BottomSheet open={isOpen} onClose={onClose} title={initialMode === 'create' ? 'Add new yacht' : 'Find your yacht'}>
      <YachtPicker
        userId={userId}
        onSelect={handleSelect}
        initialQuery={initialQuery}
        initialBuilder={initialBuilder}
        initialLength={initialLength}
        initialType={initialType}
        initialFlag={initialFlag}
        initialMode={initialMode}
      />
    </BottomSheet>
  )
}

// ── Constants ─────────────────────────────────────────────────

type Mode = 'search' | 'create'

const DUPE_THRESHOLD = 0.45

// ── Main picker ───────────────────────────────────────────────

export function YachtPicker({ userId, onSelect, initialQuery, initialBuilder, initialLength, initialType, initialFlag, initialMode }: Props) {
  const supabase = createClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── search state ──────────────────────────────────────
  const [mode, setMode] = useState<Mode>(initialMode ?? 'search')
  const [query, setQuery] = useState(initialQuery ?? '')
  const [results, setResults] = useState<YachtOption[]>([])
  const [searching, setSearching] = useState(false)
  // Run initial search if a query was provided
  const hasRunInitialSearch = useRef(false)
  if (!hasRunInitialSearch.current && initialQuery) {
    hasRunInitialSearch.current = true
    // defer to avoid state-during-render
    setTimeout(() => searchYachts(initialQuery), 0)
  }

  // ── create form state ─────────────────────────────────
  const [newName, setNewName] = useState(initialQuery ?? '')
  const [newBuilder, setNewBuilder] = useState(initialBuilder ?? '')
  const [newType, setNewType] = useState<'Motor Yacht' | 'Sailing Yacht'>(initialType ?? 'Motor Yacht')
  const [newLength, setNewLength] = useState(initialLength ? String(initialLength) : '')
  const [newFlag, setNewFlag] = useState(initialFlag ?? '')
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
    // New RPC returns builder, cover_photo_url, crew_count, current_crew_count directly
    const { data } = await supabase.rpc('search_yachts', { p_query: q, p_limit: 8 })
    const raw = (data as (YachtSearchResult & { is_established?: boolean })[]) ?? []

    // Fetch is_established separately (not part of the search_yachts RPC)
    if (raw.length > 0) {
      const ids = raw.map(r => r.id)
      const { data: yachtDetails } = await supabase
        .from('yachts')
        .select('id, is_established')
        .in('id', ids)

      const detailMap = new Map(
        (yachtDetails ?? []).map((y: { id: string; is_established: boolean }) => [y.id, y])
      )

      const enriched: YachtOption[] = raw.map(r => ({
        id: r.id,
        name: r.name,
        yacht_type: r.yacht_type,
        length_meters: r.length_meters,
        flag_state: r.flag_state,
        builder: r.builder,
        cover_photo_url: r.cover_photo_url,
        crew_count: r.crew_count,
        current_crew_count: r.current_crew_count,
        is_established: detailMap.get(r.id)?.is_established ?? false,
      }))
      setResults(enriched)
    } else {
      setResults([])
    }
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
      const { data } = await supabase.rpc('search_yachts', {
        p_query: newName.trim(),
        p_limit: 3,
      })
      const candidates = ((data as (YachtSearchResult)[]) ?? [])
        .filter((r) => r.sim >= DUPE_THRESHOLD)
        .map((r): YachtOption => ({
          id: r.id, name: r.name, yacht_type: r.yacht_type, length_meters: r.length_meters,
          flag_state: r.flag_state, builder: r.builder, cover_photo_url: r.cover_photo_url,
          crew_count: r.crew_count, current_crew_count: r.current_crew_count,
        }))

      if (candidates.length > 0) {
        setDupeCandidates(candidates)
        setDupeSheetOpen(true)
        return
      }
    }

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
        ...(newBuilder.trim() ? { builder: newBuilder.trim() } : {}),
        created_by: userId,
      })
      .select('id, name, yacht_type, length_meters, flag_state, builder')
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
    const parts = [
      y.builder,
      y.yacht_type,
      y.length_meters ? `${y.length_meters}m` : null,
      y.flag_state,
      y.current_crew_count != null && y.current_crew_count > 0
        ? `${y.current_crew_count} on board now`
        : y.crew_count != null && y.crew_count > 0
        ? `${y.crew_count} crew`
        : null,
    ]
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
          {results.map((r) => {
            const meta = yachtMeta(r)
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full text-left rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] active:scale-[0.99] transition-all overflow-hidden"
              >
                <div className="flex items-stretch gap-0">
                  {/* Thumbnail */}
                  {r.cover_photo_url && (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={r.cover_photo_url}
                        alt={r.name}
                        fill
                        className="object-cover object-center"
                        sizes="64px"
                      />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                        {r.name}
                      </p>
                      {r.is_established && (
                        <span className="flex-shrink-0 text-[10px] bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-1.5 py-0.5 rounded-full font-medium">
                          Established
                        </span>
                      )}
                    </div>
                    {meta && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                        {meta}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
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
              Builder
            </label>
            <Input
              placeholder="e.g. Lurssen, Feadship"
              value={newBuilder}
              onChange={(e) => setNewBuilder(e.target.value)}
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
              className="w-full text-left rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] active:scale-[0.99] transition-all overflow-hidden"
            >
              <div className="flex items-stretch gap-0">
                {c.cover_photo_url && (
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <Image
                      src={c.cover_photo_url}
                      alt={c.name}
                      fill
                      className="object-cover object-center"
                      sizes="56px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                      {c.name}
                    </p>
                    {c.is_established && (
                      <span className="flex-shrink-0 text-[10px] bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-1.5 py-0.5 rounded-full font-medium">
                        Established
                      </span>
                    )}
                  </div>
                  {yachtMeta(c) && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                      {yachtMeta(c)}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-interactive)] mt-1 font-medium">
                    Use this yacht →
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <Button
          onClick={handleDupeCreateNew}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          No, &ldquo;{newName}&rdquo; is a different vessel — create new
        </Button>
      </BottomSheet>
    </>
  )
}
