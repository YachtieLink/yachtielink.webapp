'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { formatDateDisplay } from '@/lib/cv/types'
import type { ConfirmedImportData, SaveStats } from '@/lib/cv/types'

interface StepReviewProps {
  importData: ConfirmedImportData
  onSave: () => Promise<SaveStats | null>
  onEditStep?: (step: number) => void
}

function SectionHeader({ title, count, step, onEdit }: {
  title: string
  count: number
  step?: number
  onEdit?: (step: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        {title} {count > 0 && <span className="text-[var(--color-text-tertiary)]">({count})</span>}
      </p>
      {onEdit && step !== undefined && (
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs text-[var(--color-interactive)]"
        >
          Edit
        </button>
      )}
    </div>
  )
}

export function StepReview({ importData, onSave, onEditStep }: StepReviewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<SaveStats | null>(null)

  const { personal, languages, yachts, certifications, education, skills, hobbies } = importData

  const hasPersonal = !!(personal.full_name || personal.bio || personal.phone || personal.primary_role)
  const totalItems = [
    hasPersonal ? 1 : 0,
    yachts.length,
    certifications.length,
    education.length,
    skills.length + hobbies.length,
    languages.length,
  ].reduce((a, b) => a + b, 0)

  async function handleImport() {
    setSaving(true)
    const result = await onSave()
    setSaving(false)
    if (result) {
      setStats(result)
    } else {
      toast('Failed to import some data. Please check your profile.', 'error')
    }
  }

  // Celebration screen
  if (stats) {
    const itemCount = [
      stats.personalUpdated ? 1 : 0,
      stats.yachtsCreated,
      stats.certsCreated,
      stats.educationCreated,
      stats.skillsAdded,
      stats.hobbiesAdded,
    ].reduce((a, b) => a + b, 0)

    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">All done!</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {itemCount} item{itemCount === 1 ? '' : 's'} imported to your profile
        </p>
        <div className="text-xs text-[var(--color-text-tertiary)] flex flex-wrap gap-2 justify-center">
          {stats.personalUpdated && <span>Profile updated</span>}
          {stats.yachtsCreated > 0 && <span>· {stats.yachtsCreated} yacht{stats.yachtsCreated === 1 ? '' : 's'}</span>}
          {stats.certsCreated > 0 && <span>· {stats.certsCreated} cert{stats.certsCreated === 1 ? '' : 's'}</span>}
          {stats.educationCreated > 0 && <span>· {stats.educationCreated} education</span>}
          {stats.skillsAdded > 0 && <span>· {stats.skillsAdded} skill{stats.skillsAdded === 1 ? '' : 's'}</span>}
          {stats.hobbiesAdded > 0 && <span>· {stats.hobbiesAdded} hobb{stats.hobbiesAdded === 1 ? 'y' : 'ies'}</span>}
          {stats.languagesUpdated && <span>· Languages</span>}
        </div>
        <Button onClick={() => { router.push('/app/profile'); router.refresh() }} className="w-full mt-4">
          View my profile
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Ready to import</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">Review what we&apos;ll add to your profile:</p>

      {/* Personal details */}
      {hasPersonal && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
          <SectionHeader title="Personal details" count={0} step={1} onEdit={onEditStep} />
          <div className="flex flex-col gap-0.5 mt-1.5">
            {personal.full_name && <p className="text-xs text-[var(--color-text-secondary)]">{personal.full_name}</p>}
            {personal.primary_role && <p className="text-xs text-[var(--color-text-tertiary)]">{personal.primary_role}</p>}
            {personal.bio && <p className="text-xs text-[var(--color-text-tertiary)]">{personal.bio.length > 60 ? `${personal.bio.slice(0, 60)}…` : personal.bio}</p>}
            {personal.phone && <p className="text-xs text-[var(--color-text-tertiary)]">{personal.phone}</p>}
          </div>
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
          <SectionHeader title="Languages" count={languages.length} step={1} onEdit={onEditStep} />
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {languages.map(l => `${l.language} (${l.proficiency})`).join(', ')}
          </p>
        </div>
      )}

      {/* Yachts */}
      {yachts.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
          <SectionHeader title="Experience" count={yachts.length} step={2} onEdit={onEditStep} />
          <div className="flex flex-col gap-1 mt-1.5">
            {yachts.map((y, i) => (
              <p key={i} className="text-xs text-[var(--color-text-secondary)]">
                {y.yacht_name} — {y.role} · {formatDateDisplay(y.start_date) || '?'} — {formatDateDisplay(y.end_date) || 'Present'}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
          <SectionHeader title="Certifications" count={certifications.length} step={3} onEdit={onEditStep} />
          <div className="flex flex-col gap-0.5 mt-1.5">
            {certifications.map((c, i) => (
              <p key={i} className="text-xs text-[var(--color-text-secondary)]">
                {c.name}{c.expiry_date ? ` · ${formatDateDisplay(c.expiry_date)}` : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
          <SectionHeader title="Education" count={education.length} step={3} onEdit={onEditStep} />
          <div className="flex flex-col gap-0.5 mt-1.5">
            {education.map((e, i) => (
              <p key={i} className="text-xs text-[var(--color-text-secondary)]">
                {e.institution}{e.qualification ? ` — ${e.qualification}` : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Hobbies */}
      {(skills.length > 0 || hobbies.length > 0) && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
          <SectionHeader title="Skills & Interests" count={skills.length + hobbies.length} step={4} onEdit={onEditStep} />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {skills.map((s, i) => (
              <span key={`s-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">{s}</span>
            ))}
            {hobbies.map((h, i) => (
              <span key={`h-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">{h}</span>
            ))}
          </div>
        </div>
      )}

      {totalItems === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">Nothing to import. You can add details from your profile.</p>
      )}

      <p className="text-xs text-[var(--color-text-tertiary)]">
        This won&apos;t change anything you&apos;ve already saved — only adds new data.
      </p>

      <Button onClick={handleImport} loading={saving} className="w-full mt-2" disabled={totalItems === 0}>
        Import to my profile
      </Button>
    </div>
  )
}
