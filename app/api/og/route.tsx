import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  if (!handle) return new Response('Missing handle', { status: 400 })

  // Note: We can't use the cached getUserByHandle here since this is an edge API route.
  // Just fetch directly from Supabase.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  let user: { display_name?: string; full_name?: string; primary_role?: string; profile_photo_url?: string } | null = null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?handle=eq.${handle.toLowerCase()}&select=display_name,full_name,primary_role,profile_photo_url`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const users = await res.json()
    user = users?.[0] ?? null
  } catch (_err) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0D7377 0%, #0a5c5f 100%)',
            color: 'white',
            fontFamily: 'sans-serif',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          YachtieLink
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  if (!user) return new Response('User not found', { status: 404 })

  const name = user.display_name || user.full_name

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0D7377 0%, #0a5c5f 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {user.profile_photo_url && (
          <img
            src={user.profile_photo_url}
            width={120}
            height={120}
            style={{ borderRadius: '60px', border: '4px solid rgba(255,255,255,0.3)', marginBottom: '24px' }}
          />
        )}
        <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8 }}>
          {name}
        </div>
        {user.primary_role && (
          <div style={{ fontSize: 24, opacity: 0.9, marginBottom: 24 }}>
            {user.primary_role}
          </div>
        )}
        <div style={{ fontSize: 18, opacity: 0.7 }}>
          yachtie.link/u/{handle}
        </div>
        <div style={{ position: 'absolute', bottom: 30, fontSize: 16, opacity: 0.5 }}>
          YachtieLink — Professional profiles for yacht crew
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
