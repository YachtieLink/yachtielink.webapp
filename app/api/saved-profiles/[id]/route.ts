import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { moveToFolderSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, moveToFolderSchema)
    if ('error' in result) return result.error
    const { folder_id } = result.data

    // Verify the folder belongs to this user (if not null)
    if (folder_id) {
      const { data: folder } = await supabase
        .from('profile_folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', user.id)
        .single()
      if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .update({ folder_id })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ saved: data })
  } catch (e) {
    return handleApiError(e)
  }
}
