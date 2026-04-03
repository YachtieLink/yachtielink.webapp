import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const isPinned = body.is_pinned === true

  // Verify the endorsement exists and belongs to this user (as recipient)
  const { data: endorsement } = await supabase
    .from('endorsements')
    .select('id, recipient_id, is_pinned, is_dormant')
    .eq('id', id)
    .single()

  if (!endorsement) {
    return NextResponse.json({ error: 'Endorsement not found' }, { status: 404 })
  }

  if (endorsement.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Only the recipient can pin endorsements' }, { status: 403 })
  }

  if (isPinned && endorsement.is_dormant === true) {
    return NextResponse.json({ error: 'Cannot pin a dormant endorsement' }, { status: 400 })
  }

  // If pinning, check max 3 pinned
  if (isPinned) {
    const { count } = await supabase
      .from('endorsements')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_pinned', true)
      .or('is_dormant.is.null,is_dormant.eq.false')
      .neq('id', id)

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Maximum 3 pinned endorsements. Unpin one first.' }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('endorsements')
    .update({ is_pinned: isPinned })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, is_pinned: isPinned })
}
