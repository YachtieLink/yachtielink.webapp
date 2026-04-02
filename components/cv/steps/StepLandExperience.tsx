'use client'

import { useState } from 'react'
import { Button, Input, DatePicker } from '@/components/ui'
import { Briefcase, Pencil, Trash2, Plus } from 'lucide-react'
import { formatDateDisplay } from '@/lib/cv/types'
import type { ParsedLandEmployment } from '@/lib/cv/types'

type LandJobWithId = ParsedLandEmployment & { _id: string }

interface StepLandExperienceProps {
  landJobs: ParsedLandEmployment[]
  onConfirm: (jobs: ParsedLandEmployment[]) => void
}

function LandJobCard({
  job,
  onUpdate,
  onDelete,
}: {
  job: LandJobWithId
  onUpdate: (j: LandJobWithId) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3 border border-[var(--color-border)]">
        <Input
          label="Company"
          value={job.company}
          onChange={(e) => onUpdate({ ...job, company: e.target.value })}
        />
        <Input
          label="Role"
          value={job.role}
          onChange={(e) => onUpdate({ ...job, role: e.target.value })}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <DatePicker
              label="Start"
              value={job.start_date ?? null}
              onChange={(v) => onUpdate({ ...job, start_date: v })}
              includeDay
              optionalMonth
              minYear={1970}
              maxYear={new Date().getFullYear()}
            />
          </div>
          <div className="flex-1">
            <DatePicker
              label="End"
              value={job.end_date ?? null}
              onChange={(v) => onUpdate({ ...job, end_date: v })}
              includeDay
              optionalMonth
              minYear={1970}
              maxYear={new Date().getFullYear() + 1}
              alignRight
            />
          </div>
        </div>
        <Input
          label="Description (optional)"
          value={job.description ?? ''}
          onChange={(e) => onUpdate({ ...job, description: e.target.value })}
        />
        <Button onClick={() => setEditing(false)} className="w-full">
          Done
        </Button>
      </div>
    )
  }

  const dateRange = [
    job.start_date ? formatDateDisplay(job.start_date) : null,
    job.end_date ? formatDateDisplay(job.end_date) : job.start_date ? 'Present' : null,
  ].filter(Boolean).join(' – ')

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-3 border border-[var(--color-border)] flex items-start gap-3">
      <div className="mt-0.5 shrink-0 h-8 w-8 rounded-lg bg-[var(--color-amber-50)] flex items-center justify-center">
        <Briefcase size={16} className="text-[var(--color-amber-600)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{job.company || 'Untitled company'}</p>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">{job.role}{dateRange ? ` · ${dateRange}` : ''}</p>
        {job.description && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">{job.description}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
          aria-label="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function withId(job: ParsedLandEmployment): LandJobWithId {
  return { ...job, _id: crypto.randomUUID() }
}

export function StepLandExperience({ landJobs: initialJobs, onConfirm }: StepLandExperienceProps) {
  const [jobs, setJobs] = useState<LandJobWithId[]>(() => initialJobs.map(withId))

  function updateJob(id: string, job: LandJobWithId) {
    setJobs(prev => prev.map(j => j._id === id ? job : j))
  }

  function deleteJob(id: string) {
    setJobs(prev => prev.filter(j => j._id !== id))
  }

  function addJob() {
    setJobs(prev => [...prev, withId({
      company: '',
      role: '',
      start_date: null,
      end_date: null,
      description: null,
    })])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Shore-Side Experience</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          We found some non-yachting roles in your CV. These show up on your profile timeline alongside your yacht career.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No shore-side experience found in your CV.
          </p>
        </div>
      ) : (
        jobs.map((job) => (
          <LandJobCard
            key={job._id}
            job={job}
            onUpdate={(j) => updateJob(job._id, j)}
            onDelete={() => deleteJob(job._id)}
          />
        ))
      )}

      <button
        type="button"
        onClick={addJob}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--color-amber-200)] text-sm font-medium text-[var(--color-amber-700)] hover:bg-[var(--color-amber-50)] transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus size={14} />
        Add a shore-side role
      </button>

      <div className="mt-2 sticky bottom-0 bg-[var(--color-bg)] pb-safe pt-2">
        <Button
          onClick={() => onConfirm(jobs.filter(j => j.company || j.role).map(({ _id, ...rest }) => rest))}
          className="w-full"
          size="lg"
        >
          {(() => {
            const validCount = jobs.filter(j => j.company || j.role).length
            return validCount > 0
              ? `Confirm ${validCount} shore-side role${validCount === 1 ? '' : 's'}`
              : 'Skip — no shore-side experience'
          })()}
        </Button>
      </div>
    </div>
  )
}
