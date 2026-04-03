import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export interface CertMatchAlternative {
  id: string
  name: string
  issuingAuthority: string
  confidence: number
  crewCount: number
  equivalenceNote?: string
  typicalValidityYears?: number
}

export interface CertMatchResult {
  registryId: string | null
  matchTier: 'green' | 'amber' | 'blue'
  confidence: number
  canonicalName?: string
  issuingAuthority?: string
  equivalenceNote?: string
  typicalValidityYears?: number
  crewCount?: number
  alternatives?: CertMatchAlternative[]
}

type CertificationSearchResult =
  Database['public']['Functions']['search_certifications']['Returns'][number]

function mapAlternative(result: CertificationSearchResult): CertMatchAlternative {
  return {
    id: result.id,
    name: result.name,
    issuingAuthority: result.issuing_authority,
    confidence: result.similarity,
    crewCount: result.crew_count,
    equivalenceNote: result.equivalence_note || undefined,
    typicalValidityYears: result.typical_validity_years || undefined,
  }
}

export async function matchCertification(
  parsedName: string,
  supabase: SupabaseClient<Database>,
): Promise<CertMatchResult> {
  const query = parsedName.trim()
  if (!query) {
    return {
      registryId: null,
      matchTier: 'blue',
      confidence: 0,
      alternatives: [],
    }
  }

  const { data, error } = await supabase.rpc('search_certifications', {
    query,
    lim: 5,
  })

  if (error || !data || data.length === 0) {
    return {
      registryId: null,
      matchTier: 'blue',
      confidence: 0,
      alternatives: [],
    }
  }

  const [topMatch, ...rest] = data
  const confidence = topMatch.similarity
  const alternatives = [topMatch, ...rest].slice(0, 3).map(mapAlternative)

  if (confidence >= 0.6) {
    return {
      registryId: topMatch.id,
      matchTier: 'green',
      confidence,
      canonicalName: topMatch.name,
      issuingAuthority: topMatch.issuing_authority,
      equivalenceNote: topMatch.equivalence_note || undefined,
      typicalValidityYears: topMatch.typical_validity_years,
      crewCount: topMatch.crew_count,
      alternatives,
    }
  }

  if (confidence >= 0.3) {
    return {
      registryId: topMatch.id,
      matchTier: 'amber',
      confidence,
      canonicalName: topMatch.name,
      issuingAuthority: topMatch.issuing_authority,
      equivalenceNote: topMatch.equivalence_note || undefined,
      typicalValidityYears: topMatch.typical_validity_years,
      crewCount: topMatch.crew_count,
      alternatives,
    }
  }

  return {
    registryId: null,
    matchTier: 'blue',
    confidence,
    alternatives,
  }
}
