import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RequestEndorsementClient } from './RequestEndorsementClient'

interface ColleagueRow {
  colleague_id: string
  shared_yachts: string[]
}

interface UserProfile {
  id: string
  display_name: string | null
  full_name: string
  email: string
  profile_photo_url: string | null
  primary_role: string | null
}

interface EndorsementRequest {
  id: string
  recipient_user_id: string | null
  recipient_email: string | null
  status: string
  expires_at: string
  cancelled_at: string | null
}

interface ExistingEndorsement {
  recipient_id: string
}

interface Attachment {
  id: string
  yacht_id: string
  yachts: { id: string; name: string; yacht_type: string | null; cover_photo_url: string | null } | null
}

export default async function RequestEndorsementPage({
  searchParams,
}: {
  searchParams: Promise<{ yacht_id?: string; colleague_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const { yacht_id, colleague_id } = await searchParams

  // If no yacht_id, show a yacht picker
  if (!yacht_id) {
    const { data: attachments } = await supabase
      .from('attachments')
      .select('id, yacht_id, yachts ( id, name, yacht_type, cover_photo_url )')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('started_at', { ascending: false })

    const yachts = (attachments as unknown as Attachment[])?.filter((a) => a.yachts) ?? []

    if (yachts.length === 0) {
      redirect('/app/attachment/new')
    }

    if (yachts.length === 1) {
      redirect(`/app/endorsement/request?yacht_id=${yachts[0].yachts!.id}`)
    }

    return (
      <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Request endorsements
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Which yacht would you like endorsements for?
        </p>
        <div className="flex flex-col gap-3">
          {yachts.map((att) => (
            <Link
              key={att.id}
              href={`/app/endorsement/request?yacht_id=${att.yachts!.id}`}
              className="bg-[var(--color-surface)] rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {att.yachts!.name}
                </p>
                {att.yachts!.yacht_type && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {att.yachts!.yacht_type}
                  </p>
                )}
              </div>
              <svg className="h-5 w-5 text-[var(--color-text-tertiary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Yacht-specific request page
  const [
    yachtRes,
    colleagueRowsRes,
    existingRequestsRes,
    endorsementsGivenRes,
    todayCountRes,
    userSubRes,
  ] = await Promise.all([
    supabase
      .from('yachts')
      .select('id, name, yacht_type, cover_photo_url')
      .eq('id', yacht_id)
      .single(),
    supabase.rpc('get_colleagues', { p_user_id: user.id }),
    supabase
      .from('endorsement_requests')
      .select('id, recipient_user_id, recipient_email, status, expires_at, cancelled_at')
      .eq('requester_id', user.id)
      .eq('yacht_id', yacht_id),
    supabase
      .from('endorsements')
      .select('recipient_id')
      .eq('endorser_id', user.id)
      .is('deleted_at', null),
    supabase.rpc('endorsement_requests_today', { p_user_id: user.id }),
    supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single(),
  ])

  const yacht = yachtRes.data
  if (!yacht) redirect('/app/network')

  // Filter colleagues to those who share this yacht
  const allColleagueRows = (colleagueRowsRes.data as ColleagueRow[]) ?? []
  const relevantColleagueIds = allColleagueRows
    .filter((r) => r.shared_yachts.includes(yacht_id))
    .map((r) => r.colleague_id)

  // Fetch profiles for relevant colleagues (including email for direct requests)
  const profilesRes =
    relevantColleagueIds.length > 0
      ? await supabase
          .from('users')
          .select('id, display_name, full_name, email, profile_photo_url, primary_role')
          .in('id', relevantColleagueIds)
      : { data: [] }

  const existingRequests = (existingRequestsRes.data as EndorsementRequest[]) ?? []
  const endorsementsGiven = (endorsementsGivenRes.data as ExistingEndorsement[]) ?? []
  const todayCount = (todayCountRes.data as number | null) ?? 0
  const subscriptionStatus = userSubRes.data?.subscription_status as string | undefined

  const limit = subscriptionStatus === 'pro' ? 20 : 10
  const remaining = Math.max(0, limit - todayCount)

  const endorsedRecipientIds = new Set(endorsementsGiven.map((e) => e.recipient_id))

  // Build colleague options with status info
  const colleagues = ((profilesRes.data as UserProfile[]) ?? []).map((profile) => {
    const name = profile.display_name ?? profile.full_name
    const alreadyEndorsed = endorsedRecipientIds.has(profile.id)

    // Check for existing request to this colleague (by user_id or email)
    let existingRequestStatus: 'pending' | 'accepted' | 'expired' | 'cancelled' | null = null
    const matchedReq = existingRequests.find(
      (r) => r.recipient_user_id === profile.id || r.recipient_email === profile.email
    )
    if (matchedReq) {
      if (matchedReq.cancelled_at) {
        existingRequestStatus = 'cancelled'
      } else if (matchedReq.status === 'accepted') {
        existingRequestStatus = 'accepted'
      } else if (new Date(matchedReq.expires_at) < new Date()) {
        existingRequestStatus = 'expired'
      } else {
        existingRequestStatus = 'pending'
      }
    }

    return {
      id: profile.id,
      name,
      email: profile.email,
      profile_photo_url: profile.profile_photo_url,
      primary_role: profile.primary_role,
      existingRequestStatus,
      alreadyEndorsed,
    }
  })

  return (
    <RequestEndorsementClient
      yacht={{
        id: yacht.id,
        name: yacht.name,
        yacht_type: yacht.yacht_type as string | null,
        cover_photo_url: yacht.cover_photo_url as string | null,
      }}
      colleagues={colleagues}
      remaining={remaining}
      limit={limit}
      userId={user.id}
      initialColleagueId={colleague_id}
    />
  )
}
