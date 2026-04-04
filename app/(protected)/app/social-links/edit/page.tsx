'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { getPlatformIcon } from '@/components/ui/social-icons'
import { ALL_PLATFORMS, SOCIAL_PLATFORM_META, extractHandle, buildUrl, getPlatformPrefix } from '@/lib/social-platforms'
import type { SocialPlatform } from '@/lib/social-platforms'

interface SocialLinkItem {
  platform: SocialPlatform
  url: string
}

export default function SocialLinksEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([])
  const [editingPlatform, setEditingPlatform] = useState<SocialPlatform | null>(null)
  const [editingUrl, setEditingUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    fetch('/api/profile/social-links')
      .then((r) => r.json())
      .then((d) => {
        setSocialLinks((d.links ?? []) as SocialLinkItem[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile/social-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: socialLinks }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error ?? 'Save failed. Please try again.', 'error')
        return
      }
      toast('Social links saved.', 'success')
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            <PageHeader backHref="/app/profile" title="Social Links" />

            <p className="text-sm text-[var(--color-text-secondary)]">
              Show your social profiles on your public page.
            </p>

            <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
              {/* Existing links */}
              {socialLinks.length > 0 && (
                <div className="flex flex-col gap-2">
                  {socialLinks.map((link) => {
                    const meta = SOCIAL_PLATFORM_META[link.platform]
                    if (!meta) return null
                    const isEditing = editingPlatform === link.platform
                    return (
                      <div key={link.platform} className="flex items-center gap-2 min-h-[44px]">
                        <span className="text-[var(--color-text-secondary)] shrink-0">{getPlatformIcon(link.platform, 16)}</span>
                        {isEditing ? (
                          <div className="flex-1 flex items-center h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-interactive)]/20 focus-within:border-[var(--color-interactive)]">
                            {getPlatformPrefix(link.platform) && (
                              <span className="text-xs text-[var(--color-text-tertiary)] pl-3 pr-2 shrink-0 h-full flex items-center bg-[var(--color-surface-raised)] border-r border-[var(--color-border)]">{getPlatformPrefix(link.platform)}</span>
                            )}
                            <input
                              value={editingUrl}
                              onChange={(e) => setEditingUrl(e.target.value)}
                              placeholder={getPlatformPrefix(link.platform) ? 'yourhandle' : 'https://yourwebsite.com'}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const handle = editingUrl.trim()
                                  if (handle) {
                                    setSocialLinks(socialLinks.map(l => l.platform === link.platform ? { ...l, url: buildUrl(link.platform, handle) } : l))
                                  } else {
                                    setSocialLinks(socialLinks.filter(l => l.platform !== link.platform))
                                  }
                                  setEditingPlatform(null)
                                }
                                if (e.key === 'Escape') {
                                  if (!link.url) setSocialLinks(socialLinks.filter(l => l.platform !== link.platform))
                                  setEditingPlatform(null)
                                }
                              }}
                              onBlur={() => {
                                const handle = editingUrl.trim()
                                if (handle) {
                                  setSocialLinks(socialLinks.map(l => l.platform === link.platform ? { ...l, url: buildUrl(link.platform, handle) } : l))
                                } else if (!link.url) {
                                  setSocialLinks(socialLinks.filter(l => l.platform !== link.platform))
                                }
                                setEditingPlatform(null)
                              }}
                              className="flex-1 h-full px-2 text-sm bg-transparent outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setEditingPlatform(link.platform); setEditingUrl(extractHandle(link.platform, link.url)) }}
                            className="flex-1 text-sm text-[var(--color-text-primary)] truncate text-left hover:text-[var(--color-interactive)] transition-colors"
                          >
                            {link.url}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setSocialLinks(socialLinks.filter(l => l.platform !== link.platform)); setEditingPlatform(null) }}
                          aria-label={`Remove ${meta.label}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-error)] transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add more — dashed buttons for unused platforms */}
              {ALL_PLATFORMS.filter(p => !socialLinks.some(l => l.platform === p)).length > 0 && (
                <div className="flex flex-col gap-2">
                  {socialLinks.length === 0 && (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Add your profiles so crew can connect with you.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {ALL_PLATFORMS
                      .filter(p => !socialLinks.some(l => l.platform === p))
                      .map((p) => {
                        const meta = SOCIAL_PLATFORM_META[p]
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setSocialLinks([...socialLinks, { platform: p, url: '' }])
                              setEditingPlatform(p)
                              setEditingUrl('')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[var(--color-interactive)]/40 text-xs font-medium text-[var(--color-interactive)] hover:bg-[var(--color-interactive)]/5 transition-colors min-h-[36px]"
                          >
                            {getPlatformIcon(p, 16)}
                            <span>{meta.label}</span>
                            <Plus size={10} />
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={save}
              loading={saving}
              className="w-full"
            >
              Save links
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
