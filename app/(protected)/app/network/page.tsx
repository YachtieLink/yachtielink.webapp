import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AudienceTabs, type UserYacht } from '@/components/audience/AudienceTabs'
import { PageTransition } from '@/components/ui/PageTransition'

interface ColleagueRow {
  colleague_id: string
  shared_yachts: string[]
}

interface UserProfile {
  id: string
  full_name: string
  display_name: string | null
  profile_photo_url: string | null
  primary_role: string | null
  handle: string | null
}

interface Yacht {
  id: string
  name: string
}

export default async function NetworkPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const userEmail = user.email ?? ''

  const [
    colleaguesRes,
    endorsementsReceivedRes,
    requestsReceivedRes,
    requestsSentRes,
    endorsementsGivenRes,
    userYachtsRes,
    mostRecentEndorsementRes,
  ] = await Promise.all([
    supabase.rpc('get_colleagues', { p_user_id: user.id }),
    supabase
      .from('endorsements')
      .select('id, content, created_at, endorser:users!endorser_id(id, display_name, full_name, profile_photo_url), yacht:yachts!yacht_id(id, name)')
      .eq('recipient_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsement_requests')
      .select('id, token, yacht_id, status, expires_at, cancelled_at, requester:users!requester_id(display_name, full_name, profile_photo_url), yacht:yachts!yacht_id(name)')
      .or(
        userEmail
          ? `recipient_user_id.eq.${user.id},recipient_email.eq.${userEmail}`
          : `recipient_user_id.eq.${user.id}`
      )
      .is('cancelled_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsement_requests')
      .select('id, token, recipient_email, recipient_phone, recipient_user_id, status, expires_at, cancelled_at, yacht:yachts!yacht_id(name), recipient:users!recipient_user_id(display_name, full_name)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select('recipient_id, yacht_id')
      .eq('endorser_id', user.id)
      .is('deleted_at', null),
    // User's yacht attachments (for Yachts tab)
    supabase
      .from('attachments')
      .select('id, role_label, started_at, ended_at, yachts(id, name, yacht_type, length_meters, flag_state, is_established)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    // Most recent endorsement date (for EndorsementBanner staleness check)
    supabase
      .from('endorsements')
      .select('created_at')
      .eq('recipient_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const colleagueRows = (colleaguesRes.data as ColleagueRow[]) ?? []

  // Fetch colleague profiles and yacht names
  const colleagueIds = colleagueRows.map((r) => r.colleague_id)
  const allYachtIds = Array.from(new Set(colleagueRows.flatMap((r) => r.shared_yachts)))

  const [profilesRes, yachtsRes] = await Promise.all([
    colleagueIds.length > 0
      ? supabase
          .from('users')
          .select('id, full_name, display_name, profile_photo_url, primary_role, handle')
          .in('id', colleagueIds)
      : Promise.resolve({ data: [] }),
    allYachtIds.length > 0
      ? supabase.from('yachts').select('id, name').in('id', allYachtIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map<string, UserProfile>(
    ((profilesRes.data as UserProfile[]) ?? []).map((p) => [p.id, p])
  )
  const yachtMap = new Map<string, Yacht>(
    ((yachtsRes.data as Yacht[]) ?? []).map((y) => [y.id, y])
  )

  const colleagues = colleagueRows.map((row) => ({
    colleague_id: row.colleague_id,
    shared_yachts: row.shared_yachts,
    profile: profileMap.get(row.colleague_id) ?? null,
    sharedYachtDetails: row.shared_yachts
      .map((yid) => { const y = yachtMap.get(yid); return y ? { id: y.id, name: y.name } : null })
      .filter((y): y is { id: string; name: string } => !!y),
  }))

  const userYachts = ((userYachtsRes.data as unknown as UserYacht[]) ?? []).filter((a) => a.yachts)

  // Most recent yacht id for the wheel sheet CTA
  const mostRecentYachtId = colleagueRows[0]?.shared_yachts[0] ?? null

  // Type cast fetched data
  type EndorsementReceived = {
    id: string
    content: string
    created_at: string
    endorser: { id: string; display_name: string | null; full_name: string; profile_photo_url: string | null } | null
    yacht: { id: string; name: string } | null
  }

  type RequestReceived = {
    id: string
    token: string
    yacht_id: string
    status: string
    expires_at: string
    cancelled_at: string | null
    requester: { display_name: string | null; full_name: string; profile_photo_url: string | null } | null
    yacht: { name: string } | null
  }

  type RequestSent = {
    id: string
    token: string
    recipient_email: string | null
    recipient_phone: string | null
    recipient_user_id: string | null
    recipient: { display_name: string | null; full_name: string | null } | null
    status: string
    expires_at: string
    cancelled_at: string | null
    yacht: { name: string } | null
  }

  const endorsementsReceived = (endorsementsReceivedRes.data as unknown as EndorsementReceived[]) ?? []
  const requestsReceived = (requestsReceivedRes.data as unknown as RequestReceived[]) ?? []
  const requestsSent = (requestsSentRes.data as unknown as RequestSent[]) ?? []

  const mostRecentEndorsementDate =
    (mostRecentEndorsementRes.data as { created_at: string } | null)?.created_at ?? null

  return (
    <PageTransition className="flex flex-col gap-4">
      <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">Network</h1>
    <AudienceTabs
      endorsementsReceived={endorsementsReceived}
      requestsReceived={requestsReceived}
      requestsSent={requestsSent}
      colleagues={colleagues}
      mostRecentYachtId={mostRecentYachtId}
      userYachts={userYachts}
      mostRecentEndorsementDate={mostRecentEndorsementDate}
    />
    </PageTransition>
  )
}
