'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SaveProfileButtonProps {
  savedUserId: string
  initialSaved: boolean
  initialFolderId?: string | null
}

export function SaveProfileButton({ savedUserId, initialSaved, initialFolderId }: SaveProfileButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    if (loading) return
    setLoading(true)
    const wasSaved = saved
    setSaved(!wasSaved) // optimistic
    try {
      const res = await fetch('/api/saved-profiles', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved_user_id: savedUserId, folder_id: initialFolderId ?? null }),
      })
      if (!res.ok) {
        setSaved(wasSaved) // roll back
      } else {
        router.refresh()
      }
    } catch {
      setSaved(wasSaved) // roll back on network error
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave profile' : 'Save profile'}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)]/10 transition-colors disabled:opacity-50"
    >
      <span className={saved ? 'text-[var(--color-interactive)]' : ''}>
        {saved ? '♥' : '♡'}
      </span>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
