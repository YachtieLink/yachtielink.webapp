import { z } from 'zod'

const safeText = (max: number) => z.string().trim().max(max)

/**
 * Body for POST /api/endorsements/guest
 * Used by unauthenticated visitors writing a ghost endorsement.
 */
export const guestEndorsementSchema = z.object({
  token: z.string().min(1).max(200),
  content: safeText(2000).refine((s) => s.length >= 10, 'Endorsement must be at least 10 characters'),
  endorser_name: safeText(200).refine((s) => s.length >= 1, 'Name is required'),
  endorser_role: safeText(100),
  // Only required for shareable-link flows (not pre-verified via token)
  endorser_email: z.string().email().optional(),
})

export type GuestEndorsementInput = z.infer<typeof guestEndorsementSchema>
