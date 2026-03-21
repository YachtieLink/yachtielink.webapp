import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { updateGalleryItemSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'
import { extractStoragePath } from '@/lib/storage/upload'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, updateGalleryItemSchema)
    if ('error' in result) return result.error
    const { caption, yacht_id } = result.data

    const { data, error } = await supabase
      .from('user_gallery')
      .update({ caption, yacht_id })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({ item: data })
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

    const { data: item } = await supabase
      .from('user_gallery')
      .select('image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const storagePath = extractStoragePath(item.image_url, 'user-gallery')
    if (storagePath) {
      await supabase.storage.from('user-gallery').remove([storagePath])
    }

    await supabase.from('user_gallery').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
