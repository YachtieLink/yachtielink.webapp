import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { getUserByHandle, getPublicProfileSections } from '@/lib/queries/profile'
import { EndorsementCard } from '@/components/public/EndorsementCard'

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
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const { endorsements } = await getPublicProfileSections(user.id)
  const name = user.display_name || user.full_name

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

      <div className="flex flex-col gap-3">
        {endorsements.map((end) => (
          <EndorsementCard
            key={end.id}
            endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
            endorserRole={end.endorser_role_label}
            endorserPhoto={end.endorser?.profile_photo_url}
            endorserHandle={end.endorser?.handle}
            yachtName={end.yacht?.name}
            date={end.created_at}
            content={end.content}
          />
        ))}
      </div>
    </div>
  )
}
