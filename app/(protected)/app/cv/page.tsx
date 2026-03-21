import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CvActions } from '@/components/cv/CvActions'
import { PageTransition } from '@/components/ui/PageTransition'

export default async function CvPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/welcome')

  const { data: profile } = await supabase
    .from('users')
    .select('id, handle, latest_pdf_path, latest_pdf_generated_at, subscription_status')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <PageTransition className="flex flex-col gap-4 pb-24">
      <CvActions
        handle={profile.handle!}
        hasPdf={!!profile.latest_pdf_path}
        pdfGeneratedAt={profile.latest_pdf_generated_at}
        isPro={profile.subscription_status === 'pro'}
      />
    </PageTransition>
  )
}
