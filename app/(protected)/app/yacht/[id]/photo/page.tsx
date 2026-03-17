'use client'

import { useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadYachtCoverPhoto } from '@/lib/storage/yacht'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import Image from 'next/image'

export default function YachtPhotoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast: showToast } = useToast() // aliased: Toast API uses `toast`, this file uses `showToast`
  const supabase = createClient()

  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    const result = await uploadYachtCoverPhoto(params.id, file)
    if ('error' in result) {
      showToast(result.error, 'error')
      setUploading(false)
      return
    }

    // Save URL to yacht record
    const { error } = await supabase
      .from('yachts')
      .update({ cover_photo_url: result.url })
      .eq('id', params.id)

    setUploading(false)
    if (error) {
      showToast('Upload succeeded but failed to save. Please try again.', 'error')
      return
    }

    showToast('Cover photo updated.', 'success')
    router.push(`/app/yacht/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 pt-8 pb-24">
      <button
        onClick={() => router.back()}
        className="text-sm text-[var(--color-text-secondary)] mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Cover photo</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Add a photo of the yacht. JPEG, PNG or WebP, max 5 MB.
      </p>

      {/* Preview */}
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-[16/9] rounded-2xl bg-[var(--color-surface-raised)] overflow-hidden mb-6 cursor-pointer border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-interactive)] transition-colors"
      >
        {preview ? (
          <Image src={preview} alt="Preview" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-3xl opacity-30">📷</span>
            <p className="text-xs text-[var(--color-text-secondary)]">Tap to choose a photo</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
        size="lg"
      >
        {uploading ? 'Uploading…' : 'Save cover photo'}
      </Button>
    </div>
  )
}
