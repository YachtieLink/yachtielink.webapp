'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { createClient } from '@/lib/supabase/client'
import { uploadProfilePhoto } from '@/lib/storage/upload'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

export default function ProfilePhotoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [imgSrc, setImgSrc]       = useState<string>('')
  const [crop, setCrop]           = useState<Crop>()
  const [saving, setSaving]       = useState(false)
  const imgRef                    = useRef<HTMLImageElement>(null)
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const supabase                  = createClient()

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      toast('Only JPEG, PNG, or WebP images are allowed.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Photo must be under 5 MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setImgSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    setCrop(centerAspectCrop(width, height))
  }

  const getCroppedBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img    = imgRef.current
      const canvas = document.createElement('canvas')
      if (!img || !crop) { resolve(null); return }

      const scaleX   = img.naturalWidth  / img.width
      const scaleY   = img.naturalHeight / img.height
      const pixelCrop = {
        x:      (crop.unit === '%' ? (crop.x / 100) * img.naturalWidth  : crop.x * scaleX),
        y:      (crop.unit === '%' ? (crop.y / 100) * img.naturalHeight : crop.y * scaleY),
        width:  (crop.unit === '%' ? (crop.width  / 100) * img.naturalWidth  : crop.width  * scaleX),
        height: (crop.unit === '%' ? (crop.height / 100) * img.naturalHeight : crop.height * scaleY),
      }

      const SIZE      = 800
      canvas.width    = SIZE
      canvas.height   = SIZE
      const ctx       = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }

      ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, SIZE, SIZE,
      )

      const outputType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        ? 'image/webp' : 'image/jpeg'

      canvas.toBlob((b) => resolve(b), outputType, 0.88)
    })
  }, [crop])

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast('Not signed in.', 'error'); return }

      const blob = await getCroppedBlob()
      if (!blob) { toast('Could not process image.', 'error'); return }

      // Convert blob to File for the upload helper
      const ext  = blob.type === 'image/webp' ? 'webp' : 'jpeg'
      const file = new File([blob], `avatar.${ext}`, { type: blob.type })

      const result = await uploadProfilePhoto(user.id, file)
      if (!result.ok) { toast(result.error, 'error'); return }

      // Save URL back to users table
      const { error } = await supabase
        .from('users')
        .update({ profile_photo_url: result.url })
        .eq('id', user.id)

      if (error) { toast('Saved photo but failed to update profile.', 'error'); return }

      toast('Photo updated!', 'success')
      router.push('/app/profile')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Profile photo</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          JPEG, PNG, or WebP · max 5 MB · square crop
        </p>
      </div>

      {!imgSrc ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-[var(--border)] rounded-2xl p-12 flex flex-col items-center gap-3 text-[var(--muted-foreground)] hover:border-[var(--ocean-500)] hover:text-[var(--ocean-500)] transition-colors"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm font-medium">Choose photo</span>
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            circularCrop
            className="rounded-xl overflow-hidden max-w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-w-full max-h-[60vh] object-contain"
            />
          </ReactCrop>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setImgSrc(''); setCrop(undefined) }}
              className="flex-1"
            >
              Choose different
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="flex-1"
            >
              Save photo
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
