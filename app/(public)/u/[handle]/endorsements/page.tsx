import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserByHandle, getPublicProfileSections } from '@/lib/queries/profile'
import { EndorsementsPageClient } from './EndorsementsPageClient'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) return { title: 'Not Found' }
  const name = user.display_name || user.full_name
  return { title: `Endorsements — ${name} — YachtieLink` }
}

export default async function EndorsementsPage({ params }: Props) {
  const { handle } = await params
  const supabase = await createClient()
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const { endorsements } = await getPublicProfileSections(user.id)
  const name = user.display_name || user.full_name

  // Check if viewer is the profile owner
  const { data: { user: viewer } } = await supabase.auth.getUser()
  const isOwner = viewer?.id === user.id

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6 flex flex-col gap-4">
      <Link
        href={`/u/${handle}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Back to {name}
      </Link>

      <h1 className="text-2xl font-serif tracking-tight text-[var(--color-text-primary)]">
        Endorsements
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {endorsements.length} endorsement{endorsements.length !== 1 ? 's' : ''} for {name}
      </p>

      <EndorsementsPageClient
        endorsements={endorsements.map((e) => ({
          id: e.id,
          content: e.content,
          created_at: e.created_at,
          endorser_role_label: e.endorser_role_label,
          is_pinned: e.is_pinned ?? false,
          endorserName: e.endorser?.display_name ?? e.endorser?.full_name ?? 'Anonymous',
          endorserPhoto: e.endorser?.profile_photo_url ?? null,
          endorserHandle: e.endorser?.handle ?? null,
          ghostEndorserId: e.ghost_endorser?.id ?? null,
          ghostEndorserName: e.ghost_endorser?.full_name ?? null,
          ghostEndorserRole: e.ghost_endorser?.primary_role ?? null,
          yachtName: e.yacht?.name ?? null,
        }))}
        isOwner={isOwner}
      />
    </div>
  )
}
