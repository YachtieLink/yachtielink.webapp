import { createClient } from '@/lib/supabase/server';

export interface ProStatus {
  isPro: boolean;
  plan: 'monthly' | 'annual' | null;
  endsAt: string | null;
}

/**
 * Returns Pro subscription status for a user.
 * Checks both the status flag AND expiry date (belt + suspenders).
 * Server-side only.
 */
export async function getProStatus(userId?: string): Promise<ProStatus> {
  const supabase = await createClient();

  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return { isPro: false, plan: null, endsAt: null };

  const { data } = await supabase
    .from('users')
    .select('subscription_status, subscription_plan, subscription_ends_at')
    .eq('id', uid)
    .single();

  if (!data) return { isPro: false, plan: null, endsAt: null };

  const isPro =
    data.subscription_status === 'pro' &&
    (!data.subscription_ends_at || new Date(data.subscription_ends_at) > new Date());

  return {
    isPro,
    plan: data.subscription_plan as 'monthly' | 'annual' | null,
    endsAt: data.subscription_ends_at,
  };
}
