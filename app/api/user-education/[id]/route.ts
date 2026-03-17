import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { userEducationSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, userEducationSchema)
    if ('error' in result) return result.error
    const { institution, qualification, field_of_study, started_at, ended_at } = result.data

    const { data, error } = await supabase
      .from('user_education')
      .update({ institution, qualification, field_of_study, started_at, ended_at })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({ education: data })
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

    const { data: existing } = await supabase
      .from('user_education').select('id').eq('id', id).eq('user_id', user.id).single()
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabase.from('user_education').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
