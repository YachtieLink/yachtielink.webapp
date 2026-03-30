'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { uploadCV } from '@/lib/storage/upload'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 10 * 1024 * 1024

interface CvUploadClientProps {
  userId: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CvUploadClient({ userId }: CvUploadClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<{ name: string; size: number; path: string } | null>(null)
  const [justUploading, setJustUploading] = useState(false)

  const processFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast('Only PDF or DOCX files are accepted', 'error')
      return
    }
    if (file.size > MAX_SIZE) {
      toast('File must be under 10 MB', 'error')
      return
    }

    setUploading(true)
    const result = await uploadCV(userId, file)
    setUploading(false)

    if (!result.ok) {
      toast(result.error, 'error')
      return
    }

    // Clear any cached wizard state so a fresh parse runs on the new file
    try { sessionStorage.removeItem(`cv-wizard-${result.storagePath}`) } catch { /* SSR guard */ }
    setUploaded({ name: file.name, size: file.size, path: result.storagePath })
  }, [userId, toast])

  async function handleJustUpload() {
    if (!uploaded) return
    setJustUploading(true)
    await supabase.from('users').update({ cv_storage_path: uploaded.path }).eq('id', userId)
    toast('CV uploaded.', 'success')
    router.push('/app/cv')
  }

  function handleBuildProfile() {
    if (!uploaded) return
    router.push(`/app/cv/review?path=${encodeURIComponent(uploaded.path)}`)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // Post-upload: same page layout, upload zone becomes file confirmation
  if (uploaded) {
    return (
      <div className="p-4 flex flex-col gap-5 min-h-[calc(100dvh-10rem)] justify-center">
        {/* Same header — updated copy */}
        <div>
          <h1 className="text-xl font-serif font-semibold text-[var(--color-text-primary)]">
            CV ready
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            We&apos;ve got your CV. Now let us read it and build your profile — yachts, certifications, skills, everything extracted in under 30 seconds.
          </p>
        </div>

        {/* File confirmation — replaces the upload zone, amber-tinted to match CV section */}
        <div className="flex items-center gap-3 rounded-2xl p-4 border-2 border-dashed border-[var(--color-amber-300)] bg-[var(--color-amber-50)]/40">
          <div className="h-8 w-8 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center flex-shrink-0">
            <svg className="h-4 w-4 text-[var(--color-amber-700)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{uploaded.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{formatFileSize(uploaded.size)}</p>
          </div>
          <button
            onClick={() => setUploaded(null)}
            className="text-xs text-[var(--color-interactive)] hover:opacity-80 transition-opacity flex-shrink-0"
          >
            Change
          </button>
        </div>

        {/* Primary CTA */}
        <Button onClick={handleBuildProfile} className="w-full" size="lg">
          Build my profile from this CV
        </Button>

        {/* Same "What we do" section — now acts as reassurance + alternatives */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Other options</p>
          <button
            onClick={handleJustUpload}
            disabled={justUploading}
            className="flex items-start gap-3 text-left"
          >
            <div className="h-5 w-5 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="h-3 w-3 text-[var(--color-text-tertiary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium text-[var(--color-text-primary)]">{justUploading ? 'Saving…' : 'Just store this CV.'}</span>{' '}
              Save it to your profile without importing — useful if your profile is already set up.
            </p>
          </button>
          <a href="/app/profile" className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="h-3 w-3 text-[var(--color-text-tertiary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium text-[var(--color-text-primary)]">Enter details manually.</span>{' '}
              Skip the import and build your profile yourself.
            </p>
          </a>
        </div>

        {/* Privacy note */}
        <p className="text-[11px] text-[var(--color-text-tertiary)] text-center">
          Your CV is stored securely. You control who can see it.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-5 min-h-[calc(100dvh-10rem)] justify-center">
      {/* Header — sell the feature */}
      <div>
        <h1 className="text-xl font-serif font-semibold text-[var(--color-text-primary)]">
          Import your CV
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
          No more retyping your career into another platform. Upload your CV and your entire profile is built in under 30 seconds — yachts, roles, certifications, skills, all of it.
        </p>
      </div>

      {/* Upload zone — amber/sand tinted to match CV section color */}
      {uploading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-amber-200)] bg-[var(--color-amber-50)]/40 p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-amber-200)] border-t-[var(--color-amber-500)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Uploading…</p>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
            dragOver
              ? 'border-[var(--color-amber-500)] bg-[var(--color-amber-50)]'
              : 'border-[var(--color-amber-200)] bg-[var(--color-amber-50)]/30 hover:bg-[var(--color-amber-50)]/60 hover:border-[var(--color-amber-300)]'
          }`}
        >
          <svg className="h-8 w-8 text-[var(--color-amber-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Tap to upload your CV</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">PDF or DOCX · Max 10 MB</p>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {/* How it works — tell the story of what happens behind the scenes */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">What we do for you</p>
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-[var(--color-amber-700)]">1</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text-primary)]">Read your career.</span>{' '}
            We extract every yacht, role, certification, skill, and qualification — so you don&apos;t have to type it all again.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-[var(--color-amber-700)]">2</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text-primary)]">Connect your yachts.</span>{' '}
            We match each vessel against our database. If your yacht isn&apos;t listed yet, we&apos;ll add it — and your crew mates will be able to find it too.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-[var(--color-amber-700)]">3</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text-primary)]">You stay in control.</span>{' '}
            Review everything we found before it&apos;s saved. Edit, skip, or adjust — nothing changes without your say-so.
          </p>
        </div>
      </div>

      {/* Privacy note */}
      <p className="text-[11px] text-[var(--color-text-tertiary)] text-center">
        Your CV is stored securely. You control who can see it.
      </p>

      {/* Manual entry fallback */}
      <p className="text-xs text-[var(--color-text-tertiary)] text-center">
        Don&apos;t have your CV handy?{' '}
        <a href="/app/profile" className="text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)]">
          Enter your details manually
        </a>
      </p>
    </div>
  )
}
