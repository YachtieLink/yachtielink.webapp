#!/usr/bin/env node
/**
 * Cleanup script: removes all test seed data.
 *
 * Finds users by handle prefix "test-seed-" and yachts by name prefix "TS ".
 * Cascading deletes handle attachments, endorsements, certs, etc.
 *
 * Run: node --env-file=.env.local scripts/seed/cleanup-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Run with: node --env-file=.env.local scripts/seed/cleanup-test-data.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('🧹 Cleaning up test seed data...\n')

  // 1. Find all test users
  const { data: testUsers, error: findErr } = await supabase
    .from('users')
    .select('id, handle, email')
    .like('handle', 'test-seed-%')

  if (findErr) { console.error('Failed to find test users:', findErr.message); process.exit(1) }
  console.log(`Found ${testUsers.length} test users`)

  const userIds = testUsers.map(u => u.id)

  if (userIds.length > 0) {
    // Delete related data (most cascade from user delete, but be explicit)
    console.log('Deleting endorsement requests...')
    await supabase.from('endorsement_requests').delete().in('requester_id', userIds)

    console.log('Deleting endorsements...')
    await supabase.from('endorsements').delete().in('endorser_id', userIds)
    await supabase.from('endorsements').delete().in('recipient_id', userIds)

    console.log('Deleting attachments...')
    await supabase.from('attachments').delete().in('user_id', userIds)

    console.log('Deleting certifications...')
    await supabase.from('certifications').delete().in('user_id', userIds)

    console.log('Deleting education...')
    await supabase.from('user_education').delete().in('user_id', userIds)

    console.log('Deleting skills...')
    await supabase.from('user_skills').delete().in('user_id', userIds)

    console.log('Deleting hobbies...')
    await supabase.from('user_hobbies').delete().in('user_id', userIds)

    console.log('Deleting photos...')
    await supabase.from('user_photos').delete().in('user_id', userIds)

    console.log('Deleting gallery...')
    await supabase.from('user_gallery').delete().in('user_id', userIds)

    console.log('Deleting saved profiles...')
    await supabase.from('saved_profiles').delete().in('user_id', userIds)
    await supabase.from('saved_profiles').delete().in('saved_user_id', userIds)

    console.log('Deleting profile analytics...')
    await supabase.from('profile_analytics').delete().in('user_id', userIds)

    // Delete auth users (this cascades to public.users via FK)
    console.log('Deleting auth users...')
    for (const userId of userIds) {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) console.error(`  ✗ Failed to delete auth user ${userId}: ${error.message}`)
    }
    console.log(`  ✓ ${userIds.length} users deleted`)
  }

  // 2. Delete test yachts
  console.log('\nDeleting test yachts...')
  const { data: testYachts } = await supabase
    .from('yachts')
    .select('id, name')
    .like('name', 'TS %')

  if (testYachts && testYachts.length > 0) {
    // Remove any remaining attachments to these yachts first
    await supabase.from('attachments').delete().in('yacht_id', testYachts.map(y => y.id))
    const { error } = await supabase.from('yachts').delete().in('id', testYachts.map(y => y.id))
    if (error) console.error(`  ✗ Failed to delete yachts: ${error.message}`)
    else console.log(`  ✓ ${testYachts.length} yachts deleted`)
  } else {
    console.log('  No test yachts found')
  }

  console.log('\n✅ Cleanup complete!')
}

main().catch(console.error)
