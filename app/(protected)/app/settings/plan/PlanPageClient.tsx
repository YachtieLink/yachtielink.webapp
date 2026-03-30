'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

// Display amounts — update here if Stripe prices change
const PLAN_PRICES = {
  monthly: { standard: '€8.99', founding: '€4.99' },
  annual: { standard: '€69.99', founding: '€49.99' },
}

const PRO_BENEFITS = [
  'Custom subdomain (handle.yachtie.link)',
  'Profile analytics & insights',
  'Premium CV templates',
  'Priority support',
]

interface PlanPageClientProps {
  isPro: boolean
  plan: 'monthly' | 'annual' | null
  endsAt: string | null
  hasStripeCustomer: boolean
  isFoundingMember: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PlanPageClient({
  isPro,
  plan,
  endsAt,
  hasStripeCustomer,
  isFoundingMember,
}: PlanPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<'monthly' | 'annual' | 'portal' | null>(null)

  async function handleCheckout(selectedPlan: 'monthly' | 'annual') {
    setLoading(selectedPlan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })
      if (!res.ok) throw new Error('Could not start checkout')
      const { url } = await res.json()
      if (url) router.push(url)
    } catch {
      toast('Could not start checkout — please try again', 'error')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) throw new Error('Could not open billing portal')
      const { url } = await res.json()
      if (url) router.push(url)
    } catch {
      toast('Could not open billing portal — please try again', 'error')
    } finally {
      setLoading(null)
    }
  }

  const monthlyPrice = isFoundingMember
    ? PLAN_PRICES.monthly.founding
    : PLAN_PRICES.monthly.standard

  const annualPrice = isFoundingMember
    ? PLAN_PRICES.annual.founding
    : PLAN_PRICES.annual.standard

  return (
    <PageTransition className="flex flex-col gap-6 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-sand-100)]">
      <PageHeader backHref="/app/more" title="Your Plan" />

      {isPro ? (
        <ProState
          plan={plan}
          endsAt={endsAt}
          hasStripeCustomer={hasStripeCustomer}
          isFoundingMember={isFoundingMember}
          annualPrice={annualPrice}
          loading={loading}
          onCheckout={handleCheckout}
          onPortal={handlePortal}
        />
      ) : (
        <FreeState
          isFoundingMember={isFoundingMember}
          monthlyPrice={monthlyPrice}
          annualPrice={annualPrice}
          loading={loading}
          onCheckout={handleCheckout}
        />
      )}
    </PageTransition>
  )
}

// ── Free state ──────────────────────────────────────────────────────────────

function FreeState({
  isFoundingMember,
  monthlyPrice,
  annualPrice,
  loading,
  onCheckout,
}: {
  isFoundingMember: boolean
  monthlyPrice: string
  annualPrice: string
  loading: 'monthly' | 'annual' | 'portal' | null
  onCheckout: (plan: 'monthly' | 'annual') => void
}) {
  return (
    <>
      {/* Current plan */}
      <div className="card-soft rounded-2xl px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
          Current plan
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
            Free
          </span>
        </div>
      </div>

      {/* Upgrade card */}
      <div className="card-soft rounded-2xl px-5 py-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
            Upgrade to Crew Pro
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Everything you need to stand out on the water.
          </p>
        </div>

        {/* Benefits */}
        <ul className="flex flex-col gap-2">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
              <span className="mt-0.5 text-[var(--color-teal-600)] font-bold shrink-0">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* Founding member callout */}
        {isFoundingMember && (
          <div className="rounded-xl bg-[var(--color-teal-50)] border border-[var(--color-teal-200)] px-4 py-3">
            <p className="text-xs font-semibold text-[var(--color-teal-700)]">
              Founding member pricing
            </p>
            <p className="text-xs text-[var(--color-teal-600)] mt-0.5">
              Your locked-in price — forever.
            </p>
          </div>
        )}

        {/* Pricing + buttons */}
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-semibold text-[var(--color-text-primary)]">
                {monthlyPrice}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]"> / month</span>
            </div>
            <Button
              onClick={() => onCheckout('monthly')}
              disabled={loading !== null}
              className="min-w-[120px]"
            >
              {loading === 'monthly' ? 'Loading…' : 'Upgrade monthly'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-semibold text-[var(--color-text-primary)]">
                {annualPrice}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]"> / year</span>
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-teal-600)]">
                Save ~35%
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => onCheckout('annual')}
              disabled={loading !== null}
              className="min-w-[120px]"
            >
              {loading === 'annual' ? 'Loading…' : 'Upgrade annual'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Pro active state ─────────────────────────────────────────────────────────

function ProState({
  plan,
  endsAt,
  hasStripeCustomer,
  isFoundingMember,
  annualPrice,
  loading,
  onCheckout,
  onPortal,
}: {
  plan: 'monthly' | 'annual' | null
  endsAt: string | null
  hasStripeCustomer: boolean
  isFoundingMember: boolean
  annualPrice: string
  loading: 'monthly' | 'annual' | 'portal' | null
  onCheckout: (plan: 'monthly' | 'annual') => void
  onPortal: () => void
}) {
  return (
    <>
      {/* Current plan */}
      <div className="card-soft rounded-2xl px-5 py-4 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Current plan
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-teal-100)] text-[var(--color-teal-700)] border border-[var(--color-teal-200)]">
            Pro
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {plan === 'annual' ? 'Annual' : 'Monthly'}
          </span>
          {isFoundingMember && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Founding member
            </span>
          )}
        </div>
        {endsAt && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {plan === 'annual' ? 'Renews' : 'Renews'} {formatDate(endsAt)}
          </p>
        )}
      </div>

      {/* Annual upsell — only if on monthly */}
      {plan === 'monthly' && (
        <div className="card-soft rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
              Switch to annual
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Pay {annualPrice} / year and save around 35% compared to monthly.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onCheckout('annual')}
            disabled={loading !== null}
            className="self-start"
          >
            {loading === 'annual' ? 'Loading…' : 'Switch to annual'}
          </Button>
        </div>
      )}

      {/* Manage subscription */}
      {hasStripeCustomer && (
        <div className="card-soft rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
              Manage subscription
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Update payment method, view invoices, or cancel.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onPortal}
            disabled={loading !== null}
            className="self-start"
          >
            {loading === 'portal' ? 'Loading…' : 'Manage subscription'}
          </Button>
        </div>
      )}
    </>
  )
}
