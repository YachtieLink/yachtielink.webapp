'use client'

import { useState } from 'react'
import { EndorsementCard } from '@/components/public/EndorsementCard'
import { useToast } from '@/components/ui/Toast'

interface EndorsementItem {
  id: string
  content: string
  created_at: string
  endorser_role_label: string | null
  is_pinned: boolean
  endorserName: string
  endorserPhoto: string | null
  endorserHandle: string | null
  ghostEndorserId: string | null
  ghostEndorserName: string | null
  ghostEndorserRole: string | null
  yachtName: string | null
}

interface EndorsementsPageClientProps {
  endorsements: EndorsementItem[]
  isOwner: boolean
}

export function EndorsementsPageClient({ endorsements: initial, isOwner }: EndorsementsPageClientProps) {
  const { toast } = useToast()
  const [endorsements, setEndorsements] = useState(initial)

  // Sort: pinned first, then by date
  const sorted = [...endorsements].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  async function handlePin(id: string, isPinned: boolean) {
    const prev = endorsements
    // Optimistic update
    setEndorsements((es) => es.map((e) => e.id === id ? { ...e, is_pinned: isPinned } : e))

    try {
      const res = await fetch(`/api/endorsements/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: isPinned }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to update pin')
      }
      toast(isPinned ? 'Endorsement pinned' : 'Endorsement unpinned', 'success')
    } catch (err) {
      setEndorsements(prev)
      toast(err instanceof Error ? err.message : 'Could not update pin', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((end) => (
        <EndorsementCard
          key={end.id}
          endorserName={end.endorserName}
          endorserRole={end.endorser_role_label}
          endorserPhoto={end.endorserPhoto}
          endorserHandle={end.endorserHandle}
          ghostEndorserId={end.ghostEndorserId}
          ghostEndorserName={end.ghostEndorserName}
          ghostEndorserRole={end.ghostEndorserRole}
          yachtName={end.yachtName}
          date={end.created_at}
          content={end.content}
          isPinned={end.is_pinned}
          onPin={isOwner ? (pinned) => handlePin(end.id, pinned) : undefined}
        />
      ))}
    </div>
  )
}
