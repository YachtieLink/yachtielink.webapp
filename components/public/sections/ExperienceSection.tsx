import { Anchor } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { experienceSummary } from '@/lib/profile-summaries'
import type { PublicAttachment } from '@/lib/queries/types'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

interface ExperienceSectionProps {
  attachments: PublicAttachment[]
  sharedYachtIdSet: Set<string>
}

export function ExperienceSection({ attachments, sharedYachtIdSet }: ExperienceSectionProps) {
  return (
    <ScrollReveal>
      <ProfileAccordion
        title="My Experience"
        summary={experienceSummary(attachments)}
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
                    {att.yachts?.name ?? 'Unknown Yacht'}
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
