'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/ui/PageTransition'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { isProFromRecord } from '@/lib/stripe/pro-shared'
import {
  Shield,
  FileText,
  Download,
  CreditCard,
  Palette,
  Bell,
  Map,
  MessageCircle,
  Scale,
  Lock,
  LogOut,
  Trash2,
  Bug,
} from 'lucide-react'

function SettingsRow({
  label,
  href,
  sublabel,
  icon: Icon,
  danger,
  onClick,
}: {
  label: string
  href?: string
  sublabel?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  danger?: boolean
  onClick?: () => void
}) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={16}
            className={danger ? 'text-[var(--color-error)]' : 'text-[var(--color-sand-400)]'}
          />
        )}
        <div>
          <p className="text-sm">{label}</p>
          {sublabel && <p className="text-xs text-[var(--color-text-secondary)]">{sublabel}</p>}
        </div>
      </div>
      <span className="text-[var(--color-text-secondary)] text-lg">&rsaquo;</span>
    </>
  )

  const cls = `flex items-center justify-between px-4 py-3.5 hover:bg-[var(--color-surface-raised)]/30 transition-colors ${
    danger ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]'
  }`

  if (onClick) {
    return (
      <button onClick={onClick} className={`${cls} w-full text-left`}>
        {inner}
      </button>
    )
  }

  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('mailto:')
    if (isExternal) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      )
    }
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }

  return <div className={cls}>{inner}</div>
}

function SectionHeader({ title, icon: Icon }: { title: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-5 pb-1.5">
      {Icon && <Icon size={12} className="text-[var(--color-sand-400)]" />}
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-sand-400)]">
        {title}
      </p>
    </div>
  )
}

export default function MorePage() {
  const router   = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [subPlan, setSubPlan] = useState<string | null>(null)
  const [subEndsAt, setSubEndsAt] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSub() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_ends_at')
        .eq('id', user.id)
        .single()
      if (!data) return
      setIsPro(isProFromRecord(data))
      setSubPlan(data.subscription_plan)
      setSubEndsAt(data.subscription_ends_at)
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
      <h1 className="text-[28px] font-serif tracking-tight text-[var(--color-text-primary)] px-1 pt-2 pb-1">Settings</h1>

      {/* ── ACCOUNT ────────────────────────────────── */}
      <SectionHeader title="Account" icon={Shield} />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow
          label="Login & security"
          href="/app/more/account"
          sublabel="Login email and credentials"
          icon={Lock}
        />
        <SettingsRow
          label="Cert documents"
          href="/app/certs"
          sublabel="Manage certification files"
          icon={FileText}
        />
        <SettingsRow
          label="Data export (GDPR)"
          onClick={handleExport}
          sublabel="Export all your data as JSON"
          icon={Download}
        />
      </div>

      {/* ── PLAN ───────────────────────────────────── */}
      <SectionHeader title="Plan" icon={CreditCard} />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        {isPro === null ? (
          <div className="px-4 py-4 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ) : (
          <Link
            href="/app/settings/plan"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard size={16} className="text-[var(--color-sand-400)]" />
              <div>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {isPro
                    ? `Crew Pro \u00b7 ${subPlan === 'annual' ? 'Annual' : 'Monthly'}`
                    : 'Current plan: Free'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {isPro
                    ? subEndsAt
                      ? `Renews ${new Date(subEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Manage subscription'
                    : 'Upgrade to Crew Pro'}
                </p>
                {isPro && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    15 gallery photos, analytics, premium CV templates
                  </p>
                )}
              </div>
            </div>
            <span className="text-[var(--color-text-secondary)] text-lg">&rsaquo;</span>
          </Link>
        )}
      </div>

      {/* ── APP ─────────────────────────────────────── */}
      <SectionHeader title="App" icon={Palette} />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Palette size={16} className="text-[var(--color-sand-400)]" />
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">Appearance</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Dark mode coming soon</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell size={16} className="text-[var(--color-sand-400)]" />
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">Notifications</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMMUNITY ──────────────────────────────── */}
      <SectionHeader title="Community" icon={MessageCircle} />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow
          label="Feature roadmap & ideas"
          href="/app/more/roadmap"
          sublabel="See what's coming and share ideas"
          icon={Map}
        />
        <SettingsRow
          label="Report a bug"
          href="/app/more/report-bug"
          sublabel="Something broken? Let us know"
          icon={Bug}
        />
        <SettingsRow
          label="Contact us"
          href="mailto:hello@yachtie.link?subject=YachtieLink feedback"
          sublabel="hello@yachtie.link"
          icon={MessageCircle}
        />
      </div>

      {/* ── LEGAL ──────────────────────────────────── */}
      <SectionHeader title="Legal" icon={Scale} />
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
        <SettingsRow label="Terms of Service" href="/terms" icon={Scale} />
        <SettingsRow label="Privacy Policy"   href="/privacy" icon={Lock} />
      </div>

      {/* ── Sign out ───────────────────────────────── */}
      <div className="mt-6 px-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      {/* ── Danger zone — isolated ─────────────────── */}
      <div className="mt-8 border-t border-[var(--color-border)] pt-4">
        <SettingsRow
          label="Delete my account"
          href="/app/more/delete-account"
          sublabel="Permanently delete your account and data"
          icon={Trash2}
          danger
        />
      </div>

      <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-6 mb-2">
        YachtieLink
      </p>
    </PageTransition>
  )
}
