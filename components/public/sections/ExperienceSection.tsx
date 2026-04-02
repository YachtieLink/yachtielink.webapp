import { Anchor } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { formatSeaTime } from '@/lib/sea-time'
import { formatDate } from '@/lib/format-date'
import { prefixedYachtName } from '@/lib/yacht-prefix'
import type { PublicAttachment } from '@/lib/queries/types'

interface ExperienceSectionProps {
  attachments: PublicAttachment[]
  sharedYachtIdSet: Set<string>
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  onNavigate?: (url: string, label: string) => void
}

export function ExperienceSection({ attachments, sharedYachtIdSet, seaTimeTotalDays = 0, seaTimeYachtCount = 0, onNavigate }: ExperienceSectionProps) {
  const yachtCount = seaTimeYachtCount || attachments.length
  const summary = seaTimeTotalDays > 0
    ? `${formatSeaTime(seaTimeTotalDays).displayShort} sea time · ${yachtCount} ${yachtCount === 1 ? 'yacht' : 'yachts'}`
    : yachtCount > 0
    ? `${yachtCount} ${yachtCount === 1 ? 'yacht' : 'yachts'}`
    : 'No experience added yet'

  return (
    <ScrollReveal>
      <ProfileAccordion
        title="My Experience"
        summary={summary}
        accentColor="teal"
        icon={<Anchor size={16} />}
      >
        <div className="flex flex-col gap-3">
          {attachments.map((att) => {
            const isShared = att.yachts?.id ? sharedYachtIdSet.has(att.yachts.id) : false
            return (
              <div key={att.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-interactive)]" />
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
          })}
        </div>
      </ProfileAccordion>
    </ScrollReveal>
  )
}
