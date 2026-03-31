import { SupabaseClient } from '@supabase/supabase-js'

const PARTICLES = new Set(['van', 'der', 'von', 'de', 'di', 'del', 'la', 'le'])

function toTitleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (word === '&') return '&'

      const lower = word.toLowerCase()

      if (index > 0 && PARTICLES.has(lower)) return lower

      // "mc" prefix: capitalise the letter after "mc"
      if (lower.startsWith('mc') && lower.length > 2) {
        return 'Mc' + lower[2].toUpperCase() + lower.slice(3)
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolve a builder name to a yacht_builders ID.
 * 1. Fuzzy-match against existing builders via search_builders RPC
 * 2. If match found with high confidence, return that ID
 * 3. If no match, auto-create with title-case normalization, return new ID
 */
export interface ResolvedBuilder {
  id: string
  name: string
}

export async function resolveOrCreateBuilder(
  name: string,
  supabase: SupabaseClient,
  userId?: string
): Promise<ResolvedBuilder | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  const inputNormalized = normalizeName(trimmed)

  const { data: searchResults } = await supabase.rpc('search_builders', {
    p_query: trimmed,
    p_limit: 1,
  })

  if (searchResults && searchResults.length > 0) {
    const top = searchResults[0] as { id: string; name: string; sim: number }
    // Trust the match if similarity is high enough (catches typos like "lursen" → "Lürssen")
    // Below 0.4, the match is too weak — create a new builder instead
    if (top.sim >= 0.4) {
      return { id: top.id, name: top.name }
    }
  }

  const titleCased = toTitleCase(trimmed)
  const nameNormalized = normalizeName(titleCased)

  const { data: inserted, error } = await supabase
    .from('yacht_builders')
    .insert({
      name: titleCased,
      name_normalized: nameNormalized,
      ...(userId ? { created_by: userId } : {}),
    })
    .select('id')
    .single()

  if (error) {
    // Unique constraint violation — another process created it first
    if (error.code === '23505') {
      const { data: retryResults } = await supabase.rpc('search_builders', {
        p_query: trimmed,
        p_limit: 1,
      })
      if (retryResults && retryResults.length > 0) {
        const r = retryResults[0] as { id: string; name: string }
        return { id: r.id, name: r.name }
      }
    }
    return null
  }

  return inserted ? { id: inserted.id, name: titleCased } : null
}
