import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getProfileSections, getExtendedProfileSections } from '@/lib/queries/profile'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ProfileStrength } from '@/components/profile/ProfileStrength'
import { SectionManager } from '@/components/profile/SectionManager'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { EndorsementsSection } from '@/components/profile/EndorsementsSection'
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

  const sectionConfigs = [
    { key: 'about' as const,          label: 'About',           editHref: '/app/about/edit',          addHref: '/app/about/edit',          hasData: !!profile.bio },
    { key: 'experience' as const,     label: 'Experience',      editHref: '/app/attachment/new',      addHref: '/app/attachment/new',      hasData: (attachments?.length ?? 0) > 0 },
    { key: 'endorsements' as const,   label: 'Endorsements',    editHref: undefined,                  addHref: '/app/endorsement/request', hasData: (endorsements?.length ?? 0) > 0 },
    { key: 'certifications' as const, label: 'Certifications',  editHref: '/app/certification/new',  addHref: '/app/certification/new',  hasData: (certs?.length ?? 0) > 0 },
    { key: 'education' as const,      label: 'Education',       editHref: '/app/education/new',       addHref: '/app/education/new',       hasData: extended.education.length > 0 },
    { key: 'hobbies' as const,        label: 'Hobbies',         editHref: '/app/hobbies/edit',        addHref: '/app/hobbies/edit',        hasData: extended.hobbies.length > 0 },
    { key: 'skills' as const,         label: 'Extra Skills',    editHref: '/app/skills/edit',         addHref: '/app/skills/edit',         hasData: extended.skills.length > 0 },
    { key: 'photos' as const,         label: 'Photos',          editHref: '/app/profile/photos',      addHref: '/app/profile/photos',      hasData: (profilePhotos?.length ?? 0) > 0 },
    { key: 'gallery' as const,        label: 'Work Gallery',    editHref: '/app/profile/gallery',     addHref: '/app/profile/gallery',     hasData: extended.gallery.length > 0 },
  ]

  const nextStepHref = (() => {
    if (!profile.profile_photo_url) return '/app/profile/photos'
    if (!profile.primary_role) return '/app/more/account'
    if (!profile.bio) return '/app/about/edit'
    if ((attachments?.length ?? 0) === 0) return '/app/attachment/new'
    if ((certs?.length ?? 0) === 0) return '/app/certification/new'
    return undefined
  })()

  return (
    <PageTransition className="flex flex-col gap-3 pb-24">

      {/* Page title */}
      <div className="flex items-center justify-between px-1">
        <h1 className="font-serif text-lg text-[var(--color-text-primary)]">My Profile</h1>
        <Link
          href={`/u/${profile.handle}`}
          className="text-xs text-[var(--color-interactive)] hover:underline"
        >
          👁 Preview →
        </Link>
      </div>

      {/* Photo strip — compact editing view */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-3 flex flex-col gap-2">
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

      {/* Identity */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              {profile.display_name ?? profile.full_name}
            </h2>
            {profile.primary_role && (
              <p className="text-sm text-[var(--color-text-secondary)]">{profile.primary_role}</p>
            )}
            {profile.departments && profile.departments.length > 0 && (
              <p className="text-xs text-[var(--color-text-secondary)]">{profile.departments.join(' · ')}</p>
            )}
          </div>
          <Link href="/app/more/account" className="text-xs text-[var(--color-interactive)] hover:underline shrink-0 ml-3">
            Edit
          </Link>
        </div>

        {/* Profile URL */}
        <Link
          href={`/u/${profile.handle}`}
          className="text-sm text-[var(--color-interactive)] hover:underline"
        >
          yachtie.link/u/{profile.handle}
        </Link>

        {/* Social links */}
        {Array.isArray(profile.social_links) && (profile.social_links as any[]).length > 0 && (
          <SocialLinksRow links={profile.social_links as any} />
        )}
      </div>

      {/* Profile Strength */}
      <ProfileStrength
        score={score}
        label={label}
        nextPrompt={nextPrompt}
        nextHref={nextStepHref}
      />

      {/* Section Manager */}
      <SectionManager
        visibility={sectionVisibility as any}
        sections={sectionConfigs}
      />

      {/* Accordion sections (own profile view — all shown, with edit buttons) */}
      <ProfileAccordion
        title="About"
        summary={aboutSummary(profile.ai_summary, profile.bio)}
        editHref="/app/about/edit"
      >
        {profile.ai_summary || profile.bio ? (
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
            {profile.ai_summary ?? profile.bio}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No bio yet. <Link href="/app/about/edit" className="text-[var(--color-interactive)] underline">Add one →</Link></p>
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Experience"
        summary={experienceSummary(attachments ?? [])}
        editHref="/app/attachment/new"
      >
        {(attachments?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-3">
            {attachments!.map((att: any) => (
              <div key={att.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-interactive)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {att.yachts?.name ?? 'Unknown Yacht'}
                    {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
                  </p>
                  {(att.started_at || att.ended_at) && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {att.started_at ? new Date(att.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
                      {att.started_at ? ' – ' : ''}
                      {att.ended_at ? new Date(att.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No yachts added. <Link href="/app/attachment/new" className="text-[var(--color-interactive)] underline">Add your first →</Link></p>
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Endorsements"
        summary={endorsementsSummary(endorsements?.length ?? 0, 0)}
      >
        {(endorsements?.length ?? 0) > 0 ? (
          <EndorsementsSection endorsements={endorsements as any} />
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No endorsements yet. <Link href="/app/endorsement/request" className="text-[var(--color-interactive)] underline">Request one →</Link></p>
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Certifications"
        summary={certificationsSummary(certs?.length ?? 0, expiringCount)}
        editHref="/app/certification/new"
      >
        {(certs?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-2">
            {certs!.map((cert: any) => {
              const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
              return (
                <p key={cert.id} className="text-sm text-[var(--color-text-primary)]">{name}</p>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No certs added. <Link href="/app/certification/new" className="text-[var(--color-interactive)] underline">Add one →</Link></p>
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Education"
        summary={educationSummary(extended.education)}
        editHref="/app/education/new"
      >
        {extended.education.length > 0 ? (
          <div className="flex flex-col gap-3">
            {extended.education.map((edu) => (
              <div key={edu.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
                  {edu.qualification && <p className="text-sm text-[var(--color-text-secondary)]">{edu.qualification}</p>}
                </div>
                <Link href={`/app/education/${edu.id}/edit`} className="text-xs text-[var(--color-interactive)] shrink-0">Edit</Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState variant="inline" title="No education added" actionLabel="Add education" actionHref="/app/education/new" />
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Hobbies"
        summary={hobbiesSummary(extended.hobbies)}
        editHref="/app/hobbies/edit"
      >
        {extended.hobbies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {extended.hobbies.map((h) => (
              <span key={h.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
                {h.emoji ? `${h.emoji} ${h.name}` : h.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No hobbies added. <Link href="/app/hobbies/edit" className="text-[var(--color-interactive)] underline">Add →</Link></p>
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Extra Skills"
        summary={skillsSummary(extended.skills)}
        editHref="/app/skills/edit"
      >
        {extended.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {extended.skills.map((s) => (
              <span key={s.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
                {s.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No skills added. <Link href="/app/skills/edit" className="text-[var(--color-interactive)] underline">Add →</Link></p>
        )}
      </ProfileAccordion>

      <ProfileAccordion
        title="Work Gallery"
        summary={gallerySummary(extended.gallery.length)}
        editHref="/app/profile/gallery"
      >
        {extended.gallery.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {extended.gallery.slice(0, 9).map((item) => (
              <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
                <img src={(item as any).image_url} alt={(item as any).caption ?? 'Gallery'} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No gallery photos. <Link href="/app/profile/gallery" className="text-[var(--color-interactive)] underline">Add →</Link></p>
        )}
      </ProfileAccordion>

    </PageTransition>
  )
}
