-- Rally 003 Sprint 3: Tighten endorsement_requests update policy
-- Split the single "own update" policy into requester (full) and recipient (restricted).
-- Recipients should only be able to update status and cancelled_at, not other fields.

-- Drop the overly broad combined policy
DROP POLICY IF EXISTS "endorsement_requests: own update" ON public.endorsement_requests;

-- Requesters can update their own requests (full access)
CREATE POLICY "endorsement_requests: requester update"
  ON public.endorsement_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- Recipients can update only status-related fields
-- Note: Postgres RLS cannot restrict specific columns. The restriction
-- is enforced at the API layer (endorsement-requests/[id]/route.ts only
-- allows recipients to set status + cancelled_at via the 'decline' action).
-- This policy grants row-level access; column restriction is code-enforced.
CREATE POLICY "endorsement_requests: recipient update"
  ON public.endorsement_requests FOR UPDATE
  USING (auth.uid() = recipient_user_id);

-- DOWN migration:
-- DROP POLICY IF EXISTS "endorsement_requests: requester update" ON public.endorsement_requests;
-- DROP POLICY IF EXISTS "endorsement_requests: recipient update" ON public.endorsement_requests;
-- CREATE POLICY "endorsement_requests: own update" ON public.endorsement_requests FOR UPDATE
--   USING (auth.uid() = requester_id OR auth.uid() = recipient_user_id);
