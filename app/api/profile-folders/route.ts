import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { profileFolderSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('profile_folders')
      .select('id, name, emoji, sort_order')
      .eq('user_id', user.id)
      .order('sort_order')

    return NextResponse.json({ folders: data ?? [] })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, profileFolderSchema)
    if ('error' in result) return result.error
    const { name, emoji } = result.data

    // Get next sort_order
    const { count } = await supabase
      .from('profile_folders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data, error } = await supabase
      .from('profile_folders')
      .insert({ user_id: user.id, name, emoji, sort_order: count ?? 0 })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({ folder: data }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}
