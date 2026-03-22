import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { cvSettingsSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, cvSettingsSchema)
    if ('error' in result) return result.error
    const { cv_public, cv_public_source } = result.data

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

    // Zod refine guarantees at least one field, but belt-and-suspenders
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update(update)
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
