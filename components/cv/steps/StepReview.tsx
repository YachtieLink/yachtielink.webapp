'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import type { ConfirmedImportData, SaveStats } from '@/lib/cv/types'

interface StepReviewProps {
  importData: ConfirmedImportData
  onSave: () => Promise<SaveStats | null>
}

export function StepReview({ importData, onSave }: StepReviewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<SaveStats | null>(null)

  const counts = [
    importData.personal.full_name ? 'Profile fields' : null,
    importData.yachts.length > 0 ? `${importData.yachts.length} yacht${importData.yachts.length === 1 ? '' : 's'}` : null,
    importData.certifications.length > 0 ? `${importData.certifications.length} certification${importData.certifications.length === 1 ? '' : 's'}` : null,
    importData.education.length > 0 ? `${importData.education.length} education entr${importData.education.length === 1 ? 'y' : 'ies'}` : null,
    importData.skills.length > 0 || importData.hobbies.length > 0
      ? `${importData.skills.length} skill${importData.skills.length === 1 ? '' : 's'} · ${importData.hobbies.length} hobb${importData.hobbies.length === 1 ? 'y' : 'ies'}`
      : null,
    importData.languages.length > 0 ? `${importData.languages.length} language${importData.languages.length === 1 ? '' : 's'}` : null,
  ].filter(Boolean)

  async function handleImport() {
    setSaving(true)
    const result = await onSave()
    setSaving(false)
    if (result) {
      setStats(result)
    } else {
      toast('Failed to import some data. Please check your profile.', 'error')
    }
  }

  // Celebration screen
  if (stats) {
    const itemCount = [
      stats.personalUpdated ? 1 : 0,
      stats.yachtsCreated,
      stats.certsCreated,
      stats.educationCreated,
      stats.skillsAdded,
      stats.hobbiesAdded,
    ].reduce((a, b) => a + b, 0)

    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">All done!</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {itemCount} item{itemCount === 1 ? '' : 's'} imported to your profile
        </p>
        <div className="text-xs text-[var(--color-text-tertiary)] flex flex-wrap gap-2 justify-center">
          {stats.personalUpdated && <span>Profile updated</span>}
          {stats.yachtsCreated > 0 && <span>· {stats.yachtsCreated} yacht{stats.yachtsCreated === 1 ? '' : 's'}</span>}
          {stats.certsCreated > 0 && <span>· {stats.certsCreated} cert{stats.certsCreated === 1 ? '' : 's'}</span>}
          {stats.educationCreated > 0 && <span>· {stats.educationCreated} education</span>}
          {stats.skillsAdded > 0 && <span>· {stats.skillsAdded} skill{stats.skillsAdded === 1 ? '' : 's'}</span>}
          {stats.hobbiesAdded > 0 && <span>· {stats.hobbiesAdded} hobb{stats.hobbiesAdded === 1 ? 'y' : 'ies'}</span>}
          {stats.languagesUpdated && <span>· Languages</span>}
        </div>
        <Button onClick={() => { router.push('/app/profile'); router.refresh() }} className="w-full mt-4">
          View my profile
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Ready to import</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">Here&apos;s what we&apos;ll add:</p>

      <div className="flex flex-col gap-2">
        {counts.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-green-50 text-green-600">ok</span>
            <span className="text-sm text-[var(--color-text-primary)]">{c}</span>
          </div>
        ))}
      </div>

      {counts.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">Nothing to import. You can add details from your profile.</p>
      )}

      <p className="text-xs text-[var(--color-text-tertiary)]">
        This won&apos;t change anything you&apos;ve already saved — only adds new data.
      </p>

      <Button onClick={handleImport} loading={saving} className="w-full mt-2" disabled={counts.length === 0}>
        Import to my profile
      </Button>
    </div>
  )
}
