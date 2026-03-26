import { BackButton } from '@/components/ui/BackButton'
import { PageTransition } from '@/components/ui/PageTransition'

export default function BillingPage() {
  return (
    <PageTransition className="flex flex-col gap-6 pb-24 pt-8">
      <BackButton href="/app/profile" />

      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-teal-100)] flex items-center justify-center">
          <span className="text-2xl font-bold text-[var(--color-teal-700)]">Pro</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Billing & Subscription
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
          Pro subscriptions, invoices, and plan management are coming soon.
        </p>
      </div>
    </PageTransition>
  )
}
