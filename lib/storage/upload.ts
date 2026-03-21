/**
 * lib/storage/upload.ts
 *
 * Client-side helpers for uploading to Supabase Storage.
 * See docs/yl_storage_plan.md for bucket conventions and rationale.
 */

import { createClient } from '@/lib/supabase/client'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024   // 5 MB
const MAX_CERT_BYTES  = 10 * 1024 * 1024  // 10 MB
const TARGET_PHOTO_PX = 800               // max dimension for avatar resize

// ─────────────────────────────────────────
// Image pre-processing
// ─────────────────────────────────────────

/**
 * Resize a File/Blob to at most TARGET_PHOTO_PX on its longest side,
 * and convert to WebP where supported. Returns a Blob.
 */
export async function resizeImage(
  file: File,
  maxPx = TARGET_PHOTO_PX,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const { width, height } = img
      const scale = Math.min(1, maxPx / Math.max(width, height))
      const w = Math.round(width * scale)
      const h = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h

      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not available')); return }
      ctx.drawImage(img, 0, 0, w, h)

      // Prefer WebP; fall back to JPEG
      const outputType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg'

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          resolve(blob)
        },
        outputType,
        0.88,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

// ─────────────────────────────────────────
// Profile photo upload
// ─────────────────────────────────────────

export type UploadPhotoResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Validate, resize, and upload a profile photo.
 * Saves to: profile-photos/{userId}/avatar.{ext}
 * Returns the public CDN URL (with cache-bust timestamp).
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File,
): Promise<UploadPhotoResult> {
  // Validate type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPEG, PNG, or WebP images are allowed.' }
  }
  // Validate size before processing
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Photo must be under 5 MB.' }
  }

  let blob: Blob
  try {
    blob = await resizeImage(file)
  } catch {
    return { ok: false, error: 'Could not process image. Please try another file.' }
  }

  const ext   = blob.type === 'image/webp' ? 'webp' : 'jpeg'
  const path  = `${userId}/avatar.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('profile-photos')
    .upload(path, blob, { contentType: blob.type, upsert: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  const { data } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(path)

  // Cache-bust so browsers reload the new avatar
  const url = `${data.publicUrl}?t=${Date.now()}`
  return { ok: true, url }
}

// ─────────────────────────────────────────
// Cert document upload
// ─────────────────────────────────────────

const ALLOWED_CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export type UploadCertResult =
  | { ok: true; storagePath: string }
  | { ok: false; error: string }

/**
 * Upload a certification document.
 * Saves to: cert-documents/{userId}/{certId}.{ext}
 * Returns the raw storage path (NOT a URL — generate signed URLs at render time).
 * See docs/yl_storage_plan.md for the signed URL pattern.
 */
export async function uploadCertDocument(
  userId: string,
  certId: string,
  file: File,
): Promise<UploadCertResult> {
  if (!ALLOWED_CERT_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only PDF, JPEG, or PNG files are allowed.' }
  }
  if (file.size > MAX_CERT_BYTES) {
    return { ok: false, error: 'File must be under 10 MB.' }
  }

  const extMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg':      'jpeg',
    'image/png':       'png',
  }
  const ext  = extMap[file.type]
  const path = `${userId}/${certId}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('cert-documents')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, storagePath: path }
}

/**
 * Generate a 1-hour signed URL for a private cert document.
 * Call this at render time — never store the signed URL.
 */
export async function getCertDocumentUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('cert-documents')
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

// ─────────────────────────────────────────
// CV upload
// ─────────────────────────────────────────

const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_CV_BYTES = 10 * 1024 * 1024 // 10 MB

export type UploadCVResult =
  | { ok: true; storagePath: string }
  | { ok: false; error: string }

/**
 * Validate and upload a CV file (PDF or DOCX).
 * Saves to: cv-uploads/{userId}/cv.{ext} — one file per user, overwrites previous.
 * Returns the raw storage path (generate signed URLs at render time).
 */
export async function uploadCV(
  userId: string,
  file: File,
): Promise<UploadCVResult> {
  if (!ALLOWED_CV_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only PDF or DOCX files are allowed.' }
  }
  if (file.size > MAX_CV_BYTES) {
    return { ok: false, error: 'File must be under 10 MB.' }
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : 'docx'
  const path = `${userId}/cv.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('cv-uploads')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, storagePath: path }
}

/**
 * Generate a 1-hour signed URL for a PDF export.
 * Call this at render time — never store the signed URL.
 */
export async function getPdfExportUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('pdf-exports')
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

// ─────────────────────────────────────────
// User photos (multi-photo profile gallery)
// ─────────────────────────────────────────

const MAX_USER_PHOTO_PX = 1200

export async function uploadUserPhoto(
  userId: string,
  file: File,
): Promise<UploadPhotoResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPEG, PNG, or WebP images are allowed.' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Photo must be under 5 MB.' }
  }

  let blob: Blob
  try {
    blob = await resizeImage(file, MAX_USER_PHOTO_PX)
  } catch {
    return { ok: false, error: 'Could not process image.' }
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpeg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('user-photos')
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from('user-photos').getPublicUrl(path)
  return { ok: true, url: `${data.publicUrl}?t=${Date.now()}` }
}

export async function deleteUserPhoto(photoUrl: string): Promise<void> {
  const url = new URL(photoUrl)
  const storagePath = url.pathname.split('/object/public/user-photos/')[1]
  if (!storagePath) return
  const supabase = createClient()
  await supabase.storage.from('user-photos').remove([storagePath])
}

// ─────────────────────────────────────────
// User gallery (work samples)
// ─────────────────────────────────────────

export async function uploadGalleryItem(
  userId: string,
  file: File,
): Promise<UploadPhotoResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPEG, PNG, or WebP images are allowed.' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: 'Photo must be under 5 MB.' }
  }

  let blob: Blob
  try {
    blob = await resizeImage(file, MAX_USER_PHOTO_PX)
  } catch {
    return { ok: false, error: 'Could not process image.' }
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpeg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('user-gallery')
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from('user-gallery').getPublicUrl(path)
  return { ok: true, url: `${data.publicUrl}?t=${Date.now()}` }
}

export async function deleteGalleryItem(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl)
  const storagePath = url.pathname.split('/object/public/user-gallery/')[1]
  if (!storagePath) return
  const supabase = createClient()
  await supabase.storage.from('user-gallery').remove([storagePath])
}

// ─────────────────────────────────────────
// Server-side storage path extraction
// ─────────────────────────────────────────

/**
 * Extract the storage path from a public URL for a given bucket.
 * Use in API routes with the server supabase client.
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl)
    const marker = `/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return url.pathname.slice(idx + marker.length)
  } catch {
    return null
  }
}
