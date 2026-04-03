'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface ColleagueRowProps {
  colleagueId: string
  name: string
  profilePhotoUrl: string | null
  role: string | null
  handle: string | null
  yachtId: string
  endorsementStatus?: 'endorsed' | 'pending' | null
  isGhost?: boolean
}

function AvatarCircle({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-10 h-10 rounded-full bg-[var(--color-navy-100)] overflow-hidden shrink-0 flex items-center justify-center">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          width={40}
          height={40}
          className="object-cover object-top w-full h-full"
        />
      ) : (
        <span className="text-xs font-semibold text-[var(--color-navy-700)]">{initials}</span>
      )}
    </div>
  )
}

export function ColleagueRow({
  colleagueId,
  name,
  profilePhotoUrl,
  role,
  handle,
  yachtId,
  endorsementStatus,
  isGhost,
}: ColleagueRowProps) {
  const profileHref = handle ? `/u/${handle}` : '#'

  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <Link href={isGhost ? '#' : profileHref}>
        <AvatarCircle name={name} photoUrl={profilePhotoUrl} />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={isGhost ? '#' : profileHref}>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{name}</p>
        </Link>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          {role ?? 'Crew'}
          {endorsementStatus === 'endorsed' && (
            <span className="ml-1.5 text-[var(--color-interactive)]">★ endorsed</span>
          )}
          {endorsementStatus === 'pending' && (
            <span className="ml-1.5 text-[var(--color-text-tertiary)]">⏳ pending</span>
          )}
          {isGhost && (
            <span className="ml-1.5 text-[var(--color-text-tertiary)]">· not on platform</span>
          )}
        </p>
      </div>

      {isGhost ? (
        <Link href={`/app/endorsement/request?ghost_id=${colleagueId}`} className="shrink-0">
          <Button variant="outline" size="sm">Invite</Button>
        </Link>
      ) : (
        <Link
          href={`/app/endorsement/request?colleague_id=${colleagueId}&yacht_id=${yachtId}`}
          className="shrink-0"
        >
          <Button variant="outline" size="sm">Request</Button>
        </Link>
      )}
    </div>
  )
}
