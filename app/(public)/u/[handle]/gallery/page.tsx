import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { getUserByHandle } from '@/lib/queries/profile'
import { getExtendedProfileSections } from '@/lib/queries/profile'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) return { title: 'Not Found' }
  const name = user.display_name || user.full_name
  return { title: `Gallery — ${name} — YachtieLink` }
}

export default async function GalleryPage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const { gallery } = await getExtendedProfileSections(user.id)
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
        Gallery
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {gallery.length} photo{gallery.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {gallery.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
            <Image
              src={item.image_url}
              alt={item.caption ?? 'Gallery photo'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-xs text-white truncate">{item.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
