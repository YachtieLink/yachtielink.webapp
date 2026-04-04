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
import { ProUpsellCard } from '@/components/ui/ProUpsellCard'
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
  avatar_focal_x?: number | null
  avatar_focal_y?: number | null
  hero_focal_x?: number | null
  hero_focal_y?: number | null
  cv_focal_x?: number | null
  cv_focal_y?: number | null
  avatar_zoom?: number
  hero_zoom?: number
  cv_zoom?: number
}

type FocalContext = 'base' | 'avatar' | 'hero' | 'cv'

const MAX_PHOTOS_FREE = 3
const MAX_PHOTOS_PRO = 15
const MAX_PROFILE_PHOTOS_PRO = 3

// ── Sortable gallery photo ────────────────────────────────────────
function SortablePhoto({
  photo,
  index,
  onDelete,
  onFocalPoint,
  isConfirmingDelete,
}: {
  photo: Photo
  index: number
  isConfirmingDelete?: boolean
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
        className={`absolute top-1 right-1 text-white text-xs rounded-full flex items-center justify-center transition-all ${
          isConfirmingDelete
            ? 'bg-[var(--color-error)] px-2 py-1 text-[10px] font-medium'
            : 'bg-black/50 hover:bg-[var(--color-error)] w-6 h-6'
        }`}
        aria-label="Delete photo"
      >
        {isConfirmingDelete ? 'Tap to delete' : '×'}
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
  const [isPro, setIsPro] = useState(false)
  const [focalPhoto, setFocalPhoto] = useState<Photo | null>(null)
  const [focalX, setFocalX] = useState(50)
  const [focalY, setFocalY] = useState(50)
  const [focalContext, setFocalContext] = useState<FocalContext>('base')
  const [zoom, setZoom] = useState(1)
  const [savingFocal, setSavingFocal] = useState(false)
  const [savingContext, setSavingContext] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const maxPhotos = isPro ? MAX_PHOTOS_PRO : MAX_PHOTOS_FREE
  const profilePhoto = photos.length > 0 ? photos[0] : null
  // Pro: up to 3 profile photos (sort_order 0-2 that aren't gallery-only)
  const profilePhotos = isPro ? photos.slice(0, Math.min(MAX_PROFILE_PHOTOS_PRO, photos.length)) : (profilePhoto ? [profilePhoto] : [])
  const galleryPhotos = photos.slice(profilePhotos.length)

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

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showContextFocals, setShowContextFocals] = useState(false)
  const [showExtraPhotos, setShowExtraPhotos] = useState(false)

  async function deletePhoto(photo: Photo) {
    if (confirmDeleteId !== photo.id) {
      setConfirmDeleteId(photo.id)
      // Auto-clear after 3 seconds
      setTimeout(() => setConfirmDeleteId((prev) => prev === photo.id ? null : prev), 3000)
      return
    }
    setConfirmDeleteId(null)
    try {
      const res = await fetch(`/api/user-photos/${photo.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
        toast('Photo deleted', 'success')
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

  function openFocalPicker(photo: Photo, context: FocalContext = 'base') {
    setFocalPhoto(photo)
    setFocalContext(context)
    // Load the focal point for this context, falling back to base
    if (context === 'avatar' && photo.avatar_focal_x != null) {
      setFocalX(photo.avatar_focal_x)
      setFocalY(photo.avatar_focal_y ?? 50)
    } else if (context === 'hero' && photo.hero_focal_x != null) {
      setFocalX(photo.hero_focal_x)
      setFocalY(photo.hero_focal_y ?? 50)
    } else if (context === 'cv' && photo.cv_focal_x != null) {
      setFocalX(photo.cv_focal_x)
      setFocalY(photo.cv_focal_y ?? 50)
    } else {
      setFocalX(Number(photo.focal_x) || 50)
      setFocalY(Number(photo.focal_y) || 50)
    }
    // Load zoom for this context
    const zoomKey = `${context}_zoom` as keyof Photo
    setZoom(context !== 'base' ? (Number(photo[zoomKey]) || 1) : 1)
  }

  /** Resolve the focal point for a given context, falling back to base */
  function resolvedFocal(photo: Photo, context: 'avatar' | 'hero' | 'cv'): { x: number; y: number } {
    const ctxX = photo[`${context}_focal_x` as keyof Photo] as number | null | undefined
    const ctxY = photo[`${context}_focal_y` as keyof Photo] as number | null | undefined
    return {
      x: ctxX ?? (Number(photo.focal_x) || 50),
      y: ctxY ?? (Number(photo.focal_y) || 50),
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
            {/* ── Layer 1: Single photo + base focal (everyone) ────── */}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openFocalPicker(profilePhoto, 'base')}
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

            {/* ── Layer 2: Per-context focal points (expandable) ───── */}
            {isPro ? (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowContextFocals(prev => !prev)}
                  className="w-full flex items-center justify-between py-1 text-sm font-medium text-[var(--color-text-primary)]"
                >
                  <span>Customize crop per context</span>
                  <span className={`text-[var(--color-text-tertiary)] transition-transform ${showContextFocals ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {showContextFocals && (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Set a different crop center for each use of your photo.
                    </p>
                    <div className="flex items-end gap-3">
                      {/* Avatar */}
                      {(() => {
                        const photo = photos.find(p => p.is_avatar) ?? profilePhoto
                        const focal = resolvedFocal(photo, 'avatar')
                        return (
                          <div className="flex flex-col items-center gap-1.5">
                            <button type="button" onClick={() => openFocalPicker(photo, 'avatar')} className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-surface-raised)] ring-2 ring-[var(--color-teal-200)] hover:ring-[var(--color-teal-500)] transition-all">
                              <img src={photo.photo_url} alt="Avatar" className="w-full h-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                            </button>
                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Avatar</span>
                            <span className="text-[9px] text-[var(--color-text-tertiary)]">Profile card</span>
                          </div>
                        )
                      })()}

                      {/* Hero */}
                      {(() => {
                        const photo = photos.find(p => p.is_hero) ?? profilePhoto
                        const focal = resolvedFocal(photo, 'hero')
                        return (
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <button type="button" onClick={() => openFocalPicker(photo, 'hero')} className="w-full h-[56px] rounded-lg overflow-hidden bg-[var(--color-surface-raised)] ring-2 ring-[var(--color-teal-200)] hover:ring-[var(--color-teal-500)] transition-all">
                              <img src={photo.photo_url} alt="Hero" className="w-full h-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                            </button>
                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Hero</span>
                            <span className="text-[9px] text-[var(--color-text-tertiary)]">Public page banner</span>
                          </div>
                        )
                      })()}

                      {/* CV */}
                      {(() => {
                        const photo = photos.find(p => p.is_cv) ?? profilePhoto
                        const focal = resolvedFocal(photo, 'cv')
                        return (
                          <div className="flex flex-col items-center gap-1.5">
                            <button type="button" onClick={() => openFocalPicker(photo, 'cv')} className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-surface-raised)] ring-2 ring-[var(--color-teal-200)] hover:ring-[var(--color-teal-500)] transition-all">
                              <img src={photo.photo_url} alt="CV" className="w-full h-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                            </button>
                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">CV</span>
                            <span className="text-[9px] text-[var(--color-text-tertiary)]">Generated PDF</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <ProUpsellCard
                  variant="inline"
                  feature="per-context focal points for avatar, hero, and CV"
                  context="profile"
                />
              </div>
            )}

            {/* ── Layer 3: Extra profile photos (expandable, Pro) ──── */}
            {isPro ? (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowExtraPhotos(prev => !prev)}
                  className="w-full flex items-center justify-between py-1 text-sm font-medium text-[var(--color-text-primary)]"
                >
                  <span>Use different photos per context</span>
                  <span className={`text-[var(--color-text-tertiary)] transition-transform ${showExtraPhotos ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {showExtraPhotos && (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Upload up to {MAX_PROFILE_PHOTOS_PRO} profile photos and assign each to Avatar, Hero, or CV.
                    </p>

                    {/* Multi-photo grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {profilePhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--color-surface-raised)]">
                          <Image src={photo.photo_url} alt="" fill className="object-cover" style={{ objectPosition: `${photo.focal_x ?? 50}% ${photo.focal_y ?? 50}%` }} />
                          <div className="absolute top-1 left-1 flex gap-0.5">
                            {photo.is_avatar && <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-black/60 text-white">A</span>}
                            {photo.is_hero && <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-black/60 text-white">H</span>}
                            {photo.is_cv && <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-black/60 text-white">CV</span>}
                          </div>
                          {profilePhotos.length > 1 && (
                            <button
                              onClick={() => deletePhoto(photo)}
                              className={`absolute top-1 right-1 text-white text-xs rounded-full flex items-center justify-center transition-all ${
                                confirmDeleteId === photo.id
                                  ? 'bg-[var(--color-error)] px-1.5 py-0.5 text-[9px] font-medium'
                                  : 'bg-black/50 hover:bg-[var(--color-error)] w-5 h-5'
                              }`}
                              aria-label="Delete"
                            >
                              {confirmDeleteId === photo.id ? 'Delete?' : '×'}
                            </button>
                          )}
                        </div>
                      ))}
                      {profilePhotos.length < MAX_PROFILE_PHOTOS_PRO && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--color-teal-300)] flex flex-col items-center justify-center gap-1 text-[var(--color-text-secondary)] hover:border-[var(--color-teal-500)] transition-colors disabled:opacity-50"
                        >
                          <span className="text-xl">+</span>
                          <span className="text-[10px]">{uploading ? '...' : 'Add'}</span>
                        </button>
                      )}
                    </div>

                    {/* Context assignment per photo */}
                    {profilePhotos.length > 1 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-[var(--color-text-tertiary)]">Assign each photo:</p>
                        {profilePhotos.map((photo) => (
                          <div key={photo.id} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md overflow-hidden bg-[var(--color-surface-raised)] shrink-0">
                              <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex gap-1 flex-1">
                              {(['is_avatar', 'is_hero', 'is_cv'] as const).map((ctx) => {
                                const labels = { is_avatar: 'Avatar', is_hero: 'Hero', is_cv: 'CV' }
                                const isActive = photo[ctx] ?? false
                                const isSaving = savingContext === `${photo.id}-${ctx}`
                                return (
                                  <button
                                    key={ctx}
                                    type="button"
                                    onClick={() => toggleContext(photo, ctx)}
                                    disabled={isSaving}
                                    className={`flex-1 text-[10px] font-medium py-1 rounded-md border transition-colors disabled:opacity-50 ${
                                      isActive
                                        ? 'border-[var(--color-teal-700)] bg-[var(--color-teal-100)] text-[var(--color-teal-700)]'
                                        : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-teal-300)]'
                                    }`}
                                  >
                                    {isSaving ? '...' : labels[ctx]}
                                    {isActive && ' ✓'}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <ProUpsellCard
                  variant="inline"
                  feature="3 profile photos — use a different photo for avatar, hero, and CV"
                  context="profile"
                />
              </div>
            )}
          </>
        ) : (
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
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-teal-700)]">
            Work Gallery
          </h2>
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {Math.min(galleryPhotos.length, maxPhotos - 1)}/{maxPhotos - 1} photos
            </p>
            {!isPro && (
              <ProUpsellCard
                variant="inline"
                feature={`${MAX_PHOTOS_PRO - 1} gallery photos`}
                context="profile"
              />
            )}
          </div>
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
                  onFocalPoint={(p) => openFocalPicker(p, 'base')}
                  isConfirmingDelete={confirmDeleteId === photo.id}
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
        <div
          className="fixed inset-0 z-50 flex items-stretch sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setFocalPhoto(null) }}
        >
          <div className="bg-[var(--color-surface)] w-full sm:rounded-2xl sm:max-w-sm flex flex-col gap-3 overflow-y-auto p-5 pb-24 sm:pb-5 sm:max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                Set Focal Point
              </h3>
              <button
                onClick={() => setFocalPhoto(null)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Context tabs — Pro only */}
            {isPro && (
              <div className="flex gap-1 bg-[var(--color-surface-raised)] rounded-lg p-0.5">
                {(['base', 'avatar', 'hero', 'cv'] as const).map((ctx) => {
                  const labels = { base: 'Base', avatar: 'Avatar', hero: 'Hero', cv: 'CV' }
                  return (
                    <button
                      key={ctx}
                      type="button"
                      onClick={() => {
                        setFocalContext(ctx)
                        // Load focal point for selected context
                        if (ctx === 'base') {
                          setFocalX(Number(focalPhoto.focal_x) || 50)
                          setFocalY(Number(focalPhoto.focal_y) || 50)
                          setZoom(1)
                        } else {
                          const xKey = `${ctx}_focal_x` as keyof Photo
                          const yKey = `${ctx}_focal_y` as keyof Photo
                          const ctxX = focalPhoto[xKey] as number | null | undefined
                          const ctxY = focalPhoto[yKey] as number | null | undefined
                          setFocalX(ctxX ?? (Number(focalPhoto.focal_x) || 50))
                          setFocalY(ctxY ?? (Number(focalPhoto.focal_y) || 50))
                          const zoomKey = `${ctx}_zoom` as keyof Photo
                          setZoom(Number(focalPhoto[zoomKey]) || 1)
                        }
                      }}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                        focalContext === ctx
                          ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {labels[ctx]}
                    </button>
                  )
                })}
              </div>
            )}

            <p className="text-xs text-[var(--color-text-secondary)]">
              {focalContext === 'base'
                ? 'Default crop center — used when no context-specific focal is set.'
                : focalContext === 'avatar'
                  ? 'How this photo crops as a circular avatar.'
                  : focalContext === 'hero'
                    ? 'The banner at the top of your public profile. Crops differently on mobile and desktop.'
                    : 'How this photo crops as a square CV photo.'}
            </p>

            <FocalPointPicker
              imageUrl={focalPhoto.photo_url}
              focalX={focalX}
              focalY={focalY}
              onChange={(x, y) => { setFocalX(x); setFocalY(y) }}
            />

            {/* Zoom slider — context tabs only */}
            {focalContext !== 'base' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-tertiary)] w-6">1x</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[var(--color-teal-700)] h-1.5"
                />
                <span className="text-xs font-medium text-[var(--color-text-secondary)] w-8 text-right">{zoom.toFixed(1)}x</span>
              </div>
            )}

            {/* Context-specific crop preview */}
            {focalContext === 'avatar' ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--color-surface-raised)]">
                  <img src={focalPhoto.photo_url} alt="Avatar preview" className="w-full h-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%`, transform: `scale(${zoom})`, transformOrigin: `${focalX}% ${focalY}%` }} draggable={false} />
                </div>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">Avatar preview</span>
              </div>
            ) : focalContext === 'hero' ? (
              <div className="flex gap-3">
                <div className="flex flex-col gap-1 w-1/3">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
                    <img src={focalPhoto.photo_url} alt="Mobile" className="w-full h-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%`, transform: `scale(${zoom})`, transformOrigin: `${focalX}% ${focalY}%` }} draggable={false} />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] text-center">Mobile</span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="aspect-[2/1] rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
                    <img src={focalPhoto.photo_url} alt="Desktop" className="w-full h-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%`, transform: `scale(${zoom})`, transformOrigin: `${focalX}% ${focalY}%` }} draggable={false} />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] text-center">Desktop</span>
                </div>
              </div>
            ) : focalContext === 'cv' ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
                  <img src={focalPhoto.photo_url} alt="CV preview" className="w-full h-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%`, transform: `scale(${zoom})`, transformOrigin: `${focalX}% ${focalY}%` }} draggable={false} />
                </div>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">CV preview</span>
              </div>
            ) : (
              <PhotoFormatPreview
                photoUrl={focalPhoto.photo_url}
                focalX={focalX}
                focalY={focalY}
              />
            )}

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
                    // Build save payload based on active context
                    const payload: Record<string, number> = {}
                    if (focalContext === 'base') {
                      payload.focal_x = focalX
                      payload.focal_y = focalY
                    } else {
                      payload[`${focalContext}_focal_x`] = focalX
                      payload[`${focalContext}_focal_y`] = focalY
                      payload[`${focalContext}_zoom`] = zoom
                    }

                    const res = await fetch(`/api/user-photos/${focalPhoto.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })
                    if (!res.ok) throw new Error('Failed to save')

                    // Update local state
                    setPhotos((prev) => prev.map((p) =>
                      p.id === focalPhoto.id ? { ...p, ...payload } : p
                    ))
                    const contextLabels = { base: 'Base', avatar: 'Avatar', hero: 'Hero', cv: 'CV' }
                    toast(`${contextLabels[focalContext]} focal point saved`, 'success')
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
