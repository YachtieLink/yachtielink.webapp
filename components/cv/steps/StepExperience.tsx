'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import type { ParsedYachtEmployment, ParsedLandEmployment, ConfirmedYacht } from '@/lib/cv/types'

interface YachtCardState {
  yacht: ParsedYachtEmployment
  status: 'matched' | 'new' | 'skipped'
  confirmed: ConfirmedYacht
}

interface StepExperienceProps {
  yachts: ParsedYachtEmployment[]
  landJobs: ParsedLandEmployment[]
  parseLoading: boolean
  onConfirm: (yachts: ConfirmedYacht[]) => void
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

function YachtCard({ card, onUpdate, onToggleSkip }: {
  card: YachtCardState
  onUpdate: (c: ConfirmedYacht) => void
  onToggleSkip: () => void
}) {
  const [editing, setEditing] = useState(false)
  const { yacht, status, confirmed } = card
  const isSkipped = status === 'skipped'

  if (editing) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3 border border-[var(--color-border)]">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{yacht.yacht_name}</p>
        <Input label="Role" value={confirmed.role} onChange={(e) => onUpdate({ ...confirmed, role: e.target.value })} />
        <Input label="Start" value={confirmed.start_date ?? ''} onChange={(e) => onUpdate({ ...confirmed, start_date: e.target.value || null })} placeholder="YYYY-MM" />
        <Input label="End" value={confirmed.end_date ?? ''} onChange={(e) => onUpdate({ ...confirmed, end_date: e.target.value || null })} placeholder="YYYY-MM or Current" />
        <Select label="Employment Type" value={confirmed.employment_type ?? ''} onChange={(e) => onUpdate({ ...confirmed, employment_type: e.target.value || null })}>
          {EMPLOYMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select label="Program" value={confirmed.yacht_program ?? ''} onChange={(e) => onUpdate({ ...confirmed, yacht_program: e.target.value || null })}>
          {PROGRAM_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Input label="Cruising Area" value={confirmed.cruising_area ?? ''} onChange={(e) => onUpdate({ ...confirmed, cruising_area: e.target.value || null })} />
        <div className="flex gap-2">
          <Button onClick={() => setEditing(false)} className="flex-1">Done</Button>
          <Button variant="secondary" onClick={() => { setEditing(false) }} className="flex-1">Cancel</Button>
        </div>
      </div>
    )
  }

  const specs = [
    yacht.length_meters ? `${yacht.length_meters}m` : null,
    yacht.builder,
    yacht.yacht_program,
    yacht.flag_state,
  ].filter(Boolean).join(' · ')

  return (
    <div className={`bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-1 border ${isSkipped ? 'border-[var(--color-border)] opacity-50' : 'border-[var(--color-border)]'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          isSkipped ? 'bg-gray-100 text-gray-500' : status === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
        }`}>
          {isSkipped ? 'skipped' : status === 'new' ? 'new' : 'ok'}
        </span>
        <p className={`text-sm font-semibold text-[var(--color-text-primary)] ${isSkipped ? 'line-through' : ''}`}>
          {yacht.yacht_name}
        </p>
      </div>
      {specs && <p className="text-xs text-[var(--color-text-tertiary)]">{specs}</p>}
      <p className="text-xs text-[var(--color-text-secondary)]">
        {confirmed.role} · {confirmed.start_date ?? '?'} — {confirmed.end_date ?? 'Present'}
      </p>
      {confirmed.cruising_area && (
        <p className="text-xs text-[var(--color-text-tertiary)]">{confirmed.cruising_area}</p>
      )}
      <div className="flex justify-end gap-3 mt-1">
        <button type="button" onClick={onToggleSkip} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
          {isSkipped ? 'Undo skip' : 'Skip'}
        </button>
        {!isSkipped && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

export function StepExperience({ yachts, landJobs, parseLoading, onConfirm }: StepExperienceProps) {
  const [cards, setCards] = useState<YachtCardState[]>(() =>
    yachts.map((y) => ({
      yacht: y,
      status: 'new' as const,
      confirmed: {
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
      },
    }))
  )

  // Re-sync if parse finishes and yachts change
  const [lastYachts, setLastYachts] = useState(yachts)
  if (yachts !== lastYachts && yachts.length > 0 && cards.length === 0) {
    setLastYachts(yachts)
    setCards(yachts.map((y) => ({
      yacht: y,
      status: 'new' as const,
      confirmed: {
        yacht_name: y.yacht_name, yacht_type: y.yacht_type, length_meters: y.length_meters,
        flag_state: y.flag_state, builder: y.builder, role: y.role, start_date: y.start_date,
        end_date: y.end_date, employment_type: y.employment_type, yacht_program: y.yacht_program,
        description: y.description, cruising_area: y.cruising_area,
      },
    })))
  }

  function updateCard(index: number, confirmed: ConfirmedYacht) {
    setCards(cards.map((c, i) => i === index ? { ...c, confirmed } : c))
  }

  function toggleSkip(index: number) {
    setCards(cards.map((c, i) => i === index ? { ...c, status: c.status === 'skipped' ? 'new' : 'skipped' } : c))
  }

  if (parseLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Your Experience</h2>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Your Experience</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          We didn&apos;t find yacht experience on your CV — no worries! You can add yachts anytime from your profile.
        </p>
        <Button onClick={() => onConfirm([])} className="w-full">Next</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Your Experience</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">We found {cards.length} yacht{cards.length === 1 ? '' : 's'} on your CV</p>

      {cards.map((card, i) => (
        <YachtCard
          key={i}
          card={card}
          onUpdate={(c) => updateCard(i, c)}
          onToggleSkip={() => toggleSkip(i)}
        />
      ))}

      {landJobs.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-3 mt-1">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            We also found {landJobs.length} non-yacht role{landJobs.length === 1 ? '' : 's'}. These won&apos;t be imported — you can add them later when we support it.
          </p>
        </div>
      )}

      <Button
        onClick={() => onConfirm(cards.filter(c => c.status !== 'skipped').map(c => c.confirmed))}
        className="w-full mt-2"
      >
        Confirm all
      </Button>
    </div>
  )
}
