'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Instagram, Linkedin, Globe } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { formatDateDisplay } from '@/lib/cv/types'
import type { ConfirmedImportData, SaveStats, ParsedSocialMedia } from '@/lib/cv/types'

// Custom TikTok icon (no Lucide equivalent)
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07Z" />
    </svg>
  )
}

function socialLabel(sm: ParsedSocialMedia): string | null {
  const parts: string[] = []
  if (sm.instagram) parts.push('Instagram')
  if (sm.linkedin) parts.push('LinkedIn')
  if (sm.tiktok) parts.push('TikTok')
  if (sm.website) parts.push('Website')
  return parts.length > 0 ? parts.join(', ') : null
}

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
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
        {title} {count > 0 && <span className="text-[var(--color-text-tertiary)] font-normal text-sm">({count})</span>}
      </h3>
      {onEdit && step !== undefined && (
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs text-[var(--color-interactive)] min-h-[44px] min-w-[44px] flex items-center justify-end px-1 -mr-1"
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

  const { personal, languages, yachts, certifications, education, skills, hobbies, skillsSummary, interestsSummary, socialMedia } = importData

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
      <div className="flex flex-col items-center justify-start gap-4 pb-8 text-center min-h-[80vh] pt-[25vh]">
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
        <Button onClick={() => router.push('/app/profile')} className="w-full mt-4">
          View my profile
        </Button>
      </div>
    )
  }

  const dedupedHobbies = hobbies.filter(h => !skills.includes(h))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Ready to import</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">Review what we&apos;ll add to your profile:</p>

      {/* Personal details — elevated card */}
      {hasPersonal && (
        <div className="bg-[var(--color-surface-raised)] rounded-2xl p-4 border border-[var(--color-amber-200)]">
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
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-amber-200)]">
          <SectionHeader title="Languages" count={languages.length} step={1} onEdit={onEditStep} />
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {languages.map(l => `${l.language} (${l.proficiency})`).join(', ')}
          </p>
        </div>
      )}

      {/* Yachts */}
      {yachts.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-amber-200)]">
          <SectionHeader title="Experience" count={yachts.length} step={2} onEdit={onEditStep} />
          <div className="flex flex-col gap-1 mt-1.5">
            {yachts.map((y, i) => {
              const prefix = y.yacht_type === 'Motor Yacht' ? 'M/Y' : y.yacht_type === 'Sailing Yacht' ? 'S/Y' : null
              const name = prefix ? `${prefix} ${y.yacht_name}` : y.yacht_name
              const start = formatDateDisplay(y.start_date)
              const end = formatDateDisplay(y.end_date) || 'Present'
              return (
                <p key={i} className="text-xs text-[var(--color-text-secondary)]">
                  {name} — {y.role}{start && end ? ` · ${start} — ${end}` : start ? ` · ${start}` : end ? ` · ${end}` : ''}
                </p>
              )
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-amber-200)]">
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
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-amber-200)]">
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
      {(skills.length > 0 || dedupedHobbies.length > 0) && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-amber-200)]">
          <SectionHeader title="Skills & Interests" count={skills.length + dedupedHobbies.length} step={4} onEdit={onEditStep} />
          {skills.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((s, i) => (
                  <span key={`s-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-interactive)]/10 text-[var(--color-interactive)]">{s}</span>
                ))}
              </div>
              {skillsSummary && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-2 line-clamp-2 italic">{skillsSummary}</p>
              )}
            </>
          )}
          {dedupedHobbies.length > 0 && (
            <>
              {skills.length > 0 && <div className="h-px bg-[var(--color-amber-200)] my-2" />}
              <div className="flex flex-wrap gap-1.5">
                {dedupedHobbies.map((h, i) => (
                  <span key={`h-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{h}</span>
                ))}
              </div>
            </>
          )}
          {interestsSummary && (
            <>
              {(skills.length > 0 || dedupedHobbies.length > 0) && dedupedHobbies.length === 0 && <div className="h-px bg-[var(--color-amber-200)] my-2" />}
              <p className="text-xs text-[var(--color-text-tertiary)] mt-2 line-clamp-2 italic">{interestsSummary}</p>
            </>
          )}
        </div>
      )}

      {/* Social links */}
      {socialLabel(socialMedia) && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 border border-[var(--color-amber-200)]">
          <SectionHeader title="Social Links" count={0} step={4} onEdit={onEditStep} />
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {socialMedia.instagram && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Instagram size={12} className="shrink-0" />
                {socialMedia.instagram}
              </span>
            )}
            {socialMedia.linkedin && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Linkedin size={12} className="shrink-0" />
                {socialMedia.linkedin}
              </span>
            )}
            {socialMedia.tiktok && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <TikTokIcon size={12} />
                {socialMedia.tiktok}
              </span>
            )}
            {socialMedia.website && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Globe size={12} className="shrink-0" />
                {socialMedia.website}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1.5">
            Tap Edit to correct any links before importing.
          </p>
        </div>
      )}

      {totalItems === 0 && !socialLabel(socialMedia) && (
        <p className="text-sm text-[var(--color-text-secondary)]">Nothing to import. You can add details from your profile.</p>
      )}

      <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-amber-200)] px-4 py-3">
        <p className="text-xs text-[var(--color-text-secondary)]">
          New experience, certifications, and skills will be added. Personal details will be updated with the values you confirmed.
        </p>
      </div>

      <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
        <Button onClick={handleImport} loading={saving} className="w-full" disabled={totalItems === 0 && !socialLabel(socialMedia)}>
          Import to my profile
        </Button>
      </div>
    </div>
  )
}
