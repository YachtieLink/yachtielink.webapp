import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IdentityCard } from '@/components/profile/IdentityCard'
import { WheelACard, type WheelAMilestones } from '@/components/profile/WheelACard'
import { AboutSection } from '@/components/profile/AboutSection'
import { YachtsSection } from '@/components/profile/YachtsSection'
import { CertsSection } from '@/components/profile/CertsSection'
import { EndorsementsSection } from '@/components/profile/EndorsementsSection'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // ── Fetch user profile ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, display_name, handle, bio, profile_photo_url,
      primary_role, departments, onboarding_complete
    `)
    .eq('id', user.id)
    .single()

  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  // ── Fetch attachments (with yacht data) ─────────────────────────────────────
  const { data: attachments } = await supabase
    .from('attachments')
    .select(`
      id, role_label, started_at, ended_at,
      yachts ( id, name, yacht_type, flag_state )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('started_at', { ascending: false })

  // ── Fetch certifications ─────────────────────────────────────────────────────
  const { data: certs } = await supabase
    .from('certifications')
    .select(`
      id, custom_cert_name, issued_at, expires_at, document_url,
      certification_types ( name, short_name, category )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // ── Fetch endorsements received ──────────────────────────────────────────────
  const { data: endorsements } = await supabase
    .from('endorsements')
    .select(`
      id, content, created_at, yacht_id,
      endorser:endorser_id ( display_name, full_name, handle ),
      yachts ( name )
    `)
    .eq('recipient_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

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
      {/* Identity card */}
      <IdentityCard
        displayName={profile.display_name ?? profile.full_name}
        fullName={profile.full_name}
        handle={profile.handle!}
        primaryRole={profile.primary_role}
        departments={profile.departments}
        photoUrl={profile.profile_photo_url}
      />

      {/* Progress Wheel A */}
      <WheelACard milestones={milestones} />

      {/* About */}
      <AboutSection bio={profile.bio} />

      {/* Yachts */}
      <YachtsSection attachments={(attachments as any) ?? []} />

      {/* Certifications */}
      <CertsSection certs={(certs as any) ?? []} />

      {/* Endorsements */}
      <EndorsementsSection endorsements={(endorsements as any) ?? []} />

      {/* Floating CTA */}
      {nextStep ? (
        <Link
          href={nextStep.href}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--teal-500)] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg hover:bg-[var(--teal-600)] transition-colors whitespace-nowrap"
        >
          {nextStep.label} →
        </Link>
      ) : (endorsements?.length ?? 0) < 5 && (attachments?.length ?? 0) > 0 ? (
        <Link
          href="/app/endorsement/request"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--teal-500)] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg hover:bg-[var(--teal-600)] transition-colors whitespace-nowrap"
        >
          Request endorsements →
        </Link>
      ) : (
        <Link
          href={`/u/${profile.handle}`}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--teal-500)] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg hover:bg-[var(--teal-600)] transition-colors whitespace-nowrap"
        >
          Share profile →
        </Link>
      )}
    </div>
  )
}
