import { createClient } from '@/lib/supabase/server';
import { isProFromRecord, type ProStatus } from './pro-shared';

// Re-export pure helpers so existing server-side `import { isProFromRecord } from '@/lib/stripe/pro'` still works.
export { isProFromRecord, type ProStatus } from './pro-shared';

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
