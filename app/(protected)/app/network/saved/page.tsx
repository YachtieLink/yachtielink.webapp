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
        id,
        folder_id,
        saved_user_id,
        saved_user:users!saved_profiles_saved_user_id_fkey (
          id,
          full_name,
          display_name,
          handle,
          profile_photo_url,
          primary_role
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

  // Supabase returns joined user as array — normalize to single object
  const profiles = (savedRes.data ?? []).map((p) => ({
    ...p,
    saved_user: Array.isArray(p.saved_user) ? p.saved_user[0] ?? null : p.saved_user,
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
