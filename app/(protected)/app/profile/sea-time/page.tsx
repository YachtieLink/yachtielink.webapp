import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SeaTimeBreakdown } from '@/components/profile/SeaTimeBreakdown'
import { PageTransition } from '@/components/ui/PageTransition'
import Link from 'next/link'

interface SeaTimeDetailedRow {
  yacht_id: string
  yacht_name: string
  role_label: string
  started_at: string
  ended_at: string | null
  days: number
  is_current: boolean
}

interface YachtTypeRow {
  id: string
  yacht_type: string | null
}

export default async function SeaTimePage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')
  const user = authUser

  const { data: entries } = await supabase.rpc('get_sea_time_detailed', { p_user_id: user.id })

  const seaTimeEntries = (entries as SeaTimeDetailedRow[]) ?? []
  const totalDays = seaTimeEntries.reduce((sum, e) => sum + e.days, 0)

  // Fetch yacht types for prefix display
  const yachtIds = [...new Set(seaTimeEntries.map(e => e.yacht_id))]
  const { data: yachtTypes } = yachtIds.length > 0
    ? await supabase.from('yachts').select('id, yacht_type').in('id', yachtIds)
    : { data: [] }
  const yachtTypeMap = new Map((yachtTypes as YachtTypeRow[] ?? []).map(y => [y.id, y.yacht_type]))

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <PageHeader backHref="/app/profile" title="Sea Time" />

      {seaTimeEntries.length > 0 ? (
        <SeaTimeBreakdown entries={seaTimeEntries} totalDays={totalDays} yachtTypeMap={yachtTypeMap} />
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚓</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Add a yacht to your profile to start tracking sea time.
          </p>
          <Link
            href="/app/attachment/new"
            className="inline-block text-sm text-[var(--color-interactive)] font-medium hover:underline"
          >
            + Add a yacht
          </Link>
        </div>
      )}
    </PageTransition>
  )
}
