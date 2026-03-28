import Link from 'next/link'
import { Star } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { EndorsementCard } from '../EndorsementCard'
import { StaggeredList, StaggeredItem } from '../StaggeredList'
import { endorsementsSummary } from '@/lib/profile-summaries'
import type { PublicEndorsement } from '@/lib/queries/types'

interface EndorsementsSectionProps {
  endorsements: PublicEndorsement[]
  mutualEndorserCount: number
  handle: string
}

export function EndorsementsSection({ endorsements, mutualEndorserCount, handle }: EndorsementsSectionProps) {
  return (
    <ScrollReveal>
      <ProfileAccordion
        title="My Endorsements"
        summary={endorsementsSummary(endorsements.length, mutualEndorserCount)}
        accentColor="coral"
        icon={<Star size={16} />}
      >
        <StaggeredList className="flex flex-col gap-3">
          {endorsements.slice(0, 3).map((end) => (
            <StaggeredItem key={end.id}>
              <EndorsementCard
                endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                endorserRole={end.endorser_role_label}
                endorserPhoto={end.endorser?.profile_photo_url}
                endorserHandle={end.endorser?.handle}
                yachtName={end.yacht?.name}
                date={end.created_at}
                content={end.content}
              />
            </StaggeredItem>
          ))}
        </StaggeredList>
        {endorsements.length > 3 && (
          <Link
            href={`/u/${handle}/endorsements`}
            className="mt-3 block text-sm font-medium text-[var(--color-interactive)] hover:underline"
          >
            See all {endorsements.length} {endorsements.length === 1 ? 'endorsement' : 'endorsements'}
          </Link>
        )}
      </ProfileAccordion>
    </ScrollReveal>
  )
}
