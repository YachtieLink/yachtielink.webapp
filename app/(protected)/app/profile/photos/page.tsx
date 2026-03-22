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
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Photo {
  id: string
  photo_url: string
  sort_order: number
}

const MAX_PHOTOS_FREE = 3
const MAX_PHOTOS_PRO = 9

function SortablePhoto({
  photo,
  index,
  onDelete,
}: {
  photo: Photo
  index: number
  onDelete: (photo: Photo) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-surface-raised)] cursor-grab active:cursor-grabbing"
    >
      <Image
        src={photo.photo_url}
        alt={`Photo ${index + 1}`}
        fill
        className="object-cover pointer-events-none"
      />
      {index === 0 && (
        <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
          Main
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(photo)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 bg-black/50 hover:bg-[var(--color-error)] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors"
        aria-label="Delete photo"
      >
        ×
      </button>
    </div>
  )
}

export default function ProfilePhotosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isPro, setIsPro] = useState(true) // Default to Pro so paid users aren't penalised if plan lookup fails
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxPhotos = isPro ? MAX_PHOTOS_PRO : MAX_PHOTOS_FREE

  // Require a small drag distance before starting to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', user.id)
            .single()
          if (!error && profile) {
            setIsPro(profile.subscription_status === 'pro')
          }
          // On error, keep default (Pro) so paid users aren't penalised — server enforces real limit on upload
        }
        const res = await fetch('/api/user-photos')
        const d = await res.json()
        setPhotos(d.photos ?? [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(photos, oldIndex, newIndex)
    const previous = photos

    // Optimistic update
    setPhotos(reordered)

    try {
      const res = await fetch('/api/user-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_ids: reordered.map((p) => p.id) }),
      })
      if (!res.ok) throw new Error('Reorder failed')
      toast('Photos reordered', 'success')
    } catch {
      setPhotos(previous)
      toast('Failed to reorder photos', 'error')
    }
  }

  async function handleMultiUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const remaining = maxPhotos - photos.length
    let files = Array.from(fileList)

    if (files.length > remaining) {
      toast(`You can only add ${remaining} more photo${remaining === 1 ? '' : 's'}. Extra files were skipped.`, 'error')
      files = files.slice(0, remaining)
    }

    if (files.length === 0) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const result = await uploadUserPhoto(user.id, file)
        if (!result.ok) {
          toast(result.error, 'error')
          continue
        }

        const res = await fetch('/api/user-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: result.url, sort_order: photos.length + i }),
        })
        if (!res.ok) {
          const d = await res.json()
          toast(d.error ?? 'Upload failed', 'error')
          break
        }
        const { photo } = await res.json()
        setPhotos((prev) => [...prev, photo])
      }
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

      {/* Downgrade notice — photos exist beyond free limit */}
      {!isPro && photos.length > MAX_PHOTOS_FREE && (
        <div className="rounded-xl border border-[var(--color-warning-border,var(--color-border))] bg-[var(--color-warning-bg,var(--color-surface-overlay))] p-3 text-sm text-[var(--color-text-secondary)]">
          You have {photos.length} photos but your free plan shows {MAX_PHOTOS_FREE}. Your extra photos are safe — upgrade to Pro to make them visible again.
        </div>
      )}

      <p className="text-sm text-[var(--color-text-secondary)]">
        Your first photo is your main profile picture.{!isPro && photos.length > MAX_PHOTOS_FREE ? '' : ' Drag to reorder.'} {Math.min(photos.length, maxPhotos)}/{maxPhotos} photos visible{!isPro && photos.length <= MAX_PHOTOS_FREE ? ` · Upgrade to Pro for up to ${MAX_PHOTOS_PRO}` : ''}.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={photos.slice(0, maxPhotos).map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, maxPhotos).map((photo, idx) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={idx}
                onDelete={deletePhoto}
              />
            ))}

            {photos.length < maxPhotos && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-interactive)] hover:text-[var(--color-interactive)] transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">{uploading ? '...' : '+'}</span>
                <span className="text-xs mt-1">{uploading ? 'Uploading...' : 'Add photo'}</span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleMultiUpload}
      />
    </div>
  )
}
