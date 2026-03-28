/**
 * Pure Pro-status helpers — safe to import from client components.
 * No server-only imports (no Supabase server client, no next/headers).
 *
 * For server-only Pro helpers that need DB access, use `lib/stripe/pro.ts`.
 */

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
