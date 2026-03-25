import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { EndorsementCard } from '../EndorsementCard'
import { ShowMoreButton } from '../ShowMoreButton'
import { StaggeredList, StaggeredItem } from '../StaggeredList'
import { endorsementsSummary } from '@/lib/profile-summaries'
import type { PublicEndorsement } from '@/lib/queries/types'

interface EndorsementsSectionProps {
  endorsements: PublicEndorsement[]
  mutualEndorserCount: number
}

export function EndorsementsSection({ endorsements, mutualEndorserCount }: EndorsementsSectionProps) {
  return (
    <ScrollReveal>
      <ProfileAccordion
        title="Endorsements"
        summary={endorsementsSummary(endorsements.length, mutualEndorserCount)}
        accentColor="coral"
      >
        <StaggeredList className="flex flex-col gap-3">
          {endorsements.slice(0, 5).map((end) => (
            <StaggeredItem key={end.id}>
              <EndorsementCard
                endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                endorserRole={end.endorser_role_label}
                endorserPhoto={end.endorser?.profile_photo_url}
                yachtName={end.yacht?.name}
                date={end.created_at}
                content={end.content}
              />
            </StaggeredItem>
          ))}
          {endorsements.length > 5 && (
            <ShowMoreButton label={`${endorsements.length - 5} more endorsements`}>
              {endorsements.slice(5).map((end) => (
                <EndorsementCard
                  key={end.id}
                  endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                  endorserRole={end.endorser_role_label}
                  endorserPhoto={end.endorser?.profile_photo_url}
                  yachtName={end.yacht?.name}
                  date={end.created_at}
                  content={end.content}
                />
              ))}
            </ShowMoreButton>
          )}
        </StaggeredList>
      </ProfileAccordion>
    </ScrollReveal>
  )
}
