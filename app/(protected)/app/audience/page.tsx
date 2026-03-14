import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  // ── Fetch colleague graph ──────────────────────────────────────────────────
  const { data: colleagueRows } = await supabase.rpc('get_colleagues', {
    p_user_id: user.id,
  })

  const rows = (colleagueRows as ColleagueRow[]) ?? []

  if (rows.length === 0) {
    return (
      <div className="px-4 pt-8 pb-24">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Colleagues</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          People you&apos;ve worked with on the water.
        </p>
        <div className="bg-[var(--color-surface-raised)] rounded-2xl p-6 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Your colleague list will populate once you and a crewmate have both attached the same
            yacht to your profiles.
          </p>
          <Link
            href="/app/attachment/new"
            className="text-sm text-[var(--ocean-500)] font-medium hover:underline"
          >
            Add a yacht →
          </Link>
        </div>
      </div>
    )
  }

  // ── Fetch profile data for each colleague ──────────────────────────────────
  const colleagueIds = rows.map((r) => r.colleague_id)
  const allYachtIds = Array.from(new Set(rows.flatMap((r) => r.shared_yachts)))

  const [profilesRes, yachtsRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, display_name, profile_photo_url, primary_role')
      .in('id', colleagueIds),
    supabase.from('yachts').select('id, name').in('id', allYachtIds),
  ])

  const profileMap = new Map<string, UserProfile>(
    ((profilesRes.data as UserProfile[]) ?? []).map((p) => [p.id, p])
  )
  const yachtMap = new Map<string, Yacht>(
    ((yachtsRes.data as Yacht[]) ?? []).map((y) => [y.id, y])
  )

  return (
    <div className="px-4 pt-8 pb-24">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Colleagues</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {rows.length} {rows.length === 1 ? 'person' : 'people'} you&apos;ve worked with on the water.
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const profile = profileMap.get(row.colleague_id)
          if (!profile) return null
          const name = profile.display_name || profile.full_name
          const sharedNames = row.shared_yachts
            .map((yid) => yachtMap.get(yid)?.name)
            .filter(Boolean) as string[]

          return (
            <div
              key={row.colleague_id}
              className="bg-[var(--card)] rounded-2xl p-4 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                {profile.profile_photo_url ? (
                  <Image
                    src={profile.profile_photo_url}
                    alt={name}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base font-semibold text-[var(--color-text-secondary)]">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{name}</p>
                {profile.primary_role && (
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {profile.primary_role}
                  </p>
                )}
                {sharedNames.length > 0 && (
                  <p className="text-xs text-[var(--ocean-500)] truncate mt-0.5">
                    {sharedNames.length === 1
                      ? sharedNames[0]
                      : `${sharedNames[0]} +${sharedNames.length - 1} more`}
                  </p>
                )}
              </div>

              {/* Request endorsement */}
              <Link
                href={`/app/endorsement/request?colleague_id=${row.colleague_id}&yacht_id=${row.shared_yachts[0]}`}
                className="shrink-0 text-xs text-[var(--ocean-500)] font-medium px-3 py-1.5 rounded-full border border-[var(--ocean-500)] hover:bg-[var(--ocean-500)]/5 transition-colors"
              >
                Endorse
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
