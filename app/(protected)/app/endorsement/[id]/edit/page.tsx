import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditEndorsementClient } from './EditEndorsementClient'

export default async function EditEndorsementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const { id } = await params

  const { data: endorsement } = await supabase
    .from('endorsements')
    .select(`
      id, content, endorser_role_label, recipient_role_label,
      worked_together_start, worked_together_end,
      endorser_id, recipient_id, yacht_id,
      yacht:yachts!yacht_id(name),
      recipient:users!recipient_id(display_name, full_name)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!endorsement || endorsement.endorser_id !== user.id) {
    redirect('/app/audience')
  }

  type EndorsementRow = typeof endorsement & {
    yacht: { name: string } | null
    recipient: { display_name: string | null; full_name: string } | null
  }

  const row = endorsement as EndorsementRow
  const yachtName = row.yacht?.name ?? 'Unknown yacht'
  const recipientName =
    row.recipient?.display_name ?? row.recipient?.full_name ?? 'Unknown'

  return (
    <EditEndorsementClient
      endorsementId={row.id}
      recipientId={row.recipient_id}
      recipientName={recipientName}
      yachtId={row.yacht_id}
      yachtName={yachtName}
      existingEndorsement={{
        id: row.id,
        content: row.content,
        endorser_role_label: (row.endorser_role_label as string | null) ?? undefined,
        recipient_role_label: (row.recipient_role_label as string | null) ?? undefined,
        worked_together_start: (row.worked_together_start as string | null) ?? undefined,
        worked_together_end: (row.worked_together_end as string | null) ?? undefined,
      }}
    />
  )
}
