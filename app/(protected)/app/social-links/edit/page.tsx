'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/ui/PageTransition'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram',  placeholder: 'https://instagram.com/yourhandle' },
  { key: 'linkedin',  label: 'LinkedIn',   placeholder: 'https://linkedin.com/in/yourname' },
  { key: 'tiktok',   label: 'TikTok',     placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'youtube',  label: 'YouTube',    placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'x',        label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'facebook', label: 'Facebook',   placeholder: 'https://facebook.com/yourpage' },
  { key: 'website',  label: 'Website',    placeholder: 'https://yourwebsite.com' },
] as const

type Platform = typeof PLATFORMS[number]['key']

export default function SocialLinksEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [links, setLinks] = useState<Partial<Record<Platform, string>>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // Load from user profile
    fetch('/api/profile/social-links')
      .then((r) => r.json())
      .then((d) => {
        const map: Partial<Record<Platform, string>> = {}
        for (const link of d.links ?? []) {
          map[link.platform as Platform] = link.url
        }
        setLinks(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function setLink(platform: Platform, url: string) {
    setLinks((prev) => ({ ...prev, [platform]: url }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const linksArray = PLATFORMS
        .filter((p) => links[p.key]?.trim())
        .map((p) => ({ platform: p.key, url: links[p.key]!.trim() }))

      const res = await fetch('/api/profile/social-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: linksArray }),
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
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 pb-24"
          >
            <div className="flex items-center gap-3">
              <BackButton href="/app/profile" />
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Social Links</h1>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)]">Add links to your social profiles or website. Only filled ones show on your profile.</p>

            <form onSubmit={save} className="flex flex-col gap-3">
              {PLATFORMS.map((p) => (
                <Input
                  key={p.key}
                  label={p.label}
                  type="url"
                  value={links[p.key] ?? ''}
                  onChange={(e) => setLink(p.key, e.target.value)}
                  placeholder={p.placeholder}
                />
              ))}

              <Button
                type="submit"
                loading={saving}
                className="w-full mt-2"
              >
                Save links
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
