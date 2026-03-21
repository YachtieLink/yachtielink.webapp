'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { uploadGalleryItem } from '@/lib/storage/upload'

interface GalleryItem {
  id: string
  image_url: string
  caption?: string | null
  yacht_id?: string | null
}

export default function WorkGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/user-gallery')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []) })
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

      const result = await uploadGalleryItem(user.id, file)
      if (!result.ok) { alert(result.error); return }

      const res = await fetch('/api/user-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: result.url, sort_order: items.length }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Upload failed'); return }
      const { item } = await res.json()
      setItems((prev) => [...prev, item])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this photo from your gallery?')) return
    const res = await fetch(`/api/user-gallery/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) return <div className="p-4 text-[var(--color-text-secondary)]">Loading…</div>

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/app/profile" className="text-sm text-[var(--color-interactive)] hover:underline">← Back</Link>
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Work Gallery</h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">Showcase your work — engine rooms, table settings, deck work, interiors. Free: 12 photos · Pro: 30.</p>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
            <Image src={item.image_url} alt={item.caption ?? 'Gallery photo'} fill className="object-cover" unoptimized />
            <button
              onClick={() => deleteItem(item.id)}
              className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}

        {items.length < 30 && (
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

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  )
}
