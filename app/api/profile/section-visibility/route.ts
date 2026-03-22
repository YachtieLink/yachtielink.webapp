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

    // Atomic jsonb_set — no read-modify-write race
    const { error } = await supabase.rpc('update_section_visibility', {
      p_user_id: user.id,
      p_section: section,
      p_visible: visible,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
