'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  isPro: boolean;
}

/**
 * Shows a success/pending toast after returning from Stripe Checkout.
 * If the webhook hasn't fired yet (still free), auto-refreshes after 3 s.
 */
export function InsightsUpgradedToast({ isPro }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isPro) {
      // Webhook may not have fired yet — refresh after 3 s
      const timer = setTimeout(() => router.refresh(), 3000);
      return () => clearTimeout(timer);
    }
    // Auto-dismiss after 5 s
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [isPro, router]);

  if (!visible) return null;

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm font-medium ${
        isPro
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
      }`}
    >
      {isPro
        ? '🎉 Welcome to Crew Pro! Your features are now active.'
        : 'Your upgrade is processing… refreshing shortly.'}
    </div>
  );
}
