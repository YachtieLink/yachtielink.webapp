import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { extractStoragePath } from '@/lib/storage/upload'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const focalX = typeof body.focal_x === 'number' ? Math.min(100, Math.max(0, body.focal_x)) : undefined
    const focalY = typeof body.focal_y === 'number' ? Math.min(100, Math.max(0, body.focal_y)) : undefined

    if (focalX === undefined && focalY === undefined) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const update: Record<string, number> = {}
    if (focalX !== undefined) update.focal_x = focalX
    if (focalY !== undefined) update.focal_y = focalY

    const { error } = await supabase
      .from('user_photos')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership and get the URL
    const { data: photo } = await supabase
      .from('user_photos')
      .select('photo_url, sort_order')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete storage object
    const storagePath = extractStoragePath(photo.photo_url, 'user-photos')
    if (storagePath) {
      await supabase.storage.from('user-photos').remove([storagePath])
    }

    await supabase.from('user_photos').delete().eq('id', id).eq('user_id', user.id)

    // If this was the first photo, update profile_photo_url to next photo
    if (photo.sort_order === 0) {
      const { data: nextPhoto } = await supabase
        .from('user_photos')
        .select('photo_url')
        .eq('user_id', user.id)
        .order('sort_order')
        .limit(1)
        .single()
      await supabase
        .from('users')
        .update({ profile_photo_url: nextPhoto?.photo_url ?? null })
        .eq('id', user.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
