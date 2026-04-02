'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select, DatePicker } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateDisplay } from '@/lib/cv/types'
import { calculateSeaTimeDays, detectOverlaps, type DateRange } from '@/lib/sea-time'
import { YachtMatchCard, type MatchState } from '@/components/yacht/YachtMatchCard'
import { YachtPickerModal } from '@/components/yacht/YachtPicker'
import type {
  ParsedYachtEmployment,
  ParsedLandEmployment,
  ConfirmedYacht,
  YachtSearchResult,
} from '@/lib/cv/types'

// ── Types ─────────────────────────────────────────────────────

/** Which state the match card is in for a given parsed yacht */
interface MatchInfo {
  state: MatchState
  topMatch: YachtSearchResult | null
  candidates: YachtSearchResult[]
  loading: boolean
}

/** Status of the whole card from the user's perspective */
type CardStatus = 'pending' | 'confirmed' | 'skipped'

interface YachtCardState {
  yacht: ParsedYachtEmployment
  match: MatchInfo
  /** State after user interaction — null means "use auto-selected" */
  override: {
    status: CardStatus
    confirmedYachtId: string | null
  }
  confirmed: ConfirmedYacht
}

interface StepExperienceProps {
  userId: string
  yachts: ParsedYachtEmployment[]
  landJobs: ParsedLandEmployment[]
  parseLoading: boolean
  onConfirm: (yachts: ConfirmedYacht[]) => void
  /** Pre-confirmed yachts from a previous pass (e.g. when returning from review) */
  initialConfirmed?: ConfirmedYacht[]
}

interface IndexedDateRange extends DateRange {
  cardIndex: number
}

const EMPLOYMENT_TYPES = [
  { value: '', label: 'Select...' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'relief', label: 'Relief' },
  { value: 'temporary', label: 'Temporary' },
]

const PROGRAM_TYPES = [
  { value: '', label: 'Select...' },
  { value: 'private', label: 'Private' },
  { value: 'charter', label: 'Charter' },
  { value: 'private_charter', label: 'Private/Charter' },
]

// Similarity thresholds
const AMBER_THRESHOLD = 0.45  // 0.3 was too low — "M/Y WTR" matched "M/Y Go" at 0.36 which is garbage

/**
 * Determine if a search result is a confident green match.
 * Name similarity alone is NOT enough — "Eclipse Star" vs "Eclipse Star 3" is 0.89 but a different yacht.
 * Green requires EITHER a perfect name match (sim ≥ 1.0 before boosts)
 * OR a strong name match (sim ≥ 0.8) confirmed by at least one secondary signal.
 */
function isGreenMatch(
  result: YachtSearchResult,
  parsedBuilder: string | null,
  parsedLength: number | null,
): boolean {
  // Perfect or near-perfect boosted sim (includes builder/length boosts) — very high confidence
  if (result.sim >= 1.15) return true

  // If sim is high but could be a partial name match (e.g. "Star" vs "Star 3"),
  // require at least one confirming signal
  if (result.sim >= 0.8) {
    // Builder matches
    if (parsedBuilder && result.builder &&
        parsedBuilder.toLowerCase().trim() === result.builder.toLowerCase().trim()) {
      return true
    }
    // Length is close (within 30% — generous because parser gets length wrong)
    if (parsedLength && result.length_meters) {
      const ratio = result.length_meters / parsedLength
      if (ratio >= 0.7 && ratio <= 1.3) return true
    }
    // Yacht has crew — social proof that it's a real, established yacht matching the name
    if (result.crew_count >= 2) return true
  }

  return false
}

// ── Edit overlay ──────────────────────────────────────────────

function EditOverlay({
  confirmed,
  yachtName,
  onUpdate,
  onClose,
}: {
  confirmed: ConfirmedYacht
  yachtName: string
  onUpdate: (c: ConfirmedYacht) => void
  onClose: () => void
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3 border border-[var(--color-border)]">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{yachtName}</p>
      <Input
        label="Role"
        value={confirmed.role}
        onChange={(e) => onUpdate({ ...confirmed, role: e.target.value })}
      />
      <DatePicker
        label="Start"
        value={confirmed.start_date ?? null}
        onChange={(v) => onUpdate({ ...confirmed, start_date: v })}
        includeDay
        optionalMonth
        minYear={1970}
        maxYear={new Date().getFullYear()}
      />
      <DatePicker
        label="End"
        value={confirmed.end_date ?? null}
        onChange={(v) => onUpdate({ ...confirmed, end_date: v })}
        includeDay
        optionalMonth
        minYear={1970}
        maxYear={new Date().getFullYear() + 1}
        alignRight
      />
      <Select
        label="Employment Type"
        value={confirmed.employment_type ?? ''}
        onChange={(e) => onUpdate({ ...confirmed, employment_type: e.target.value || null })}
      >
        {EMPLOYMENT_TYPES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Select
        label="Program"
        value={confirmed.yacht_program ?? ''}
        onChange={(e) => onUpdate({ ...confirmed, yacht_program: e.target.value || null })}
      >
        {PROGRAM_TYPES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Input
        label="Cruising Area"
        value={confirmed.cruising_area ?? ''}
        onChange={(e) => onUpdate({ ...confirmed, cruising_area: e.target.value || null })}
      />
      <div className="flex gap-2">
        <Button onClick={onClose} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  )
}

// ── Card wrapper (handles per-card edit / skip / picker) ──────

function YachtCardWrapper({
  cardState,
  userId,
  onMatchStateChange,
  onConfirmedUpdate,
  onStatusChange,
}: {
  cardState: YachtCardState
  userId: string
  onMatchStateChange: (state: MatchState, yachtId: string | null, pickedYacht?: YachtSearchResult) => void
  onConfirmedUpdate: (c: ConfirmedYacht) => void
  onStatusChange: (status: CardStatus) => void
}) {
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<'search' | 'create'>('search')
  const { yacht, match, override, confirmed } = cardState
  const isSkipped = override.status === 'skipped'

  // Show edit overlay
  if (editing) {
    return (
      <EditOverlay
        confirmed={confirmed}
        yachtName={yacht.yacht_name}
        onUpdate={onConfirmedUpdate}
        onClose={() => setEditing(false)}
      />
    )
  }

  // Skipped state — compact strip
  if (isSkipped) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-3 border border-[var(--color-border)] opacity-50 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] line-through">
            {yacht.yacht_name}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Skipped</p>
        </div>
        <button
          type="button"
          onClick={() => onStatusChange('pending')}
          className="text-xs text-[var(--color-interactive)] font-medium"
        >
          Undo
        </button>
      </div>
    )
  }

  // Loading skeleton while searching
  if (match.loading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Match card */}
        <YachtMatchCard
          matchState={match.state}
          similarity={match.topMatch?.sim ?? 0}
          yacht={match.topMatch}
          candidates={match.candidates}
          parsedName={yacht.yacht_name}
          parsedBuilder={yacht.builder}
          parsedLength={yacht.length_meters}
          parsedYachtType={confirmed.yacht_type}
          role={confirmed.role}
          startDate={confirmed.start_date}
          endDate={confirmed.end_date}
          cruisingArea={confirmed.cruising_area}
          onSelect={(yachtId) => {
            const picked = match.candidates.find((c) => c.id === yachtId) ?? match.topMatch
            onMatchStateChange('green', yachtId, picked ?? undefined)
            onStatusChange('confirmed')
            onConfirmedUpdate({
              ...confirmed,
              matched_yacht_id: yachtId,
              ...(picked ? {
                yacht_name: picked.name,
                yacht_type: picked.yacht_type ?? confirmed.yacht_type,
                length_meters: picked.length_meters ?? confirmed.length_meters,
                flag_state: picked.flag_state ?? confirmed.flag_state,
                builder: picked.builder ?? confirmed.builder,
              } : {}),
            })
          }}
          onReject={() => {
            // Open picker directly — don't dump user into blue state
            setPickerMode('search')
            setPickerOpen(true)
          }}
          onCreateNew={() => {
            // Open picker in create mode so user can edit parsed details before saving
            setPickerMode('create')
            setPickerOpen(true)
          }}
          onOpenPicker={() => { setPickerMode('search'); setPickerOpen(true) }}
          onUpdateSpecs={(name, builder, length, yachtType) => {
            onConfirmedUpdate({
              ...confirmed,
              yacht_name: name,
              builder,
              length_meters: length,
              yacht_type: yachtType,
            })
          }}
          onUpdateEmployment={(role, startDate, endDate) => {
            onConfirmedUpdate({
              ...confirmed,
              role,
              start_date: startDate,
              end_date: endDate,
            })
          }}
        />

      </div>

      {/* Manual picker sheet */}
      <YachtPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(picked) => {
          const asSearchResult: YachtSearchResult = {
            id: picked.id,
            name: picked.name,
            yacht_type: picked.yacht_type,
            length_meters: picked.length_meters,
            flag_state: picked.flag_state,
            builder: picked.builder ?? null,
            cover_photo_url: picked.cover_photo_url ?? null,
            crew_count: picked.crew_count ?? 0,
            current_crew_count: picked.current_crew_count ?? 0,
            sim: 1,
          }
          // Single atomic update — match state + confirmed data + status all at once
          onMatchStateChange('green', picked.id, asSearchResult)
          onConfirmedUpdate({
            ...confirmed,
            yacht_name: picked.name,
            yacht_type: picked.yacht_type ?? confirmed.yacht_type,
            length_meters: picked.length_meters ?? confirmed.length_meters,
            flag_state: picked.flag_state ?? confirmed.flag_state,
            builder: picked.builder ?? confirmed.builder,
            matched_yacht_id: picked.id,
          })
        }}
        userId={userId}
        initialQuery={yacht.yacht_name}
        initialBuilder={yacht.builder ?? undefined}
        initialLength={yacht.length_meters ?? undefined}
        initialType={(yacht.yacht_type === 'Motor Yacht' || yacht.yacht_type === 'Sailing Yacht') ? yacht.yacht_type : undefined}
        initialFlag={yacht.flag_state ?? undefined}
        initialMode={pickerMode}
      />
    </>
  )
}

// ── Step ──────────────────────────────────────────────────────

export function StepExperience({
  userId,
  yachts,
  landJobs,
  parseLoading,
  onConfirm,
  initialConfirmed,
}: StepExperienceProps) {
  const supabase = createClient()
  const searchFiredRef = useRef(false)

  // ── State ────────────────────────────────────────────────
  const [addPickerOpen, setAddPickerOpen] = useState(false)

  // ── Initial card state ─────────────────────────────────
  const [cards, setCards] = useState<YachtCardState[]>(() => {
    if (initialConfirmed && initialConfirmed.length > 0) {
      return initialConfirmed.map((c) => ({
        yacht: {
          ...c,
          crew_count: null,
          guest_count: null,
          former_names: null,
        } as ParsedYachtEmployment,
        match: { state: 'blue' as MatchState, topMatch: null, candidates: [], loading: false },
        override: { status: 'confirmed' as CardStatus, confirmedYachtId: c.matched_yacht_id ?? null },
        confirmed: c,
      }))
    }
    return yachts.map((y) => ({
      yacht: y,
      match: { state: 'blue' as MatchState, topMatch: null, candidates: [], loading: !!y.yacht_name },
      override: { status: 'pending' as CardStatus, confirmedYachtId: null },
      confirmed: buildConfirmedFromParsed(y),
    }))
  })

  // Re-sync if parse finishes and yachts arrive after initial render
  const [lastYachts, setLastYachts] = useState(yachts)
  if (yachts !== lastYachts && yachts.length > 0 && cards.length === 0) {
    setLastYachts(yachts)
    searchFiredRef.current = false
    setCards(
      yachts.map((y) => ({
        yacht: y,
        match: { state: 'blue' as MatchState, topMatch: null, candidates: [], loading: !!y.yacht_name },
        override: { status: 'pending' as CardStatus, confirmedYachtId: null },
        confirmed: buildConfirmedFromParsed(y),
      }))
    )
  }

  // ── Fire searches once yachts arrive ──────────────────
  useEffect(() => {
    if (searchFiredRef.current) return
    if (cards.length === 0) return
    // Don't search if we're working from initialConfirmed (already done)
    if (initialConfirmed && initialConfirmed.length > 0) return

    searchFiredRef.current = true
    runMatchSearches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length])

  async function runMatchSearches() {
    // Run all searches in parallel
    const searchPromises = cards.map((card, index) => {
      const y = card.yacht
      if (!y.yacht_name) {
        // Empty name → stay blue, no loading
        return Promise.resolve({ index, result: null })
      }
      return Promise.resolve(
        supabase.rpc('search_yachts', {
          p_query: y.yacht_name,
          p_builder: y.builder ?? undefined,
          p_length_min: y.length_meters ? y.length_meters * 0.9 : undefined,
          p_length_max: y.length_meters ? y.length_meters * 1.1 : undefined,
          p_limit: 5,
        })
      )
        .then(({ data }) => ({ index, result: (data as YachtSearchResult[]) ?? [] }))
        .catch(() => ({ index, result: null as YachtSearchResult[] | null }))
    })

    const results = await Promise.all(searchPromises)

    setCards((prev) => {
      const next = [...prev]
      for (const { index, result } of results) {
        const card = next[index]
        if (!card) continue

        if (!result || result.length === 0) {
          next[index] = {
            ...card,
            match: { state: 'blue', topMatch: null, candidates: [], loading: false },
          }
          continue
        }

        const best = result[0]
        let state: MatchState = 'blue'
        let topMatch: YachtSearchResult | null = null
        let candidates: YachtSearchResult[] = []

        if (isGreenMatch(best, card.yacht.builder, card.yacht.length_meters)) {
          state = 'green'
          topMatch = best
          candidates = result.slice(1)
        } else if (best.sim >= AMBER_THRESHOLD) {
          state = 'amber'
          topMatch = best
          candidates = result.slice(0, 3)
        } else {
          state = 'blue'
          topMatch = null
          candidates = []
        }

        // For green matches, auto-set matched_yacht_id in confirmed data
        const newConfirmed =
          state === 'green'
            ? {
                ...card.confirmed,
                matched_yacht_id: best.id,
                yacht_name: best.name,
                yacht_type: best.yacht_type ?? card.confirmed.yacht_type,
                builder: best.builder ?? card.confirmed.builder,
                length_meters: best.length_meters ?? card.confirmed.length_meters,
                flag_state: best.flag_state ?? card.confirmed.flag_state,
              }
            : card.confirmed

        next[index] = {
          ...card,
          match: { state, topMatch, candidates, loading: false },
          confirmed: newConfirmed,
          override: {
            ...card.override,
            // Green matches are auto-confirmed unless user rejects
            status: state === 'green' ? 'confirmed' : 'pending',
            confirmedYachtId: state === 'green' ? best.id : null,
          },
        }
      }
      return next
    })
  }

  // ── Duplicate-match warning ────────────────────────────
  // Detect when two cards resolved to the same DB yacht
  const matchedIds = cards
    .filter((c) => c.override.confirmedYachtId)
    .map((c) => c.override.confirmedYachtId as string)
  const duplicateYachtIds = new Set(
    matchedIds.filter((id, i) => matchedIds.indexOf(id) !== i)
  )

  // ── Card update helpers ────────────────────────────────
  // Atomic update — applies all changes in a single setCards call to prevent stale closures
  function updateCard(index: number, patch: {
    match?: Partial<MatchInfo>
    override?: Partial<YachtCardState['override']>
    confirmed?: ConfirmedYacht
  }) {
    setCards((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c
        const updated = { ...c }
        if (patch.match) updated.match = { ...c.match, ...patch.match } as MatchInfo
        if (patch.override) updated.override = { ...c.override, ...patch.override }
        if (patch.confirmed) updated.confirmed = patch.confirmed
        return updated
      })
    )
  }

  // Convenience wrappers for simple updates
  function updateMatchState(index: number, state: MatchState, yachtId: string | null, pickedYacht?: YachtSearchResult) {
    updateCard(index, {
      match: { state, topMatch: pickedYacht ?? null, candidates: [], loading: false },
      override: { confirmedYachtId: yachtId, status: 'confirmed' },
    })
  }

  function updateConfirmed(index: number, confirmed: ConfirmedYacht) {
    updateCard(index, { confirmed })
  }

  function updateStatus(index: number, status: CardStatus) {
    updateCard(index, { override: { status, confirmedYachtId: null } })
  }

  // ── Render ─────────────────────────────────────────────
  if (parseLoading) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Your Career</h2>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Hang tight — we&apos;re linking up your career history.
        </p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Your Career</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          We didn&apos;t find yacht experience on this CV — that&apos;s completely fine. You might be just
          starting out, or your experience is listed differently. You can add yachts anytime from your profile.
        </p>
        <Button onClick={() => onConfirm([])} className="w-full">
          Continue
        </Button>
      </div>
    )
  }

  const pendingOrConfirmed = cards.filter((c) => c.override.status !== 'skipped')
  const stillLoading = cards.some((c) => c.match.loading)

  // Compute summary stats
  const greenCount = cards.filter((c) => c.match.state === 'green' && c.override.status !== 'skipped').length
  const blueCount = cards.filter((c) => c.match.state === 'blue' && c.override.status !== 'skipped').length
  const amberCount = cards.filter((c) => c.match.state === 'amber' && c.override.status !== 'skipped').length
  const skippedCount = cards.filter((c) => c.override.status === 'skipped').length

  // Build confirm button label
  const confirmParts: string[] = []
  if (blueCount > 0) confirmParts.push(`Add ${blueCount} new`)
  if (greenCount > 0) confirmParts.push(`Confirm ${greenCount} match${greenCount === 1 ? '' : 'es'}`)
  if (amberCount > 0) confirmParts.push(`${amberCount} to verify`)
  const confirmLabel = stillLoading
    ? 'Matching yachts…'
    : confirmParts.length > 0
      ? confirmParts.join(' · ')
      : 'Confirm all'

  // Career summary — calculate total sea time and role category
  const activeCards = cards.filter((c) => c.override.status !== 'skipped')
  const roles = activeCards.map((c) => c.confirmed.role.toLowerCase())
  const earliestStart = activeCards
    .map((c) => c.confirmed.start_date)
    .filter(Boolean)
    .sort()[0]
  const earliestYear = earliestStart ? earliestStart.split('-')[0] : null

  // Build date ranges from all non-skipped cards with valid start dates
  const indexedSeaRanges: IndexedDateRange[] = []
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    if (card.override.status === 'skipped') continue
    const s = card.confirmed.start_date
    if (!s) continue
    const start = parseCVDate(s)
    if (!start) continue
    const e = card.confirmed.end_date
    const end = (!e || e === 'Current' || e === 'Present')
      ? new Date()
      : (parseCVDate(e) ?? new Date())
    indexedSeaRanges.push({ start, end, cardIndex: i })
  }

  // Union-based sea time — no double-counting of overlapping stints
  const seaTimeDays = calculateSeaTimeDays(indexedSeaRanges)
  const totalYears = Math.floor(seaTimeDays / 365.25)
  const remainingMonths = Math.floor((seaTimeDays % 365.25) / 30.44)

  // Detect overlapping stints for user warnings
  const rawOverlaps = detectOverlaps(indexedSeaRanges)
  const overlapCardIndices = new Set<number>()
  let maxOverlapDays = 0
  for (const o of rawOverlaps) {
    if (o.overlapDays > maxOverlapDays) maxOverlapDays = o.overlapDays
    overlapCardIndices.add(o.rangeA.cardIndex)
    overlapCardIndices.add(o.rangeB.cardIndex)
  }

  // Detect role category from common keywords
  function getRoleCategory(): string | null {
    const allRoles = roles.join(' ')
    if (/chef|cook|culinary|galley/i.test(allRoles)) return 'chef'
    if (/engineer|mechanic|technical/i.test(allRoles)) return 'engineering'
    if (/steward|stew|interior|housekeeper/i.test(allRoles)) return 'interior'
    if (/deck|bosun|mate|officer|captain/i.test(allRoles)) return 'deck'
    return null
  }
  const roleCategory = getRoleCategory()
  const uniqueRoles = new Set(roles)
  const roleSuffix = roleCategory
    ? uniqueRoles.size <= 1
      ? null // genuinely all the same role title, don't say "various"
      : `in various ${roleCategory} roles`
    : null

  // Build summary parts for the stat cards
  const singleYacht = activeCards.length === 1
  const yachtCountStr = singleYacht ? activeCards[0].confirmed.yacht_name : `${activeCards.length}`

  return (
    <div className="flex flex-col gap-2">
      {/* Header + stats card */}
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Your Career</h2>

        {/* Stat cards — label pinned top, value fills remaining space centered */}
        <div className="flex gap-2">
          {/* Yachts */}
          <div className="flex-1 rounded-2xl bg-[var(--color-amber-50)]/50 border border-[var(--color-amber-100)] px-3 pt-2.5 pb-3 flex flex-col items-center">
            <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Yachts</p>
            <div className="flex-1 flex items-center">
              <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{yachtCountStr}</p>
            </div>
          </div>
          {/* Time at sea */}
          {(totalYears > 0 || remainingMonths > 0) && (
            <div className="flex-1 rounded-2xl bg-[var(--color-amber-50)]/50 border border-[var(--color-amber-100)] px-3 pt-2.5 pb-3 flex flex-col items-center">
              <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Sea service</p>
              <div className="flex-1 flex items-center">
                <p className="text-base font-bold text-[var(--color-text-primary)] leading-snug text-center">
                  {totalYears > 0 && <>{totalYears} year{totalYears === 1 ? '' : 's'}</>}
                  {totalYears > 0 && remainingMonths > 0 && <br />}
                  {remainingMonths > 0 && <>{remainingMonths} month{remainingMonths === 1 ? '' : 's'}</>}
                </p>
              </div>
            </div>
          )}
          {/* Since year */}
          {earliestYear && (
            <div className="flex-1 rounded-2xl bg-[var(--color-amber-50)]/50 border border-[var(--color-amber-100)] px-3 pt-2.5 pb-3 flex flex-col items-center">
              <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Since</p>
              <div className="flex-1 flex items-center">
                <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{earliestYear}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate match warning */}
      {duplicateYachtIds.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            Two of your jobs matched the same yacht — is this correct?
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Review the matches below and adjust if needed.
          </p>
        </div>
      )}

      {/* Overlap warning */}
      {rawOverlaps.length > 0 && (
        maxOverlapDays >= 28 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-medium text-amber-900">
              Some of your roles overlap. The longest overlap is {maxOverlapDays} days. Your sea time will be calculated based on actual calendar days, not summed separately.
            </p>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Some of your roles overlap. The longest overlap is {maxOverlapDays} days. This is common for handover periods.
            </p>
          </div>
        )
      )}

      {/* Compact career list */}
      {cards.map((card, i) => (
        <div
          key={i}
          id={`yacht-card-${i}`}
          className={overlapCardIndices.has(i) ? 'rounded-2xl ring-2 ring-amber-400' : undefined}
        >
          <YachtCardWrapper
            cardState={card}
            userId={userId}
            onMatchStateChange={(state, yachtId, pickedYacht) => updateMatchState(i, state, yachtId, pickedYacht)}
            onConfirmedUpdate={(c) => updateConfirmed(i, c)}
            onStatusChange={(status) => updateStatus(i, status)}
          />
        </div>
      ))}

      {/* Add a yacht — for missing entries or second stints */}
      <button
        type="button"
        onClick={() => setAddPickerOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--color-amber-200)] text-sm font-medium text-[var(--color-amber-700)] hover:bg-[var(--color-amber-50)] transition-colors"
      >
        + Add a yacht
      </button>

      {/* Picker for manually adding a yacht */}
      <YachtPickerModal
        isOpen={addPickerOpen}
        onClose={() => setAddPickerOpen(false)}
        onSelect={(picked) => {
          // Add a new card for this yacht
          const newConfirmed: ConfirmedYacht = {
            yacht_name: picked.name,
            yacht_type: picked.yacht_type,
            length_meters: picked.length_meters,
            flag_state: picked.flag_state,
            builder: picked.builder ?? null,
            role: '',
            start_date: null,
            end_date: null,
            employment_type: null,
            yacht_program: null,
            description: null,
            cruising_area: null,
            matched_yacht_id: picked.id,
          }
          const newCard: YachtCardState = {
            yacht: {
              yacht_name: picked.name,
              yacht_type: picked.yacht_type,
              length_meters: picked.length_meters,
              flag_state: picked.flag_state,
              builder: picked.builder ?? null,
              role: '',
              start_date: null,
              end_date: null,
              employment_type: null,
              yacht_program: null,
              description: null,
              cruising_area: null,
              crew_count: null,
              guest_count: null,
              former_names: null,
            } as ParsedYachtEmployment,
            match: {
              state: 'green' as MatchState,
              topMatch: {
                id: picked.id,
                name: picked.name,
                yacht_type: picked.yacht_type,
                length_meters: picked.length_meters,
                flag_state: picked.flag_state,
                builder: picked.builder ?? null,
                cover_photo_url: picked.cover_photo_url ?? null,
                crew_count: picked.crew_count ?? 0,
                current_crew_count: picked.current_crew_count ?? 0,
                sim: 1,
              },
              candidates: [],
              loading: false,
            },
            override: { status: 'confirmed' as CardStatus, confirmedYachtId: picked.id },
            confirmed: newConfirmed,
          }
          setCards((prev) => [...prev, newCard])
          setAddPickerOpen(false)
        }}
        userId={userId}
        initialMode="search"
      />

      {/* Non-yacht roles — mention if present */}
      {landJobs.length > 0 && (
        <p className="text-xs text-[var(--color-text-tertiary)] px-1 mt-1">
          We also found {landJobs.length} shore-based role{landJobs.length === 1 ? '' : 's'} — you&apos;ll review {landJobs.length === 1 ? 'it' : 'them'} next.
        </p>
      )}

      {/* Sticky-style confirm bar */}
      <div className="mt-2 sticky bottom-0 bg-[var(--color-bg)] pb-safe pt-2">
        {skippedCount > 0 && (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center mb-1.5">
            {skippedCount} yacht{skippedCount === 1 ? '' : 's'} skipped
          </p>
        )}
        {amberCount > 0 ? (
          <Button
            onClick={() => {
              // Scroll to first amber card
              const firstAmberIdx = cards.findIndex((c) => c.match.state === 'amber' && c.override.status !== 'skipped')
              if (firstAmberIdx >= 0) {
                document.getElementById(`yacht-card-${firstAmberIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            {amberCount} yacht{amberCount === 1 ? '' : 's'} need{amberCount === 1 ? 's' : ''} your attention
          </Button>
        ) : (
          <Button
            onClick={() =>
              onConfirm(pendingOrConfirmed.map((c) => c.confirmed))
            }
            disabled={stillLoading}
            className="w-full"
            size="lg"
          >
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

/** Parse a CV date string ("YYYY-MM-DD", "YYYY-MM", or "YYYY") into a Date. Returns null for invalid or absent values. */
function parseCVDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === 'Current' || dateStr === 'Present') return null
  const parts = dateStr.split('-').map(Number)
  const year = parts[0]
  if (!year || isNaN(year)) return null
  const month = (parts[1] ?? 1) - 1
  const day = parts[2] ?? 1
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return null
  return date
}

function buildConfirmedFromParsed(y: ParsedYachtEmployment): ConfirmedYacht {
  return {
    yacht_name: y.yacht_name,
    yacht_type: y.yacht_type,
    length_meters: y.length_meters,
    flag_state: y.flag_state,
    builder: y.builder,
    role: y.role,
    start_date: y.start_date,
    end_date: y.end_date,
    employment_type: y.employment_type,
    yacht_program: y.yacht_program,
    description: y.description,
    cruising_area: y.cruising_area,
    matched_yacht_id: null,
  }
}
