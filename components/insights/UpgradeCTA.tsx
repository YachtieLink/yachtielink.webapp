'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UpgradeCTA() {
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

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
        <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
          Best value
        </span>
      </div>

      {/* Plan toggle */}
      <div className="flex gap-2 mt-3 mb-4">
        <button
          onClick={() => setPlan('monthly')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            plan === 'monthly'
              ? 'bg-[var(--teal-700)] text-white'
              : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          Monthly
          <span className="block text-xs font-normal opacity-80">€12 / mo</span>
        </button>
        <button
          onClick={() => setPlan('annual')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            plan === 'annual'
              ? 'bg-[var(--teal-700)] text-white'
              : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          Annual
          <span className="block text-xs font-normal opacity-80">€9 / mo · save 25%</span>
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
