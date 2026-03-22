import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { saveProfileSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

const deleteSavedSchema = z.object({ saved_user_id: z.string().uuid() })

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folder_id') // 'null' string or uuid or absent
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const sort = searchParams.get('sort') ?? 'recent'
    const watchingOnly = searchParams.get('watching_only') === 'true'
    const limit = 20

    let query = supabase
      .from('saved_profiles')
      .select(`
        id, folder_id, created_at, notes, watching,
        saved_user:saved_user_id (
          id, display_name, full_name, handle, profile_photo_url,
          primary_role, departments, location_country
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)

    // Folder filter
    if (folderId === 'null') {
      query = query.is('folder_id', null)
    } else if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    // Watching filter
    if (watchingOnly) {
      query = query.eq('watching', true)
    }

    // P3 fix: for name/role sort, we must fetch all rows, sort, then paginate.
    // For 'recent' sort, Supabase handles both ordering and pagination.
    query = query.order('created_at', { ascending: false })

    if (sort === 'recent') {
      query = query.range((page - 1) * limit, page * limit - 1)
    }
    // else: fetch all rows, sort in JS, then slice after enrichment

    const { data: rawData, count } = await query

    // Enrich with colleague overlap + top certs
    const data = rawData ?? []
    const savedUserIds = data
      .map((d: any) => d.saved_user?.id)
      .filter(Boolean)

    let colleagueSet = new Set<string>()
    let certMap: Record<string, string[]> = {}

    if (savedUserIds.length > 0) {
      // C1 fix: use attachments table, not yacht_crew
      const { data: overlap } = await supabase
        .from('attachments')
        .select('user_id, yacht_id')
        .in('user_id', [user.id, ...savedUserIds])
        .is('deleted_at', null)

      if (overlap) {
        const viewerYachts = new Set(
          overlap.filter((r: any) => r.user_id === user.id).map((r: any) => r.yacht_id)
        )
        for (const row of overlap) {
          if (row.user_id !== user.id && viewerYachts.has(row.yacht_id)) {
            colleagueSet.add(row.user_id)
          }
        }
      }

      // P1 fix: certifications has custom_cert_name OR certification_type_id (FK to certification_types.name)
      const { data: certs } = await supabase
        .from('certifications')
        .select('user_id, custom_cert_name, cert_type:certification_type_id(name)')
        .in('user_id', savedUserIds)
        .order('created_at', { ascending: false })

      if (certs) {
        for (const cert of certs as any[]) {
          const certName = cert.custom_cert_name
            || (Array.isArray(cert.cert_type) ? cert.cert_type[0]?.name : cert.cert_type?.name)
          if (!certName) continue
          if (!certMap[cert.user_id]) certMap[cert.user_id] = []
          if (certMap[cert.user_id].length < 2) certMap[cert.user_id].push(certName)
        }
      }
    }

    // Merge enrichment into results
    let enriched = data.map((item: any) => ({
      ...item,
      isColleague: item.saved_user?.id ? colleagueSet.has(item.saved_user.id) : false,
      topCerts: item.saved_user?.id ? (certMap[item.saved_user.id] ?? []) : [],
    }))

    // P3 fix: sort THEN paginate for name/role
    if (sort === 'name') {
      enriched.sort((a: any, b: any) => {
        const nameA = (a.saved_user?.display_name ?? a.saved_user?.full_name ?? '').toLowerCase()
        const nameB = (b.saved_user?.display_name ?? b.saved_user?.full_name ?? '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
    } else if (sort === 'role') {
      enriched.sort((a: any, b: any) => {
        const roleA = (a.saved_user?.primary_role ?? '').toLowerCase()
        const roleB = (b.saved_user?.primary_role ?? '').toLowerCase()
        return roleA.localeCompare(roleB)
      })
    }

    // Apply pagination after sort for name/role (already applied at DB for recent)
    const total = count ?? enriched.length
    if (sort !== 'recent') {
      enriched = enriched.slice((page - 1) * limit, page * limit)
    }

    return NextResponse.json({
      results: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, saveProfileSchema)
    if ('error' in result) return result.error
    const { saved_user_id, folder_id } = result.data

    if (saved_user_id === user.id) {
      return NextResponse.json({ error: "You can't save your own profile." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_profiles')
      .upsert({ user_id: user.id, saved_user_id, folder_id }, { onConflict: 'user_id,saved_user_id' })
      .select()
      .single()
    if (error) throw error

    await trackServerEvent(user.id, 'profile.saved', { saved_user_id })

    return NextResponse.json({ saved: data }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, deleteSavedSchema)
    if ('error' in result) return result.error
    const { saved_user_id } = result.data

    await supabase
      .from('saved_profiles')
      .delete()
      .eq('user_id', user.id)
      .eq('saved_user_id', saved_user_id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
