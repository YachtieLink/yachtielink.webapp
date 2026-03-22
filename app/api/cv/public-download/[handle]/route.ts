import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params
  const serviceClient = createServiceClient()

  const { data: user } = await serviceClient
    .from('users')
    .select('cv_public, cv_public_source, latest_pdf_path, cv_storage_path')
    .eq('handle', handle)
    .single()

  if (!user || !user.cv_public) {
    return NextResponse.json({ error: 'CV not available' }, { status: 404 })
  }

  const path = user.cv_public_source === 'uploaded' ? user.cv_storage_path : user.latest_pdf_path
  if (!path) return NextResponse.json({ error: 'No CV found' }, { status: 404 })

  const bucket = user.cv_public_source === 'uploaded' ? 'cv-uploads' : 'pdf-exports'
  const { data } = await serviceClient.storage.from(bucket).createSignedUrl(path, 60)
  if (!data?.signedUrl) return NextResponse.json({ error: 'Could not generate link' }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
