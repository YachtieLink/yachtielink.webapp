import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AudienceTabs } from '@/components/audience/AudienceTabs'

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
}

interface Yacht {
  id: string
  name: string
}

export default async function AudiencePage() {
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
      .select('id, token, recipient_email, recipient_phone, status, expires_at, cancelled_at, yacht:yachts!yacht_id(name)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('endorsements')
      .select('recipient_id, yacht_id')
      .eq('endorser_id', user.id)
      .is('deleted_at', null),
  ])

  const colleagueRows = (colleaguesRes.data as ColleagueRow[]) ?? []

  // Fetch colleague profiles and yacht names
  const colleagueIds = colleagueRows.map((r) => r.colleague_id)
  const allYachtIds = Array.from(new Set(colleagueRows.flatMap((r) => r.shared_yachts)))

  const [profilesRes, yachtsRes] = await Promise.all([
    colleagueIds.length > 0
      ? supabase
          .from('users')
          .select('id, full_name, display_name, profile_photo_url, primary_role')
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
    sharedYachtNames: row.shared_yachts
      .map((yid) => yachtMap.get(yid)?.name)
      .filter((n): n is string => !!n),
  }))

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
    status: string
    expires_at: string
    cancelled_at: string | null
    yacht: { name: string } | null
  }

  const endorsementsReceived = (endorsementsReceivedRes.data as unknown as EndorsementReceived[]) ?? []
  const requestsReceived = (requestsReceivedRes.data as unknown as RequestReceived[]) ?? []
  const requestsSent = (requestsSentRes.data as unknown as RequestSent[]) ?? []

  return (
    <AudienceTabs
      endorsementsReceived={endorsementsReceived}
      requestsReceived={requestsReceived}
      requestsSent={requestsSent}
      colleagues={colleagues}
      mostRecentYachtId={mostRecentYachtId}
    />
  )
}
