import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { profileFolderSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, profileFolderSchema)
    if ('error' in result) return result.error
    const { name, emoji } = result.data

    const { data, error } = await supabase
      .from('profile_folders')
      .update({ name, emoji })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({ folder: data })
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

    // Profiles in deleted folder move to null (handled by FK on delete set null)
    await supabase.from('profile_folders').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
