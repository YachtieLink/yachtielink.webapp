import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { saveProfileSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const deleteSavedSchema = z.object({ saved_user_id: z.string().uuid() })

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folder_id') // 'null' string or uuid or absent
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = 20

    let query = supabase
      .from('saved_profiles')
      .select(`
        id, folder_id, created_at,
        saved_user:saved_user_id (
          id, display_name, full_name, handle, profile_photo_url, primary_role
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (folderId === 'null') {
      query = query.is('folder_id', null)
    } else if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data, count } = await query
    return NextResponse.json({ results: data ?? [], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, saveProfileSchema)
    if ('error' in result) return result.error
    const { saved_user_id, folder_id } = result.data

    if (saved_user_id === user.id) {
      return NextResponse.json({ error: "You can't save your own profile." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .upsert({ user_id: user.id, saved_user_id, folder_id }, { onConflict: 'user_id,saved_user_id' })
      .select()
      .single()
    if (error) throw error

    await trackServerEvent(user.id, 'profile.saved', { saved_user_id })

    return NextResponse.json({ saved: data }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, deleteSavedSchema)
    if ('error' in result) return result.error
    const { saved_user_id } = result.data

    await supabase
      .from('saved_profiles')
      .delete()
      .eq('user_id', user.id)
      .eq('saved_user_id', saved_user_id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
