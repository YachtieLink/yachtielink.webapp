import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CvUploadClient } from '@/components/cv/CvUploadClient'

export default async function CvUploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  return (
    <div className="flex flex-col gap-4 pb-24">
      <CvUploadClient userId={user.id} />
    </div>
  )
}
