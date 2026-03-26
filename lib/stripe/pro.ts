import { createClient } from '@/lib/supabase/server';

export interface ProStatus {
  isPro: boolean;
  plan: 'monthly' | 'annual' | null;
  endsAt: string | null;
}

/**
 * Pure check for Pro status from an already-fetched user record.
 * Use this when you already have the user row and don't want a second DB query.
 * Canonical logic — matches getProStatus().
 */
export function isProFromRecord(user: {
  subscription_status: string | null;
  subscription_ends_at: string | null;
}): boolean {
  return (
    user.subscription_status === 'pro' &&
    (!user.subscription_ends_at || new Date(user.subscription_ends_at) > new Date())
  );
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

  return {
    isPro: isProFromRecord(data),
    plan: data.subscription_plan as 'monthly' | 'annual' | null,
    endsAt: data.subscription_ends_at,
  };
}
