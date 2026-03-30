import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import { PlanPageClient } from './PlanPageClient'

export const metadata = {
  title: 'Your Plan — YachtieLink',
}

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/welcome')
  }

  const { data } = await supabase
    .from('users')
    .select('subscription_status, subscription_plan, subscription_ends_at, stripe_customer_id, founding_member')
    .eq('id', user.id)
    .single()

  const record = data ?? {
    subscription_status: null,
    subscription_plan: null,
    subscription_ends_at: null,
    stripe_customer_id: null,
    founding_member: false,
  }

  const isPro = isProFromRecord(record)

  return (
    <PlanPageClient
      isPro={isPro}
      plan={(record.subscription_plan as 'monthly' | 'annual' | null) ?? null}
      endsAt={record.subscription_ends_at ?? null}
      hasStripeCustomer={!!record.stripe_customer_id}
      isFoundingMember={!!record.founding_member}
    />
  )
}
