import { redirect } from 'next/navigation'
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
  profile_photo_url: string | null
  primary_role: string | null
}

interface EndorsementRequest {
  id: string
  recipient_email: string | null
  status: string
  expires_at: string
  cancelled_at: string | null
}

interface ExistingEndorsement {
  recipient_id: string
}

export default async function RequestEndorsementPage({
  searchParams,
}: {
  searchParams: Promise<{ yacht_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const { yacht_id } = await searchParams
  if (!yacht_id) redirect('/app/audience')

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
      .select('id, recipient_email, status, expires_at, cancelled_at')
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
  if (!yacht) redirect('/app/audience')

  // Filter colleagues to those who share this yacht
  const allColleagueRows = (colleagueRowsRes.data as ColleagueRow[]) ?? []
  const relevantColleagueIds = allColleagueRows
    .filter((r) => r.shared_yachts.includes(yacht_id))
    .map((r) => r.colleague_id)

  // Fetch profiles for relevant colleagues
  const profilesRes =
    relevantColleagueIds.length > 0
      ? await supabase
          .from('users')
          .select('id, display_name, full_name, profile_photo_url, primary_role')
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
    const existingReq = existingRequests.find(() => false) // colleagues don't have email-linked requests
    const name = profile.display_name ?? profile.full_name

    // Check if there's a pending/accepted request — since we don't store recipient_user_id yet
    // we use the colleague id to check endorsements given
    const alreadyEndorsed = endorsedRecipientIds.has(profile.id)

    // Find request status based on email match (may be null if no email)
    let existingRequestStatus: 'pending' | 'accepted' | 'expired' | 'cancelled' | null = null
    const matched = existingReq
    if (matched) {
      if (matched.cancelled_at) {
        existingRequestStatus = 'cancelled'
      } else if (matched.status === 'accepted') {
        existingRequestStatus = 'accepted'
      } else if (new Date(matched.expires_at) < new Date()) {
        existingRequestStatus = 'expired'
      } else {
        existingRequestStatus = 'pending'
      }
    }

    return {
      id: profile.id,
      name,
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
    />
  )
}
