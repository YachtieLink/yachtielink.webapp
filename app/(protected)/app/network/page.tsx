import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NetworkUnifiedView } from '@/components/network/NetworkUnifiedView'
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

  const [
    colleaguesRes,
    endorsementsReceivedRes,
    endorsementsGivenRes,
    requestsSentRes,
    userYachtsRes,
    ghostsRes,
  ] = await Promise.all([
    supabase.rpc('get_colleagues', { p_user_id: user.id }),
    supabase
      .from('endorsements')
      .select('id, endorser:users!endorser_id(id), yacht:yachts!yacht_id(id)')
      .eq('recipient_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('endorsements')
      .select('recipient_id')
      .eq('endorser_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('endorsement_requests')
      .select('id, recipient_user_id, status, cancelled_at, yacht:yachts!yacht_id(name)')
      .eq('requester_id', user.id)
      .is('cancelled_at', null)
      .in('status', ['pending']),
    supabase
      .from('attachments')
      .select('id, role_label, started_at, ended_at, yachts(id, name, yacht_type, length_meters, flag_state, is_established)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('ghost_profiles')
      .select('id, full_name, primary_role, yacht_id')
      .eq('created_by', user.id)
      .eq('account_status', 'ghost'),
  ])

  const colleagueRows = (colleaguesRes.data as ColleagueRow[]) ?? []

  // Fetch colleague profiles
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

  type UserYacht = {
    id: string
    role_label: string
    started_at: string
    ended_at: string | null
    yachts: {
      id: string; name: string; yacht_type: string | null; length_meters: number | null
      flag_state: string | null; is_established: boolean
    } | null
  }

  const userYachts = ((userYachtsRes.data as unknown as UserYacht[]) ?? []).filter((a) => a.yachts)

  // Endorsement stats
  const endorsementsReceived = (endorsementsReceivedRes.data as unknown as Array<{ id: string; endorser: { id: string } | null }>) ?? []
  const endorsementsGivenCount = ((endorsementsGivenRes.data as unknown as Array<{ recipient_id: string }>) ?? []).length
  const pendingRequests = (requestsSentRes.data as unknown as Array<{ id: string; recipient_user_id: string | null; status: string; cancelled_at: string | null }>) ?? []

  // Build endorsed/pending colleague ID sets for status indicators
  const endorsedColleagueIds = new Set(
    endorsementsReceived
      .map((e) => e.endorser?.id)
      .filter((id): id is string => !!id)
  )
  const pendingColleagueIds = new Set(
    pendingRequests
      .filter((r) => r.recipient_user_id && r.status === 'pending')
      .map((r) => r.recipient_user_id!)
  )

  // Ghost suggestions
  const ghostSuggestions = ((ghostsRes.data as Array<{ id: string; full_name: string; primary_role: string | null; yacht_id: string }>) ?? [])

  return (
    <PageTransition className="flex flex-col gap-4">
      {/* Header with bookmark icon */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)]">
          My Network
        </h1>
        <Link
          href="/app/network/saved"
          className="p-2 rounded-xl hover:bg-[var(--color-surface-raised)] transition-colors"
          title="Saved Profiles"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)]">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </Link>
      </div>

      {/* Navy wayfinding background */}
      <div className="min-h-screen bg-[var(--color-navy-50)] -mx-4 px-4 md:-mx-6 md:px-6 pt-4 pb-24 -mt-2">
        <NetworkUnifiedView
          colleagues={colleagues}
          userYachts={userYachts}
          endorsementsReceivedCount={endorsementsReceived.length}
          endorsementsGivenCount={endorsementsGivenCount}
          pendingRequestsCount={pendingRequests.length}
          endorsedColleagueIds={endorsedColleagueIds}
          pendingColleagueIds={pendingColleagueIds}
          ghostSuggestions={ghostSuggestions}
        />
      </div>
    </PageTransition>
  )
}
