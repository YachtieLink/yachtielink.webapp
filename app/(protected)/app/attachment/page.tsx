import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Ship } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTransition } from '@/components/ui/PageTransition'
import { SectionVisibilityToggle } from '@/components/profile/SectionVisibilityToggle'
import { formatSeaTime } from '@/lib/sea-time'

export default async function AttachmentListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const { data: attachments } = await supabase
    .from('attachments')
    .select('id, role_label, started_at, ended_at, yachts(id, name, yacht_type)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('started_at', { ascending: false })

  const items = attachments ?? []

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <PageHeader
        backHref="/app/profile"
        title="Experience"
        actions={
          <Link
            href="/app/attachment/new"
            className="text-sm font-medium text-[var(--color-interactive)] hover:underline"
          >
            + Add yacht
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center">
            <Ship size={24} className="text-[var(--color-text-tertiary)]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">No yacht experience added yet</p>
          <Link
            href="/app/attachment/new"
            className="text-sm font-medium text-[var(--color-interactive)] hover:underline"
          >
            Add your first yacht
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((att) => {
            const yacht = att.yachts as unknown as { id: string; name: string; yacht_type: string | null } | null
            const startYear = att.started_at ? new Date(att.started_at).getFullYear() : null
            const endLabel = att.ended_at
              ? new Date(att.ended_at).getFullYear().toString()
              : 'Present'
            const dateRange = startYear ? `${startYear} – ${endLabel}` : null

            // Compute duration for this attachment
            const days = att.started_at
              ? Math.max(0, Math.floor(
                  ((att.ended_at ? new Date(att.ended_at).getTime() : Date.now()) -
                    new Date(att.started_at).getTime()) / 86_400_000
                ))
              : 0
            const duration = formatSeaTime(days).displayShort

            return (
              <Link
                key={att.id}
                href={`/app/attachment/${att.id}/edit`}
                className="bg-[var(--color-surface)] rounded-2xl p-4 flex items-start gap-3 hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-teal-50)] flex items-center justify-center shrink-0">
                  <Ship size={20} className="text-[var(--color-teal-700)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {yacht?.name ?? 'Unknown yacht'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {att.role_label}
                    {yacht?.yacht_type ? ` · ${yacht.yacht_type}` : ''}
                  </p>
                  {dateRange && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      {dateRange} · {duration}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)] shrink-0 mt-1">Edit →</span>
              </Link>
            )
          })}
        </div>
      )}
      <SectionVisibilityToggle sectionKey="experience" label="Experience" />
    </PageTransition>
  )
}
