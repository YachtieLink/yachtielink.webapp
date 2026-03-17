import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit/helpers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await applyRateLimit(req, 'pdfGenerate', user.id)
  if (limited) return limited

  const { data: profile } = await supabase
    .from('users')
    .select('latest_pdf_path')
    .eq('id', user.id)
    .single()

  if (!profile?.latest_pdf_path) {
    return NextResponse.json({ error: 'No PDF generated yet' }, { status: 404 })
  }

  const serviceClient = createServiceClient()

  const { data: signedUrl } = await serviceClient.storage
    .from('pdf-exports')
    .createSignedUrl(profile.latest_pdf_path, 3600)

  if (!signedUrl?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}
