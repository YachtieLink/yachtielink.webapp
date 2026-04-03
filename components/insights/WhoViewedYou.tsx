'use client'

import Image from 'next/image'
import Link from 'next/link'

interface Viewer {
  id: string
  name: string
  role: string | null
  photoUrl: string | null
  viewedAt: string
}

interface WhoViewedYouProps {
  viewers: Viewer[]
  totalCount: number
  blurred?: boolean
}

function ViewerRow({ viewer }: { viewer: Viewer }) {
  const daysAgo = Math.floor((Date.now() - new Date(viewer.viewedAt).getTime()) / 86400000)
  const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] overflow-hidden shrink-0 flex items-center justify-center">
        {viewer.photoUrl ? (
          <Image src={viewer.photoUrl} alt={viewer.name} width={36} height={36} className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
            {viewer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{viewer.name}</p>
        {viewer.role && (
          <p className="text-xs text-[var(--color-text-secondary)]">{viewer.role}</p>
        )}
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)] shrink-0">{timeLabel}</span>
    </div>
  )
}

export function WhoViewedYou({ viewers, totalCount, blurred = false }: WhoViewedYouProps) {
  return (
    <div className={`card-soft rounded-2xl p-4 ${blurred ? 'relative overflow-hidden' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Who Viewed You</h3>
        <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[var(--color-sand-100)] text-[var(--color-sand-400)]">
          Pro
        </span>
      </div>

      {blurred ? (
        <div className="blur-sm select-none pointer-events-none">
          <div className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)]" />
            <div className="flex-1">
              <div className="h-3 bg-[var(--color-surface-raised)] rounded w-24 mb-1" />
              <div className="h-2 bg-[var(--color-surface-raised)] rounded w-16" />
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)]" />
            <div className="flex-1">
              <div className="h-3 bg-[var(--color-surface-raised)] rounded w-28 mb-1" />
              <div className="h-2 bg-[var(--color-surface-raised)] rounded w-20" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {viewers.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] py-2">No profile viewers in the last 30 days</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {viewers.map((v) => <ViewerRow key={v.id} viewer={v} />)}
            </div>
          )}
          {totalCount > viewers.length && (
            <Link
              href="/app/insights/viewers"
              className="block text-center text-sm font-medium text-[var(--color-interactive)] mt-2 hover:underline"
            >
              See all {totalCount} viewers →
            </Link>
          )}
        </>
      )}
    </div>
  )
}
