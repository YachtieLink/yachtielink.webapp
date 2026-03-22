import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { cv_public, cv_public_source } = body

  // Validate cv_public_source
  if (cv_public_source && !['generated', 'uploaded'].includes(cv_public_source)) {
    return NextResponse.json({ error: 'Invalid cv_public_source' }, { status: 400 })
  }

  // Guard: can't set source to 'uploaded' if no CV is uploaded
  if (cv_public_source === 'uploaded') {
    const { data: profile } = await supabase
      .from('users')
      .select('cv_storage_path')
      .eq('id', user.id)
      .single()
    if (!profile?.cv_storage_path) {
      return NextResponse.json({ error: 'No uploaded CV to share' }, { status: 400 })
    }
  }

  const update: Record<string, unknown> = {}
  if (typeof cv_public === 'boolean') update.cv_public = cv_public
  if (cv_public_source) update.cv_public_source = cv_public_source

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
