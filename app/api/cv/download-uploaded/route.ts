import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit/helpers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await applyRateLimit(req, 'cvDownload', user.id)
  if (limited) return limited

  const { data: profile } = await supabase
    .from('users')
    .select('cv_storage_path')
    .eq('id', user.id)
    .single()

  if (!profile?.cv_storage_path) {
    return NextResponse.json({ error: 'No uploaded CV found' }, { status: 404 })
  }

  const serviceClient = createServiceClient()

  const { data: signedUrl } = await serviceClient.storage
    .from('cv-uploads')
    .createSignedUrl(profile.cv_storage_path, 3600)

  if (!signedUrl?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}
