'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Copy, Share2, Check, Pencil } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { countryToFlag } from '@/lib/constants/country-iso'
import { formatSeaTime } from '@/lib/sea-time'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { popIn } from '@/lib/motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface ProfileHeroCardProps {
  displayName: string
  handle: string | null
  userId: string
  primaryRole: string | null
  departments: string[]
  profilePhotoUrl: string | null
  home_country?: string | null
  seaTimeTotalDays?: number
  seaTimeYachtCount?: number
  isPro?: boolean
  /** Profile Strength data for embedded ring */
  strengthScore?: number
  strengthLabel?: string
  strengthNextPrompt?: string
  strengthCtaHref?: string
  strengthCtaLabel?: string
}

// ─── Inline Edit Field ──────────────────────────────────────────────────────

function InlineEditField({
  value,
  fieldName,
  placeholder,
  className,
}: {
  value: string
  fieldName: 'display_name' | 'primary_role'
  placeholder: string
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  async function save() {
    if (text === value || !text.trim()) {
      setText(value)
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const updateField = fieldName === 'display_name' ? 'display_name' : 'primary_role'
      const { error } = await supabase
        .from('users')
        .update({ [updateField]: text.trim() })
        .eq('id', user.id)
      if (error) {
        toast('Could not save', 'error')
        setText(value)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      }
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setText(value); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0 max-w-full">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={saving}
          className={`bg-transparent border-b border-[var(--color-teal-700)] outline-none min-w-0 ${className ?? ''}`}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-1 text-left hover:opacity-80 transition-opacity min-w-0 max-w-full ${className ?? ''}`}
    >
      <span className="truncate">{text || placeholder}</span>
      {saved ? (
        <Check size={12} className="text-emerald-500 shrink-0" />
      ) : (
        <Pencil size={12} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  )
}

// ─── Compact Strength Ring ──────────────────────────────────────────────────

function CompactStrengthRing({ score }: { score: number }) {
  const r = 16
  const circumference = 2 * Math.PI * r
  const dash = (score / 100) * circumference

  return (
    <motion.div variants={popIn} initial="hidden" animate="visible" className="shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-border)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke="var(--color-teal-700)"
          strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="20" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-text-primary)">
          {score}%
        </text>
      </svg>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProfileHeroCard({
  displayName,
  handle,
  userId,
  primaryRole,
  departments,
  profilePhotoUrl,
  home_country,
  seaTimeTotalDays,
  seaTimeYachtCount,
  isPro = false,
  strengthScore,
  strengthLabel,
  strengthNextPrompt,
  strengthCtaHref,
  strengthCtaLabel,
}: ProfileHeroCardProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [copiedPro, setCopiedPro] = useState(false)

  const profileUrl = handle ? `yachtie.link/u/${handle}` : null
  const proUrl = handle ? `${handle}.yachtie.link` : null

  function trackShare() {
    const supabase = createClient()
    void supabase.rpc('record_profile_event', {
      p_user_id: userId,
      p_event_type: 'link_share',
    })
  }

  async function copyUrl() {
    if (!handle) return
    try {
      await navigator.clipboard.writeText(`https://yachtie.link/u/${handle}`)
      setCopied(true)
      toast('Profile link copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
      trackShare()
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  async function copyProUrl() {
    if (!handle) return
    try {
      await navigator.clipboard.writeText(`https://${handle}.yachtie.link`)
      setCopiedPro(true)
      toast(isPro ? 'Pro link copied!' : 'Link copied — upgrade to Pro to activate', isPro ? 'success' : 'info')
      setTimeout(() => setCopiedPro(false), 2000)
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  async function shareProfile() {
    if (!handle) return
    const url = `https://yachtie.link/u/${handle}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} on YachtieLink`, url })
        trackShare()
      } catch { /* User cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast('Profile link copied!', 'success')
      trackShare()
    }
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
      {/* Top row: photo + identity + strength ring */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-[var(--color-surface-raised)]">
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-[var(--color-text-secondary)]">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* Tap-to-edit name */}
          <InlineEditField
            value={displayName}
            fieldName="display_name"
            placeholder="Your name"
            className="text-lg font-bold text-[var(--color-text-primary)]"
          />
          {/* Tap-to-edit role */}
          <InlineEditField
            value={primaryRole ?? ''}
            fieldName="primary_role"
            placeholder="Your role"
            className="text-sm text-[var(--color-text-secondary)]"
          />
          {home_country && (
            <span className="text-sm text-[var(--color-text-secondary)]"> · {countryToFlag(home_country)}</span>
          )}
          {departments.length > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {departments.join(' · ')}
            </p>
          )}
          {(seaTimeTotalDays ?? 0) > 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
              {formatSeaTime(seaTimeTotalDays!).displayShort} · {seaTimeYachtCount} yacht{seaTimeYachtCount === 1 ? '' : 's'}
              <InfoTooltip text="Total time at sea, calculated from your yacht history. Overlapping dates are counted once." />
            </p>
          )}
        </div>
        {/* Compact strength ring */}
        {strengthScore !== undefined && (
          <div data-tour="strength-ring">
            <InfoTooltip text="Your profile completeness. Higher scores get more visibility.">
              <div>
                <CompactStrengthRing score={strengthScore} />
              </div>
            </InfoTooltip>
          </div>
        )}
      </div>

      {/* Profile Strength coaching prompt */}
      {strengthNextPrompt && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)]">
          <p className="text-xs text-[var(--color-text-secondary)] flex-1">{strengthNextPrompt}</p>
          {strengthCtaHref && (
            <Link
              href={strengthCtaHref}
              className="shrink-0 text-xs font-medium text-[var(--color-interactive)] hover:underline"
            >
              {strengthCtaLabel ?? 'Go →'}
            </Link>
          )}
        </div>
      )}

      {/* Profile URLs */}
      {profileUrl && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-8" />
            <p className="text-sm text-[var(--color-interactive)] truncate flex-1">{profileUrl}</p>
            <button
              onClick={copyUrl}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          {proUrl && (
            <div className="flex items-center gap-2">
              <Link href="/app/settings/plan" className="shrink-0 w-8 flex items-center justify-center">
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[var(--color-teal-100)] text-[var(--color-teal-700)] hover:bg-[var(--color-teal-200)] transition-colors cursor-pointer">
                  Pro
                </span>
              </Link>
              <a
                href={`https://${proUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm truncate flex-1 ${isPro ? 'text-[var(--color-interactive)] hover:underline' : 'text-[var(--color-text-tertiary)]'}`}
              >
                {proUrl}
              </a>
              <button
                onClick={copyProUrl}
                className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
              >
                {copiedPro ? <Check size={14} /> : <Copy size={14} />}
              </button>
              {!isPro && (
                <Link
                  href="/app/settings/plan"
                  className="shrink-0 text-[10px] font-medium text-[var(--color-interactive)] hover:underline"
                >
                  Upgrade
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons — hidden when profile is too incomplete */}
      {(strengthScore ?? 100) >= 40 ? (
        <div className="flex gap-2">
          {handle && (
            <Link href={`/u/${handle}`} className="flex-1">
              <Button variant="outline" className="w-full">Preview</Button>
            </Link>
          )}
          <Button onClick={shareProfile} className="flex-1">
            Share Profile
          </Button>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-tertiary)] text-center py-1">
          Complete your profile to unlock sharing and preview
        </p>
      )}
    </div>
  )
}
