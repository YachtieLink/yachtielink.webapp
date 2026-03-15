-- Sprint 6: CV Upload + PDF Export storage infrastructure
-- Creates cv-uploads and pdf-exports buckets, RLS policies, user columns, and rate-limit function.

-- 1. Storage bucket: cv-uploads (private, for raw CV files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage bucket: pdf-exports (private, for generated PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-exports',
  'pdf-exports',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for cv-uploads: owner only
CREATE POLICY "cv_uploads_owner_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "cv_uploads_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "cv_uploads_owner_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "cv_uploads_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cv-uploads' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

-- 4. RLS for pdf-exports: owner only
CREATE POLICY "pdf_exports_owner_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "pdf_exports_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "pdf_exports_owner_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "pdf_exports_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdf-exports' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

-- 5. Add columns to users table for CV and PDF tracking
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cv_storage_path text,
  ADD COLUMN IF NOT EXISTS cv_parsed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cv_parse_count_today integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cv_parse_count_reset_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS latest_pdf_path text,
  ADD COLUMN IF NOT EXISTS latest_pdf_generated_at timestamptz;

-- 6. Function to check/increment CV parse rate limit (3/day)
CREATE OR REPLACE FUNCTION public.check_cv_parse_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_reset_at timestamptz;
BEGIN
  SELECT cv_parse_count_today, cv_parse_count_reset_at
  INTO v_count, v_reset_at
  FROM public.users
  WHERE id = p_user_id;

  -- Reset counter if more than 24 hours since last reset
  IF v_reset_at IS NULL OR v_reset_at < now() - interval '1 day' THEN
    UPDATE public.users
    SET cv_parse_count_today = 1, cv_parse_count_reset_at = now()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  -- Check limit
  IF v_count >= 3 THEN
    RETURN false;
  END IF;

  -- Increment
  UPDATE public.users
  SET cv_parse_count_today = cv_parse_count_today + 1
  WHERE id = p_user_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_cv_parse_limit(uuid) TO authenticated;
