import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Briefcase, Award, Anchor, Heart, Wrench, Camera, Globe,
  BookOpen, FileText, Phone, Shield, Clock, ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getProfileSections, getExtendedProfileSections, getLandExperience } from '@/lib/queries/profile'
import { getProStatus } from '@/lib/stripe/pro'
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard'
import { ProfileSectionGroup } from '@/components/profile/ProfileSectionGroup'
import { ProfileSectionList, type SectionRowItem } from '@/components/profile/ProfileSectionList'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { CareerTimeline } from '@/components/profile/CareerTimeline'
import { formatSeaTime } from '@/lib/sea-time'
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

  const [profile, { attachments, certifications: certs, endorsements }, extended, { data: profilePhotos }, seaTimeRes, proStatus, landExperience] =
    await Promise.all([
      getUserById(user.id),
      getProfileSections(user.id),
      getExtendedProfileSections(user.id),
      supabase
        .from('user_photos')
        .select('id, photo_url, sort_order')
        .eq('user_id', user.id)
        .order('sort_order'),
      supabase.rpc('get_sea_time', { p_user_id: user.id }),
      getProStatus(user.id),
      getLandExperience(user.id),
    ])

  const seaTime = seaTimeRes.data as { total_days: number; yacht_count: number }[] | null
  const seaTimeTotalDays = seaTime?.[0]?.total_days ?? 0
  const seaTimeYachtCount = seaTime?.[0]?.yacht_count ?? 0

  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

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

  const strengthCta = (() => {
    if (!profile.profile_photo_url) return { label: 'Add photos', href: '/app/profile/photos' }
    if (!profile.bio) return { label: 'Write your bio', href: '/app/about/edit' }
    if ((endorsements?.length ?? 0) === 0) return { label: 'Request endorsement', href: '/app/endorsement/request' }
    if ((certs?.length ?? 0) === 0) return { label: 'Add certifications', href: '/app/certification/new' }
    return undefined
  })()

  const displayName = profile.display_name ?? profile.full_name
  const departments = (profile.departments ?? []) as string[]
  const langCount = Array.isArray(profile.languages) ? (profile.languages as any[]).length : 0
  const langSummary = langCount > 0
    ? (profile.languages as any[]).map((l: any) => l?.language ?? String(l)).join(', ')
    : ''

  // CV details summary
  const cvDetailParts = [
    profile.smoke_pref ? (profile.smoke_pref === 'non_smoker' ? 'Non-smoker' : profile.smoke_pref) : null,
    profile.appearance_note ? 'Tattoos' : null,
    profile.license_info ? 'DL' : null,
  ].filter(Boolean)
  const cvDetailsSummary = cvDetailParts.length > 0 ? cvDetailParts.join(', ') : ''

  // ── 4-Group Section Data ─────────────────────────────────────────────────

  const aboutMeSections: SectionRowItem[] = [
    {
      key: 'about',
      label: 'Bio',
      summary: aboutSummary(profile.ai_summary, profile.bio),
      count: profile.bio ? 1 : 0,
      icon: <User size={18} />,
      editHref: '/app/about/edit',
      visibilityKey: 'about',
      emptyPrompt: 'Tell your story — captains want to know who you are',
    },
    {
      key: 'skills',
      label: 'Skills',
      summary: skillsSummary(extended.skills),
      count: extended.skills.length,
      icon: <Wrench size={18} />,
      editHref: '/app/skills/edit',
      visibilityKey: 'skills',
      emptyPrompt: 'Add skills that set you apart from the crew',
    },
    {
      key: 'hobbies',
      label: 'Hobbies',
      summary: hobbiesSummary(extended.hobbies),
      count: extended.hobbies.length,
      icon: <Heart size={18} />,
      editHref: '/app/hobbies/edit',
      visibilityKey: 'hobbies',
      emptyPrompt: 'Show your personality beyond the deck',
    },
    {
      key: 'languages',
      label: 'Languages',
      summary: langSummary,
      count: langCount,
      icon: <Globe size={18} />,
      editHref: '/app/languages/edit',
      emptyPrompt: 'Add languages — multilingual crew are in demand',
    },
  ]

  const personalDetailsSections: SectionRowItem[] = [
    {
      key: 'personal',
      label: 'Personal Info',
      summary: [
        profile.dob ? `Age ${Math.floor((Date.now() - new Date(profile.dob).getTime()) / 31557600000)}` : null,
        profile.home_country,
      ].filter(Boolean).join(', ') || 'Add your details',
      count: profile.dob || profile.home_country ? 1 : 0,
      icon: <User size={18} />,
      editHref: '/app/profile/settings',
      emptyPrompt: 'Add personal details for a complete profile',
    },
    {
      key: 'contact',
      label: 'Contact & Visibility',
      summary: 'Manage who can see your info',
      count: 1,
      icon: <Phone size={18} />,
      editHref: '/app/profile/settings',
    },
    {
      key: 'cv_details',
      label: 'CV Details',
      summary: cvDetailsSummary || 'Tattoos, driving licence, smoking',
      count: cvDetailParts.length,
      icon: <FileText size={18} />,
      editHref: '/app/profile/settings',
      emptyPrompt: 'Complete your CV details — agents check these first',
    },
  ]

  const careerSections: SectionRowItem[] = [
    {
      key: 'experience',
      label: 'Experience',
      summary: experienceSummary(attachments ?? []) + (landExperience.length > 0 ? ` + ${landExperience.length} shore-side` : ''),
      count: (attachments?.length ?? 0) + landExperience.length,
      icon: <Anchor size={18} />,
      editHref: '/app/attachment',
      visibilityKey: 'experience',
      emptyPrompt: 'Add a yacht to start building your graph',
    },
    {
      key: 'certifications',
      label: 'Certifications',
      summary: certificationsSummary(certs?.length ?? 0, expiringCount),
      count: certs?.length ?? 0,
      icon: <Award size={18} />,
      editHref: '/app/certification/new',
      visibilityKey: 'certifications',
      emptyPrompt: 'Add certifications — captains search by certs first',
    },
    {
      key: 'sea_time',
      label: 'Sea Time',
      summary: seaTimeTotalDays > 0
        ? `${formatSeaTime(seaTimeTotalDays).displayShort} across ${seaTimeYachtCount} yacht${seaTimeYachtCount === 1 ? '' : 's'}`
        : 'No sea time recorded',
      count: seaTimeTotalDays > 0 ? 1 : 0,
      icon: <Clock size={18} />,
      editHref: '/app/profile/sea-time',
    },
  ]

  const mediaSections: SectionRowItem[] = [
    {
      key: 'photos',
      label: 'Profile Photo',
      summary: (profilePhotos?.length ?? 0) > 0 ? `${profilePhotos!.length} photo${profilePhotos!.length === 1 ? '' : 's'}` : 'No photos yet',
      count: profilePhotos?.length ?? 0,
      icon: <Camera size={18} />,
      editHref: '/app/profile/photos',
      visibilityKey: 'photos',
      emptyPrompt: 'Add a photo to make it yours',
    },
    {
      key: 'gallery',
      label: 'Work Gallery',
      summary: gallerySummary(extended.gallery.length),
      count: extended.gallery.length,
      icon: <ImageIcon size={18} />,
      editHref: '/app/profile/photos',
      visibilityKey: 'gallery',
      emptyPrompt: 'Show your work environment',
    },
  ]

  return (
    <PageTransition className="flex flex-col gap-2 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-teal-50)]">

      {/* Page title */}
      <div className="flex items-center justify-between px-1 pt-4">
        <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">My Profile</h1>
      </div>

      {/* Hero Card — identity + tap-to-edit + embedded strength ring */}
      <ProfileHeroCard
        displayName={displayName}
        handle={profile.handle}
        userId={profile.id}
        primaryRole={profile.primary_role}
        departments={departments}
        profilePhotoUrl={profile.profile_photo_url}
        home_country={profile.show_home_country !== false ? profile.home_country : null}
        seaTimeTotalDays={seaTimeTotalDays}
        seaTimeYachtCount={seaTimeYachtCount}
        isPro={proStatus.isPro}
        strengthScore={score}
        strengthLabel={label}
        strengthNextPrompt={nextPrompt}
        strengthCtaHref={strengthCta?.href}
        strengthCtaLabel={strengthCta?.label}
      />

      {/* ── ABOUT ME ──────────────────────────────────────────── */}
      <ProfileSectionGroup title="About Me" icon={<User size={16} />}>
        <ProfileSectionList
          sections={aboutMeSections}
          initialVisibility={sectionVisibility}
        />
      </ProfileSectionGroup>

      {/* Social links inline */}
      {Array.isArray(profile.social_links) && (profile.social_links as any[]).length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-4">
          <SocialLinksRow links={profile.social_links as any} />
        </div>
      )}

      {/* ── PERSONAL DETAILS ──────────────────────────────────── */}
      <ProfileSectionGroup title="Personal Details" icon={<Shield size={16} />}>
        <ProfileSectionList
          sections={personalDetailsSections}
          initialVisibility={sectionVisibility}
        />
      </ProfileSectionGroup>

      {/* ── CAREER ────────────────────────────────────────────── */}
      <ProfileSectionGroup title="Career" icon={<Anchor size={16} />}>
        <ProfileSectionList
          sections={careerSections}
          initialVisibility={sectionVisibility}
        />
        {/* Integrated career timeline */}
        {((attachments?.length ?? 0) > 0 || landExperience.length > 0) && (
          <div className="px-4 py-3">
            <CareerTimeline attachments={attachments ?? []} landExperience={landExperience} />
          </div>
        )}
      </ProfileSectionGroup>

      {/* ── MEDIA ─────────────────────────────────────────────── */}
      <ProfileSectionGroup title="Media" icon={<Camera size={16} />}>
        <ProfileSectionList
          sections={mediaSections}
          initialVisibility={sectionVisibility}
        />
        {/* Photo strip preview */}
        {(profilePhotos?.length ?? 0) > 0 && (
          <div className="px-4 py-3 flex gap-2 overflow-x-auto">
            {(profilePhotos ?? []).slice(0, 5).map((p, i) => (
              <div key={p.id} className="relative shrink-0 w-[56px] h-[56px] rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
                <Image
                  src={p.photo_url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </ProfileSectionGroup>

    </PageTransition>
  )
}
