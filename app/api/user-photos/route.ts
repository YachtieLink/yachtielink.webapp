import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { userPhotoSchema, reorderPhotosSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const FREE_LIMIT = 3
const PRO_LIMIT = 9

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('user_photos')
      .select('id, photo_url, sort_order, created_at')
      .eq('user_id', user.id)
      .order('sort_order')

    return NextResponse.json({ photos: data ?? [] })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check subscription for limit
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    const isPro = profile?.subscription_status === 'pro'
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT

    const { count } = await supabase
      .from('user_photos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: `Photo limit reached (${limit}). Upgrade to Pro for more.` }, { status: 403 })
    }

    const result = await validateBody(req, userPhotoSchema)
    if ('error' in result) return result.error
    const { photo_url, sort_order } = result.data

    const { data, error } = await supabase
      .from('user_photos')
      .insert({ user_id: user.id, photo_url, sort_order })
      .select()
      .single()
    if (error) throw error

    // If this is the first photo, also update profile_photo_url
    if (sort_order === 0 || (count ?? 0) === 0) {
      await supabase.from('users').update({ profile_photo_url: photo_url }).eq('id', user.id)
    }

    await trackServerEvent(user.id, 'photo.uploaded', { bucket: 'user-photos' })

    return NextResponse.json({ photo: data }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}

// PUT — reorder photos
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, reorderPhotosSchema)
    if ('error' in result) return result.error
    const { photo_ids } = result.data

    // Validate that photo_ids covers all user photos
    const { data: existing } = await supabase
      .from('user_photos')
      .select('id')
      .eq('user_id', user.id)
    const existingIds = new Set((existing ?? []).map((p) => p.id))
    const submittedIds = new Set(photo_ids)
    if (existingIds.size !== submittedIds.size || ![...existingIds].every((id) => submittedIds.has(id))) {
      return NextResponse.json({ error: 'photo_ids must include all your photos' }, { status: 400 })
    }

    // Update sort_order for each photo — check for errors
    const updates = photo_ids.map((id, idx) =>
      supabase.from('user_photos').update({ sort_order: idx }).eq('id', id).eq('user_id', user.id)
    )
    const results = await Promise.all(updates)
    const failed = results.filter((r) => r.error)
    if (failed.length > 0) {
      console.error('Photo reorder partial failure:', failed.map((r) => r.error))
      return NextResponse.json({ error: 'Some photos could not be reordered' }, { status: 500 })
    }

    // Sync profile_photo_url to the first photo in the new order
    const { data: firstPhoto } = await supabase
      .from('user_photos')
      .select('photo_url')
      .eq('id', photo_ids[0])
      .eq('user_id', user.id)
      .single()
    if (firstPhoto) {
      await supabase.from('users').update({ profile_photo_url: firstPhoto.photo_url }).eq('id', user.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
