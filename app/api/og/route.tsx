import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Load fonts at module level so they're cached across requests
const dmSerifPromise = fetch(
  new URL('../../../public/fonts/DMSerifDisplay-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

const dmSansPromise = fetch(
  new URL('../../../public/fonts/DMSans-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  if (!handle) return new Response('Missing handle', { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  let user: {
    display_name?: string
    full_name?: string
    primary_role?: string
    profile_photo_url?: string
  } | null = null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?handle=eq.${handle.toLowerCase()}&select=display_name,full_name,primary_role,profile_photo_url`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const users = await res.json()
    user = users?.[0] ?? null
  } catch {
    return fallbackImage()
  }

  if (!user) return new Response('User not found', { status: 404 })

  const name = user.display_name || user.full_name || 'Yacht Professional'
  const truncatedName = name.length > 30 ? name.slice(0, 28) + '…' : name

  // Load fonts — fall back to sans-serif on failure
  let fonts: { name: string; data: ArrayBuffer; style: 'normal' }[] = []
  try {
    const [dmSerif, dmSans] = await Promise.all([dmSerifPromise, dmSansPromise])
    fonts = [
      { name: 'DM Serif Display', data: dmSerif, style: 'normal' as const },
      { name: 'DM Sans', data: dmSans, style: 'normal' as const },
    ]
  } catch {
    // Fonts failed to load — Satori will use system sans-serif
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'row',
          background: 'linear-gradient(145deg, #0D7377 0%, #095557 60%, #074042 100%)',
          color: 'white',
          fontFamily: fonts.length > 0 ? '"DM Sans", sans-serif' : 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Left — Profile photo */}
        <div
          style={{
            width: 400,
            height: 630,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {user.profile_photo_url ? (
            <img
              src={user.profile_photo_url}
              width={240}
              height={240}
              style={{
                borderRadius: 24,
                border: '4px solid rgba(255,255,255,0.2)',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.1)',
                border: '4px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 80,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {(name[0] || 'Y').toUpperCase()}
            </div>
          )}
        </div>

        {/* Right — Text content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: 60,
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              fontFamily: fonts.length > 0 ? '"DM Serif Display", serif' : 'serif',
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {truncatedName}
          </div>

          {user.primary_role && (
            <div style={{ fontSize: 24, opacity: 0.85, fontWeight: 500 }}>
              {user.primary_role}
            </div>
          )}

          <div style={{ fontSize: 18, opacity: 0.6, marginTop: 8 }}>
            yachtie.link/u/{handle}
          </div>
        </div>

        {/* Bottom strip — branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.8, letterSpacing: 1 }}>
            YACHTIELINK
          </div>
          <div style={{ fontSize: 14, opacity: 0.5 }}>
            — Professional profiles for yacht crew
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  )
}

function fallbackImage() {
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
