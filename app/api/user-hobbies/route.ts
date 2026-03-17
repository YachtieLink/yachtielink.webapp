import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { bulkHobbiesSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('user_hobbies')
      .select('id, name, emoji, sort_order')
      .eq('user_id', user.id)
      .order('sort_order')

    return NextResponse.json({ hobbies: data ?? [] })
  } catch (e) {
    return handleApiError(e)
  }
}

// PUT — replace entire hobby list (bulk save)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, bulkHobbiesSchema)
    if ('error' in result) return result.error
    const { hobbies } = result.data

    // Delete existing and re-insert in one go
    await supabase.from('user_hobbies').delete().eq('user_id', user.id)

    if (hobbies.length > 0) {
      const rows = hobbies.map((h, idx) => ({
        user_id: user.id,
        name: h.name,
        emoji: h.emoji ?? null,
        sort_order: idx,
      }))
      const { error } = await supabase.from('user_hobbies').insert(rows)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
