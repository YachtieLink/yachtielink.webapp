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
  recipient_name: safeText(200).optional(),
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

// --- Profile Photos ---

export const userPhotoSchema = z.object({
  photo_url: z.string().url(),
  sort_order: z.number().int().min(0).max(20),
});

export const reorderPhotosSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1).max(9),
});

// --- User Gallery ---

export const userGalleryItemSchema = z.object({
  image_url: z.string().url(),
  caption: z.string().max(300).optional(),
  yacht_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().min(0).max(50),
});

export const updateGalleryItemSchema = z.object({
  caption: z.string().max(300).optional().nullable(),
  yacht_id: z.string().uuid().optional().nullable(),
});

export const reorderGallerySchema = z.object({
  item_ids: z.array(z.string().uuid()).min(1).max(30),
});

// --- Saved Profiles ---

export const saveProfileSchema = z.object({
  saved_user_id: z.string().uuid(),
  folder_id: z.string().uuid().optional().nullable(),
});

export const moveToFolderSchema = z.object({
  folder_id: z.string().uuid().nullable(),
});

export const savedProfileUpdateSchema = z.object({
  folder_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  watching: z.boolean().optional(),
});

// --- Profile Folders ---

export const profileFolderSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  emoji: z.string().max(10).optional(),
});

// --- Hobbies ---

export const bulkHobbiesSchema = z.object({
  hobbies: z.array(
    z.object({
      name: z.string().min(1).max(100).trim(),
      emoji: z.string().max(10).optional(),
    })
  ).min(0).max(10),
});

// --- Education ---

export const userEducationSchema = z.object({
  institution: z.string().min(1).max(200).trim(),
  qualification: z.string().max(200).trim().optional(),
  field_of_study: z.string().max(200).trim().optional(),
  started_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  ended_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
}).refine(
  (d) => !d.started_at || !d.ended_at || d.ended_at >= d.started_at,
  { message: 'End date must be on or after start date', path: ['ended_at'] }
);

// --- Skills ---

export const bulkSkillsSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string().min(1).max(100).trim(),
      category: z.enum(['technical', 'certifiable', 'language', 'software', 'other']).optional(),
    })
  ).min(0).max(20),
});

// --- Languages ---

export const languagesSchema = z.object({
  languages: z.array(z.object({
    language: z.string().min(1).max(50).trim(),
    proficiency: z.enum(['native', 'fluent', 'intermediate', 'basic']),
  })).max(10),
})

// --- Social Links ---

export const socialLinksSchema = z.object({
  links: z.array(
    z.object({
      platform: z.enum(['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'website']),
      url: z.string().url(),
    })
  ).max(7),
});

// --- Section Visibility ---

export const sectionVisibilitySchema = z.object({
  section: z.enum(['about', 'experience', 'endorsements', 'certifications', 'hobbies', 'education', 'skills', 'photos', 'gallery']),
  visible: z.boolean(),
});

// --- CV Settings ---

export const cvSettingsSchema = z.object({
  cv_public: z.boolean().optional(),
  cv_public_source: z.enum(['generated', 'uploaded']).optional(),
}).refine(
  (d) => d.cv_public !== undefined || d.cv_public_source !== undefined,
  'At least one field required',
);

// --- Display Settings ---

export const displaySettingsSchema = z.object({
  profile_view_mode: z.enum(['profile', 'portfolio', 'rich_portfolio']).optional(),
  scrim_preset: z.enum(['dark', 'light', 'teal', 'warm']).optional(),
  accent_color: z.enum(['teal', 'coral', 'navy', 'amber', 'sand']).optional(),
  profile_template: z.enum(['classic', 'bold']).optional(),
}).refine(
  (d) => d.profile_view_mode !== undefined || d.scrim_preset !== undefined || d.accent_color !== undefined || d.profile_template !== undefined,
  'At least one field required',
);

// --- AI Summary ---

export const aiSummaryEditSchema = z.object({
  summary: z.string().min(10).max(500).trim(),
});
