import { createServiceClient } from '@/lib/supabase/admin'

export default async function sitemap() {
  const supabase = createServiceClient()

  const { data: users } = await supabase
    .from('users')
    .select('handle, updated_at')
    .not('handle', 'is', null)
    .is('deleted_at', null)
    .eq('onboarding_complete', true)

  const profileUrls = (users ?? []).map((user) => ({
    url: `https://yachtie.link/u/${user.handle}`,
    lastModified: user.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://yachtie.link',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    {
      url: 'https://yachtie.link/terms',
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: 'https://yachtie.link/privacy',
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    ...profileUrls,
  ]
}
