'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/ui/PageTransition'
import { ManagePortalButton } from '@/components/insights/ManagePortalButton'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

function SettingsRow({
  label,
  href,
  sublabel,
  danger,
  onClick,
}: {
  label: string
  href?: string
  sublabel?: string
  danger?: boolean
  onClick?: () => void
}) {
  const cls = `flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-raised)]/30 transition-colors ${
    danger ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]'
  }`

  if (onClick) {
    return (
      <button onClick={onClick} className={`${cls} w-full text-left`}>
        <div>
          <p className="text-sm">{label}</p>
          {sublabel && <p className="text-xs text-[var(--color-text-secondary)]">{sublabel}</p>}
        </div>
        <span className="text-[var(--color-text-secondary)] text-lg">›</span>
      </button>
    )
  }

  if (href) {
    return (
      <Link href={href} className={cls}>
        <div>
          <p className="text-sm">{label}</p>
          {sublabel && <p className="text-xs text-[var(--color-text-secondary)]">{sublabel}</p>}
        </div>
        <span className="text-[var(--color-text-secondary)] text-lg">›</span>
      </Link>
    )
  }

  return (
    <div className={cls}>
      <div>
        <p className="text-sm">{label}</p>
        {sublabel && <p className="text-xs text-[var(--color-text-secondary)]">{sublabel}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] px-1 pt-4 pb-1">
      {title}
    </p>
  )
}

export default function MorePage() {
  const router   = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isPro, setIsPro] = useState(false)
  const [subPlan, setSubPlan] = useState<string | null>(null)
  const [subEndsAt, setSubEndsAt] = useState<string | null>(null)
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)

  // Fetch subscription status
  useEffect(() => {
    async function fetchSub() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_ends_at, stripe_customer_id')
        .eq('id', user.id)
        .single()
      if (!data) return
      const active =
        data.subscription_status === 'pro' &&
        (!data.subscription_ends_at || new Date(data.subscription_ends_at) > new Date())
      setIsPro(active)
      setSubPlan(data.subscription_plan)
      setSubEndsAt(data.subscription_ends_at)
      setHasStripeCustomer(!!data.stripe_customer_id)
    }
    fetchSub()
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/welcome')
    router.refresh()
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'yachtielink-data.json'
      a.click()
      URL.revokeObjectURL(url)
      toast('Data exported', 'success')
    } catch {
      toast('Could not export data', 'error')
    }
  }

  return (
    <PageTransition className="flex flex-col pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-sand-100)]">
      {/* Page title */}
      <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)] px-1 pt-2 pb-2">Settings</h1>

      {/* ── Appearance ─────────────────────────────── */}
      <SectionHeader title="Appearance" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden px-5 py-4">
        <p className="text-sm text-[var(--color-text-secondary)]">Dark mode coming soon</p>
      </div>

      {/* ── Account ────────────────────────────────── */}
      <SectionHeader title="Account" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow
          label="Edit name, handle & role"
          href="/app/more/account"
          sublabel="Full name, display name, handle, department, role"
        />
        <SettingsRow
          label="Contact info"
          href="/app/profile/settings"
          sublabel="Phone, WhatsApp, location · visibility toggles"
        />
      </div>

      {/* ── Privacy ────────────────────────────────── */}
      <SectionHeader title="Privacy" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow
          label="Contact visibility"
          href="/app/profile/settings"
          sublabel="Control what's shown on your public profile"
        />
        <SettingsRow
          label="Download my data"
          onClick={handleExport}
          sublabel="Export all your data as JSON (GDPR)"
        />
        <SettingsRow
          label="Delete my account"
          href="/app/more/delete-account"
          sublabel="Permanently delete your account and data"
          danger
        />
      </div>

      {/* ── Billing ────────────────────────────────── */}
      <SectionHeader title="Billing" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        {isPro ? (
          <div className="px-5 py-4">
            <p className="text-sm text-[var(--color-text-primary)]">
              Current plan: <span className="font-semibold">Crew Pro · {subPlan === 'annual' ? 'Annual' : 'Monthly'}</span>
            </p>
            {subEndsAt && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Renews {new Date(subEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            {hasStripeCustomer && (
              <div className="mt-3">
                <ManagePortalButton />
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/app/insights"
            className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
          >
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">Current plan: Free</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Upgrade to Crew Pro</p>
            </div>
            <span className="text-[var(--color-text-secondary)] text-lg">›</span>
          </Link>
        )}
      </div>

      {/* ── Help ───────────────────────────────────── */}
      <SectionHeader title="Help" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow
          label="Feature Roadmap"
          href="/app/more/roadmap"
          sublabel="See what's coming and what's shipped"
        />
        <SettingsRow
          label="Send feedback"
          href="mailto:hello@yachtie.link?subject=YachtieLink feedback"
          sublabel="hello@yachtie.link"
        />
      </div>

      {/* ── Legal ──────────────────────────────────── */}
      <SectionHeader title="Legal" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow label="Terms of Service" href="/terms" />
        <SettingsRow label="Privacy Policy"   href="/privacy" />
      </div>

      {/* ── Sign out ───────────────────────────────── */}
      <div className="mt-6">
        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6 mb-2">
        YachtieLink · Phase 1A
      </p>
    </PageTransition>
  )
}
