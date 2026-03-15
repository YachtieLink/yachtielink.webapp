import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { updateEndorsementSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { moderateText } from '@/lib/ai/moderation'
import { trackServerEvent } from '@/lib/analytics/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await applyRateLimit(req, 'endorsementEdit', user.id)
  if (limited) return limited

  const result = await validateBody(req, updateEndorsementSchema)
  if ('error' in result) return result.error
  const body = result.data

  // AI-01: Content moderation on updated content (if provided)
  if (body.content) {
    const moderation = await moderateText(body.content)
    if (moderation.flagged) {
      trackServerEvent(user.id, 'moderation.flagged', { context: 'endorsement.update', categories: moderation.categories })
      return NextResponse.json({ error: 'Your endorsement was flagged as potentially inappropriate. Please revise it.' }, { status: 422 })
    }
  }

  const { data: endorsement, error } = await supabase
    .from('endorsements')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('endorser_id', user.id)  // only own endorsements
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !endorsement) {
    return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 })
  }

  return NextResponse.json({ endorsement })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('endorsements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('endorser_id', user.id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: 'Failed to delete endorsement' }, { status: 500 })

  trackServerEvent(user.id, 'endorsement.deleted', { endorsement_id: id })

  return new NextResponse(null, { status: 204 })
}
