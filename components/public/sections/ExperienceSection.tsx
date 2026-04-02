import { Anchor, Briefcase } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { formatSeaTime } from '@/lib/sea-time'
import { formatDate } from '@/lib/format-date'
import { prefixedYachtName } from '@/lib/yacht-prefix'
import type { PublicAttachment, LandExperienceEntry } from '@/lib/queries/types'

type TimelineEntry =
  | { type: 'yacht'; data: PublicAttachment }
  | { type: 'land'; data: LandExperienceEntry }

function getStartDate(entry: TimelineEntry): Date {
  if (entry.type === 'yacht') {
    return entry.data.started_at ? new Date(entry.data.started_at) : new Date(0)
  }
  return entry.data.start_date ? new Date(entry.data.start_date) : new Date(0)
}

function getEndDate(entry: TimelineEntry): Date | null {
  if (entry.type === 'yacht') {
    return entry.data.ended_at ? new Date(entry.data.ended_at) : null
  }
  return entry.data.end_date ? new Date(entry.data.end_date) : null
}

interface ExperienceSectionProps {
  attachments: PublicAttachment[]
  landExperience?: LandExperienceEntry[]
  sharedYachtIdSet: Set<string>
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  onNavigate?: (url: string, label: string) => void
}

export function ExperienceSection({ attachments, landExperience = [], sharedYachtIdSet, seaTimeTotalDays = 0, seaTimeYachtCount = 0, onNavigate }: ExperienceSectionProps) {
  const yachtCount = seaTimeYachtCount || attachments.length
  const totalEntries = attachments.length + landExperience.length

  const summaryParts: string[] = []
  if (seaTimeTotalDays > 0) {
    summaryParts.push(`${formatSeaTime(seaTimeTotalDays).displayShort} sea time`)
  }
  if (yachtCount > 0) {
    summaryParts.push(`${yachtCount} ${yachtCount === 1 ? 'yacht' : 'yachts'}`)
  }
  if (landExperience.length > 0) {
    summaryParts.push(`${landExperience.length} shore-side`)
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'No experience added yet'

  // Merge and sort reverse chronological
  const entries: TimelineEntry[] = [
    ...attachments.map(a => ({ type: 'yacht' as const, data: a })),
    ...landExperience.map(l => ({ type: 'land' as const, data: l })),
  ].sort((a, b) => {
    const endA = getEndDate(a)
    const endB = getEndDate(b)
    if (!endA && endB) return -1
    if (endA && !endB) return 1
    return getStartDate(b).getTime() - getStartDate(a).getTime()
  })

  return (
    <ScrollReveal>
      <ProfileAccordion
        title="My Experience"
        summary={summary}
        accentColor="teal"
        icon={<Anchor size={16} />}
      >
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            if (entry.type === 'yacht') {
              const att = entry.data
              const isShared = att.yachts?.id ? sharedYachtIdSet.has(att.yachts.id) : false
              return (
                <div key={`y-${att.id}`} className="flex gap-3">
                  <div className="mt-1 shrink-0 h-6 w-6 rounded-md bg-[var(--color-navy-50)] flex items-center justify-center">
                    <Anchor size={12} className="text-[var(--color-navy-500)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {att.yachts?.id && onNavigate ? (
                        <button onClick={() => onNavigate(`/app/yacht/${att.yachts!.id}`, att.yachts!.name ?? 'Yacht')} className="hover:text-[var(--accent-500,#0f9b8e)] text-left transition-colors">
                          {prefixedYachtName(att.yachts.name ?? 'Unknown Yacht', att.yachts.yacht_type)}
                        </button>
                      ) : (
                        <>{prefixedYachtName(att.yachts?.name ?? 'Unknown Yacht', att.yachts?.yacht_type)}</>
                      )}
                      {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
                      {isShared && <span className="ml-2 text-xs text-[var(--color-interactive)]">You worked here</span>}
                    </p>
                    {(att.started_at || att.ended_at) && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
                      </p>
                    )}
                    {att.yachts?.flag_state && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {att.yachts.flag_state}{att.yachts.length_meters ? ` · ${att.yachts.length_meters}m` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )
            }

            // Land experience
            const job = entry.data
            const startDate = job.start_date ? new Date(job.start_date) : null
            const endDate = job.end_date ? new Date(job.end_date) : null
            return (
              <div key={`l-${job.id}`} className="flex gap-3">
                <div className="mt-1 shrink-0 h-6 w-6 rounded-md bg-[var(--color-amber-50)] flex items-center justify-center">
                  <Briefcase size={12} className="text-[var(--color-amber-600)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {job.company || 'Unknown company'}
                    {job.role && <span className="font-normal text-[var(--color-text-secondary)]"> — {job.role}</span>}
                  </p>
                  {startDate && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formatDate(job.start_date!)} – {endDate ? formatDate(job.end_date!) : 'Present'}
                    </p>
                  )}
                  {job.industry && (
                    <p className="text-xs text-[var(--color-text-secondary)]">{job.industry}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ProfileAccordion>
    </ScrollReveal>
  )
}
