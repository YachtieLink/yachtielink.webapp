import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { extractStoragePath } from '@/lib/storage/upload'
import { getProStatus } from '@/lib/stripe/pro'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const clamp = (v: unknown) => typeof v === 'number' ? Math.min(100, Math.max(0, v)) : undefined
    const focalX = clamp(body.focal_x)
    const focalY = clamp(body.focal_y)
    const avatarFocalX = clamp(body.avatar_focal_x)
    const avatarFocalY = clamp(body.avatar_focal_y)
    const heroFocalX = clamp(body.hero_focal_x)
    const heroFocalY = clamp(body.hero_focal_y)
    const cvFocalX = clamp(body.cv_focal_x)
    const cvFocalY = clamp(body.cv_focal_y)
    const clampZoom = (v: unknown) => typeof v === 'number' ? Math.min(5, Math.max(1, v)) : undefined
    const avatarZoom = clampZoom(body.avatar_zoom)
    const heroZoom = clampZoom(body.hero_zoom)
    const cvZoom = clampZoom(body.cv_zoom)
    const isAvatar = typeof body.is_avatar === 'boolean' ? body.is_avatar : undefined
    const isHero = typeof body.is_hero === 'boolean' ? body.is_hero : undefined
    const isCv = typeof body.is_cv === 'boolean' ? body.is_cv : undefined

    const hasContextUpdate = isAvatar !== undefined || isHero !== undefined || isCv !== undefined
    const hasContextFocal = avatarFocalX !== undefined || avatarFocalY !== undefined ||
      heroFocalX !== undefined || heroFocalY !== undefined ||
      cvFocalX !== undefined || cvFocalY !== undefined
    const hasContextZoom = avatarZoom !== undefined || heroZoom !== undefined || cvZoom !== undefined
    const hasBaseFocal = focalX !== undefined || focalY !== undefined

    if (!hasBaseFocal && !hasContextUpdate && !hasContextFocal && !hasContextZoom) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Context assignment, per-context focal points, and zoom are Pro-only
    if (hasContextUpdate || hasContextFocal || hasContextZoom) {
      try {
        const proStatus = await getProStatus(user.id)
        if (!proStatus.isPro) {
          return NextResponse.json({ error: 'Context features require Pro' }, { status: 403 })
        }
      } catch {
        // Fail-open on transient Pro status check errors — Pro gating is a UX convenience,
        // not a hard security boundary. Don't block paying users on Stripe outages.
        console.warn('getProStatus failed, failing open for context focal/zoom update')
      }
    }

    const update: Record<string, number | boolean | null> = {}
    if (focalX !== undefined) update.focal_x = focalX
    if (focalY !== undefined) update.focal_y = focalY
    if (avatarFocalX !== undefined) update.avatar_focal_x = avatarFocalX
    if (avatarFocalY !== undefined) update.avatar_focal_y = avatarFocalY
    if (heroFocalX !== undefined) update.hero_focal_x = heroFocalX
    if (heroFocalY !== undefined) update.hero_focal_y = heroFocalY
    if (cvFocalX !== undefined) update.cv_focal_x = cvFocalX
    if (cvFocalY !== undefined) update.cv_focal_y = cvFocalY
    if (avatarZoom !== undefined) update.avatar_zoom = avatarZoom
    if (heroZoom !== undefined) update.hero_zoom = heroZoom
    if (cvZoom !== undefined) update.cv_zoom = cvZoom

    // Build context flags in update object
    if (isAvatar === true) {
      update.is_avatar = true
    } else if (isAvatar === false) {
      update.is_avatar = false
    }
    if (isHero === true) {
      update.is_hero = true
    } else if (isHero === false) {
      update.is_hero = false
    }
    if (isCv === true) {
      update.is_cv = true
    } else if (isCv === false) {
      update.is_cv = false
    }

    const { data: updated, error } = await supabase
      .from('user_photos')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')

    if (error) throw error
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Ownership confirmed — now clear this context from other photos
    if (isAvatar === true) {
      await supabase.from('user_photos').update({ is_avatar: false }).eq('user_id', user.id).neq('id', id)
    }
    if (isHero === true) {
      await supabase.from('user_photos').update({ is_hero: false }).eq('user_id', user.id).neq('id', id)
    }
    if (isCv === true) {
      await supabase.from('user_photos').update({ is_cv: false }).eq('user_id', user.id).neq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership and get the URL
    const { data: photo } = await supabase
      .from('user_photos')
      .select('photo_url, sort_order')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete storage object
    const storagePath = extractStoragePath(photo.photo_url, 'user-photos')
    if (storagePath) {
      await supabase.storage.from('user-photos').remove([storagePath])
    }

    await supabase.from('user_photos').delete().eq('id', id).eq('user_id', user.id)

    // If this was the first photo, update profile_photo_url to next photo
    if (photo.sort_order === 0) {
      const { data: nextPhoto } = await supabase
        .from('user_photos')
        .select('photo_url')
        .eq('user_id', user.id)
        .order('sort_order')
        .limit(1)
        .single()
      await supabase
        .from('users')
        .update({ profile_photo_url: nextPhoto?.photo_url ?? null })
        .eq('id', user.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
