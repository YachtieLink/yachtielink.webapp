'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ManagePortalButton } from '@/components/insights/ManagePortalButton'

type Theme = 'system' | 'light' | 'dark'

function SettingsRow({
  label,
  href,
  sublabel,
  danger,
}: {
  label: string
  href?: string
  sublabel?: string
  danger?: boolean
}) {
  const cls = `flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-raised)]/30 transition-colors ${
    danger ? 'text-red-500' : 'text-[var(--color-text-primary)]'
  }`

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
    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] px-1 pt-4 pb-1">
      {title}
    </p>
  )
}

export default function MorePage() {
  const router   = useRouter()
  const supabase = createClient()
  const [theme, setTheme] = useState<Theme>('system')
  const [isPro, setIsPro] = useState(false)
  const [subPlan, setSubPlan] = useState<string | null>(null)
  const [subEndsAt, setSubEndsAt] = useState<string | null>(null)
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)

  // Read current theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('yl-theme') as Theme | null
    setTheme(stored ?? 'system')
  }, [])

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

  function applyTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('yl-theme', t)
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else if (t === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/welcome')
    router.refresh()
  }

  return (
    <div className="flex flex-col pb-24">
      {/* ── Appearance ─────────────────────────────── */}
      <SectionHeader title="Appearance" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Theme</p>
          <div className="flex gap-2">
            {(['system', 'light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => applyTheme(t)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                  theme === t
                    ? 'bg-[var(--color-interactive)] text-white'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)]/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
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
          href="/api/account/export"
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
      <SectionHeader title="" />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-red-500 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
        >
          Sign out
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6 mb-2">
        YachtieLink · Phase 1A
      </p>
    </div>
  )
}
