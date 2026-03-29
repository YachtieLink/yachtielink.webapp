'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BackButton } from '@/components/ui/BackButton'
import { Skeleton } from '@/components/ui/skeleton'

export default function AccountPage() {
  const supabase = createClient()
  const [loaded, setLoaded] = useState(false)
  const [authEmail, setAuthEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAuthEmail(user.email ?? '')
      setLoaded(true)
    }
    load()
  }, [supabase])

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-[var(--color-surface-raised)] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center gap-3">
        <BackButton href="/app/more" />
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Account</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Login credentials and security.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Login email</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{authEmail}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            This is the email you use to sign in. To change your contact email shown on your profile and CV, go to Edit Profile.
          </p>
        </div>
      </div>
    </div>
  )
}
