'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { uploadUserPhoto } from '@/lib/storage/upload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Photo {
  id: string
  photo_url: string
  sort_order: number
}

export default function ProfilePhotosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/user-photos')
      .then((r) => r.json())
      .then((d) => { setPhotos(d.photos ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const result = await uploadUserPhoto(user.id, file)
      if (!result.ok) { toast(result.error, 'error'); return }
      const photoUrl = result.url

      const res = await fetch('/api/user-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: photoUrl, sort_order: photos.length }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? 'Upload failed', 'error')
        return
      }
      const { photo } = await res.json()
      setPhotos((prev) => [...prev, photo])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/user-photos/${photo.id}`, { method: 'DELETE' })
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <BackButton href="/app/profile" />
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Photos</h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">Your first photo is your main profile picture. Free: up to 6 photos · Pro: up to 9.</p>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
            <Image src={photo.photo_url} alt={`Photo ${idx + 1}`} fill className="object-cover" unoptimized />
            {idx === 0 && (
              <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">Main</span>
            )}
            <button
              onClick={() => deletePhoto(photo)}
              className="absolute top-1 right-1 bg-black/50 hover:bg-[var(--color-error)] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              aria-label="Delete photo"
            >
              ×
            </button>
          </div>
        ))}

        {photos.length < 9 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-interactive)] hover:text-[var(--color-interactive)] transition-colors disabled:opacity-50"
          >
            <span className="text-2xl">{uploading ? '⏳' : '+'}</span>
            <span className="text-xs mt-1">{uploading ? 'Uploading…' : 'Add photo'}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
