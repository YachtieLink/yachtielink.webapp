import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getProfileSections } from '@/lib/queries/profile'
import { IdentityCard } from '@/components/profile/IdentityCard'
import { WheelACard, type WheelAMilestones } from '@/components/profile/WheelACard'
import { AboutSection } from '@/components/profile/AboutSection'
import { YachtsSection } from '@/components/profile/YachtsSection'
import { CertsSection } from '@/components/profile/CertsSection'
import { EndorsementsSection } from '@/components/profile/EndorsementsSection'
import { ProfileCardList } from '@/components/profile/ProfileCardList'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // ── Fetch user profile and profile sections in parallel ──────────────────────
  const [profile, { attachments, certifications: certs, endorsements }] =
    await Promise.all([
      getUserById(user.id),
      getProfileSections(user.id),
    ])

  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  // ── Compute Wheel A milestones ───────────────────────────────────────────────
  const milestones: WheelAMilestones = {
    roleSet:  !!profile.primary_role,
    hasYacht: (attachments?.length ?? 0) > 0,
    bioSet:   !!profile.bio,
    hasCert:  (certs?.length ?? 0) > 0,
    hasPhoto: !!profile.profile_photo_url,
  }

  // First missing milestone for the floating CTA
  const nextStep = (() => {
    if (!milestones.roleSet)  return { label: 'Set your role',        href: '/app/more/account' }
    if (!milestones.hasYacht) return { label: 'Add your first yacht', href: '/app/attachment/new' }
    if (!milestones.bioSet)   return { label: 'Write your bio',       href: '/app/about/edit' }
    if (!milestones.hasCert)  return { label: 'Add a certification',  href: '/app/certification/new' }
    if (!milestones.hasPhoto) return { label: 'Upload a photo',       href: '/app/profile/photo' }
    return null
  })()

  return (
    <div className="flex flex-col gap-4 pb-24">
      <ProfileCardList>
        {[
          <IdentityCard
            key="id"
            displayName={profile.display_name ?? profile.full_name}
            fullName={profile.full_name}
            handle={profile.handle!}
            primaryRole={profile.primary_role}
            departments={profile.departments}
            photoUrl={profile.profile_photo_url}
          />,
          <WheelACard key="wheel" milestones={milestones} />,
          <AboutSection key="about" bio={profile.bio} />,
          <YachtsSection key="yachts" attachments={(attachments as any) ?? []} />,
          <CertsSection key="certs" certs={(certs as any) ?? []} />,
          <EndorsementsSection key="end" endorsements={(endorsements as any) ?? []} />,
        ]}
      </ProfileCardList>

      {/* Floating CTA */}
      {nextStep ? (
        <Link
          href={nextStep.href}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--color-interactive)] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg hover:bg-[var(--color-interactive-hover)] transition-colors whitespace-nowrap"
        >
          {nextStep.label} →
        </Link>
      ) : (endorsements?.length ?? 0) < 5 && (attachments?.length ?? 0) > 0 ? (
        <Link
          href="/app/endorsement/request"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--color-interactive)] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg hover:bg-[var(--color-interactive-hover)] transition-colors whitespace-nowrap"
        >
          Request endorsements →
        </Link>
      ) : (
        <Link
          href={`/u/${profile.handle}`}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--color-interactive)] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg hover:bg-[var(--color-interactive-hover)] transition-colors whitespace-nowrap"
        >
          Share profile →
        </Link>
      )}
    </div>
  )
}
