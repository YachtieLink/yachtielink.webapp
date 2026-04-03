'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { uploadUserPhoto } from '@/lib/storage/upload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/PageHeader'
import { PhotoFormatPreview } from '@/components/profile/PhotoFormatPreview'
import { FocalPointPicker } from '@/components/profile/FocalPointPicker'
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
  focal_x?: number
  focal_y?: number
  is_avatar?: boolean
  is_hero?: boolean
  is_cv?: boolean
}

const MAX_PHOTOS_FREE = 3
const MAX_PHOTOS_PRO = 15

// ── Sortable gallery photo ────────────────────────────────────────
function SortablePhoto({
  photo,
  index,
  onDelete,
  onFocalPoint,
}: {
  photo: Photo
  index: number
  onDelete: (photo: Photo) => void
  onFocalPoint: (photo: Photo) => void
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
      <button
        onClick={(e) => {
          e.stopPropagation()
          onFocalPoint(photo)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full transition-colors"
        aria-label="Set focal point"
      >
        ⊕
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function ProfilePhotosPage() {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isPro, setIsPro] = useState(true)
  const [focalPhoto, setFocalPhoto] = useState<Photo | null>(null)
  const [focalX, setFocalX] = useState(50)
  const [focalY, setFocalY] = useState(50)
  const [savingFocal, setSavingFocal] = useState(false)
  const [savingContext, setSavingContext] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const maxPhotos = isPro ? MAX_PHOTOS_PRO : MAX_PHOTOS_FREE
  const profilePhoto = photos.length > 0 ? photos[0] : null
  const galleryPhotos = photos.slice(1)

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, isProfile = false) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const remaining = maxPhotos - photos.length
    let files = Array.from(fileList)

    if (isProfile) {
      files = files.slice(0, 1)
    } else if (files.length > remaining) {
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

        const sortOrder = isProfile ? 0 : photos.length + i
        const res = await fetch('/api/user-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: result.url, sort_order: sortOrder }),
        })
        if (!res.ok) {
          const d = await res.json()
          toast(d.error ?? 'Upload failed', 'error')
          break
        }
        const { photo } = await res.json()
        setPhotos((prev) => isProfile ? [photo, ...prev] : [...prev, photo])
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm('Delete this photo?')) return
    try {
      const res = await fetch(`/api/user-photos/${photo.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      } else {
        toast('Failed to delete photo', 'error')
      }
    } catch {
      toast('Failed to delete photo', 'error')
    }
  }

  async function toggleContext(photo: Photo, context: 'is_avatar' | 'is_hero' | 'is_cv') {
    const currentValue = photo[context] ?? false
    const newValue = !currentValue
    setSavingContext(`${photo.id}-${context}`)
    try {
      const res = await fetch(`/api/user-photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [context]: newValue }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast((d as { error?: string }).error ?? 'Failed to update', 'error')
        return
      }
      // Update local state — if assigning, clear from other photos
      setPhotos((prev) => prev.map((p) => {
        if (p.id === photo.id) return { ...p, [context]: newValue }
        if (newValue) return { ...p, [context]: false }
        return p
      }))
      const labels = { is_avatar: 'Avatar', is_hero: 'Hero', is_cv: 'CV' }
      toast(`${labels[context]} ${newValue ? 'assigned' : 'cleared'}`, 'success')
    } catch {
      toast('Failed to update', 'error')
    } finally {
      setSavingContext(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-teal-50)]">
        <PageHeader backHref="/app/profile" title="Your Photos" />
        <Skeleton className="aspect-[3/4] rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-teal-50)]">
      <PageHeader backHref="/app/profile" title="Your Photos" />

      {/* Downgrade notice */}
      {!isPro && photos.length > MAX_PHOTOS_FREE && (
        <div className="rounded-xl border border-[var(--color-warning-border,var(--color-border))] bg-[var(--color-warning-bg,var(--color-surface-overlay))] p-3 text-sm text-[var(--color-text-secondary)]">
          You have {photos.length} photos but your free plan shows {MAX_PHOTOS_FREE}. Your extra photos are safe — upgrade to Pro to make them visible again.
        </div>
      )}

      {/* ── PROFILE PHOTO ──────────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
          Profile Photo
        </h2>

        {profilePhoto ? (
          <>
            {/* Large preview */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
              <Image
                src={profilePhoto.photo_url}
                alt="Profile photo"
                fill
                className="object-cover"
                style={{
                  objectPosition: `${profilePhoto.focal_x ?? 50}% ${profilePhoto.focal_y ?? 50}%`,
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFocalPhoto(profilePhoto)
                  setFocalX(Number(profilePhoto.focal_x) || 50)
                  setFocalY(Number(profilePhoto.focal_y) || 50)
                }}
                className="text-sm font-medium text-[var(--color-interactive)]"
              >
                Set focal point
              </button>
              <span className="text-[var(--color-text-tertiary)]">&middot;</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium text-[var(--color-interactive)] disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
            </div>

            {/* 3-format preview */}
            <div className="pt-2 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Preview</p>
              <PhotoFormatPreview
                photoUrl={profilePhoto.photo_url}
                focalX={Number(profilePhoto.focal_x) || 50}
                focalY={Number(profilePhoto.focal_y) || 50}
              />
            </div>

            {/* Contextual assignment — Pro only */}
            {isPro ? (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    Context Assignment
                  </p>
                  <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[var(--color-teal-100)] text-[var(--color-teal-700)]">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                  Use this photo as your:
                </p>
                <div className="flex gap-2">
                  {(['is_avatar', 'is_hero', 'is_cv'] as const).map((ctx) => {
                    const labels = { is_avatar: 'Avatar', is_hero: 'Hero', is_cv: 'CV' }
                    const isActive = profilePhoto[ctx] ?? false
                    const isSaving = savingContext === `${profilePhoto.id}-${ctx}`
                    return (
                      <button
                        key={ctx}
                        type="button"
                        onClick={() => toggleContext(profilePhoto, ctx)}
                        disabled={isSaving}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          isActive
                            ? 'border-[var(--color-teal-700)] bg-[var(--color-teal-100)] text-[var(--color-teal-700)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-teal-300)]'
                        }`}
                      >
                        {isSaving ? '...' : labels[ctx]}
                        {isActive && ' ✓'}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  1 photo for all contexts. <span className="text-[var(--color-interactive)]">Upgrade to Pro</span> for context-specific photos.
                </p>
              </div>
            )}
          </>
        ) : (
          /* No profile photo yet */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--color-teal-300)] flex flex-col items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:border-[var(--color-teal-500)] transition-colors disabled:opacity-50"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">
              {uploading ? 'Uploading…' : 'Add profile photo'}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              This will be your main profile picture
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e, true)}
        />
      </div>

      {/* ── WORK GALLERY ───────────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
            Work Gallery
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {Math.min(galleryPhotos.length, maxPhotos - 1)}/{maxPhotos - 1} photos
            {!isPro && <span> &middot; <span className="text-[var(--color-interactive)]">Upgrade for {MAX_PHOTOS_PRO - 1}</span></span>}
          </p>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)]">
          Show off your work on yachts. Drag to reorder.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={galleryPhotos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {galleryPhotos.map((photo, idx) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  index={idx + 1}
                  onDelete={deletePhoto}
                  onFocalPoint={(p) => {
                    setFocalPhoto(p)
                    setFocalX(Number(p.focal_x) || 50)
                    setFocalY(Number(p.focal_y) || 50)
                  }}
                />
              ))}

              {photos.length < maxPhotos && (
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-interactive)] hover:text-[var(--color-interactive)] transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{uploading ? '...' : '+'}</span>
                  <span className="text-xs mt-1">{uploading ? 'Uploading...' : 'Add'}</span>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e, false)}
        />
      </div>

      {/* ── Focal Point Modal ──────────────────────────────────────── */}
      {focalPhoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Set Focal Point</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Tap or drag to set the focal point. This determines how the photo is cropped across avatar, hero, and CV.
            </p>
            <FocalPointPicker
              imageUrl={focalPhoto.photo_url}
              focalX={focalX}
              focalY={focalY}
              onChange={(x, y) => { setFocalX(x); setFocalY(y) }}
            />
            {/* Live 3-format preview inside modal */}
            <PhotoFormatPreview
              photoUrl={focalPhoto.photo_url}
              focalX={focalX}
              focalY={focalY}
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setFocalPhoto(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                loading={savingFocal}
                className="flex-1"
                onClick={async () => {
                  setSavingFocal(true)
                  try {
                    const res = await fetch(`/api/user-photos/${focalPhoto.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ focal_x: focalX, focal_y: focalY }),
                    })
                    if (!res.ok) throw new Error('Failed to save')
                    setPhotos((prev) => prev.map((p) =>
                      p.id === focalPhoto.id ? { ...p, focal_x: focalX, focal_y: focalY } : p
                    ))
                    toast('Focal point saved', 'success')
                    setFocalPhoto(null)
                  } catch {
                    toast('Failed to save focal point', 'error')
                  } finally {
                    setSavingFocal(false)
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
