'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface Props {
  /** Passed from server — remaining founding slots (null = no founding price configured) */
  foundingSlotsLeft?: number | null;
}

export function UpgradeCTA({ foundingSlotsLeft = null }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      } else {
        toast('Something went wrong. Please try again.', 'error');
        setLoading(false);
      }
    } catch {
      toast('Checkout failed. Please try again.', 'error');
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-[var(--tab-bar-height,64px)] left-0 right-0 z-40">
      <div className="bg-white/95 dark:bg-[var(--color-surface)]/95 backdrop-blur-lg border-t border-[var(--color-border)] px-4 pb-[env(safe-area-inset-bottom,0px)]">
        {/* Founding member badge */}
        {hasFoundingSlots && (
          <p className="text-xs text-[var(--color-teal-700)] dark:text-[var(--color-teal-400)] text-center pt-2 font-medium">
            {foundingSlotsLeft} founding spots left — lock in this price forever
          </p>
        )}

        {/* Plan toggle */}
        <div className="flex gap-2 pt-3 pb-3">
          <Button
            variant={plan === 'monthly' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPlan('monthly')}
            className="flex-1 flex-col h-auto py-2"
          >
            <span>Monthly</span>
            <span className="block text-xs font-normal opacity-90">
              {monthlyPrice}/mo{monthlySaving ? ` · ${monthlySaving}` : ''}
            </span>
          </Button>
          <Button
            variant={plan === 'annual' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPlan('annual')}
            className="flex-1 flex-col h-auto py-2"
          >
            <span>Annual</span>
            <span className="block text-xs font-normal opacity-90">{annualPrice}/yr · {annualSaving}</span>
          </Button>
        </div>

        {/* Upgrade button */}
        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={handleUpgrade}
          className="w-full bg-[var(--color-teal-700)] hover:bg-[var(--color-teal-800)]"
        >
          {loading ? 'Redirecting to checkout…' : 'Upgrade to Crew Pro'}
        </Button>

        <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-2 pb-2">
          Cancel any time · Powered by Stripe
        </p>

        {/* Expandable feature list */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] py-2 hover:text-[var(--color-text-primary)] transition-colors"
        >
          {expanded ? 'Hide features' : 'See what\u2019s included'}
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {expanded && (
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-1.5 pb-3 px-1">
            {[
              'Profile analytics \u2014 see who views your profile',
              'Premium CV templates (Classic Navy, Modern Minimal)',
              'No watermark on exported CVs',
              'Cert document manager + expiry reminders',
              'Custom subdomain: handle.yachtie.link',
              '20 endorsement requests / day (vs 10)',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="text-[var(--color-teal-700)] mt-0.5">{'\u2713'}</span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
