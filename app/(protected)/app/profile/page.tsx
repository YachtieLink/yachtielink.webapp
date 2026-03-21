import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Wrench, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getProfileSections, getExtendedProfileSections } from '@/lib/queries/profile'
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard'
import { ProfileStrength } from '@/components/profile/ProfileStrength'
import { ProfileSectionGrid, type SectionItem } from '@/components/profile/ProfileSectionGrid'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTransition } from '@/components/ui/PageTransition'
import {
  aboutSummary,
  experienceSummary,
  endorsementsSummary,
  certificationsSummary,
  educationSummary,
  hobbiesSummary,
  skillsSummary,
  gallerySummary,
  countExpiringCerts,
  computeProfileStrength,
} from '@/lib/profile-summaries'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const [profile, { attachments, certifications: certs, endorsements }, extended] =
    await Promise.all([
      getUserById(user.id),
      getProfileSections(user.id),
      getExtendedProfileSections(user.id),
    ])

  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  // Fetch profile gallery photos
  const { data: profilePhotos } = await supabase
    .from('user_photos')
    .select('id, photo_url, sort_order')
    .eq('user_id', user.id)
    .order('sort_order')

  const sectionVisibility = (profile.section_visibility ?? {
    about: true, experience: true, endorsements: true, certifications: true,
    hobbies: true, education: true, skills: true, photos: true, gallery: true,
  }) as Record<string, boolean>

  const expiringCount = countExpiringCerts(certs ?? [])

  const { score, label, nextPrompt } = computeProfileStrength({
    hasPhoto: !!profile.profile_photo_url,
    hasRole: !!profile.primary_role,
    hasBio: !!profile.bio,
    hasYacht: (attachments?.length ?? 0) > 0,
    hasCert: (certs?.length ?? 0) > 0,
    hasEndorsement: (endorsements?.length ?? 0) > 0,
    hasHobby: extended.hobbies.length > 0,
    hasEducation: extended.education.length > 0,
    hasSocialLink: Array.isArray(profile.social_links) && (profile.social_links as any[]).length > 0,
  })

  // Smart CTA for profile strength card
  const strengthCta = (() => {
    if (!profile.profile_photo_url) return { label: 'Add profile photos', href: '/app/profile/photos' }
    if (!profile.bio) return { label: 'Write your bio', href: '/app/about/edit' }
    if ((endorsements?.length ?? 0) === 0) return { label: 'Request an endorsement', href: '/app/endorsement/request' }
    if ((certs?.length ?? 0) === 0) return { label: 'Add certifications', href: '/app/certification/new' }
    return undefined
  })()

  const displayName = profile.display_name ?? profile.full_name
  const departments = (profile.departments ?? []) as string[]

  // Section grid data
  const sectionGridItems: SectionItem[] = [
    {
      key: 'about',
      label: 'About',
      summary: aboutSummary(profile.ai_summary, profile.bio),
      count: profile.bio ? 1 : 0,
      visible: sectionVisibility.about ?? true,
      editHref: '/app/about/edit',
    },
    {
      key: 'experience',
      label: 'Experience',
      summary: experienceSummary(attachments ?? []),
      count: attachments?.length ?? 0,
      visible: sectionVisibility.experience ?? true,
      editHref: '/app/attachment/new',
    },
    {
      key: 'endorsements',
      label: 'Endorsements',
      summary: endorsementsSummary(endorsements?.length ?? 0, 0),
      count: endorsements?.length ?? 0,
      visible: sectionVisibility.endorsements ?? true,
      editHref: '/app/endorsement/request',
    },
    {
      key: 'certifications',
      label: 'Certifications',
      summary: certificationsSummary(certs?.length ?? 0, expiringCount),
      count: certs?.length ?? 0,
      visible: sectionVisibility.certifications ?? true,
      editHref: '/app/certification/new',
    },
    {
      key: 'education',
      label: 'Education',
      summary: educationSummary(extended.education),
      count: extended.education.length,
      visible: sectionVisibility.education ?? true,
      editHref: '/app/education/new',
    },
    {
      key: 'hobbies',
      label: 'Hobbies',
      summary: hobbiesSummary(extended.hobbies),
      count: extended.hobbies.length,
      visible: sectionVisibility.hobbies ?? true,
      editHref: '/app/hobbies/edit',
    },
    {
      key: 'skills',
      label: 'Extra Skills',
      summary: skillsSummary(extended.skills),
      count: extended.skills.length,
      visible: sectionVisibility.skills ?? true,
      editHref: '/app/skills/edit',
    },
    {
      key: 'photos',
      label: 'Photos',
      summary: (profilePhotos?.length ?? 0) > 0 ? `${profilePhotos!.length} photo${profilePhotos!.length === 1 ? '' : 's'}` : 'No photos yet',
      count: profilePhotos?.length ?? 0,
      visible: sectionVisibility.photos ?? true,
      editHref: '/app/profile/photos',
    },
    {
      key: 'gallery',
      label: 'Work Gallery',
      summary: gallerySummary(extended.gallery.length),
      count: extended.gallery.length,
      visible: sectionVisibility.gallery ?? true,
      editHref: '/app/profile/gallery',
    },
  ]

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-teal-50)]">

      {/* Page title */}
      <div className="flex items-center justify-between px-1 pt-4">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">My Profile</h1>
      </div>

      {/* Photo strip — compact editing view */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Photos</span>
          <Link
            href="/app/profile/photos"
            className="text-xs text-[var(--color-interactive)] hover:underline"
          >
            {(profilePhotos?.length ?? 0) > 0 ? 'Edit photos' : 'Add photos'}
          </Link>
        </div>
        {(profilePhotos?.length ?? 0) > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(profilePhotos ?? []).map((p, i) => (
              <div key={p.id} className="relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
                <Image
                  src={p.photo_url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {i === 0 && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5 font-medium">
                    Main
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/app/profile/photos"
              className="shrink-0 w-[72px] h-[72px] rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-interactive)] hover:text-[var(--color-interactive)] transition-colors"
            >
              <span className="text-xl">+</span>
            </Link>
          </div>
        ) : (
          <Link
            href="/app/profile/photos"
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--color-surface-raised)] flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Add profile photos</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Show the crew who you are</p>
            </div>
          </Link>
        )}
      </div>

      {/* Hero Card — identity + share/preview */}
      <ProfileHeroCard
        displayName={displayName}
        handle={profile.handle}
        primaryRole={profile.primary_role}
        departments={departments}
        profilePhotoUrl={profile.profile_photo_url}
      />

      {/* Social links */}
      {Array.isArray(profile.social_links) && (profile.social_links as any[]).length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-4">
          <SocialLinksRow links={profile.social_links as any} />
        </div>
      )}

      {/* Profile Strength */}
      <ProfileStrength
        score={score}
        label={label}
        nextPrompt={nextPrompt}
        nextHref={strengthCta?.href}
        ctaLabel={strengthCta?.label}
      />

      {/* Section Grid */}
      <ProfileSectionGrid sections={sectionGridItems} />

      {/* Empty-state prompts for key missing sections */}
      {extended.hobbies.length === 0 && (
        <EmptyState
          icon={<Heart size={24} />}
          title="Hobbies"
          description="Show your personality beyond the deck"
          actionLabel="Add hobbies"
          actionHref="/app/hobbies/edit"
        />
      )}

      {extended.skills.length === 0 && (
        <EmptyState
          icon={<Wrench size={24} />}
          title="Extra Skills"
          description="Highlight your extra skills"
          actionLabel="Add skills"
          actionHref="/app/skills/edit"
        />
      )}

      {extended.gallery.length === 0 && (
        <EmptyState
          icon={<Camera size={24} />}
          title="Work Gallery"
          description="Show your work environment"
          actionLabel="Add photos"
          actionHref="/app/profile/gallery"
        />
      )}

    </PageTransition>
  )
}
