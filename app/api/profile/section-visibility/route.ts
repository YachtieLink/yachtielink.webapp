import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { sectionVisibilitySchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, sectionVisibilitySchema)
    if ('error' in result) return result.error
    const { section, visible } = result.data

    // Fetch current visibility, merge the single key change, and save
    const { data: profile } = await supabase
      .from('users')
      .select('section_visibility')
      .eq('id', user.id)
      .single()

    const current = (profile?.section_visibility ?? {}) as Record<string, boolean>
    current[section] = visible

    const { error } = await supabase
      .from('users')
      .update({ section_visibility: current })
      .eq('id', user.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
