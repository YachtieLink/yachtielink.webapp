'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageSquareQuote } from 'lucide-react'
import type { PublicEndorsement } from '@/lib/queries/types'

interface EndorsementsTileProps {
  endorsements: PublicEndorsement[]
  handle: string
}

export function EndorsementsTile({ endorsements, handle }: EndorsementsTileProps) {
  const top = endorsements[0]
  if (!top) return null

  const endorserName = top.endorser?.display_name || top.endorser?.full_name || 'Anonymous'
  const endorserHandle = top.endorser?.handle
  const endorserAvatar = top.endorser?.profile_photo_url
  const yachtName = top.yacht?.name
  const remaining = endorsements.length - 1

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareQuote size={14} className="text-rose-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Endorsements</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-primary)] italic line-clamp-3">
          &ldquo;{top.content}&rdquo;
        </p>
        <div className="flex items-center gap-2 mt-3">
          {endorserAvatar ? (
            <Image
              src={endorserAvatar}
              alt={endorserName}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
              {endorserName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            {endorserHandle ? (
              <Link href={`/u/${endorserHandle}`} className="text-xs font-medium text-[var(--color-text-primary)] hover:underline truncate block">
                {endorserName}
              </Link>
            ) : (
              <span className="text-xs font-medium text-[var(--color-text-primary)] truncate block">{endorserName}</span>
            )}
            {(top.endorser_role_label || yachtName) && (
              <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                {top.endorser_role_label}{top.endorser_role_label && yachtName ? ' · ' : ''}{yachtName}
              </p>
            )}
          </div>
        </div>
      </div>
      <Link
        href={`/u/${handle}/endorsements`}
        className="mt-2 text-xs font-medium text-[var(--accent-500,#14b8a6)] hover:underline"
      >
        {remaining > 0 ? `+${remaining} more` : 'See all'} &rarr;
      </Link>
    </div>
  )
}
