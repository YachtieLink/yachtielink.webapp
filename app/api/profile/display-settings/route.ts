import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { displaySettingsSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'
import { getProStatus } from '@/lib/stripe/pro'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('users')
      .select('profile_view_mode, scrim_preset, accent_color, profile_template')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (e) {
    return handleApiError(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, displaySettingsSchema)
    if ('error' in result) return result.error

    if (result.data.profile_view_mode === 'rich_portfolio') {
      const { isPro } = await getProStatus(user.id)
      if (!isPro) return NextResponse.json({ error: 'Rich Portfolio requires Pro' }, { status: 403 })
    }

    const { error } = await supabase
      .from('users')
      .update(result.data)
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
