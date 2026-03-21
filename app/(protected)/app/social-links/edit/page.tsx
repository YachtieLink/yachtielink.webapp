'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'

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
  const [links, setLinks] = useState<Partial<Record<Platform, string>>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

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
        alert(d.error ?? 'Save failed. Please try again.')
        return
      }
      router.push('/app/profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-[var(--color-text-secondary)]">Loading…</div>

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3">
        <BackButton href="/app/profile" />
        <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">Social Links</h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">Add links to your social profiles or website. Only filled ones show on your profile.</p>

      <form onSubmit={save} className="flex flex-col gap-3">
        {PLATFORMS.map((p) => (
          <div key={p.key}>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">{p.label}</label>
            <input
              type="url"
              value={links[p.key] ?? ''}
              onChange={(e) => setLink(p.key, e.target.value)}
              placeholder={p.placeholder}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[var(--color-interactive)] text-white font-medium disabled:opacity-60 hover:bg-[var(--color-interactive-hover)] transition-colors mt-2"
        >
          {saving ? 'Saving…' : 'Save links'}
        </button>
      </form>
    </div>
  )
}
