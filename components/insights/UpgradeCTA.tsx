'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  /** Passed from server — remaining founding slots (null = no founding price configured) */
  foundingSlotsLeft?: number | null;
}

export function UpgradeCTA({ foundingSlotsLeft = null }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  // Default to annual if no founding slots available
  useEffect(() => {
    if (foundingSlotsLeft === 0) setPlan('annual');
  }, [foundingSlotsLeft]);

  const hasFoundingSlots = foundingSlotsLeft !== null && foundingSlotsLeft > 0;
  const monthlyPrice = hasFoundingSlots ? '€4.99' : '€8.99';
  const annualPrice = hasFoundingSlots ? '€49.99' : '€69.99';
  const monthlySaving = hasFoundingSlots ? 'save 44%' : null;
  const annualSaving = hasFoundingSlots ? 'save 53%' : 'save 35%';

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--teal-700)]/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-bold text-[var(--foreground)]">Crew Pro</span>
        {hasFoundingSlots ? (
          <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
            🔑 {foundingSlotsLeft} founding spots left
          </span>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
            Best value
          </span>
        )}
      </div>

      {hasFoundingSlots && (
        <p className="text-xs text-[var(--teal-700)] dark:text-[var(--teal-400)] mt-1 mb-2 font-medium">
          Founding members lock in {monthlyPrice}/mo or {annualPrice}/yr forever — price rises to €8.99/mo after spots fill.
        </p>
      )}

      {/* Plan toggle */}
      <div className="flex gap-2 mt-3 mb-4">
        <button
          onClick={() => setPlan('monthly')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            plan === 'monthly'
              ? 'bg-[var(--teal-700)] text-white'
              : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          Monthly
          <span className="block text-xs font-normal opacity-90">
            {monthlyPrice} / mo{monthlySaving ? ` · ${monthlySaving}` : ''}
          </span>
          {hasFoundingSlots && (
            <span className="block text-xs font-normal opacity-60">then €8.99/mo</span>
          )}
        </button>
        <button
          onClick={() => setPlan('annual')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            plan === 'annual'
              ? 'bg-[var(--teal-700)] text-white'
              : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          Annual
          <span className="block text-xs font-normal opacity-90">{annualPrice} / yr · {annualSaving}</span>
          {hasFoundingSlots && (
            <span className="block text-xs font-normal opacity-60">then €69.99/yr</span>
          )}
        </button>
      </div>

      {/* Feature list */}
      <ul className="text-sm text-[var(--muted-foreground)] space-y-1.5 mb-5">
        {[
          'Profile analytics — see who views your profile',
          'Premium CV templates (Classic Navy, Modern Minimal)',
          'No watermark on exported CVs',
          'Cert document manager + expiry reminders',
          'Custom subdomain: handle.yachtie.link',
          '20 endorsement requests / day (vs 10)',
        ].map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-[var(--teal-700)] mt-0.5">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[var(--teal-700)] text-white font-semibold text-sm hover:bg-[var(--teal-800)] disabled:opacity-60 transition-colors"
      >
        {loading ? 'Redirecting to checkout…' : 'Upgrade to Crew Pro'}
      </button>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-3">
        Cancel any time · Powered by Stripe
      </p>
    </div>
  );
}
