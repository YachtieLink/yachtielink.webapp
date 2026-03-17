import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { bulkSkillsSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('user_skills')
      .select('id, name, category, sort_order')
      .eq('user_id', user.id)
      .order('sort_order')

    return NextResponse.json({ skills: data ?? [] })
  } catch (e) {
    return handleApiError(e)
  }
}

// PUT — replace entire skill list (bulk save)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, bulkSkillsSchema)
    if ('error' in result) return result.error
    const { skills } = result.data

    await supabase.from('user_skills').delete().eq('user_id', user.id)

    if (skills.length > 0) {
      const rows = skills.map((s, idx) => ({
        user_id: user.id,
        name: s.name,
        category: s.category ?? null,
        sort_order: idx,
      }))
      const { error } = await supabase.from('user_skills').insert(rows)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
