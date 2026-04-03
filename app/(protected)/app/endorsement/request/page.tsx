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
  created_at: string
  reminded_at: string | null
  yacht_id: string
}

interface GhostProfile {
  id: string
  full_name: string
  primary_role: string | null
  yacht_id: string
}

interface Attachment {
  id: string
  yacht_id: string
  start_date: string | null
  end_date: string | null
  role_title: string | null
  yachts: { id: string; name: string; yacht_type: string | null; cover_photo_url: string | null } | null
}

function buildColleagueName(fullName: string, displayName: string | null): string {
  if (!displayName) return fullName
  const firstName = fullName.split(' ')[0]
  if (displayName === firstName) return fullName
  const rest = fullName.split(' ').slice(1).join(' ')
  return rest ? `${firstName} '${displayName}' ${rest}` : `${firstName} '${displayName}'`
}

export default async function RequestEndorsementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // Fetch all data in parallel
  const [
    attachmentsRes,
    colleagueRowsRes,
    existingRequestsRes,
    endorsementsGivenRes,
    todayCountRes,
    userSubRes,
    ghostsRes,
  ] = await Promise.all([
    supabase
      .from('attachments')
      .select('id, yacht_id, start_date, end_date, role_title, yachts ( id, name, yacht_type, cover_photo_url )')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('start_date', { ascending: false }),
    supabase.rpc('get_colleagues', { p_user_id: user.id }),
    supabase
      .from('endorsement_requests')
      .select('id, recipient_user_id, recipient_email, status, expires_at, cancelled_at, created_at, reminded_at, yacht_id')
      .eq('requester_id', user.id),
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
    supabase
      .from('ghost_profiles')
      .select('id, full_name, primary_role, yacht_id')
      .eq('created_by', user.id)
      .eq('account_status', 'ghost'),
  ])

  const attachments = (attachmentsRes.data as unknown as Attachment[]) ?? []
  const yachtAttachments = attachments.filter((a) => a.yachts)

  if (yachtAttachments.length === 0) {
    redirect('/app/attachment/new')
  }

  // Build yacht list (ordered by most recent)
  const yachtMap = new Map<string, {
    id: string
    name: string
    yachtType: string | null
    coverPhotoUrl: string | null
    startDate: string | null
    endDate: string | null
    userRole: string | null
  }>()
  for (const att of yachtAttachments) {
    if (!att.yachts) continue
    if (!yachtMap.has(att.yachts.id)) {
      yachtMap.set(att.yachts.id, {
        id: att.yachts.id,
        name: att.yachts.name,
        yachtType: att.yachts.yacht_type,
        coverPhotoUrl: att.yachts.cover_photo_url,
        startDate: att.start_date,
        endDate: att.end_date,
        userRole: att.role_title,
      })
    }
  }
  const yachts = Array.from(yachtMap.values())

  // Build colleague data grouped by yacht
  const allColleagueRows = (colleagueRowsRes.data as ColleagueRow[]) ?? []
  const allColleagueIds = [...new Set(allColleagueRows.map((r) => r.colleague_id))]

  const profilesRes = allColleagueIds.length > 0
    ? await supabase
        .from('users')
        .select('id, display_name, full_name, email, profile_photo_url, primary_role')
        .in('id', allColleagueIds)
    : { data: [] }

  const profileMap = new Map<string, UserProfile>()
  for (const p of (profilesRes.data as UserProfile[]) ?? []) {
    profileMap.set(p.id, p)
  }

  const existingRequests = (existingRequestsRes.data as EndorsementRequest[]) ?? []
  const endorsedRecipientIds = new Set(
    ((endorsementsGivenRes.data as { recipient_id: string }[]) ?? []).map((e) => e.recipient_id)
  )
  const ghosts = (ghostsRes.data as GhostProfile[]) ?? []

  const todayCount = (todayCountRes.data as number | null) ?? 0
  const subscriptionStatus = userSubRes.data?.subscription_status as string | undefined
  const limit = subscriptionStatus === 'pro' ? 20 : 10
  const remaining = Math.max(0, limit - todayCount)

  // Build yacht groups with colleagues
  type ColleagueOption = {
    id: string
    name: string
    email: string | null
    profilePhotoUrl: string | null
    primaryRole: string | null
    existingRequestStatus: 'pending' | 'accepted' | 'expired' | 'cancelled' | null
    alreadyEndorsed: boolean
    isGhost: boolean
    requestCreatedAt: string | null
    remindedAt: string | null
  }

  type YachtGroup = {
    id: string
    name: string
    yachtType: string | null
    coverPhotoUrl: string | null
    startDate: string | null
    endDate: string | null
    userRole: string | null
    colleagues: ColleagueOption[]
  }

  function getRequestStatus(
    colleagueId: string,
    colleagueEmail: string | null,
    yachtId: string
  ): { status: 'pending' | 'accepted' | 'expired' | 'cancelled' | null; createdAt: string | null; remindedAt: string | null } {
    const req = existingRequests.find(
      (r) => r.yacht_id === yachtId && (r.recipient_user_id === colleagueId || (colleagueEmail && r.recipient_email === colleagueEmail))
    )
    if (!req) return { status: null, createdAt: null, remindedAt: null }
    if (req.cancelled_at) return { status: 'cancelled', createdAt: req.created_at, remindedAt: req.reminded_at }
    if (req.status === 'accepted') return { status: 'accepted', createdAt: req.created_at, remindedAt: req.reminded_at }
    if (new Date(req.expires_at) < new Date()) return { status: 'expired', createdAt: req.created_at, remindedAt: req.reminded_at }
    return { status: 'pending', createdAt: req.created_at, remindedAt: req.reminded_at }
  }

  const yachtGroups: YachtGroup[] = yachts.map((yacht) => {
    // Real colleagues on this yacht
    const yachtColleagueIds = allColleagueRows
      .filter((r) => r.shared_yachts.includes(yacht.id))
      .map((r) => r.colleague_id)

    const realColleagues: ColleagueOption[] = yachtColleagueIds
      .map((cid) => {
        const profile = profileMap.get(cid)
        if (!profile) return null
        const reqInfo = getRequestStatus(profile.id, profile.email, yacht.id)
        return {
          id: profile.id,
          name: buildColleagueName(profile.full_name, profile.display_name),
          email: profile.email as string | null,
          profilePhotoUrl: profile.profile_photo_url,
          primaryRole: profile.primary_role,
          existingRequestStatus: reqInfo.status,
          alreadyEndorsed: endorsedRecipientIds.has(profile.id),
          isGhost: false as const,
          requestCreatedAt: reqInfo.createdAt,
          remindedAt: reqInfo.remindedAt,
        } satisfies ColleagueOption
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    // Ghost colleagues on this yacht
    const yachtGhosts: ColleagueOption[] = ghosts
      .filter((g) => g.yacht_id === yacht.id)
      .map((g) => ({
        id: g.id,
        name: g.full_name,
        email: null,
        profilePhotoUrl: null,
        primaryRole: g.primary_role,
        existingRequestStatus: null,
        alreadyEndorsed: false,
        isGhost: true,
        requestCreatedAt: null,
        remindedAt: null,
      }))

    return {
      ...yacht,
      colleagues: [...realColleagues, ...yachtGhosts],
    }
  })

  return (
    <RequestEndorsementClient
      yachtGroups={yachtGroups}
      remaining={remaining}
      limit={limit}
      userId={user.id}
    />
  )
}
