import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SavedProfilesClient } from './SavedProfilesClient'

export default async function SavedProfilesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const [savedRes, foldersRes] = await Promise.all([
    supabase
      .from('saved_profiles')
      .select(`
        id, folder_id, created_at, notes, watching,
        saved_user:users!saved_profiles_saved_user_id_fkey (
          id, full_name, display_name, handle, profile_photo_url,
          primary_role, departments, location_country
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profile_folders')
      .select('id, name, emoji')
      .eq('user_id', user.id)
      .order('name'),
  ])

  // Normalize joined user (Supabase returns as array)
  const rawProfiles = (savedRes.data ?? []).map((p) => ({
    ...p,
    saved_user: Array.isArray(p.saved_user) ? p.saved_user[0] ?? null : p.saved_user,
  }))

  // Enrich with colleague overlap + top certs
  const savedUserIds = rawProfiles
    .map((p: any) => p.saved_user?.id)
    .filter(Boolean)

  let colleagueSet = new Set<string>()
  let certMap: Record<string, string[]> = {}

  if (savedUserIds.length > 0) {
    // Colleague overlap via attachments (shared yachts)
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

    // Top 2 certs per saved user — P1 fix: use custom_cert_name OR cert_type relation
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

  const profiles = rawProfiles.map((p: any) => ({
    ...p,
    notes: p.notes ?? null,
    watching: p.watching ?? false,
    isColleague: p.saved_user?.id ? colleagueSet.has(p.saved_user.id) : false,
    topCerts: p.saved_user?.id ? (certMap[p.saved_user.id] ?? []) : [],
  }))

  const folders = foldersRes.data ?? []

  return (
    <div className="flex flex-col gap-4 pb-24">
      <SavedProfilesClient
        initialProfiles={profiles}
        initialFolders={folders}
      />
    </div>
  )
}
