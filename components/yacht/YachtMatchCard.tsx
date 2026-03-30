'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { YachtSearchResult } from '@/lib/cv/types'

// ── Types ─────────────────────────────────────────────────────

export type MatchState = 'green' | 'amber' | 'blue'

export interface YachtMatchCardProps {
  matchState: MatchState
  similarity: number

  /** Top match (green/amber) or null for blue */
  yacht: YachtSearchResult | null
  /** Additional candidates for amber state (top 3) */
  candidates?: YachtSearchResult[]

  /** CV-parsed source data */
  parsedName: string
  parsedBuilder: string | null
  parsedLength: number | null

  /** Employment data for display */
  role: string
  startDate: string | null
  endDate: string | null
  cruisingArea: string | null

  // ── Handlers ──────────────────────────────────────────────
  /** Green: confirm the matched yacht; Amber: confirm a candidate */
  onSelect: (yachtId: string) => void
  /** Reject the match — opens picker to find the right yacht */
  onReject: () => void
  /** Create a new yacht (opens picker in create mode) */
  onCreateNew: () => void
  /** Open the manual YachtPicker sheet */
  onOpenPicker: () => void
  /** Update parsed specs inline (blue state editing) */
  onUpdateSpecs?: (name: string, builder: string | null, length: number | null) => void
  /** Update employment details inline */
  onUpdateEmployment?: (role: string, startDate: string | null, endDate: string | null) => void
}

// ── Helpers ───────────────────────────────────────────────────

function formatLength(m: number): string {
  const ft = Math.round(m / 0.3048)
  return `${m}m (${ft}ft)`
}

function yachtLabel(result: YachtSearchResult): string {
  const parts = [
    result.builder,
    result.length_meters ? formatLength(result.length_meters) : null,
    result.yacht_type,
    result.flag_state,
  ]
  return parts.filter(Boolean).join(' · ')
}

function crewLabel(result: YachtSearchResult): string | null {
  const parts: string[] = []
  if (result.current_crew_count > 0) {
    parts.push(`${result.current_crew_count} crew currently onboard`)
  }
  if (result.crew_count > 0) {
    parts.push(`${result.crew_count} past and present crew`)
  }
  return parts.length ? parts.join(' · ') : null
}

function parsedSpecs(builder: string | null, length: number | null): string {
  return [builder, length ? formatLength(length) : null].filter(Boolean).join(' · ')
}

function formatDate(d: string | null): string {
  if (!d) return ''
  if (d === 'Current' || d === 'Present') return 'Present'
  // YYYY-MM → "May 2024", YYYY → "2024"
  const parts = d.split('-')
  if (parts.length === 1) return parts[0]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(parts[1], 10) - 1] ?? parts[1]} ${parts[0]}`
}

// ── Status icons ──────────────────────────────────────────────

function GreenIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  )
}

function AmberIcon() {
  return (
    <svg className="h-5 w-5 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  )
}

function BlueIcon() {
  return (
    <svg className="h-5 w-5 text-sky-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l1.216 2.916a1.25 1.25 0 00.96.7l3.143.382c1.17.142 1.638 1.571.793 2.418l-2.328 2.339a1.25 1.25 0 00-.346 1.104l.637 3.112c.233 1.14-.983 2.01-2.005 1.434l-2.77-1.563a1.25 1.25 0 00-1.224 0l-2.77 1.563c-1.022.576-2.238-.295-2.005-1.434l.637-3.112a1.25 1.25 0 00-.346-1.104L2.676 9.626c-.845-.847-.377-2.276.793-2.418l3.143-.382a1.25 1.25 0 00.96-.7l1.216-2.916z" clipRule="evenodd" />
    </svg>
  )
}

// ── Chevron ───────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// ── Compact row (collapsed state) ─────────────────────────────

export function YachtMatchCard(props: YachtMatchCardProps) {
  const {
    matchState,
    yacht,
    candidates,
    parsedName,
    parsedBuilder,
    parsedLength,
    role,
    startDate,
    endDate,
    onSelect,
    onReject,
    onCreateNew,
    onOpenPicker,
    onUpdateSpecs = () => {},
    onUpdateEmployment = () => {},
  } = props

  const [expanded, setExpanded] = useState(false)

  const displayName = matchState === 'green' && yacht ? yacht.name : parsedName
  const dateRange = [formatDate(startDate), formatDate(endDate) || 'Present'].filter(Boolean).join(' — ')

  // Specs line: show matched yacht specs for green, parsed specs for blue/amber
  const specsSource = matchState === 'green' && yacht
    ? [yacht.builder, yacht.length_meters ? formatLength(yacht.length_meters) : null, yacht.yacht_type].filter(Boolean).join(' · ')
    : [parsedBuilder, parsedLength ? formatLength(parsedLength) : null].filter(Boolean).join(' · ')

  return (
    <div className="card-soft rounded-2xl overflow-hidden">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-[var(--color-surface-raised)] transition-colors"
      >
        {matchState === 'green' && <GreenIcon />}
        {matchState === 'amber' && <AmberIcon />}
        {matchState === 'blue' && <BlueIcon />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {displayName}
          </p>
          {specsSource && (
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 truncate">
              {specsSource}
            </p>
          )}
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
            {role}{dateRange ? ` · ${dateRange}` : ''}
          </p>
        </div>

        {/* Amber needs attention indicator */}
        {matchState === 'amber' && !expanded && (
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
            Verify
          </span>
        )}

        {/* Blue: "New" badge */}
        {matchState === 'blue' && !expanded && (
          <span className="text-[10px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full flex-shrink-0">
            New
          </span>
        )}

        <Chevron open={expanded} />
      </button>

      {/* Expanded detail — inline below the row */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          {matchState === 'green' && yacht && (
            <GreenExpanded yacht={yacht} onReject={onReject} />
          )}
          {matchState === 'amber' && (
            <AmberExpanded
              candidates={candidates ?? []}
              topMatch={yacht}
              parsedName={parsedName}
              onSelect={onSelect}
              onCreateNew={onCreateNew}
              onOpenPicker={onOpenPicker}
            />
          )}
          {matchState === 'blue' && (
            <BlueExpanded
              parsedName={parsedName}
              parsedBuilder={parsedBuilder}
              parsedLength={parsedLength}
              role={role}
              startDate={startDate}
              endDate={endDate}
              onRemove={onReject}
              onUpdateSpecs={onUpdateSpecs}
              onUpdateEmployment={onUpdateEmployment}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Green expanded ────────────────────────────────────────────

function GreenExpanded({
  yacht,
  onReject,
}: {
  yacht: YachtSearchResult
  onReject: () => void
}) {
  const label = yachtLabel(yacht)
  const crew = crewLabel(yacht)

  return (
    <div className="flex flex-col gap-2">
      {/* Matched yacht info */}
      <div className="flex items-start gap-3">
        {yacht.cover_photo_url ? (
          <div className="relative h-12 w-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={yacht.cover_photo_url} alt={yacht.name} fill className="object-cover object-center" sizes="64px" />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          {label && <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>}
          {crew && <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{crew}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={onReject}
        className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors self-start"
      >
        Not this yacht?
      </button>
    </div>
  )
}

// ── Amber expanded ────────────────────────────────────────────

function AmberExpanded({
  candidates,
  topMatch,
  parsedName,
  onSelect,
  onCreateNew,
  onOpenPicker,
}: {
  candidates: YachtSearchResult[]
  topMatch: YachtSearchResult | null
  parsedName: string
  onSelect: (id: string) => void
  onCreateNew: () => void
  onOpenPicker: () => void
}) {
  const allCandidates = topMatch ? [topMatch, ...candidates.filter(c => c.id !== topMatch.id)] : candidates

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--color-text-secondary)]">
        We found similar yachts for <span className="font-semibold text-[var(--color-text-primary)]">{parsedName}</span>
      </p>

      {/* Candidate cards */}
      {allCandidates.slice(0, 3).map((c) => {
        const label = yachtLabel(c)
        const crew = crewLabel(c)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] active:scale-[0.99] transition-all"
          >
            {c.cover_photo_url ? (
              <div className="relative h-10 w-14 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={c.cover_photo_url} alt={c.name} fill className="object-cover object-center" sizes="56px" />
              </div>
            ) : (
              <div className="h-10 w-14 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-[var(--color-text-tertiary)]">⚓</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{c.name}</p>
              {label && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">{label}</p>}
              {crew && <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 truncate">{crew}</p>}
            </div>
            <svg className="h-4 w-4 text-[var(--color-text-tertiary)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )
      })}

      {/* Fallback actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onOpenPicker}
          className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Search instead
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="text-xs text-[var(--color-interactive)] font-medium hover:opacity-80 transition-opacity"
        >
          Add as new yacht
        </button>
      </div>
    </div>
  )
}

// ── Blue expanded ─────────────────────────────────────────────

function BlueExpanded({
  parsedName,
  parsedBuilder,
  parsedLength,
  role: initialRole,
  startDate: initialStart,
  endDate: initialEnd,
  onRemove,
  onUpdateSpecs,
  onUpdateEmployment,
}: {
  parsedName: string
  parsedBuilder: string | null
  parsedLength: number | null
  role: string
  startDate: string | null
  endDate: string | null
  onRemove: () => void
  onUpdateSpecs: (name: string, builder: string | null, length: number | null) => void
  onUpdateEmployment: (role: string, startDate: string | null, endDate: string | null) => void
}) {
  const [name, setName] = useState(parsedName)
  const [builder, setBuilder] = useState(parsedBuilder ?? '')
  const [metres, setMetres] = useState(parsedLength ? String(parsedLength) : '')
  const [feet, setFeet] = useState(parsedLength ? String(Math.round(parsedLength / 0.3048)) : '')
  const [yachtType, setYachtType] = useState<'Motor Yacht' | 'Sailing Yacht'>('Motor Yacht')
  const [role, setRole] = useState(initialRole)
  const [startDate, setStartDate] = useState(initialStart ?? '')
  const [endDate, setEndDate] = useState(initialEnd ?? '')

  function handleMetresChange(val: string) {
    setMetres(val)
    if (val) setFeet(String(Math.round(parseFloat(val) / 0.3048)))
    else setFeet('')
  }

  function handleFeetChange(val: string) {
    setFeet(val)
    if (val) setMetres(String(Math.round(parseFloat(val) * 0.3048)))
    else setMetres('')
  }

  function handleSpecsBlur() {
    onUpdateSpecs(
      name.trim() || parsedName,
      builder.trim() || null,
      metres ? parseFloat(metres) : null,
    )
  }

  function handleEmploymentBlur() {
    onUpdateEmployment(
      role.trim() || initialRole,
      startDate.trim() || null,
      endDate.trim() || null,
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-sky-600 font-medium">
        New to YachtieLink — check the details are correct
      </p>

      {/* Editable specs inline */}
      <div className="flex flex-col gap-2">
        {/* Type + Name on one row */}
        <div>
          <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Vessel</label>
          <div className="flex gap-2">
            <select
              value={yachtType}
              onChange={(e) => setYachtType(e.target.value as typeof yachtType)}
              className="w-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            >
              <option value="Motor Yacht">M/Y</option>
              <option value="Sailing Yacht">S/Y</option>
              <option value="Research Vessel">R/V</option>
              <option value="Fishing Vessel">F/V</option>
              <option value="Expedition Vessel">E/V</option>
              <option value="Support Vessel">SV</option>
            </select>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSpecsBlur}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              placeholder="e.g. Lady M"
            />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Builder</label>
            <input
              type="text"
              value={builder}
              onChange={(e) => setBuilder(e.target.value)}
              onBlur={handleSpecsBlur}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              placeholder="e.g. Feadship"
            />
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider text-right">m</label>
              <input
                type="number"
                value={metres}
                onChange={(e) => handleMetresChange(e.target.value)}
                onBlur={handleSpecsBlur}
                className="w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-sm text-[var(--color-text-primary)] text-right focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                placeholder="45"
                min="1"
                max="500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider text-right">ft</label>
              <input
                type="number"
                value={feet}
                onChange={(e) => handleFeetChange(e.target.value)}
                onBlur={handleSpecsBlur}
                className="w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-sm text-[var(--color-text-primary)] text-right focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
                placeholder="148"
                min="1"
                max="1640"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employment details */}
      <div className="flex flex-col gap-2">
        <div>
          <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={handleEmploymentBlur}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            placeholder="e.g. Sole Chef"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Start</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onBlur={handleEmploymentBlur}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              placeholder="YYYY-MM"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">End</label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onBlur={handleEmploymentBlur}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
              placeholder="YYYY-MM or Present"
            />
          </div>
        </div>
      </div>

      {/* Remove — tucked away */}
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors self-start"
      >
        Remove this entry
      </button>
    </div>
  )
}
