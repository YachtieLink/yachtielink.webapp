import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const { count } = await supabase
      .from('endorsement_requests')
      .select('id', { count: 'exact', head: true })
      .or(`recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}`)
      .eq('status', 'pending')

    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
