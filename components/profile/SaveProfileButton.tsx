'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
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
        setSaved(wasSaved)
      } else {
        router.refresh()
      }
    } catch {
      setSaved(wasSaved)
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
      className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md hover:bg-black/40 transition-colors disabled:opacity-50"
    >
      <Heart
        size={18}
        className={saved ? 'text-pink-500 fill-pink-500' : 'text-white'}
      />
    </button>
  )
}
