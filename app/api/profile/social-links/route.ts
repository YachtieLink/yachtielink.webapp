import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { socialLinksSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase.from('users').select('social_links').eq('id', user.id).single()
    return NextResponse.json({ links: data?.social_links ?? [] })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, socialLinksSchema)
    if ('error' in result) return result.error
    const { links } = result.data

    const { error } = await supabase
      .from('users')
      .update({ social_links: links })
      .eq('id', user.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
