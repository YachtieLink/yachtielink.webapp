import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BackButton } from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function YachtDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // Fetch yacht
  const { data: yacht } = await supabase
    .from('yachts')
    .select('id, name, yacht_type, length_meters, flag_state, year_built, is_established, cover_photo_url, created_at')
    .eq('id', id)
    .single()

  if (!yacht) redirect('/app/profile')

  // Fetch attached crew (non-deleted)
  const { data: crew } = await supabase
    .from('attachments')
    .select(`
      id, role_label, started_at, ended_at,
      users!inner(id, display_name, full_name, profile_photo_url, primary_role)
    `)
    .eq('yacht_id', id)
    .is('deleted_at', null)
    .order('started_at', { ascending: false })

  // Check if current user has attachment to this yacht (gates photo upload)
  const userHasAttachment = (crew ?? []).some(
    (c: { users: { id: string } | { id: string }[] }) =>
      (Array.isArray(c.users) ? c.users[0]?.id : c.users?.id) === user.id
  )

  const crewCount = crew?.length ?? 0

  function formatYear(y: number | null) { return y ? String(y) : null }
  function formatLength(l: number | null) { return l ? `${l}m` : null }

  const metaParts = [
    yacht.yacht_type,
    formatLength(yacht.length_meters),
    yacht.flag_state,
    formatYear(yacht.year_built),
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pb-24">
      {/* Cover photo */}
      <div className="relative w-full aspect-[16/9] bg-[var(--color-surface-raised)]">
        {yacht.cover_photo_url ? (
          <Image
            src={yacht.cover_photo_url}
            alt={yacht.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">⚓</span>
          </div>
        )}
        {userHasAttachment && (
          <Link
            href={`/app/yacht/${id}/photo`}
            className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            {yacht.cover_photo_url ? 'Change photo' : '+ Add photo'}
          </Link>
        )}
      </div>

      <div className="px-4 pt-5">
        {/* Back */}
        <div className="mb-4">
          <BackButton href="/app/profile" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{yacht.name}</h1>
          {yacht.is_established && (
            <span className="shrink-0 ml-3 mt-1 text-xs bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-2 py-0.5 rounded-full font-medium">
              Established
            </span>
          )}
        </div>

        {metaParts.length > 0 && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {metaParts.join(' · ')}
          </p>
        )}

        {/* Stats row */}
        <div className="flex gap-4 mb-6">
          <div className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 flex-1 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{crewCount}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {crewCount === 1 ? 'crew member' : 'crew members'}
            </p>
          </div>
          {yacht.length_meters && (
            <div className="bg-[var(--color-surface-raised)] rounded-2xl px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{yacht.length_meters}m</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">length</p>
            </div>
          )}
        </div>

        {/* Crew list */}
        {crewCount > 0 && (
          <div className="bg-[var(--color-surface)] rounded-2xl p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Crew</h2>
            <ul className="flex flex-col divide-y divide-[var(--color-border)]">
              {(crew ?? []).map((c: {
                id: string
                role_label: string
                started_at: string
                ended_at: string | null
                users: { id: string; display_name: string | null; full_name: string; profile_photo_url: string | null; primary_role: string | null } | Array<{ id: string; display_name: string | null; full_name: string; profile_photo_url: string | null; primary_role: string | null }>
              }) => {
                const member = Array.isArray(c.users) ? c.users[0] : c.users
                if (!member) return null
                const name = member.display_name || member.full_name
                const isCurrentUser = member.id === user.id
                const start = new Date(c.started_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                const end = c.ended_at
                  ? new Date(c.ended_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                  : 'Present'

                return (
                  <li key={c.id} className="py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0">
                      {member.profile_photo_url ? (
                        <Image
                          src={member.profile_photo_url}
                          alt={name}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
                          {name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {name}{isCurrentUser ? ' (you)' : ''}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {c.role_label} · {start}–{end}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Add attachment CTA for current user if not already attached */}
        {!userHasAttachment && (
          <Link
            href={`/app/attachment/new`}
            className="mt-4 block w-full text-center py-3 rounded-2xl border border-[var(--color-interactive)] text-[var(--color-interactive)] text-sm font-medium hover:bg-[var(--color-interactive)]/5 transition-colors"
          >
            + Add this yacht to my profile
          </Link>
        )}
      </div>
    </div>
  )
}
