import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getPendingRequestCount = cache(async (userId: string, userEmail: string) => {
  const supabase = await createClient()
  const { count } = await supabase
    .from('endorsement_requests')
    .select('id', { count: 'exact', head: true })
    .or(`recipient_user_id.eq.${userId},recipient_email.eq.${userEmail}`)
    .eq('status', 'pending')
  return count ?? 0
})
