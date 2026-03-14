'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const cls = `flex items-center justify-between px-5 py-4 hover:bg-[var(--muted)]/30 transition-colors ${
    danger ? 'text-red-500' : 'text-[var(--foreground)]'
  }`

  if (href) {
    return (
      <Link href={href} className={cls}>
        <div>
          <p className="text-sm">{label}</p>
          {sublabel && <p className="text-xs text-[var(--muted-foreground)]">{sublabel}</p>}
        </div>
        <span className="text-[var(--muted-foreground)] text-lg">›</span>
      </Link>
    )
  }

  return (
    <div className={cls}>
      <div>
        <p className="text-sm">{label}</p>
        {sublabel && <p className="text-xs text-[var(--muted-foreground)]">{sublabel}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] px-1 pt-4 pb-1">
      {title}
    </p>
  )
}

export default function MorePage() {
  const router   = useRouter()
  const supabase = createClient()
  const [theme, setTheme] = useState<Theme>('system')

  // Read current theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    setTheme(stored ?? 'system')
  }, [])

  function applyTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('theme', t)
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
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">Theme</p>
          <div className="flex gap-2">
            {(['system', 'light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => applyTheme(t)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                  theme === t
                    ? 'bg-[var(--ocean-500)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-foreground)]/10'
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
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
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
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
        <SettingsRow
          label="Contact visibility"
          href="/app/profile/settings"
          sublabel="Control what's shown on your public profile"
        />
      </div>

      {/* ── Billing ────────────────────────────────── */}
      <SectionHeader title="Billing" />
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
        <SettingsRow
          label="Current plan"
          sublabel="Free — upgrade coming in Sprint 7"
        />
      </div>

      {/* ── Help ───────────────────────────────────── */}
      <SectionHeader title="Help" />
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
        <SettingsRow
          label="Send feedback"
          href="mailto:hello@yachtie.link?subject=YachtieLink feedback"
          sublabel="hello@yachtie.link"
        />
      </div>

      {/* ── Legal ──────────────────────────────────── */}
      <SectionHeader title="Legal" />
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
        <SettingsRow label="Terms of Service"   sublabel="Coming soon" />
        <SettingsRow label="Privacy Policy"     sublabel="Coming soon" />
      </div>

      {/* ── Sign out ───────────────────────────────── */}
      <SectionHeader title="" />
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-red-500 hover:bg-[var(--muted)]/30 transition-colors"
        >
          Sign out
        </button>
      </div>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-6 mb-2">
        YachtieLink · Phase 1A
      </p>
    </div>
  )
}
