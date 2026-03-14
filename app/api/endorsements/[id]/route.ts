import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UpdateEndorsementBody {
  content?: string
  endorser_role_label?: string
  recipient_role_label?: string
  worked_together_start?: string
  worked_together_end?: string
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as UpdateEndorsementBody

  if (body.content !== undefined) {
    if (body.content.length < 10 || body.content.length > 2000) {
      return NextResponse.json({ error: 'Content must be between 10 and 2000 characters' }, { status: 400 })
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

  return new NextResponse(null, { status: 204 })
}
