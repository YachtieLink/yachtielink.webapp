#!/usr/bin/env node
/**
 * seed-gallery-only.mjs
 * Uploads gallery photos from scripts/seed/assets/gallery/ to test seed users.
 * Gives Charlotte 12 photos (to test "Show more" >9) and spreads the rest.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GALLERY_DIR = path.join(__dirname, 'assets', 'gallery')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Best quality photos first (larger file size = more detail)
const ALL_GALLERY_PHOTOS = [
  'crew-life-collage',      // 405k
  'water-sports-launch',    // 357k
  'guest-table-setting',    // 311k
  'tender-driving',         // 307k
  'beach-club-setup',       // 280k
  'night-bridge',           // 280k
  'sailing-bow-watch',      // 278k
  'dive-platform-kit',      // 278k
  'deck-rail-cleaning',     // 284k
  'engine-room-rounds',     // 258k
  'bridge-watch',           // 275k
  'sunset-stern',           // 275k
  'dockside-prep',          // 274k
  'provisioning-day',       // 274k
  'deck-teak-work',         // 275k
  'galley-plating',         // 245k
  'silver-service',         // 247k
  'sunrise-anchor-watch',   // 268k
  'crew-mess-lunch',        // 246k
  'wine-service',           // 247k
]

// Charlotte gets 12 (test "Show more" >9), others get 2-4 each
const ASSIGNMENTS = {
  'test-seed-charlotte': [
    { slug: 'guest-table-setting', caption: 'Formal table setup at sunset.' },
    { slug: 'wine-service', caption: 'Service detail for evening guest experience.' },
    { slug: 'silver-service', caption: 'Silver service setup before guest lunch.' },
    { slug: 'crew-life-collage', caption: 'A snapshot of yacht life moments.' },
    { slug: 'beach-club-setup', caption: 'Beach club prep for guest arrival.' },
    { slug: 'sunset-stern', caption: 'Sunset views from the stern deck.' },
    { slug: 'provisioning-day', caption: 'Provisioning run in port.' },
    { slug: 'crew-mess-lunch', caption: 'Crew lunch between service.' },
    { slug: 'dockside-prep', caption: 'Getting ready for a Med turnaround.' },
    { slug: 'galley-plating', caption: 'Helping galley with plating.' },
    { slug: 'night-bridge', caption: 'Night bridge passage.' },
    { slug: 'water-sports-launch', caption: 'Setting up water sports for guests.' },
  ],
  'test-seed-james': [
    { slug: 'tender-driving', caption: 'Tender driving during guest shuttle operations.' },
    { slug: 'dockside-prep', caption: 'Dockside prep during a Med turnaround.' },
    { slug: 'sailing-bow-watch', caption: 'Bow watch under sail.' },
    { slug: 'dive-platform-kit', caption: 'Dive platform setup.' },
  ],
  'test-seed-marcus': [
    { slug: 'deck-teak-work', caption: 'Exterior upkeep between guest movements.' },
    { slug: 'deck-rail-cleaning', caption: 'Polishing rails before guest arrival.' },
    { slug: 'sunrise-anchor-watch', caption: 'Anchor watch at first light.' },
  ],
  'test-seed-pierre': [
    { slug: 'galley-plating', caption: 'Galley plating before dinner service.' },
    { slug: 'crew-mess-lunch', caption: 'Crew lunch prep.' },
    { slug: 'provisioning-day', caption: 'Provisioning run.' },
  ],
  'test-seed-olivia': [
    { slug: 'crew-life-collage', caption: 'A snapshot of guest service, galley, and sunset programme moments.' },
    { slug: 'guest-table-setting', caption: 'Table setting for formal dinner.' },
  ],
  'test-seed-sofia': [
    { slug: 'beach-club-setup', caption: 'Beach club guest setup.' },
    { slug: 'water-sports-launch', caption: 'Water sports launch day.' },
  ],
  'test-seed-finn': [
    { slug: 'bridge-watch', caption: 'Bridge watch during coastal passage.' },
    { slug: 'engine-room-rounds', caption: 'Morning engine room rounds.' },
    { slug: 'night-bridge', caption: 'Night passage on the bridge.' },
  ],
}

async function main() {
  console.log('Uploading gallery photos to test seed users...\n')

  // Resolve user IDs
  const handles = Object.keys(ASSIGNMENTS)
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, handle')
    .in('handle', handles)

  if (userErr) { console.error('Failed to fetch users:', userErr.message); process.exit(1) }

  const idByHandle = new Map(users.map(u => [u.handle, u.id]))
  let totalUploaded = 0

  for (const [handle, photos] of Object.entries(ASSIGNMENTS)) {
    const userId = idByHandle.get(handle)
    if (!userId) { console.warn(`  ⚠ User ${handle} not found, skipping`); continue }

    console.log(`${handle} (${photos.length} photos):`)

    // Clear existing seed gallery for this user
    const { data: existing } = await supabase
      .from('user_gallery')
      .select('id, image_url')
      .eq('user_id', userId)
      .like('image_url', '%seed-gallery-%')

    if (existing?.length) {
      const storagePaths = existing.map(row => {
        try {
          const url = new URL(row.image_url)
          const marker = '/object/public/user-gallery/'
          const idx = url.pathname.indexOf(marker)
          return idx !== -1 ? url.pathname.slice(idx + marker.length) : null
        } catch { return null }
      }).filter(Boolean)

      if (storagePaths.length) {
        await supabase.storage.from('user-gallery').remove(storagePaths)
      }
      await supabase.from('user_gallery').delete().in('id', existing.map(r => r.id))
      console.log(`  cleared ${existing.length} old seed gallery items`)
    }

    const rows = []
    for (const [index, item] of photos.entries()) {
      const localPath = path.join(GALLERY_DIR, `${item.slug}.jpg`)
      const storagePath = `${userId}/seed-gallery-${item.slug}.jpg`

      try {
        const buffer = await fs.readFile(localPath)
        const { error: upErr } = await supabase.storage
          .from('user-gallery')
          .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

        if (upErr) {
          console.error(`  ✗ upload failed: ${item.slug} — ${upErr.message}`)
          continue
        }

        const { data: urlData } = supabase.storage.from('user-gallery').getPublicUrl(storagePath)

        rows.push({
          user_id: userId,
          image_url: `${urlData.publicUrl}?t=${Date.now()}`,
          caption: item.caption,
          sort_order: index,
        })
        totalUploaded++
        process.stdout.write(`  ✓ ${item.slug}\n`)
      } catch (err) {
        console.error(`  ✗ ${item.slug}: ${err.message}`)
      }
    }

    if (rows.length) {
      const { error: insertErr } = await supabase.from('user_gallery').insert(rows)
      if (insertErr) console.error(`  ✗ DB insert failed: ${insertErr.message}`)
      else console.log(`  → ${rows.length} rows inserted`)
    }
  }

  console.log(`\nDone: ${totalUploaded} gallery photos uploaded across ${handles.length} users.`)
  console.log(`Charlotte has 12 photos — enough to test "Show more" (>9 threshold).`)
}

main().catch(err => { console.error(err); process.exit(1) })
