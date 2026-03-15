import { z } from 'zod';

// Reusable atoms
const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/); // YYYY-MM or YYYY-MM-DD
const safeText = (max: number) => z.string().max(max).transform((s) => s.trim());

// --- Endorsements ---

export const createEndorsementSchema = z.object({
  recipient_id: uuid,
  yacht_id: uuid,
  content: safeText(2000).refine((s) => s.length >= 10, 'Endorsement must be at least 10 characters'),
  endorser_role_label: safeText(100).optional(),
  recipient_role_label: safeText(100).optional(),
  worked_together_start: isoDate.optional(),
  worked_together_end: isoDate.optional(),
  request_token: z.string().optional(),
});

export const updateEndorsementSchema = z.object({
  content: safeText(2000)
    .refine((s) => s.length >= 10, 'Endorsement must be at least 10 characters')
    .optional(),
  endorser_role_label: safeText(100).optional(),
  recipient_role_label: safeText(100).optional(),
  worked_together_start: isoDate.optional(),
  worked_together_end: isoDate.optional(),
});

// --- Endorsement Requests ---

export const createEndorsementRequestSchema = z.object({
  yacht_id: uuid,
  recipient_email: z.string().email().optional(),
  recipient_phone: safeText(20).optional(),
  recipient_user_id: uuid.optional(),
  yacht_name: safeText(200).optional(),
});

// --- CV ---

export const parseCVSchema = z.object({
  storagePath: z.string().min(1).max(500),
});

export const generatePDFSchema = z.object({
  template: z.enum(['standard', 'classic-navy', 'modern-minimal']).optional().default('standard'),
});

// --- Stripe ---

export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'annual']),
});

// --- Account ---

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

export const updateHandleSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      'Handle must be lowercase alphanumeric with hyphens, no leading/trailing hyphen',
    ),
});
