import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { ProfilePdfDocument } from '@/components/pdf/ProfilePdfDocument'
import { validateBody } from '@/lib/validation/validate'
import { generatePDFSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'pdfGenerate', user.id)
    if (limited) return limited

    const result = await validateBody(req, generatePDFSchema)
    if ('error' in result) return result.error
    const { template } = result.data

    // Check Pro for non-standard templates
    if (template !== 'standard') {
      const { data: profile } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_status !== 'pro') {
        return NextResponse.json(
          { error: 'Pro subscription required for premium templates' },
          { status: 403 },
        )
      }
    }

    // Fetch all profile data
    const [profileRes, attRes, certRes, endRes, eduRes, skillsRes, hobbiesRes] = await Promise.all([
      supabase
        .from('users')
        .select(`
          id, full_name, display_name, handle, primary_role, departments,
          bio, profile_photo_url,
          phone, whatsapp, email, location_country, location_city,
          show_phone, show_whatsapp, show_email, show_location,
          subscription_status, latest_pdf_path,
          dob, home_country, smoke_pref, appearance_note, travel_docs, license_info, languages, show_dob
        `)
        .eq('id', user.id)
        .single(),
      supabase
        .from('attachments')
        .select(`
          id, role_label, started_at, ended_at, employment_type, yacht_program, description, cruising_area,
          yachts ( id, name, yacht_type, length_meters, flag_state, builder )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('started_at', { ascending: false }),
      supabase
        .from('certifications')
        .select(`
          id, custom_cert_name, issued_at, expires_at, issuing_body,
          certification_types ( name, category )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('endorsements')
        .select(`
          id, content, created_at,
          endorser:endorser_id ( display_name, full_name ),
          yacht:yachts!yacht_id ( name )
        `)
        .eq('recipient_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase.from('user_education').select('id, institution, qualification, field_of_study, started_at, ended_at').eq('user_id', user.id).order('sort_order'),
      supabase.from('user_skills').select('id, name').eq('user_id', user.id).order('sort_order'),
      supabase.from('user_hobbies').select('id, name').eq('user_id', user.id).order('sort_order'),
    ])

    const profile = profileRes.data
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(
      `https://yachtie.link/u/${profile.handle}`,
      { width: 100, margin: 0 },
    )

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      ProfilePdfDocument({
        user: profile as any,
        attachments: (attRes.data as any) ?? [],
        certifications: (certRes.data as any) ?? [],
        endorsements: (endRes.data as any) ?? [],
        education: (eduRes.data as any) ?? [],
        skills: (skillsRes.data as any) ?? [],
        hobbies: (hobbiesRes.data as any) ?? [],
        qrDataUrl,
        isPro: profile?.subscription_status === 'pro',
      }),
    )

    // Upload to storage
    const timestamp = Date.now()
    const pdfPath = `${user.id}/profile-${timestamp}.pdf`

    const serviceClient = createServiceClient()

    // Delete previous PDF to avoid orphaned files
    if (profile.latest_pdf_path) {
      await serviceClient.storage.from('pdf-exports').remove([profile.latest_pdf_path])
    }

    const { error: uploadErr } = await serviceClient.storage
      .from('pdf-exports')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadErr) {
      return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500 })
    }

    // Update user record
    await supabase
      .from('users')
      .update({
        latest_pdf_path: pdfPath,
        latest_pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // Generate signed URL
    const { data: signedUrl } = await serviceClient.storage
      .from('pdf-exports')
      .createSignedUrl(pdfPath, 3600)

    return NextResponse.json({ ok: true, url: signedUrl?.signedUrl })
  } catch (err) {
    return handleApiError(err)
  }
}
