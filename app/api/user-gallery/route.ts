import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { userGalleryItemSchema, reorderGallerySchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const FREE_LIMIT = 3
const PRO_LIMIT = 15

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('user_gallery')
      .select('id, image_url, caption, yacht_id, sort_order, yachts ( name )')
      .eq('user_id', user.id)
      .order('sort_order')

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    const isPro = profile?.subscription_status === 'pro'
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT

    const { count } = await supabase
      .from('user_gallery')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: `Gallery limit reached (${limit}).` }, { status: 403 })
    }

    const result = await validateBody(req, userGalleryItemSchema)
    if ('error' in result) return result.error
    const { image_url, caption, yacht_id, sort_order } = result.data

    const { data, error } = await supabase
      .from('user_gallery')
      .insert({ user_id: user.id, image_url, caption, yacht_id, sort_order })
      .select()
      .single()
    if (error) throw error

    await trackServerEvent(user.id, 'gallery.uploaded', { bucket: 'user-gallery' })

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, reorderGallerySchema)
    if ('error' in result) return result.error
    const { item_ids } = result.data

    // Validate that item_ids covers all user gallery items
    const { data: existing } = await supabase
      .from('user_gallery')
      .select('id')
      .eq('user_id', user.id)
    const existingIds = new Set((existing ?? []).map((g) => g.id))
    const submittedIds = new Set(item_ids)
    if (existingIds.size !== submittedIds.size || ![...existingIds].every((id) => submittedIds.has(id))) {
      return NextResponse.json({ error: 'item_ids must include all your gallery items' }, { status: 400 })
    }

    // Update sort_order — check for errors
    const updates = item_ids.map((id, idx) =>
      supabase.from('user_gallery').update({ sort_order: idx }).eq('id', id).eq('user_id', user.id)
    )
    const results = await Promise.all(updates)
    const failed = results.filter((r) => r.error)
    if (failed.length > 0) {
      console.error('Gallery reorder partial failure:', failed.map((r) => r.error))
      return NextResponse.json({ error: 'Some items could not be reordered' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
