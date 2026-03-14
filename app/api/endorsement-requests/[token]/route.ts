import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from('endorsement_requests')
    .select(`
      id, token, requester_id, yacht_id, recipient_email,
      status, expires_at, created_at, accepted_at, cancelled_at,
      requester:users!requester_id(display_name, full_name, profile_photo_url),
      yacht:yachts!yacht_id(id, name, yacht_type, length_meters, flag_state, year_built)
    `)
    .eq('token', token)
    .single()

  if (error || !request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Cancelled
  if (request.cancelled_at || request.status === 'cancelled') {
    return NextResponse.json({ error: 'This request was cancelled' }, { status: 410 })
  }

  // Expired
  const isExpired = new Date(request.expires_at) < new Date()
  if (isExpired) {
    return NextResponse.json({ expired: true, request }, { status: 200 })
  }

  return NextResponse.json({ request })
}
