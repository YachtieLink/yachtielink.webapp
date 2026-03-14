'use client'

import { createClient } from '@/lib/supabase/client'

/** Upload or replace the cover photo for a yacht.
 *  Caller must have an attachment to this yacht — enforced by storage RLS.
 *  Returns the public CDN URL (with cache-bust) or an error string.
 */
export async function uploadYachtCoverPhoto(
  yachtId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return { error: 'Image must be JPEG, PNG, or WebP' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image must be under 5 MB' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${yachtId}/cover.${ext}`
  const supabase = createClient()

  const { error: uploadError } = await supabase.storage
    .from('yacht-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from('yacht-photos').getPublicUrl(path)
  return { url: `${data.publicUrl}?t=${Date.now()}` }
}

/** Derive size_category from length in metres. */
export function sizeFromLength(meters: number): 'small' | 'medium' | 'large' | 'superyacht' {
  if (meters < 24) return 'small'
  if (meters < 50) return 'medium'
  if (meters < 80) return 'large'
  return 'superyacht'
}

/** Common yacht flag states (most frequent in superyacht registry). */
export const FLAG_STATES = [
  'Cayman Islands',
  'Malta',
  'Marshall Islands',
  'Bahamas',
  'British Virgin Islands',
  'Gibraltar',
  'Panama',
  'Bermuda',
  'Isle of Man',
  'Vanuatu',
  'Cyprus',
  'Antigua & Barbuda',
  'Saint Vincent & the Grenadines',
  'Seychelles',
  'Cook Islands',
  'United Kingdom',
  'United States',
  'France',
  'Italy',
  'Netherlands',
  'Australia',
  'New Zealand',
  'Norway',
  'Denmark',
  'Other',
]
